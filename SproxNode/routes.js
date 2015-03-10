var bcrypt = require('bcrypt');
var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnector');
var UmassParking = require('./serviceConnectors/parkingConnector');
//var TableToJson = require('tabletojson');

module.exports = function(app) {
	var userFunds = {};

	function requireAuth(req, res, next) {
		if (req.isAuthenticated()) {
	    	return next();
		}

	  	res.redirect('/');
	}

	//Login
	app.post('/login', Passport.authenticate('local', { successRedirect: '/login/success', failureRedirect: '/login/failure', failureFlash: false }));

	app.get('/login/success', function(req, res){
		if (userFunds[req.user.spireId] != undefined) {
			delete userFunds[req.user.spireId];
		}
		
		res.send({ loginStatus: 'valid' });
	});
	app.get('/login/failure', function(req, res){res.send({ loginStatus: 'failure' });});
	app.get('/authStatus', function(req, res){
		if (req.isAuthenticated()) {
	    	res.send({ authStatus: 'valid' });
		} else {
			res.send({ authStatus: 'invalid' });
		}		
	});

	//Logout
	app.get('/logout', requireAuth, function(req, res){
      req.logout();
      res.redirect("/");
   });

	//GET (i.e UCard info)
	app.post('/userInfo/ucard', requireAuth, function(req, res) {
		console.log("Fetching GET information for user: '" + req.body.username + "'...");

		//Check if we have the users funds cached
		if (userFunds[req.user.spireId] != undefined) {
			res.send(userFunds[req.user.spireId]);
		} else {
			//If we don't have their funds cached, send a new request
			var get = new UmassGet(req.body.username, req.body.password);
			var fetched = [];

			get.on('values', function (vals) {
				fetched.push(vals);

				if (fetched.length > 1) {
					console.log("Finished fetching GET information for user: '" + req.body.username + "'!");

					//Cache their funds for later
					userFunds[req.user.spireId] = fetched;
					res.send(fetched);
				}
			});
		}
   	});

	//Spire
	app.get('/userInfo/spire', requireAuth, function(req, res){
		res.send(req.user);
   	});

	//Parking
	app.get('/parking', function(req, res) {
		var parking = new UmassParking("req.query.username", "req.query.password");

		parking.on('console', function (line) {
    		console.log(line);
		});

		parking.on('values', function(vals) {
			vals = "<div> test </div>" + "<tbody>" + vals + "</tbody>"
			res.send(vals);
		});

		parking.on('authFailure', function() {
			res.send({ status : 'authFailure' });
		});

	});

	//Catch all 404's
	app.get('*', function(req, res){
		res.redirect('/');
	});
};