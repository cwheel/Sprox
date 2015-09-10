var Spooky = require('spooky');

module.exports = function(user,passwd) {
	var spooky = new Spooky({child: {
            transport: 'stdio'
        }}, function (err) {

	    spooky.start("http://www.umassdining.com/locations-menus/franklin/wed-sept-9");

	    spooky.then(function() {
	    	var rawMenu = this.evaluate(function () {
	    		return document.getElementById("content");
	    	});

	    	rawMenu = rawMenu.innerHTML.replace(new RegExp("<[^>]*>", "g"), " ").trim().replace(/ +(?= )/g,'').replace(/\t+/g, "");
	    	rawMenu = rawMenu.replace(/&nbsp;/g, "");
	    	rawMenu = rawMenu.replace(/&amp;/g, "");
	    	rawMenu = rawMenu.replace(/Today's Menu/g, "");

	    	var lines = rawMenu.split("\n");
	    	var curTime;
	    	var menu = {};

	    	for (var i = 0; i < lines.length; i++) {
	    		var line = lines[i].trim();
	    		if (line != "" && line.indexOf("SPECIAL") == -1) {
	    			if (line == "Breakfast" || line == "Lunch" || line == "Dinner Menu") {
	    				curTime = line.replace(" ","").replace("Menu", "");
 						menu[curTime] = [];
	    			} else if (line.indexOf("The dining area is divided") > -1) {
	    				i += 4;
	    			} else if (line.indexOf("Entrée") < 0 && line.indexOf("UMass Bakeshop") < 0) {
	    				var loc_ex = /\(.*?\)/g;
	    				var locs = loc_ex.exec(lines[i].trim());
	    				var item = lines[i].trim().replace("w/", "with ").replace(/\s\s+/g, " ");

	    				if (locs != null) {
	    					locs = locs[0].replace("(","").replace(")","").split(" ");
	    				//	item = item.replace(locs[0].toString(), "");
	    				} else {
	    					locs = "all";
	    				}
	    				
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