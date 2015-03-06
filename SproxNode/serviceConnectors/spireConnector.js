var Spooky = require('spooky');
var SpireMap = require('.././maps/spire.js');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {transport: 'http'}}, function (err) {
		//Initialize the Spire page
	    spooky.start(SpireMap.entryURL);

	    //Fill the login form
	  	spooky.then([{"user": user, "passwd": passwd}, function () {
	        this.fill('form[name="login"]', {
	            'userid': user,
	            'pwd' : passwd
	        }, true);
	    }]);

	  	//Catch all of the Spire Redirects
	    spooky.then(function(){});
	    spooky.then(function(){});
	    spooky.then(function(){
	    	if (this.getPageContent().indexOf("Your User ID and/or Password are invalid.") > -1) {
	    		this.emit('authFailure', null);
	    		this.exit();
	    	}
	    });

	    //Wait for the version label to indicate an end to the redirects
		spooky.waitForSelector(SpireMap.redirectsDone, function() {});

		//Iterate each key in the map
		for (var url in SpireMap.map) {
			//Load the map URL
			spooky.thenOpen(url, function () {});

			//Once the URL loaded
			spooky.then([{'map' : SpireMap.map[url], 'url' : url}, function() {
				var vals = {};
				var dmStartOperator = "[";
				var dmEndOperator = "]";

				//Iterate each key for the map URL
				for (var key in map) {

					//Does our key indicate it's an expression?
			        if (map[key].tag.substring(0, dmStartOperator.length) === dmStartOperator) {
			                //Obtain the root expression
			                var exp = map[key].tag.replace(dmStartOperator, "").replace(dmEndOperator, "");
			                
			                //Find the divs to search
			                var sdivs = exp.split(",");

			            //Does our expression contain a counter?
						if (map[key].tag.indexOf(".*") > -1) {

							//Counter for iteration
							var curDivIndex = 0;

							//Continue to increase our index until we hit a null
							while (this.evaluate(function (id) {return document.getElementById(id).innerHTML;}, sdivs[0].replace(".*", curDivIndex).split("::")[1]) != null) {
								if (vals[key] == undefined) {
									vals[key] = [];
								}

								//The current iteration
								var iteration = {};

								//Over each div in the expresssion
								for (var k = 0; k < sdivs.length; k++ ) {
									//Separate the key parts
									var pkey = sdivs[k].split("::")[0];
									var divId = sdivs[k].split("::")[1];

									//Capture the specified key (div)
									var id = divId.replace(".*", curDivIndex);
									iteration[pkey] = this.evaluate(function (id) {
										return document.getElementById(id).innerHTML;
									}, id);

									//Do any removes (replacements for nothing)
									for (var i = 0; i < map[key].remove.length; i++) {
										iteration[pkey] = iteration[pkey].replace(map[key].remove[i], "");
									}
				                }

				                //Push the iteration
				                vals[key].push(iteration);

				                //Increase the div count
				                curDivIndex++;
							}
				        }
				    } else {
			        	var content = this.evaluate(function (id) {
			        		return document.getElementById(id).innerHTML;
			        	}, map[key].tag);

			        	//Do any removes (replacements for nothing)
			        	for (var i = 0; i < map[key].remove.length; i++) {
			        		content = content.replace(map[key].remove[i], "");
			        	}

			        	//Push a single value
			        	vals[key] = content;
			        }
				}

				//Push the value
				this.emit('values', vals);
			}]);
		}

		//Logout of Spire
		spooky.thenOpen(SpireMap.logoutURL, function(){});

		spooky.run();
	});

	return spooky;
}