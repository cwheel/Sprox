sprox.controller('loginController',['$scope', '$location', '$timeout', '$rootScope', '$http', function($scope, $location, $timeout, $rootScope, $http) {
	//Initialize Route
	$scope.pageClass = "loginFrame";
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
					$("#loginBack").animate({opacity: 0}, 400);
				    $scope.$emit('loginCompleted', null);
				});

				$http({
			     	method  : 'POST',
			    	url     : '/userInfo/ucard',
			    	data    : $.param($scope.login),
			    	headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			    })
			    .success(function(resp) {
			    	//If the auth was valid, save the response
			    	if (angular.fromJson(resp).status != 'authFailure') {
			    		funds = angular.fromJson(resp);
			    	} else {
			    		console.warn("Failed to authenticat with UCard.");
			    	}
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
