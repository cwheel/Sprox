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
				
				//Iterate the days of the week
				for (var i = 0; i < days.length; i++) {
					//Create an empty class array for each day
					spireUser.classesWeekly[days[i]] = [];

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
							spireUser.classesWeekly[days[i]].push(allCourses[j]);
						}
					}

					//Sort the days classes
					spireUser.classesWeekly[days[i]].sort(function (a,b) {return a.tf_e - b.tf_e});
				}

				//Remove Break Tags from Elements
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