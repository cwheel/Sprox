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
	    	for (var i = 0; i < lines.length; i++) {
	    		if (lines[i].trim() != "" && lines[i].indexOf("SPECIAL") == -1) {
	    			this.emit("console", "'" + lines[i].trim() + "'");
	    		}
	    		
	    	}
	    });

		spooky.run();	
	});

	return spooky;
}