var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnector');
var UmassParking = require('./serviceConnectors/parkingConnector');
var CachedUser = require('./models/user');
var Note = require('./models/note');
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

	//Notebook save
	app.post('/notebook/save', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.title == null || req.body.content == null) {
			res.send(400, "Missing or invalid request parameters.")
		}

		Note.findOneAndUpdate({user : req.user.netid, section : req.body.section, title : req.body.title}, {content: req.body.content}, {upsert:true}, function(err, doc){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Notebook layout
   	app.get('/notebook/layout', requireAuth, function(req, res) {
   		Note.find({user : req.user.netid}, function(err, notes) {
   			if (err) return res.send(500, { error: err });
   			var layout = {};

   			notes.forEach(function(note) {
   				if (layout[note.section] == undefined) {
   					layout[note.section] = {};
   				}

   				layout[note.section][note.title] = "";
   			});

   			res.send(layout);
   		});
   	});

   	//Notebook note
   	app.get('/notebook/note', requireAuth, function(req, res) {
   		if (req.user.netid == null || req.query.section == null || req.query.title == null) {
   			res.send(400, "Missing or invalid request parameters.");
   		}

   		Note.findOne({user : req.user.netid, section : req.query.section, title : req.query.title}, function(err, note) {
   			if (err) return res.send(500, { error: err });
   			res.send(note.content);
   		});
   	});

   	//Notebook delete
   	app.post('/notebook/delete', requireAuth, function(req, res) {
   		var remove;

   		if (req.user.netid == null || req.body.section == null) {
   			res.send(400, "Missing or invalid request parameters.");
   		}

   		if (req.body.title == null) {
   			remove = {user : req.user.netid, section : req.body.section};
   		} else {
   			remove = {user : req.user.netid, section : req.body.section, title : req.body.title};
   		}

   		Note.remove(remove, function(err, doc){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Notebook note rename
   	app.post('/notebook/rename', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.title == null || req.body.newTitle == null) {
			res.send(400, "Missing or invalid request parameters.")
		}

		Note.findOneAndUpdate({user : req.user.netid, section : req.body.section, title : req.body.title}, {title: req.body.newTitle}, {upsert:true}, function(err, doc){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Notebook note rename
   	app.post('/notebook/renameSection', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.newSection == null) {
			res.send(400, "Missing or invalid request parameters.")
		}

		Note.update({user : req.user.netid, section : req.body.section}, {section: req.body.newSection}, {multi: true}, function(err){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Fetch a users notebook sections for sharing
   	app.get('/notebook/getSections', requireAuth, function(req, res) {
		if (req.query.user == null) {
			res.send(400, "Missing or invalid request parameters.")
		}

		Note.find({user : req.query.user}, function(err, notes) {
   			if (err) return res.send(500, { error: err });
   			var sections = [];

   			if (notes == null) {
   				res.send(["No Notebook Sections"])
   			}

   			notes.forEach(function(note) {
   				if (sections[note.section] == undefined) {
   					sections.push(note.section);
   				}
   			});

   			res.send(sections);
   		});
   	});

   	//Share a section in a notebook
   	app.post('/notebook/share', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.user == null || req.body.section == null || req.body.title == null) { 
			res.send(400, "Missing or invalid request parameters.")
		}

		Note.findOne({user : req.user.netid, section : req.body.section, title : req.body.title}, function(err, note) {
   			if (err) return res.send(500, { error: err });
   			
   			var content = note.content;

  			Note.insert({}, function(err) {
  				res.send({"status" : "success"});
  			});
   		});
   	});

	//Catch all 404's
	app.get('*', function(req, res){
		res.redirect('/');
	});
};