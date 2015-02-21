sprox.controller('mainController',['$rootScope', '$scope', '$timeout', '$location', 'ngDialog','$ocLazyLoad', function($rootScope, $scope, $timeout, $location, ngDialog, $ocLazyLoad) {
	//Initilization
	$scope.showTopbar = false;
	$scope.showSearch = false;
	$scope.showDropDown = false;
	$scope.selectedIndex = 0;
	$scope.userMenu = false;
	$scope.tabs = [{"path" : "sc", "title" : "Student Center", "dev" : false, "color" : "#FFC107"},
	 			{"path" : "sh", "title" : "Schedule", "dev" : false, "color" : "#4caf50"},
	 			{"path" : "nb", "title" : "Notebook", "dev" : false, "color" : "#9C27B0"},
	 			{"path" : "cs", "title" : "Club Search", "dev" : false, "color" : "#666"}, 
	 			{"path" : "uc", "title" : "UCard", "dev" : false, "color" : "#f44336"}, 
	 			{"path" : "pk", "title" : "Parking", "dev" : true, "color" : "#666"}, 
	 			{"path" : "mp", "title" : "Map", "dev" : false, "color" : "#666"}];

	 //Load other libraries
	$ocLazyLoad.load([{
    	name: 'ngCkeditor',
    	files: ['bower_components/ng-ckeditor/ng-ckeditor.css','bower_components/ng-ckeditor/ng-ckeditor.min.js','bower_components/ng-ckeditor/libs/ckeditor/ckeditor.js']
	},{
		name: 'leaflet-directive',
		files: ['bower_components/leaflet/dist/leaflet.js','bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js','style/leaflet.css']
	}]);

	//Action performed by main (the top bar) when the login controller finishes
	$rootScope.$on('loginCompleted', function(event, args) {
		$timeout(function() {
			$scope.userEmail = CryptoJS.MD5(userData.email).toString();
			
			$scope.$apply();
			$scope.$apply('showTopbar = true');
		}, 100);

		$scope.studentName = userData.studentName;
		$scope.spireID = userData.spireId;
		$scope.major = userData.major;
		$scope.fullName = userData.studentFullname;
	});

	//Swithces the current ngView
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

	//Triggered when a user clicks the logout button
	$scope.logout = function() {
		window.location.href = "https://dev.sprox.net";
	};
	
	//Determines what tabs should be shown the the user
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

//Main socket helper
//Usage: sendMessage(<command name (String)>, <arguments (Array)>)
function sendMessage(cmd, args) {
	var mssg = "[" + cmd + "]";

	if (args.length > 0) {
		mssg = mssg + args[0];
	}

	for (var i = 1; i < args.length; i++) {
		mssg = mssg + "," + args[i];
	}

	console.log(mssg);

	if (!sproxSocketOpen) {
		sporxSocketQueue.push(mssg);
	} else {
		sproxSocket.send(mssg);
	}
}

//A 'fullscreen' route
sprox.directive('fullViewport', function($timeout) {
    return {
        link: function(scope, element, attr) {
        	$timeout(function() {
        		if (attr.fullViewport == "false" || attr.fullViewport === ""){
        			element.css("margin-top","40px");
        		}
        	}, 1);
        }
    };
});