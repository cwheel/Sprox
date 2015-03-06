var Spooky = require('spooky');
var ParkingMap = require('.././maps/parking.js');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'http'}}, function (err) {

		//Initialize the generic Shibboleth auth page for Parking
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

	    //Check for Invalid Credentials
	    spooky.then([{'authFailed' : ParkingMap.authFailure}, function(){
	    	if (this.getPageContent().indexOf(authFailed) > -1) {
	    		this.emit('authFailure', null);
	    		this.exit();
	    	}
	    }]);

	    //Wait for the topbar to load-in before scraping
		spooky.waitForSelector("#topbannercontainer", function() {});

		spooky.then([{'tag' : ParkingMap.tag}, function(){

			//Gets the Permits Table and puts the HTML into a var called content
			var content = null;
			content = this.evaluate(function (tag) {
			    return document.getElementsByClassName(tag)[0].innerHTML;
			}, tag);
			this.echo(content);
	    	this.emit('values', content);
	    }]);

		spooky.run();
	});

	return spooky;
}