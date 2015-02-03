sprox.controller('mainController',['$rootScope', '$scope', '$timeout', '$location', 'ngDialog','$ocLazyLoad', function($rootScope, $scope, $timeout, $location, ngDialog, $ocLazyLoad) {
	/*if (document.location.protocol == "http:") {
		window.location = "https://sprox.net";
	}*/

	$scope.showTopbar = false;
	$scope.showSearch = false;
	$scope.showDropDown = false;
	$scope.selectedIndex = 0;
	var currentIndex = 0;
	$scope.userMenu = false;
	$scope.tabs = [{"path" : "sc", "title" : "Student Center", "dev" : false, "color" : "#FFC107"},
	 			{"path" : "sh", "title" : "Schedule", "dev" : false, "color" : "#4caf50"},
	 			{"path" : "nb", "title" : "Notebook", "dev" : false, "color" : "#9C27B0"},
	 			{"path" : "cs", "title" : "Club Search", "dev" : false, "color" : "#666"}, 
	 			{"path" : "uc", "title" : "UCard", "dev" : false, "color" : "#f44336"}, 
	 			{"path" : "pk", "title" : "Parking", "dev" : true, "color" : "#666"}, 
	 			{"path" : "mp", "title" : "Map", "dev" : false, "color" : "#666"}];
	$ocLazyLoad.load([{
    	name: 'ngCkeditor',
    	files: ['bower_components/ng-ckeditor/ng-ckeditor.css','bower_components/ng-ckeditor/ng-ckeditor.min.js','bower_components/ng-ckeditor/libs/ckeditor/ckeditor.js']
	},{
		name: 'leaflet-directive',
		files: ['bower_components/leaflet/dist/leaflet.js','bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js','bower_components/leaflet/dist/leaflet.css']
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

			select(0, "#FFC107", true);
			var w = $("#fname").width();
       		console.log(w);

			while(w > 110){
		   		var currentFontSize = $('#fname').css('font-size');
		  		var currentFontSizeNum = parseFloat(currentFontSize, 10);
		   		var newFontSize = currentFontSizeNum*0.98;
		   		$('#fname').css('font-size', newFontSize);
		   		w = $("#fname").width();
		   		console.log(w);
   			}
   			$('#fname').css('width', "120px");
		}, 500);

		$scope.studentName = userData.studentName;
		$scope.spireID = userData.spireId;
		$scope.major = userData.major;
		$scope.fullName = userData.studentFullname;
	});
	$scope.invertMenuZIndex = function() {
          	var zindex = $("#userMenu").css('z-index');
          	zindex = zindex * -1;
          	$("#userMenu").css('z-index', zindex);
    };
	$scope.clickTab = function(path, args) {
		$scope.$apply('userMenu = false');

		for (var i = 0; i < $scope.tabs.length; i++) {
			if (path == $scope.tabs[i].path) { $scope.selectedIndex = i; }
		}

		select($scope.selectedIndex, $scope.tabs[$scope.selectedIndex].color, false);
		
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

//Temporary
//Make it into a directive at some point
function select(item, color, ignore) {
	//This padding calculation is terrible and should be thrown away as soon as physically possible.
	//It lacks any and all device support, but it works locally and thats good enought for now.
	var padding = 8;

	if (!lockAnimation || ignore) {
		if (typeof baseSelectOffset === 'undefined') {
			baseSelectOffset = $("#tabSelectBar").position().left
		}

		$("#tabSelectBar").css("background-color", color);

		$("#tabSelectBar").animate({
			width: $($(".tabBox")[item]).width()-((padding*2)+1),
			left: (baseSelectOffset+padding) + $($(".tabBox")[item]).position().left
		
		}, 1000);
	}
}

