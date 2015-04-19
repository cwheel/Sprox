var SpireConnector = require('./serviceConnectors/spireConnector');
var SpireMap = require('./maps/spire.js');
var merge = require('merge');
var CachedUser = require('./models/user');
var sha512 = require('js-sha512');
var bcrypt = require('bcrypt');
var CryptoJSAES = require('node-cryptojs-aes');

module.exports = function(passport, strategy) {
	passport.use('local', new strategy(function(username, password, done) {
		console.log("Authenticating user: '" + username + "' with Spire...");

		var authWithSpire = function() {
			var spire = new SpireConnector(username, password);
			var spireUser = {};
			var objFinished = 0;

			spire.on('values', function (vals) {
				objFinished++;
				spireUser = merge(spireUser, vals);

				if (objFinished == Object.keys(SpireMap.map).length) {
					console.log("User: '" + username + "' passed authentication with Spire!");
					
					//Spire data post processing
					var days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
					var allCourses = spireUser.classesWeekly;
					spireUser.classesWeekly = [];

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
					var classesArray = [];
					for (var i = 0; i < days.length; i++) {
						//Create an empty class array for each day
						spireUser.classesWeekly[i] = {classes: []};
						var index = 0;
						//Iterate all of the users classes
						for (var j = 0; j < allCourses.length; j++) {
							//Only fix the location and time during the first pass, subsequent passes will render them invalid
							if (i == 0) {
								//Cleans up the time, location and class name from Spire, they're messy
								allCourses[j].time = allCourses[j].time.split("<br>")[0];
								allCourses[j].location = allCourses[j].location.split("<br>")[1];
								allCourses[j].type = allCourses[j].name.split("<br>")[1].split(" ")[0];
								allCourses[j].name = allCourses[j].name.replace("<br>","");
								allCourses[j].prettyName = allCourses[j].name.split("-")[0];
							}

							//Check if the class occurs on the day we're looking at
							if (allCourses[j].time.indexOf(days[i]) != -1) {
								//Times in 24 hour (Bad names are relics from builds gone by, kept to maintain support)
								allCourses[j].tf_s = calcStartTft(allCourses[j].time);
								allCourses[j].tf_e = calcEndTft(allCourses[j].time);
								allCourses[j].th_s = calcStartTh(allCourses[j].time);
								allCourses[j].th_e = calcEndTh(allCourses[j].time);

								//Used for class grouping we check for undefined to not repeat this on multiple day lectures
								if (allCourses[j].classID == undefined){
									//A very conveint \n charector before the name of the class

									var arrayName = allCourses[j].name.split('\n')[0];
									var code = arrayName.charCodeAt(arrayName.length - 2);

									//removes the last 2 charectors of Discussion and Lab Sections to match their normal Lecture Section. 48 to 57 are the range of ASCII numbers.
									if (!((code >= 48) && (code <= 57))) {
										arrayName = arrayName.slice(0,-2);
									}

									
									//If it exists in the array give it the same number. Smart Pushing to save a var
									var indexArray = classesArray.indexOf(arrayName);
									if (indexArray == -1){
										allCourses[j].classID = classesArray.length;
										classesArray.push(arrayName);
									}else{
										allCourses[j].classID = indexArray;
									}

								}

								//Add the current class to the day in question
								//Objects are Refrences.... what is this Java. Convert to JSON and back into an object is the easiest deep copy I have found.
								spireUser.classesWeekly[i].classes[index] = JSON.parse(JSON.stringify(allCourses[j]));
								//Removes the Days that the class Happens from the Time Tag
								spireUser.classesWeekly[i].classes[index].time = spireUser.classesWeekly[i].classes[index].time.replace("Mo","").replace("Tu","").replace("We","").replace("Th","").replace("Fr","");
								index++;
							}
						}
						//Puts the Length into the data to easily get how many classes a student is taking. 
						//spireUser.classesWeekly.classAmount = classesArray.length;
						//Sort the days classes
						spireUser.classesWeekly[i].classes.sort(function (a,b) {return a.tf_e - b.tf_e});
					}
					
					for(var curday in spireUser.classesWeekly){
						for(var curclass in spireUser.classesWeekly[curday].classes){
							//Free Time takes in StartTime, the time of the last class, and the Start of the class.
							//This is used to determine how much time is between the current class and the last class
							spireUser.classesWeekly[curday].classes[curclass].freeTime = DiffTime(startTime, spireUser.classesWeekly[curday].classes[curclass].th_s);

							//Similar to Free Time, Class Duration takes in the Start Time and the End time, together the function determines how many minutes are in your class.
							spireUser.classesWeekly[curday].classes[curclass].classDuration = DiffTime(spireUser.classesWeekly[curday].classes[curclass].th_s, spireUser.classesWeekly[curday].classes[curclass].th_e);

							//Sets the StartTime to the end of the class time to use in the freeTime calculation
							startTime = spireUser.classesWeekly[curday].classes[curclass].th_e;

							// Creates the Amount of Free Time you have between all the classes. This function ignores breaks in between classes (15 minutes) and the the First Classes Free Time.
							if (curclass != 0 && spireUser.classesWeekly[curday].classes[curclass].freeTime > 15){
								freeTimeTotal = freeTimeTotal + spireUser.classesWeekly[curday].classes[curclass].freeTime;
							}

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

					//Keep a hash of the users password on hand, useful for verification later
					spireUser.passValidator = bcrypt.hashSync(password, 10);

					return done(null, spireUser);
				}
			});

			//The spire object reported it was unable to authenticate
			spire.on('authFailure', function (vals) {
				console.log("User: '" + username + "' failed authnetication with Spire...");
				return done(null, false);
			});
		};

		CachedUser.findOne({user : sha512(username)}, function(err, user) {
			if (user != null) {
				if (user.cached) {
					var b64 = new Buffer(password).toString('base64');
					var decrypted = CryptoJSAES.CryptoJS.AES.decrypt(JSON.stringify(user.spire), b64, { format: CryptoJSAES.JsonFormatter });

					try {
						var user = JSON.parse(CryptoJSAES.CryptoJS.enc.Utf8.stringify(decrypted));
						return done(null, user);
					} catch (err) {
						authWithSpire();
					}
				} else {
					authWithSpire();
				}
		   	} else {
		   		authWithSpire();
		   	}
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