sprox.controller('loginController',['$scope', '$location', '$timeout', '$rootScope', function($scope, $location, $timeout, $rootScope) {
	//Initialize Route
	$scope.pageClass = "toggle";
	$scope.showLogin = true;

	$scope.loginStatus = "Login";
	$scope.build = version;
	$scope.netid = "";
	$scope.pass = "";

	//Initialize socket blockers
	var opened = {"sas" : false, "parking" : false, "get": false};

	//Check if the user has a session
	if (document.cookie != "") {
		//Configure the route as if the user is logged in
		//(Worst Case) They're not and get a broken page...
		$scope.showLogin = false;	
		$location.path('/sc');		
		isAuthed = true;				
		$scope.$apply();

		sendMessage("restore_session", [document.cookie]);

		//Restore data from the socket back to the view
		$rootScope.$on('session_restore', function(event, args) {
			var session = angular.fromJson(args);

			//Move the incoming data to its correct locations
			userData = angular.fromJson(session.spire);
			funds = angular.fromJson(session.get);
			parking = angular.fromJson(session.parking);
			
			//Inform the main controller that it should update
			$rootScope.$broadcast("restoreCompleted", null);
		});
	}

	//Triggered when a user attempts to login
	$scope.login = function() {
		username = $scope.netid;
		$scope.loginStatus = "Connecting to Login Server...";

		//Verify that the user entered something
		if ($scope.netid !== "" && $scope.pass !== "") {
			$scope.loading = true;
			user = $scope.netid;

			//Initialize the login sockets
			var sasAuth = new WebSocket(sproxSrv);
			var sasParking = new WebSocket(sproxSrv);
			var sasGet = new WebSocket(sproxSrv);

			//SAS(Main Auth) Socket
			//===============================
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
				//The usual incoming data
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
				} 
				//A status update during the authentication process
				else if (event.data.substring(0, "[auth_status]".length) === "[auth_status]") {
					$scope.showStatusText = true;
					$scope.loginStatus = event.data.replace("[auth_status]", "");
					$scope.$apply();
				} 
				//An authentication failure
				else if (event.data == "[authentication_failure]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "Invalid NetID or password";
					$scope.$apply();

					sasAuth.close();
					sasParking.close();
					sasGet.close();
					
					opened = {"sas" : false, "parking" : false, "get": false};

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} 
				//An auth failure due to a whitelist error
				else if (event.data == "[authentication_failure_whitelist]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "NetID not on whitelist";
					$scope.$apply();

					sasAuth.close();
					sasParking.close();
					sasGet.close();
					
					opened = {"sas" : false, "parking" : false, "get": false};

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);
					
					sasAuth = null;
				} 
				//An auth failure due to being on the blacklist
				else if (event.data == "[authentication_failure_blacklist]") {
					$scope.showStatusText = true;
					$scope.loading = false;
					$scope.loginStatus = "NetID banned from Sprox";
					$scope.$apply();

					sasAuth.close();
					sasParking.close();
					sasGet.close();

					opened = {"sas" : false, "parking" : false, "get": false};

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth = null;
				} 
				//A cache status update
				else if (event.data.substring(0, "[cache_status]".length) === "[cache_status]") {
					//The user has no cache and has not told us they don't want one, ask them
					if (event.data.replace("[cache_status]", "") == "0") {
						askCache = true;
					}
				} 
				//The inital UUID comes back
				else if (event.data.substring(0, "[uuid]".length) === "[uuid]") {
					uuid = event.data.replace("[uuid]", "");
					document.cookie = user + "," + uuid;
				} 
				//Looks like SAS had trouble connecting
				else if (event.data == "[service_down_spire]") {
					$scope.loginStatus = "Spire appears to be offline...";
					$scope.$apply();

					$timeout(function() {
						$scope.loginStatus = "Login";
						$scope.$apply();
					}, 5000);

					sasAuth.close();
					sasAuth = null;
				} 
				//An arbitrary dev flag
				else if (event.data.substring(0, "[dev]".length) === "[dev]") {
					if (event.data.replace("[dev]", "") == "0") {
						developer = false;
					} else {
						developer = true;
					}
				}
			};

			//Get socket
			//===============================
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

			//Parking socket
			//===============================
			sasParking.onopen = function(event) {
				if (!opened.parking) {
					opened.parking = !opened.parking;
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
			//If the user failed out earlier
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