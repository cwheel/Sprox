var Spooky = require('spooky');
var DiningMap = require('.././maps/dining.js');

module.exports = function(user,passwd,day) {
	var spooky = new Spooky({child: {
            transport: 'stdio'
        }}, function (err) {

        //Pull the menu
	    spooky.start(DiningMap.entryURL + day);

	    //Wait for it to come back
	    spooky.then(function() {
	    	//Pull the content
	    	var rawMenu = this.evaluate(function () {
	    		return document.getElementById("content");
	    	});

	    	//Clean up the raw menu content
	    	rawMenu = rawMenu.innerHTML.replace(new RegExp("<[^>]*>", "g"), " ").trim().replace(/ +(?= )/g,'').replace(/\t+/g, "");
	    	rawMenu = rawMenu.replace(/&nbsp;/g, "");
	    	rawMenu = rawMenu.replace(/&amp;/g, "");
	    	rawMenu = rawMenu.replace(/Today's Menu/g, "");

	    	//Split the menu line by line
	    	var lines = rawMenu.split("\n");
	    	var curTime;
	    	var menu = {};

	    	//Iterate over each line
	    	for (var i = 0; i < lines.length; i++) {
	    		//Trim the line
	    		var line = lines[i].trim();

	    		//Ignore the line if its a 'special' item
	    		if (line != "" && line.indexOf("SPECIAL") == -1) {
	    			//Determine the meal and clean it up
	    			if (line == "Breakfast" || line == "Lunch" || line == "Dinner Menu") {
	    				curTime = line.replace(" ","").replace("Menu", "");

	    				//Add a spot in the dictionary for whatever meal it is
 						menu[curTime] = [];
	    			} else if (line.indexOf("The dining area is divided") > -1) {
	    				//Skip the next 4 lines, its just generic info that doesn't matter
	    				i += 4;
	    			} else if (line.indexOf("Entrée") < 0 && line.indexOf("UMass Bakeshop") < 0) {
	    				//Expand w/ to with, we're not sending a text message here...
	    				var item = lines[i].trim().replace("w/", "with ");

	    				//Remove the excess spaces, there seem to be far to many for some reason...
	    				item = item.replace(/\s\s+/g, " ");

	    				//Try to detect if this item only occurs at certain locations
	    				var locs = item.split("(");

	    				//If it has more than 1 item, it found a location
	    				if (locs.length > 1) {
	    					//Strip out parens from the location(s)
	    					locs = locs[1].replace(")","");

	    					//Remove the locations tag from the menu item and cut the whitespace off
	    					item = item.replace("(" + locs + ")", "").trim();

	    					//Split the locations by space, there may be more than one
	    					locs = locs.split(" ");
	    				} else {
	    					locs = "all";
	    				}
	    				
	    				//Add the menu item to the right meal with the correct locations
	    				menu[curTime].push({item : item, locations : locs});
	    			}
	    		}
	    	}

	    	this.emit("console", menu);
	    });

		spooky.run();	
	});

	return spooky;
}