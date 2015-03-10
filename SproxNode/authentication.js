var SpireConnector = require('./serviceConnectors/spireConnector');
var SpireMap = require('./maps/spire.js');
var merge = require('merge');

module.exports = function(passport, strategy) {
	passport.use('local', new strategy(function(username, password, done) {
		//Setup the Spire authentication system
		var spire =  new SpireConnector(username, password);
		var spireUser = {};
		var objFinished = 0;

		console.log("Authenticating user: '" + username + "' with Spire...");

		//The spire object reported some finding some values
		spire.on('values', function (vals) {
			objFinished++;
			spireUser = merge(spireUser, vals);

			if (objFinished == Object.keys(SpireMap.map).length) {
				console.log("User: '" + username + "' passed authnetication with Spire!");

				//Spire data post processing
				var days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
				var allCourses = spireUser.classesWeekly;
				spireUser.classesWeekly = {};

		 		var heightMultiplier = 1.4;
				var startTime = "8:00 AM";
				var freeTimeTotal = 0;

				//Converts a Spire day/week/time thing into a the 24 hour end timestamp
				var calcStartTft = function(time) {
					/* 
					Possibly the nastiest oneliner there ever was... (Let your eyes burn)
					1st : Replace the '-', the ':', and the 'AM' and 'PM' whilist lopping off the days in the front
					2nd: Convert that abomination to an int
					3rd: Check if the string contains PM, if it does return 1200, otherwise return 0. This converts afternoon and night times to proper 24 hour time
					4th: Add the results and return
					*/

					return parseInt(time.split(" -")[0].split(" ")[1].replace(":","").replace("AM","").replace("PM","")) + (((time.indexOf("PM") > -1) && parseInt(time.split(" -")[0].split(" ")[1].replace(":","").replace("AM","").replace("PM","")) < 1000) ? 1200 : 0);
				};

				var calcEndTft = function(time) {
					//Same deal as above, but only 95% as bad!
					return parseInt(time.split("- ")[1].replace(":","").replace("AM","").replace("PM","")) + (((time.indexOf("PM") > -1) && parseInt(time.split("- ")[1].replace(":","").replace("AM","").replace("PM","")) < 1000) ? 1200 : 0);
				};

				//Converts a Spire Day to a 12 Hour Time because of how Javascript Dates Work 
				var calcStartTh = function(time) {
					/* 
					Derived from the calcStartTft, this function stops when before replacing the : with "" leaving a 12 Hour formated Time
					*/

					return time.split(" -")[0].split(" ")[1].replace("AM"," AM").replace("PM"," PM");
				}; 

				var calcEndTh = function(time) {
					//Same deal as calcStartTh
					return time.split("- ")[1].replace("AM"," AM").replace("PM"," PM");
				};
				var DiffTime = function(start, stop){
					// Creates A Date Object with a static start Date
					var tstart = new Date("02/08/14 " + start);
					var tstop = new Date("02/08/14 " + stop);

					// Subtraction of Date Objects returns a milisecond time which is converted into minutes
					tstart = tstop - tstart;
					return (tstart/60/1000);
				};	
				
				//Iterate the days of the week
				for (var i = 0; i < days.length; i++) {
					//Create an empty class array for each day
					spireUser.classesWeekly[days[i]] = {classes: []};

					//Iterate all of the users classes
					for (var j = 0; j < allCourses.length; j++) {
						//Only fix the location and time during the first pass, subsequent passes will render them invalid
						if (i == 0) {
							//Cleans up the time, location and class name from Spire, they're messy
							allCourses[j].time = allCourses[j].time.split("<br>")[0];
							allCourses[j].location = allCourses[j].location.split("<br>")[1];
							allCourses[j].name = allCourses[j].name.replace("<br>","");
						}

						//Check if the class occurs on the day we're looking at
						if (allCourses[j].time.indexOf(days[i]) != -1) {
							//Times in 24 hour (Bad names are relics from builds gone by, kept to maintain support)
							allCourses[j].tf_s = calcStartTft(allCourses[j].time);
							allCourses[j].tf_e = calcEndTft(allCourses[j].time);
							allCourses[j].th_s = calcStartTh(allCourses[j].time);
							allCourses[j].th_e = calcEndTh(allCourses[j].time);

							//Add the current class to the day in question
							spireUser.classesWeekly[days[i]].classes.push(allCourses[j]);
						}
					}

					//Sort the days classes
					spireUser.classesWeekly[days[i]].classes.sort(function (a,b) {return a.tf_e - b.tf_e});
				}

					for(var curday in spireUser.classesWeekly){
						for(var curclass in spireUser.classesWeekly[curday].classes){
							//Free Time takes in StartTime, the time of the last class, and the Start of the class.
							//This is used to determine how much time is between the current class and the last class
							spireUser.classesWeekly[curday].classes[curclass].freeTime = DiffTime(startTime, spireUser.classesWeekly[curday].classes[curclass].th_s);

							//Similar to Free Time, Class Duration takes in the Start Time and the End time, together the function determines how many minutes are in your class.
							spireUser.classesWeekly[curday].classes[curclass].classDuration = DiffTime(spireUser.classesWeekly[curday].classes[curclass].th_s, spireUser.classesWeekly[curday].classes[curclass].th_e);
							// Creates the Amount of Free Time you have between all the classes. This function ignores breaks in between classes (15 minutes) and the the First Classes Free Time.
							if (curclass != 0 && spireUser.classesWeekly[curday].classes[curclass].freeTime > 15){
								freeTimeTotal = freeTimeTotal + spireUser.classesWeekly[curday].classes[curclass].freeTime;
							}

							//Creates the Height in pixels for the Box's size
							spireUser.classesWeekly[curday].classes[curclass].freeTimePadded = spireUser.classesWeekly[curday].classes[curclass].freeTime * heightMultiplier;
							spireUser.classesWeekly[curday].classes[curclass].classDurationPadded = spireUser.classesWeekly[curday].classes[curclass].classDuration * heightMultiplier;

							//Sets the StartTime to the end of the class time to use in the freeTime calculation
							startTime = spireUser.classesWeekly[curday].classes[curclass].th_e;
						}
					
						// Creates a variable on when your day ends
						spireUser.classesWeekly[curday].endTime = startTime;
						//Calculates the padding at the End of the day. 6:45 is the last time of normally scheduled classes acording to Umass's Website.
						spireUser.classesWeekly[curday].endTimePadding = DiffTime(startTime,"6:45 PM");
						spireUser.classesWeekly[curday].freeTimeTotal = freeTimeTotal;

						//Reset Variables for the Next Day
						freeTimeTotal = 0;
						startTime = "8:00 AM";
					}

				//Remove <br> Tags from Certain Elements Creating an Array of Each Line
				spireUser.homeAddress = spireUser.homeAddress.split("<br>");
				spireUser.schoolAddress = spireUser.schoolAddress.split("<br>");

				//Fix the roomate name by re-ordering their name from Last,First Middle to First Middle Last
				if (spireUser.roomate.indexOf(',') > -1) {
					spireUser.roomate = spireUser.roomate.split(",")[1] + " " + spireUser.roomate.split(",")[0]
				}

				return done(null, spireUser);
			}
		})

		//The spire object reported it was unable to authenticate
		spire.on('authFailure', function (vals) {
			console.log("User: '" + username + "' failed authnetication with Spire...");
			return done(null, false);
		});
	}));

	//Session serialization
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
	  done(null, user)
	});
};