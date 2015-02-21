var bcrypt = require('bcrypt');
var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnector');

module.exports = function(app) {
	function requireAuth(req, res, next) {
		if (req.isAuthenticated()) {
	    	return next();
		}

	  	res.redirect('/');
	}

	//Login
	app.post('/login', Passport.authenticate('local', { successRedirect: '/login/success', failureRedirect: '/login/failure', failureFlash: false }));

	app.get('/login/success', function(req, res){res.send({ loginStatus: 'valid' });});
	app.get('/login/failure', function(req, res){res.send({ loginStatus: 'failure' });});
	app.get('/authStatus', function(req, res){
		if (req.isAuthenticated()) {
	    	res.send({ authStatus: 'valid' });
		} else {
			res.send({ authStatus: 'invalid' });
		}		
	});

	//Logout
	app.get('/logout', function(req, res){
      req.logout();
      res.redirect("/");
   });

	//GET (i.e UCard info)
	app.post('/userInfo/ucard', function(req, res){
		var get = new UmassGet(req.body.username, req.body.password);
		var fetched = [];

		get.on('values', function (vals) {
			fetched.push(vals);

			if (fetched.length > 1) {
				res.send(fetched);
			}
		});

		get.on('authFailure', function() {
			res.send({ status : 'authFailure' });
		});
   	});

	//Spire
	app.get('/userInfo/spire', requireAuth, function(req, res){
		res.send(req.user);
   	});

	//Catch all 404's
	app.get('*', function(req, res){
		res.redirect('/');
	});
};