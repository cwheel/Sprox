var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnector');
var UmassParking = require('./serviceConnectors/parkingConnector');
var CachedUser = require('./models/user');
var sha512 = require('js-sha512');
var CryptoJSAES = require('node-cryptojs-aes');
var bcrypt = require('bcrypt');
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

	//The login worked
	app.get('/login/success', function(req, res){
		if (userFunds[req.user.spireId] != undefined) {
			delete userFunds[req.user.spireId];
		}

		res.send({ loginStatus: 'valid' });
	});

	//The login failed
	app.get('/login/failure', function(req, res){res.send({ loginStatus: 'failure' });});

	//Return the current users status
	app.get('/authStatus', function(req, res){
		if (req.isAuthenticated()) {
	    	res.send({ authStatus: 'valid' });
		} else {
			res.send({ authStatus: 'invalid' });
		}		
	});

	//Logout
	app.get('/logout', requireAuth, function(req, res){
		if (userFunds[req.user.spireId] != undefined) {
			delete userFunds[req.user.spireId];
		}
		
		req.logout();
		res.redirect("/");
   	});

   	//Verify a users password
	app.post('/verifyPassword', requireAuth, function(req, res) {
		if (req.body.password != null) {
			if (bcrypt.compareSync(req.body.password, req.user.passValidator)) {
				res.send({ status: 'success'});
			} else {
				res.send({ status: 'failure'});
			}
		}
   	});

   	//Cache control
	app.post('/userInfo/setCache', requireAuth, function(req, res) {
		if (req.body.cache != null && req.body.password != null) {
			if (req.body.cache == 'true') {
				CachedUser.findOne({user : sha512(req.user.spireId)}, function(err, user) {
					var b64 = new Buffer(req.body.password).toString('base64');
					var encrypted = CryptoJSAES.CryptoJS.AES.encrypt(JSON.stringify(req.user), b64, { format: CryptoJSAES.JsonFormatter });

					var saveUser  = new CachedUser({
					     user: sha512(req.user.netid),
					     spire: JSON.parse(encrypted.toString()),
					     cached: true
					});

					var objUser = saveUser.toObject();
					delete objUser.user;

					CachedUser.update({user: saveUser.user}, objUser, {upsert: true}, function(err){return err});

					res.send({ status: 'success'});
				});
			} else if (req.body.cache == 'false') {
				var saveUser = new CachedUser({
				   user: sha512(req.user.netid),
				   spire: null,
				   cached: false
				});

				saveUser.save();

				res.send({ status: 'success'});
			}
		}
   	});

   	//Return the cache state
	app.get('/userInfo/cache', requireAuth, function(req, res) {
		CachedUser.findOne({user : sha512(req.user.netid)}, function(err, user) {
			if (user == null) {
				res.send({ status: 'unset'});
		   	} else if (user.cached) {
		   		res.send({ status: 'cached'});
		   	} else {
		   		res.send({ status: 'non-cached'});
		   	}
		});
   	});

	//GET (i.e UCard info)
	app.post('/userInfo/ucard', requireAuth, function(req, res) {
		console.log("Fetching GET information for user: '" + req.body.username + "'...");

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
   	});

	//GET via a GET request, used only to restore the users session
   	app.get('/userInfo/ucard', requireAuth, function(req, res) {
		if (userFunds[req.user.spireId] != undefined) {
			res.send(userFunds[req.user.spireId]);
		} else {
			res.send("Error: You must have a session before requesting your funds.");
		}
   	});

	//Spire
	app.get('/userInfo/spire', requireAuth, function(req, res) {
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