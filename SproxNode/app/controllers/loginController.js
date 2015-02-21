sprox.controller('loginController',['$scope', '$location', '$timeout', '$rootScope', '$http', function($scope, $location, $timeout, $rootScope, $http) {
	//Initialize Route
	$scope.pageClass = "toggle";
	$scope.showLogin = true;

	$scope.loginStatus = "Login";
	$scope.build = version;
	$scope.login = {'username' : '', 'password' : ''};

	//Initialize socket blockers
	var opened = {"sas" : false, "parking" : false, "get" : false};

	//Triggered when a user attempts to login
	$scope.login = function() {
		username = $scope.netid;
		$scope.loginStatus = "Connecting to Login Server...";

		$http({
		 	method  : 'POST',
			url     : '/login',
			data    : $.param($scope.login),
			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.success(function(resp) {
			if (angular.fromJson(resp).loginStatus == 'valid') {
				$http({
				    method : 'GET',
				    url : '/userInfo/spire'
				})
				.success(function(resp) {
				    userData = angular.fromJson(resp);

				    $location.path('/sc');						
					$scope.pageClass = "scale-fade-in";
				    $scope.$emit('loginCompleted', null);
				});
			} else {
				$scope.loginStatus = "Invalid NetID or password";

				$timeout(function() {
					$scope.loginStatus = "Login";
				}, 5000);
			}
		});
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