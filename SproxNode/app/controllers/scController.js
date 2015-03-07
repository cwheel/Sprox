sprox.controller('studentCenterController',['$scope', '$location', '$timeout', 'ngDialog', '$rootScope', '$route', function($scope, $location, $timeout, ngDialog, $rootScope, $route) {
	$timeout(function() {
		$(".tab").removeClass("slide-down");
	}, 1500);
	if(isFirst){
		$scope.pageClass = "page-first";
		$scope.$apply();
		isFirst = false;
	}else{
		$scope.pageClass = "page-left";
	}

	//Set the main page values
	$scope.homeAddress  = userData.homeAddress;
	$scope.schoolAddress  = userData.schoolAddress;
	$scope.mailBox  = userData.mailbox;
	$scope.building = userData.building;
	$scope.roomNumber = userData.room;
	$scope.roomType = userData.roomType;
	$scope.roomate = userData.roomate;
	$scope.roomateEmail = userData.roomateEmail;
	$scope.roomateAddress = userData.roomateAddress;
	$scope.gradYear = userData.gradTerm;

	//We're not showing any models right now
	$scope.notifModel = false;
	$scope.cacheModel = false;

	switch(new Date().getDay()) {
		case 0:
			$scope.ct = userData.classesWeekly.Su;
			break;
		case 1:
			$scope.ct = userData.classesWeekly.Mo;
			break;
		case 2:
			$scope.ct = userData.classesWeekly.Tu;
			break;
		case 3:
			$scope.ct = userData.classesWeekly.We;
			break;
		case 4:
			$scope.ct = userData.classesWeekly.Th;
			break;
		case 5:
			$scope.ct = userData.classesWeekly.Fr;
			break;
		case 6:
			$scope.ct = userData.classesWeekly.Sa;
			break;
	}

	$scope.ct = userData.classesWeekly.Tu;

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

		if ($scope.ct.length !== 0) {
			if (parseInt(time) < 2359 && parseInt(time) > $scope.ct[$scope.ct.length - 1].tfh_e) {
				$scope.classesDay = "Tomorrow's";

				switch(new Date().getDay() + 1) {
					case 0:
						$scope.ct = userData.classesWeekly.Su;
						break;
					case 1:
						$scope.ct = userData.classesWeekly.Mo;
						break;
					case 2:
						$scope.ct = userData.classesWeekly.Tu;
						break;
					case 3:
						$scope.ct = userData.classesWeekly.We;
						break;
					case 4:
						$scope.ct = userData.classesWeekly.Th;
						break;
					case 5:
						$scope.ct = userData.classesWeekly.Fr;
						break;
					case 6:
						$scope.ct = userData.classesWeekly.Sa;
						break;
				}

				if (now.getDay() == 6 || now.getDay() == 5) {
					$scope.classesToday = false;
				}
				
			} else {
				$scope.classesDay = "Today's";
			}
		}

		var foundFirst = false;
		if ($scope.ct.length !== 0) {
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

		var cacheScoket = new WebSocket(sproxSrv);
		cacheScoket.onopen = function(event) {
			cacheScoket.send("[disable_cache]" + username + "," + uuid);
		};
		
		if ("Notification" in window) {
			if (Notification.permission !== 'denied') {
				$scope.notifModel = true;

			}
		}
	}

	$scope.cache = function() {
		$scope.cacheModel = false;

		var cacheScoket = new WebSocket(sproxSrv);
		cacheScoket.onopen = function(event) {
			cacheScoket.send("[enable_cache]" + username + ","+ uuid);
		};
		
		if ("Notification" in window) {
			if (Notification.permission !== 'denied') {
				$scope.notifModel = true;
			}
		}
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