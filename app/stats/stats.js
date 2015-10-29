var aStep = 0;

$(document).ready(function() {
	animateBalls();	
	loadStats();
	$("#build").html("Build " + version);
});

function animateBalls() {
	var ctx = document.getElementById('sidebar').getContext('2d');
	ctx.clearRect(0, 0, document.getElementById('sidebar').width, document.getElementById('sidebar').height);
  
	for (var i = 0; i < 120; i++) {
		ctx.beginPath();
		ctx.arc(60 + (20 * i), 200 + 175 * (Math.sin(aStep * (i / 200 + 0.08))), 5, 0, 2 * Math.PI);
		ctx.fillStyle = "#fff";
		ctx.fill();
	}
  
	aStep = aStep + 0.2;
	requestAnimationFrame(animateBalls);
}

function loadStats() {
	var loadSocket = new WebSocket("wss://dev.sprox.net:8181");
	
	loadSocket.onopen = function(event) {
		loadSocket.send("[stats]");
	};

	loadSocket.onmessage = function(event) {
		if (event.data.substring(0, "[sprox_statistics]".length) === "[sprox_statistics]") {
			var stats = jQuery.parseJSON(event.data.replace("[sprox_statistics]", ""));
			loadSocket.close();
			$("#ssc").html(stats.ssc);
			$("#car").html(stats.car);
			$("#sasc").html(stats.sasc);
			$("#np").html(stats.np);
		}
	};
	setTimeout(loadStats, 1000*60);
}