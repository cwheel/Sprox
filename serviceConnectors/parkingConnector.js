var Spooky = require('spooky');
var ParkingMap = require('.././maps/parking.js');
var striptags = require('striptags');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'stdio'}}, function (err) {

		//Initialize the generic Shibboleth auth page for Parking
	    spooky.start(ParkingMap.entryURL);

	    //Since T2 is too good for a static link, we have to click their stupid button to get to the Shibboleth auth page
	    spooky.then([{"t2Button": ParkingMap.authButton}, function() {
	    	this.click(t2Button);
	    }]);

	    //Wait the Shibboleth
	    spooky.then(function () {});
	    
	    //Fill the login form
	  	spooky.then([{"user": user, "passwd": passwd}, function () {
	        this.fill('#query', {
	            'j_username': user,
	            'j_password' : passwd
	        }, false);
	    }]);

	  	//Click the login button
	  	spooky.then(function() {
	    	this.click("#login_submit");
	    });

	  	//Catch all of possible redirects (Authn and SAML2)
	    spooky.then(function(){});

	    //Check for Invalid Credentials
	    spooky.then([{'authFailed' : ParkingMap.authFailure}, function(){
	    	if (this.getPageContent().indexOf(authFailed) > -1) {
	    		this.emit('authFailure', null);
	    		this.exit();
	    	}
	    }]);

	    //Open the permits page
	    spooky.thenOpen(ParkingMap.permitsURL, function () {});

	    //Wait for the topbar to load-in before scraping
		spooky.waitForSelector(ParkingMap.permitsLoaded, function() {});

		spooky.then([{'odd' : ParkingMap.oddPermit, 'even' : ParkingMap.evenPermit, 'striptags' : striptags}, function(){
			//Gets the Permits Table and puts the HTML into a var called content
			var evenRows = null;
			evenRows = this.evaluate(function (even) {
			    return document.getElementsByClassName(even);
			}, even);

			var oddRows = null;
			oddRows = this.evaluate(function (odd) {
			    return document.getElementsByClassName(odd);
			}, odd);

			var rows = null;

			if (oddRows.length == 0 && evenRows.length != 0) {
				rows = evenRows;
			} else if (evenRows.length == 0 && oddRows.length != 0) {
				rows = oddRows;
			} else if (evenRows.length == 0 && oddRows.length == 0) {
				rows = [];
			} else {
				rows = evenRows.concat(oddRows);
			}

			if (rows.length != 0) {
				for (var i = 0; i < rows.length; i++) {
					var permit = rows[i].innerHTML.replace(new RegExp("<[^>]*>", "g"), " ").trim().replace(/ +(?= )/g,',').split(',');

					rows[i] = {};
					rows[i]['permit'] = permit[0].trim();
					rows[i]['type'] = permit[1].trim();
					rows[i]['status'] = permit[2].trim();
					rows[i]['purchased'] = permit[3].trim();
					rows[i]['start'] = permit[4].trim();
					rows[i]['end'] = permit[5].trim();
				}
			}

			this.emit('values', rows);
	    }]);

		spooky.run();
	});

	return spooky;
}