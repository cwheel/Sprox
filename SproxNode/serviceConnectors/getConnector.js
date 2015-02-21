var Spooky = require('spooky');
var GetMap = require('.././maps/get.js');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'http'}}, function (err) {
		//Initialize the generic auth page
	    spooky.start(GetMap.entryURL);

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
	    }, GetMap.authFailure);

	    //Wait for the main page to load and indicate an end to the redirects
		spooky.waitForSelector(GetMap.redirectsDone, function() {});
		
		//Find each value of the UCard property
		spooky.then([{tags : GetMap.userTags, vClass : GetMap.valueClass}, function() {
			var vals = {};

			for (var tag in tags) {
				vals[tags[tag]] = this.evaluate(function (tag, valueClass) {
					return $('.account_name:contains("' + tag + '")').parent().find('.' + valueClass)[0].innerHTML;
				}, tag, vClass);
			}

			//Report the UCard values
			this.emit('values', vals);
	    }]);


		//Get the users transaction history (Goes back 200 transactions)
		spooky.thenOpen("https://get.cbord.com/umass/full/history.php", function () {});

		//Iterate over the transactions
		spooky.then([{'GetMap' : GetMap.transactionAttribs}, function() {
	   		var transactions = [];

	   		var numEven = this.evaluate(function () {
				return document.getElementsByClassName("odd").length;
			});

			var numOdd = this.evaluate(function () {
				return document.getElementsByClassName("odd").length;
			});

			//Get the specified transaction as an object
			var getRow = function (pageInstance, row, type) {
		   		var time = pageInstance.evaluate(function (row, type, mapObject) {
					return document.getElementsByClassName(type)[row].getElementsByClassName(mapObject.mainElem)[0].getElementsByClassName(mapObject.time)[0].innerHTML;
				}, row, type, GetMap.date);
				var date = pageInstance.evaluate(function (row, type, mapObject) {
					return document.getElementsByClassName(type)[row].getElementsByClassName(mapObject.mainElem)[0].getElementsByClassName(mapObject.date)[0].innerHTML;
				}, row, type, GetMap.date);
				var location = pageInstance.evaluate(function (row, type, mapObject) {
					return document.getElementsByClassName(type)[row].getElementsByClassName(mapObject)[0].innerHTML;
				}, row, type, GetMap.location);
				var cost = pageInstance.evaluate(function (row, type, mapObject) {
					return document.getElementsByClassName(type)[row].getElementsByClassName(mapObject)[0].innerHTML;
				}, row, type, GetMap.cost);

				//If the value is meaningless, make it one swipe
				if (cost == GetMap.swipe) {
					cost = "One Swipe";
				}

				//The horrors of regex live on....
				//Make the location title case
				location = location.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

				//Remove all numbers (i.e cash registers)
				location = location.replace(/[0-9]/g, '');

				//Remove the extra whitespace left over from removing numbers
				location = location.trim();

				//Make the cost neutral
				cost = cost.replace("- ","");
				cost = cost.replace("+ ","");

				return {'time' : time, 'date' : date, 'location' : location, 'cost' : cost};
			}

			//Merge the even and odd arrays (used by GET for alternating rows)
			for (var i = 0; i < numOdd; i++) {
				//Fetch the odd row
				var row = getRow(this, i, "odd")
				
				//If the transaction was not made by GET itself, add it to the array
				if (row.location != GetMap.admin && row.location != GetMap.admin2) {
					transactions.push(row);
				}
				
				//Make sure we have an accessable even row, even's will run our before odd
				if (i < numEven) {
					//Fetch the odd row
					var row = getRow(this, i, "even")

					//If the transaction was not made by GET itself, add it to the array
					if (row.location != GetMap.admin && row.location != GetMap.admin2) {
						transactions.push(row);
					}
				}
			}

			//Report the transaction history
			this.emit('values', transactions);
	    }]);

		spooky.run();
	});

	return spooky;
}