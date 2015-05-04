var Passport = require('passport');
var UmassGet = require('./serviceConnectors/getConnectorAPI');
var CachedUser = require('./models/user');
var User = require('./models/user');
var sha512 = require('js-sha512');
var CryptoJSAES = require('node-cryptojs-aes');
var bcrypt = require('bcrypt');

module.exports = function(app, sockets) {
	sockets.on('connection', function (socket) {
		socket.on('authenticateAPI', function (data) {
			var get = new UmassGet(data.username, data.password);
			
			get.on('authFailure', function (vals) {
				socket.emit('authenticateAPIStatus', { status: 'failure' });
			});

			get.on('authSuccess', function (vals) {
				socket.emit('authenticateAPIStatus', { status: 'failure' });
			});

			get.on('history', function (vals) {
				socket.emit('getHistoryAPI', vals);
			});

			get.on('funds', function (vals) {
				socket.emit('getFundsAPI', vals);
			});

			socket.on('disconnect', function () {
				console.log("it was closed");
				delete get;
			});
			
	 	});
	});
};