sprox.controller('mainController',['$rootScope', '$scope', '$timeout', '$location', 'ngDialog','$ocLazyLoad', function($rootScope, $scope, $timeout, $location, ngDialog, $ocLazyLoad) {
	/*if (document.location.protocol == "http:") {
		window.location = "https://sprox.net";
	}*/

	$scope.showTopbar = false;
	$scope.showTabs = false;
	$scope.showDropDown = false;
	var currentIndex = 0;
	$scope.userMenu = false;
	$scope.tabs = [{"path" : "sc", "title" : "Student Center", "dev" : false},
	 			{"path" : "sh", "title" : "Schedule", "dev" : false},
	 			{"path" : "nb", "title" : "Notebook", "dev" : false},
	 			{"path" : "cs", "title" : "Club Search", "dev" : false}, 
	 			{"path" : "uc", "title" : "UCard", "dev" : false}, 
	 			{"path" : "pk", "title" : "Parking", "dev" : true}, 
	 			{"path" : "mp", "title" : "Map", "dev" : false}];
	$ocLazyLoad.load([{
    	name: 'ngCkeditor',
    	files: ['lib/ng-ckeditor/ng-ckeditor.css','lib/ng-ckeditor/ng-ckeditor.min.js','lib/ng-ckeditor/libs/ckeditor/ckeditor.js']
	},{
		name: 'leaflet-directive',
		files: ['lib/leaflet/leaflet.js','lib/leaflet/angular-leaflet-directive.js','lib/leaflet/leaflet.css']
	}]);

	$scope.$on('loginCompleted', function(event, args) {
		$timeout(function() {
			$scope.userEmail = CryptoJS.MD5(user + "@umass.edu").toString();
			
			$scope.$apply();
			$scope.$apply('showTopbar = true');
		}, 100);

		$timeout(function() {
			$scope.$apply('showTabs = true');
			$scope.developerStatus = developer;
		}, 500);

		$scope.studentName = userData.studentName;
		$scope.spireID = userData.spireId;
		$scope.major = userData.major;
		$scope.fullName = userData.studentFullname;
	});

	$scope.clickTab = function(path, args) {
		$scope.$apply('userMenu = false');
		
		if (lockAnimation == false){
			lockAnimation = true;
			$rootScope.$broadcast("load_" + path, null);
			$location.path("/" + path);
			$timeout(function() {
					lockAnimation = false;
			}, 1000);
		}
	};

	$scope.tabClass = function(tabTitle) {
		if (tabTitle == "Map") {
			return "tab tabLast";
		} else {
			return "tab";
		}
	};

	$scope.logout = function() {
		var logout = new WebSocket(sproxSrv);
		
		logout.onopen = function(event) {
			logout.send("[logout]" + username + "," + uuid);
		};

		window.location.href = "https://sprox.net";
	};

	$scope.openSettings = function() {		
		ngDialog.open({ template: 'settingsPane', className: 'settings', showClose: false, scope: $scope, closeByDocument: false, closeByEscape: false});
	};
	
	$scope.showTab = function(tabState) {
		if ($scope.showTabs) {
	 		if (!tabState) {
				return true;
			} else if (tabState && developer) {
				return true;
			} else {
				return false;
			}
		}
	}
}]);