var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnector');
var UmassParking = require('./serviceConnectors/parkingConnector');
var CachedUser = require('./models/user');
var Note = require('./models/note');
var User = require('./models/user');
var sha512 = require('js-sha512');
var CryptoJSAES = require('node-cryptojs-aes');
var bcrypt = require('bcrypt');
//var TableToJson = require('tabletojson');

module.exports = function(app) {
	var userSession = {};
	var mitmPort = Math.floor(Math.random() * 60000) + 10000

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
		if (userSession[req.user.spireId] != undefined) {
			delete userSession[req.user.spireId];
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
		if (userSession[req.user.spireId] != undefined) {
			delete userSession[req.user.spireId];
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
		if (req.body.cache != null) {
			if (req.body.cache == 'true' && req.body.password != null) {
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
					delete objUser._id;

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
			} else {
				res.send(400, "Missing or invalid request parameters.");
			}
		} else {
			res.send(400, "Missing or invalid request parameters.");
		}
   	});

   	//Return the cache state
	app.get('/userInfo/cache', requireAuth, function(req, res) {
		CachedUser.findOne({user : sha512(req.user.netid)}, function(err, user) {
			if (err) return res.send(500, { error: err });

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
		console.log("[Service-GET] Fetching GET information for user: '" + req.body.username + "'...");

		if (sessionCacheExists(req.body.username, "ucard")) {
			if (sessionCacheEntryValid(req.body.username, "ucard")) {
				if (req.body.api == 'true') {
					res.send({status : 'success'});
					return;
				} else {
					res.send(fetchSessionCacheEntry(req.body.username, "ucard"));
					return;
				}
			} else {
				sessionCacheRemoveEntry(req.body.username, "ucard");
			}
		}

		mitmPort++;
		var mitm = require('child_process').exec("mitmproxy -p " + mitmPort);
		console.log("[Service-GET] Started GET access proxy on port " + mitmPort);

		setTimeout(function() {
			var get = new UmassGet(req.body.username, req.body.password, mitmPort);
			/*get.on('console', function (line) {
			    console.log(line);
			});*/

			var fetched = [];

			get.on('values', function (vals) {
				fetched.push(vals);

				if (fetched.length > 1) {
					console.log("[Service-GET] Finished fetching GET information for user: '" + req.body.username + "'!");

					//Cache their funds for later
					setSessionCacheEntry(req.body.username, "ucard", fetched, minutes(30));

					if (req.body.api == 'true') {
						res.send({status : 'success'});
					} else {
						res.send(userSession[req.body.username]["ucard"]);
					}

					mitm.kill('SIGINT');
				}
			});
		}, 1000);
   	});

	//GET via a GET request, used only to restore the users session (Web Only)
   	app.get('/userInfo/ucard', requireAuth, function(req, res) {
		if (sessionCacheExists(req.user.netid, "ucard")) {
			res.send(fetchSessionCacheEntry(req.user.netid, "ucard"));
		} else { 
			res.status(403).send("You must have a session before requesting your funds.");
		}
   	});

   	//Funds via a GET request, used only in API where the Cocoa JSON parser is literally useless (API Only)
   	app.get('/userInfo/ucardFunds', requireAuth, function(req, res) {
		if (userSession[req.user.spireId] != undefined) {
			res.send(userSession[req.user.spireId]['ucard'][0]);
		} else { 
			res.send({status : "init_needed_failure"});
		}
   	});

   	//Funds via a GET request, used only in API where the Cocoa JSON parser is literally useless (API Only)
   	app.get('/userInfo/ucardTransactions', requireAuth, function(req, res) {
		if (userSession[req.user.spireId] != undefined) {
			res.send(userSession[req.user.spireId]['ucard'][1]);
		} else { 
			res.send({status : "init_needed_failure"});
		}
   	});

	//Spire
	app.get('/userInfo/spire', requireAuth, function(req, res) {
		res.send(req.user);
   	});

	//Provide basic user info for desktop clients, (i.e Cocoa is incapable of parsing anything multilevel) (API only)
   	app.get('/userInfo/spireBasic', requireAuth, function(req, res) {
		res.send({'fullname' : req.user.studentFullname, 'major' : req.user.major});
   	});

	//Parking
	app.post('/userInfo/parking', function(req, res) {
		console.log("[Service-Parking] Fetching Parking information for user: '" + req.body.username + "'...");

		if (sessionCacheExists(req.user.spireId, "parking")) {
			if (sessionCacheEntryValid(req.user.spireId, "parking")) {
				res.send(fetchSessionCacheEntry(req.user.spireId, "parking"));
				return;
			} else {
				sessionCacheRemoveEntry(req.user.spireId, "parking");
			}
		}

		var parking = new UmassParking(req.body.username, req.body.password);

		parking.on('values', function(vals) {
			setSessionCacheEntry(req.body.username, "parking", vals, minutes(30));

			res.send(vals);
			console.log("[Service-Parking] Fetching Parking information for user: '" + req.body.username + "'!");
		});

		parking.on('authFailure', function() {
			res.send({ status : 'authFailure' });
			console.log("[Service-GET] Failed to fetch Parking information for user: '" + req.body.username + "'...");
		});
	});

	//Parking via a GET request, used only to restore the users session (Web Only)
   	app.get('/userInfo/parking', requireAuth, function(req, res) {
		if (sessionCacheExists(req.user.netid, "parking")) {
			res.send(fetchSessionCacheEntry(req.user.netid, "parking"));
		} else { 
			res.status(403).send("You must have a session before requesting your permits.");
		}
   	});


	//Notebook save
	app.post('/notebook/save', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.title == null || req.body.content == null) {
			res.send(400, "Missing or invalid request parameters.");
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

	   		User.findOne({user : sha512(req.user.netid)}, function(err, user) {
			    if (err) return res.send(500, { error: err });
			    layout["notebookState"] = user.noteState;
			    res.send(layout);
			});
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
			res.send(400, "Missing or invalid request parameters.");
		}

		Note.findOneAndUpdate({user : req.user.netid, section : req.body.section, title : req.body.title}, {title: req.body.newTitle}, {upsert:true}, function(err, doc){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Notebook note rename
   	app.post('/notebook/renameSection', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.newSection == null) {
			res.send(400, "Missing or invalid request parameters.");
		}

		Note.update({user : req.user.netid, section : req.body.section}, {section: req.body.newSection}, {multi: true}, function(err){
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});   
		});
   	});

   	//Fetch a users notebook sections for sharing
   	app.get('/notebook/getSections', requireAuth, function(req, res) {
		if (req.query.user == null) {
			res.send(400, "Missing or invalid request parameters.");
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
		if (req.user.netid == null || req.body.recipient == null || req.body.section == null || req.body.title == null) { 
			res.send(400, "Missing or invalid request parameters.");
		}

		Note.findOne({user : req.user.netid, section : req.body.section, title : req.body.title}, function(err, note) {
   			if (err) return res.send(500, { error: err });

   			if (note != null) {
   				var shareNote = new Note({user : req.body.recipient, owner : req.user.netid, section : "newShares", title : req.body.section + " - " + req.body.title, content : note.content});
   				shareNote.save();

   				res.send({"status" : "success"});
   			} else {
   				res.send(400, "Invalid request parameters.");
   			}
   		});
   	});

   	//Set the current notebook to resume for future use
   	app.post('/notebook/setResumeNote', requireAuth, function(req, res) {
		if (req.user.netid == null || req.body.section == null || req.body.title == null) { 
			res.send(400, "Missing or invalid request parameters.");
		}

   		User.findOneAndUpdate({user : sha512(req.user.netid)}, {noteState : req.body}, {upsert:true}, function(err, user) {
		    if (err) return res.send(500, { error: err });
		    res.send({ status: 'success'});
		});
   	});

	//Catch all 404's
	app.get('*', function(req, res){
		res.redirect('/');
	});

	//Insert a piece of data into the session cache
	function setSessionCacheEntry(user, entryTitle, entryData, lifespan) {
		if (userSession[user] == undefined) {
			userSession[user] = {}
		}

		userSession[user][entryTitle] = entryData;
		userSession[user][entryTitle].valid = new Date();
		userSession[user][entryTitle].lifespan = lifespan;
	}

	//Returns an item from the session cache
	function fetchSessionCacheEntry(user, entryTitle) {
		if (!sessionCacheExists(user, entryTitle)) {
			return null;
		}

		return userSession[user][entryTitle];
	}

	//Returns true if a session cache entry is still valid, returns false otherwise
	function sessionCacheEntryValid(user, entryTitle) {
		var now = new Date();

		if (!sessionCacheExists(user, entryTitle)) {
			return false;
		}

		if (now.getTime() - userSession[user][entryTitle].valid.getTime() < userSession[user][entryTitle].lifespan) {
			return true;
		} else {
			return false;
		}
	}

	//Returns true if an entry exists for the user and item, returns false otherwise
	function sessionCacheExists(user, entryTitle) {
		if (userSession[user] == undefined || userSession[user][entryTitle] == undefined) {
			return false;
		} else {
			return true;
		}
	}

	//Removes a session cache entry, returns true on success, false on failure
	function sessionCacheRemoveEntry(user, entryTitle) {
		if (!sessionCacheExists(user, entryTitle)) {
			return false;
		} else {
			delete userSession[user][entryTitle];
			return true;
		}
	}

	//Returns the specified number of minutes in milliseconds
	function minutes(min) {
		return 60 * 1000 * min;
	}
};