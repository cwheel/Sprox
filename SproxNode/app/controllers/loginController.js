sprox.controller('loginController',['$scope', '$location', '$timeout', '$rootScope', '$http', function($scope, $location, $timeout, $rootScope, $http) {
	//Initialize Route
	$scope.pageClass = "toggle";
	$scope.showLogin = true;

	//Login Form
	$scope.loginStatus = "Login";
	$scope.build = version;
	$scope.login = {'username' : '', 'password' : ''};

	//The barely-witty statuses
	var shouldSetWittyStatus = false;
	var wittyStats = ["Eating at Bluewall...", "Slaying the Spire Dragon...", "Waiting for a Bus...", "Summiting Orchard Hill...", "Rotating Soggy Cloths..."]

	//Triggered when a user attempts to login
	$scope.login = function() {
		username = $scope.netid;
		shouldSetWittyStatus = true;
		$scope.setWittyStatus();

		//Send the user params to Passport for authentication
		$http({
		 	method  : 'POST',
			url     : '/login',
			data    : $.param($scope.login),
			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.success(function(resp) {
			//If the auth was valid, ask for the users Spire info
			if (angular.fromJson(resp).loginStatus == 'valid') {
				$http({
				    method : 'GET',
				    url : '/userInfo/spire'
				})
				.success(function(resp) {
					//Set the userData object
				    userData = angular.fromJson(resp);
				    isAuthed = true;

				    //Perfom the usual post login actions
				    $location.path('/sc');						
					$scope.pageClass = "scale-fade-in";
				    $scope.$emit('loginCompleted', null);
				});
			} else {
				//User failed to login, notify them
				shouldSetWittyStatus = false;
				$scope.loginStatus = "Invalid NetID or password";

				//Change the button message back in 5 seconds
				$timeout(function() {
					$scope.loginStatus = "Login";
				}, 5000);
			}
		});
	};

	//Allow the enter key to send logins, needed as ng-keypress double fires... for some reason...
	$scope.enterLogin = function(keyEvent) {
		if (keyEvent.which === 13) {
			$scope.login();

			keyEvent.stopPropagation();
			keyEvent.preventDefault();  
			return false;
		}
	}

	//Sets an number of witty statuses.. you know... for entertainment
	$scope.setWittyStatus = function() {
		if (shouldSetWittyStatus) {
			$scope.loginStatus = wittyStats[Math.floor(Math.random() * wittyStats.length)];

			$timeout($scope.setWittyStatus, 2000);
		}
	};
}]);

//http://www.reddit.com/r/gifs/comments/2on8si/connecting_to_server_so_mesmerizing/cmow0sz
//And http://codepen.io/anon/pen/OPMvOb

sprox.directive('loginAnimation',function() {
	return {link: function(scope, element) {
	  	var aStep = 0;
		animateBalls();
		function animateBalls() {
			var ctx = element[0].getContext('2d');
			ctx.clearRect(0, 0, element[0].width, element[0].height);
		  
			for (var i = 0; i < 12; i++) {
				ctx.beginPath();
				ctx.arc(60 + (20 * i), 200 + 50 * (Math.sin(aStep * (i / 200 + 0.08))), 5, 0, 2 * Math.PI);
				ctx.fillStyle = "#fff";
				ctx.fill();
			}
		  
			aStep++;
			requestAnimationFrame(animateBalls);
		}
	  }
	};    
});