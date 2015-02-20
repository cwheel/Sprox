var bcrypt = require('bcrypt');
var Passport = require('passport');

module.exports = function(app) {
	function requireAuth(req, res, next) {
		if (req.isAuthenticated()) {
	    	return next();
		}

	  	res.redirect('/');
	}

	//Login
	app.post('/login', Passport.authenticate('local', { successRedirect: '/login/success', failureRedirect: '/login/failure', failureFlash: false }));

	app.get('/login/success', function(req, res){res.send({ loginStatus: req.user });});
	app.get('/login/failure', function(req, res){res.send({ loginStatus: 'failure' });});
	app.get('/authStatus', function(req, res){
		if (req.isAuthenticated()) {
	    	res.send({ authStatus: 'valid' });
		} else {
			res.send({ loginStatus: 'invalid' });
		}		
	});

	//Logout
	app.get('/logout', function(req, res){
      req.logout();
      res.redirect("/");
   });

	//Catch all 404's
	app.get('*', function(req, res){
		res.redirect('/');
	});
};