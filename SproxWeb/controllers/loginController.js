sprox.controller('loginController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.pageClass = "toggle";
	$scope.showLogin = true;

	$scope.loginStatus = "Login";
	$scope.build = version;
	$scope.netid = "";
	$scope.pass = "";

	var opened = {"sas" : false, "parking" : false, "get": false};

	$scope.login = function() {
		username = $scope.netid;
		$scope.loginStatus = "Connecting to Login Server...";

		if ($scope.netid !== "" && $scope.pass !== "") {
			$scope.loading = true;

			user = $scope.netid;
			var sasAuth = new WebSocket(sproxSrv);
			var sasParking = new WebSocket(sproxSrv);
			var sasGet = new WebSocket(sproxSrv);

			sasAuth.onopen = function(event) {
				if (!opened.sas) {
					opened.sas = !opened.sas;
					sasAuth.send("[authenticate],[spire]," + $scope.netid + "," + $scope.pass);
				}
			};

			sasAuth.onerror = function(event) {
				$scope.loginStatus = "Cannot connect to server";	
				$scope.$apply();

				$timeout(function() {
					$scope.loginStatus = "Login";
					$scope.$apply();
				}, 5000);
			};
			
			sasAuth.onmessage = function(event) {
				if (event.data.substring(0, "[user_data_reply]".length) === "[user_data_reply]") {
					userData = angular.fromJson(event.data.replace("[user_data_reply]", ""));
					isAuthed = true;
					$location.path('/sc');						
					$scope.pageClass = "scale-fade-in";
					$scope.$apply();
					$scope.$emit('loginCompleted', null);

					$scope.loading = false;
					$scope.loginStatus = "";
					$scope.$apply();
				} else if (event.data.substring(0, "[auth_status]".length) === "[auth_status]") {
					$scope.showStatusText = true;
					$scope.loginStatus = event.data.replace("[auth_status]", "");
					$scope.$apply();
				} else if (event.data == "[authentication_failure]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "Invalid NetID or password";
					$scope.$apply();

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} else if (event.data == "[authentication_failure_whitelist]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "NetID not on whitelist";
					$scope.$apply();

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} else if (event.data == "[authentication_failure_blacklist]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "NetID banned from Sprox";
					$scope.$apply();

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} else if (event.data.substring(0, "[cache_status]".length) === "[cache_status]") {
					if (event.data.replace("[cache_status]", "") == "0") {
						askCache = true;
					}
				} else if (event.data.substring(0, "[uuid]".length) === "[uuid]") {
					uuid = event.data.replace("[uuid]", "");
				} else if (event.data == "[service_down_spire]") {
					$scope.loginStatus = "Spire appears to be offline...";
					$scope.$apply();

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} else if (event.data.substring(0, "[dev]".length) === "[dev]") {
					if (event.data.replace("[dev]", "") == "0") {
						developer = false;
					} else {
						developer = true;
					}
				}
			};

			sasGet.onopen = function(event) {
				if (!opened.get) {
					opened.get = !opened.get;
					sasGet.send("[authenticate],[get]," + $scope.netid + "," + $scope.pass);
				}
			};

			sasGet.onmessage = function(event) {
				if (event.data.substring(0, "[user_data_reply_get]".length) === "[user_data_reply_get]") {
					funds = angular.fromJson(event.data.replace("[user_data_reply_get]", ""));
					sasGet.close();
				}
			};

			sasParking.onopen = function(event) {
				if (!opened.parking) {
					opened.sas = !opened.parking;
					sasParking.send("[authenticate],[parking]," + $scope.netid + "," + $scope.pass);
				}
			};

			sasParking.onmessage = function(event) {
				if (event.data.substring(0, "[user_data_reply_parking]".length) === "[user_data_reply_parking]") {
					parking = angular.fromJson(event.data.replace("[user_data_reply_parking]", ""));
					sasParking.close();
				} 
			};
		} else {
			$scope.loginStatus = "Invalid NetID or password";

			$timeout(function() {
				$scope.loginStatus = "Login";
			}, 5000);
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