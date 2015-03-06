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

				var timeCompare = function(a,b) {
					
				}

				for (var i = 0; i < days.length; i++) {
					userData.classesWeekly[days[i]] = [];
					for (var j = 0; j < allCourses.length; j++) {
						if (allCourses[j]['location'].indexOf(days[i]) > -1) {
							allCourses[j].time = allCourses[j].time.split("<br>")[0];
							allCourses[j].location = allCourses[j].location.split("<br>")[1];

							spireUser.classesWeekly[days[i]].push(allCourses[j]);
						}
					}
				}

				return done(null, spireUser);
			}
		});

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