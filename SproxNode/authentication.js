var SpireConnector = require('./serviceConnectors/spireConnector');
var SpireMap = require('./maps/spire.js');
var merge = require('merge');

module.exports = function(passport, strategy) {
	passport.use('local', new strategy(function(username, password, done) {
		var spire =  new SpireConnector(username, password);
		var spireUser = {};
		var objFinished = 0;

		spire.on('values', function (vals) {
			objFinished++;
			spireUser = merge(spireUser, vals);

			if (objFinished == Object.keys(SpireMap.map).length) {
				return done(null, spireUser);
			}
		});

		spire.on('authFailure', function (vals) {
			return done(null, false);
		});
	}));

	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
	  done(null, user)
	});
};