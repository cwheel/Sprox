var Spooky = require('spooky');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'http'}}, function (err) {
		//Initialize the generic auth page
	    spooky.start("https://get.cbord.com/umass/full/login.php");

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
	    spooky.then(function(){
	    	if (this.getPageContent().indexOf("Authentication Failed") > -1) {
	    		this.exit();
	    	}
	    });

	    //Wait for the version label to indicate an end to the redirects
		spooky.waitForSelector(".date", function() {});
		spooky.then(function(){
	    	this.echo(this.getPageContent());
	    });

		spooky.thenOpen("https://get.cbord.com/umass/full/history.php", function () {});
		spooky.then(function(){
	   		this.echo(this.getPageContent());
	    });

		spooky.run();
	});

	return spooky;
}