var Spooky = require('spooky');
var ParkingMap = require('.././maps/parking.js');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'http'}}, function (err) {
		//Initialize the generic auth page
	    spooky.start(ParkingMap.entryURL);

	    //Fill the login form
	  	spooky.then([{"user": user, "passwd": passwd}, function () {
	        this.fill('#query', {
	            'j_username': user,
	            'j_password' : passwd
	        }, true);
	    }]);

	  	//Catch all of possible redirects (Authn and SAML2)
	    spooky.then(function(){});
	    spooky.then(function(){});
	   	spooky.then(function(authFailure){
	    	if (this.getPageContent().indexOf(authFailure) > -1) {
	    		this.emit('authFailure', null);
	    		this.exit();
	    	}
	    }, ParkingMap.authFailure);

	    //Wait for the version label to indicate an end to the redirects
		spooky.waitForSelector("#topbannercontainer", function() {});

		spooky.then([{'tag' : ParkingMap.tag}, function(){

			var content = this.evaluate(function (tag) {
			    return document.getElementsByClassName(tag)[0].innerHTML;
			}, tag);

	    	this.emit('values', content);
	    }]);

		spooky.run();
	});

	return spooky;
}