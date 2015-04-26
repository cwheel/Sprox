var i = 0;

$(document).ready(function () {
    var i = setInterval(timerIncrement, 60000);
    $(this).mousemove(function (e) {
        i = 0;
    });
    $(this).keypress(function (e) {
        i = 0;
    });
});

function timerIncrement() {
    i = i + 1;
    if (i > 360) {
        var logout = new WebSocket("wss://dev.sprox.net:8181");
        
        logout.onopen = function(event) {
            logout.send("[logout]" + username + "," + uuid);
        };
        
        window.location = "https://sprox.net"
    }
}