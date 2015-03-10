 				var util = require('util');

 				var heightMultiplier = 1.4;
				var startTime = "8:00 AM";
				var freeTimeTotal = 0;

				var spireUser = {"classesWeekly": []};
				spireUser.classesWeekly = {"Su":[],"Mo":[{"name":"GEOLOGY 101-01\nLEC (13953)","time":"MoWeFr 9:05AM - 9:55AM","location":"\nHerter Hall room 231","tf_s":905,"tf_e":955,"th_s":"9:05 AM","th_e":"9:55 AM"},{"name":"MATH 132-01\nLEC (14091)","time":"MoWeFr 10:10AM - 11:00AM","location":"\nGoesmann lab Addition 152","tf_s":1010,"tf_e":1100,"th_s":"10:10 AM","th_e":"11:00 AM"},{"name":"MICROBIO 160-01\nLEC (14272)","time":"MoWeFr 11:15AM - 12:05PM","location":"\nMahar room 108","tf_s":1115,"tf_e":1205,"th_s":"11:15 AM","th_e":"12:05 PM"}],"Tu":[{"name":"GEOLOGY 101-01LM\nLAB (13989)","time":"Tu 8:00AM - 11:00AM","location":"\nHasbrouck Room 235","tf_s":800,"tf_e":1100,"th_s":"8:00 AM","th_e":"11:00 AM","type":"scheduleClass","$$hashKey":"object:5"},{"name":"CMPSCI 230-01\nLEC (13846)","time":"TuTh 1:00PM - 2:15PM","location":"\nHasbrouck Lab Add room 126","tf_s":1300,"tf_e":1415,"th_s":"1:00 PM","th_e":"2:15 PM","type":"scheduleClass","$$hashKey":"object:6"},{"name":"MATH 132-01AB\nDIS (14231)","time":"Tu 2:30PM - 3:20PM","location":"\nLederle Grad Res Tower Rm 145","tf_s":1430,"tf_e":1520,"th_s":"2:30 PM","th_e":"3:20 PM","type":"scheduleClass","$$hashKey":"object:7"}],"We":[{"name":"GEOLOGY 101-01\nLEC (13953)","time":"MoWeFr 9:05AM - 9:55AM","location":"\nHerter Hall room 231","tf_s":905,"tf_e":955,"th_s":"9:05 AM","th_e":"9:55 AM"},{"name":"MATH 132-01\nLEC (14091)","time":"MoWeFr 10:10AM - 11:00AM","location":"\nGoesmann lab Addition 152","tf_s":1010,"tf_e":1100,"th_s":"10:10 AM","th_e":"11:00 AM"},{"name":"MICROBIO 160-01\nLEC (14272)","time":"MoWeFr 11:15AM - 12:05PM","location":"\nMahar room 108","tf_s":1115,"tf_e":1205,"th_s":"11:15 AM","th_e":"12:05 PM"}],"Th":[{"name":"CMPSCI 230-01\nLEC (13846)","time":"TuTh 1:00PM - 2:15PM","location":"\nHasbrouck Lab Add room 126","tf_s":1300,"tf_e":1415,"th_s":"1:00 PM","th_e":"2:15 PM"}],"Fr":[{"name":"GEOLOGY 101-01\nLEC (13953)","time":"MoWeFr 9:05AM - 9:55AM","location":"\nHerter Hall room 231","tf_s":905,"tf_e":955,"th_s":"9:05 AM","th_e":"9:55 AM"},{"name":"MATH 132-01\nLEC (14091)","time":"MoWeFr 10:10AM - 11:00AM","location":"\nGoesmann lab Addition 152","tf_s":1010,"tf_e":1100,"th_s":"10:10 AM","th_e":"11:00 AM"},{"name":"MICROBIO 160-01\nLEC (14272)","time":"MoWeFr 11:15AM - 12:05PM","location":"\nMahar room 108","tf_s":1115,"tf_e":1205,"th_s":"11:15 AM","th_e":"12:05 PM"},{"name":"CMPSCI 230-01AC\nDIS (18181)","time":"Fr 12:20PM - 1:10PM","location":"\nEngineering Laboratory rm 323","tf_s":1220,"tf_e":1310,"th_s":"12:20 PM","th_e":"1:10 PM"}],"Sa":[]};

				var DiffTime = function(start, stop){
					// Creates A Date Object with a static start Date
					var tstart = new Date("02/08/14 " + start);
					var tstop = new Date("02/08/14 " + stop);

					// Subtraction of Date Objects returns a milisecond time which is converted into minutes
					tstart = tstop - tstart;
					return (tstart/60/1000);
				}		

					//Schedule Block Creator
					for(var curday in spireUser.classesWeekly){
						for(var curclass in spireUser.classesWeekly[curday]){
							//Free Time takes in StartTime, the time of the last class, and the Start of the class.
							//This is used to determine how much time is between the current class and the last class
							spireUser.classesWeekly[curday][curclass].freeTime = DiffTime(startTime, spireUser.classesWeekly[curday][curclass].th_s);

							//Similar to Free Time, Class Duration takes in the Start Time and the End time, together the function determines how many minutes are in your class.
							spireUser.classesWeekly[curday][curclass].classDuration = DiffTime(spireUser.classesWeekly[curday][curclass].th_s, spireUser.classesWeekly[curday][curclass].th_e);
							// Creates the Amount of Free Time you have between all the classes. This function ignores breaks in between classes (15 minutes) and the the First Classes Free Time.
							if (curclass != 0 && spireUser.classesWeekly[curday][curclass].freeTime > 15){
								freeTimeTotal = freeTimeTotal + spireUser.classesWeekly[curday][curclass].freeTime;
							}

							//Creates the Height in pixels for the Box's size
							spireUser.classesWeekly[curday][curclass].freeTimePadded = spireUser.classesWeekly[curday][curclass].freeTime * heightMultiplier;
							spireUser.classesWeekly[curday][curclass].classDurationPadded = spireUser.classesWeekly[curday][curclass].classDuration * heightMultiplier;

							//Sets the StartTime to the end of the class time to use in the freeTime calculation
							startTime = spireUser.classesWeekly[curday][curclass].th_e;
						}
					
						// Creates a variable on when your day ends
						spireUser.classesWeekly[curday].endTime = startTime;
						console.log(spireUser.classesWeekly[curday].endTime);
						//Calculates the padding at the End of the day. 6:45 is the last time of normally scheduled classes acording to Umass's Website.
						spireUser.classesWeekly[curday].endTimePadding = DiffTime(startTime,"6:45 PM");
						spireUser.classesWeekly[curday].freeTimeTotal = freeTimeTotal;

						//Reset Variables for the Next Day
						freeTimeTotal = 0;
						startTime = "8:00 AM";
					}
					console.log(util.inspect(spireUser, {showHidden: false, depth: null}));
