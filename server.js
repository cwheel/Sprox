var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var session = require('express-session');
var localStrategy = require('passport-local').Strategy;
var Passport = require('passport');
var spooky = require('spooky');
var fs = require('fs');

var app = express();

mongoose.connect('mongodb://localhost/sprox');

console.log(" ___                                       ");
console.log("/ __|_ __ _ _ _____ __                     ");
console.log("\\__ \\ '_ \\ '_/ _ \\ \\ /                     ");
console.log("|___/ .__/_| \\___/_\\_\\                     ");
console.log("    |_|         _ _    _   _ _   __  __  _ ");
console.log("     | |__ _  _(_) |__| | | | | / / /  \\/ |");
console.log("     | '_ \\ || | | / _` | |_  _/ _ \\ () | |");
console.log("     |_.__/\\_,_|_|_\\__,_|   |_|\\___/\\__/|_|");
console.log("");
console.log("");

var whitelist = null;

if (fs.existsSync("whitelist.json")) {
	console.log("=> Detected NetID whitelist, loading...")

	whitelist = JSON.parse(fs.readFileSync("whitelist.json", 'utf8'));
}

console.log("=> Connected to MongoDB database");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieParser());
app.use(session({ 
	secret: 'testsecret', 
	saveUninitialized: true, 
	resave: true
}));

app.use(Passport.initialize());
app.use(Passport.session());

app.use(express.static(__dirname + '/app'));

require('./authentication')(Passport, localStrategy, whitelist);
require('./routes')(app);

console.log("=> Starting Socket.io listener...");  
app.listen(3000);

console.log("=> Listening on :3000");     
exports = module.exports = app;
console.log("=> Sprox is up and running!");