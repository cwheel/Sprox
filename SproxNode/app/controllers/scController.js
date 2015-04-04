sprox.controller('studentCenterController',['$scope', '$location', '$timeout', 'ngDialog', '$rootScope', '$route', '$http', function($scope, $location, $timeout, ngDialog, $rootScope, $route, $http) {

	//Set the main page values
	$scope.homeAddress  = userData.homeAddress;
	$scope.schoolAddress  = userData.schoolAddress;
	$scope.mailBox  = userData.mailbox;
	$scope.gradYear = userData.gradTerm;
	$scope.ct = userData.classesWeekly.Tu;
	$scope.showRooming = false;
	$scope.colors = colors;

	//Ensure we actually were given a roommate
	if (userData.roomateEmail != "") {
		$scope.showRooming = true;
		$scope.building = userData.building;
		$scope.roomNumber = userData.room;
		$scope.roomType = userData.roomType;
		$scope.roomate = userData.roomate;
		$scope.roomateEmail = userData.roomateEmail;
		$scope.roomateAddress = userData.roomateAddress[0].address;
		$scope.roomateCity = userData.roomateAddress[0].city;
		$scope.roomateZip = userData.roomateAddress[0].zip;
		$scope.roomateState = userData.roomateAddress[0].state;
	}

	//We're not showing any models right now
	$scope.notifModel = false;
	$scope.cacheModel = false;
	$scope.authCache = false;
	$scope.cacheBtn1 = "No Thanks";
	$scope.cacheBtn2 = "Start";
	$scope.cacheForm = {password: ""};

	//We're restoring from an existing session
	if (funds != 0) {
		$http({
		    method : 'GET',
		    url : '/userInfo/ucard'
		})
		.success(function(resp) {
			//If the auth was valid, save the response
	    	if (angular.fromJson(resp).status != 'authFailure') {
	    		funds = angular.fromJson(resp);
	    	} else {
	    		console.warn("Failed to authenticate with UCard.");
	    	}
		});
	}

	//Get the users auth state
	$http({
	    method : 'GET',
	    url : '/userInfo/cache'
	})
	.success(function(resp) {
		if (angular.fromJson(resp).status == 'unset') {
    		$scope.cacheModel = true;
    	} else if (angular.fromJson(resp).status == 'cached') {

    	} else if (angular.fromJson(resp).status == 'non-cached') {

    	}
	});
	$scope.ct = userData.classesWeekly[new Date().getDay()];

	if ($scope.ct.length !== 0) {
		$scope.classesToday = true;
	}

	$scope.setCurrentClass = function() {
		var now = new Date();
		var time;
		if (now.getMinutes().toString().length == 1) {
			time = now.getHours().toString() + "0" + now.getMinutes().toString();
		} else {
			time = now.getHours().toString() + now.getMinutes().toString();
		}
		if ($scope.ct.classes.length !== 0) {
			if (parseInt(time) < 2359 && parseInt(time) > $scope.ct.classes[$scope.ct.classes.length - 1].tfh_e) {
				$scope.classesDay = "Tomorrow's";
				$scope.ct = userData.classesWeekly[(new Date().getDay() + 1) % 7];

				if (now.getDay() == 6 || now.getDay() == 5) {
					$scope.classesToday = false;
				}
				
			} else {
				$scope.classesDay = "Today's";
			}
		}

		var foundFirst = false;
		if ($scope.ct.classes.length !== 0) {
			for (var i = 0; i < $scope.ct.length; i++) {

				$scope.ct[i].type = "scheduleClass";

				if (parseInt(time) < $scope.ct[i].tfh_s && !foundFirst) {
					$scope.ct[i].type = "scheduleClass scheduleClassNext";
					if (lastClassNotif != $scope.ct[i].name && (parseInt(time) > ($scope.ct[i].tfh_s - 15))) {
						lastClassNotif = $scope.ct[i].name;
						var notification = new Notification('Upcoming Class', {body: 'You have ' + $scope.ct[i].name + ' in 15 minutes.', icon: "favicons/favicon.ico"});
						
					}
					foundFirst = true;
					
				} else if (parseInt(time) > $scope.ct[i].tfh_s && time < $scope.ct[i].tfh_e) {
					if ((i + 1) <= ($scope.length - 1)) {
						$scope.ct[i+1].type = "scheduleClass scheduleClassNext";
					}
				}
			}
		}

		$timeout($scope.setCurrentClass, 1000*60*1);
	};

	$scope.noCache = function() {
		$scope.cacheModel = false;

		$http({
		 	method  : 'POST',
			url     : '/userInfo/setCache',
			data    : {'cache' : false},
			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.success(function(resp) {});
	}

	$scope.cache = function() {
		if (!$scope.authCache) {
			$scope.authCache = true;
			$scope.cacheBtn1 = "Cancel";
			$scope.cacheBtn2 = "Allow";
		} else {
			$http({
			 	method  : 'POST',
				url     : '/verifyPassword',
				data    : $.param({'password' : $scope.cacheForm.password}),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
			.success(function(resp) {
				if (angular.fromJson(resp).status == 'success') {
					$scope.cacheModel = false;

			    	$http({
			    	 	method  : 'POST',
			    		url     : '/userInfo/setCache',
			    		data    : $.param({'cache' : true, 'password' : $scope.cacheForm.password}),
			    		headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			    	})
			    	.success(function(resp) {
			    		console.log(resp);
			    	});
			    } else {
			    	console.warn("Oh no! An invlid password!");
			    }
			});
		}
	}

	$scope.disableNotifs = function() {
		$scope.notifModel = false;
	}

	$scope.enableNotifs = function() {
		$scope.notifModel = false;

		Notification.requestPermission(function (permission) {
			if (!('permission' in Notification)) {
				Notification.permission = permission;
			}
		  
			if (permission === "granted") {
				canSendNotifs = true;
			}
		});
	}

	if (askCache) {
		suppressNotifs = true;
		$scope.cacheModel = true;
	}

	if ("Notification" in window && Notification.permission !== 'denied' && Notification.permission !== "granted" && !suppressNotifs && !askedForNotif) {
		askedForNotif = true;
		$scope.notifModel = true;
	}

	$scope.setCurrentClass();

	if (!isAuthed) {
		$location.path('/');
		$scope.$apply();
	}
}]);

sprox.directive('edgelessPanel', function() {
    return {
        compile: function(element, attrs, transclude) {
       		element.css("border-top-right-radius", "20px");
        	element.css("border-top-left-radius", "20px");
        }
    };
});
//Directive for controlling Bootstrap model dialogs
sprox.directive('showModel', function() {
    return {
        link: function(scope, element, attr) {
        	scope.$watch(attr.showModel, 
        	
        	function (shouldShow) {
        	    if (shouldShow) {
        	    	$(element[0]).modal('show');
        	    } else if (!shouldShow) {
        	       	$(element[0]).modal('hide');
        	    }
        	}, true);
        }
    };
});