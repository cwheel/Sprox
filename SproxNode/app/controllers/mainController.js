sprox.controller('mainController',['$rootScope', '$scope', '$timeout', '$location', 'ngDialog','$ocLazyLoad', '$http','$cookieStore', '$document', function($rootScope, $scope, $timeout, $location, ngDialog, $ocLazyLoad, $http, $cookieStore, $document) {
	//Initilization
	$scope.showTopbar = false;
	$scope.showSearch = false;
	$scope.showDropDown = false;
	$scope.showNotes = false;
	$scope.selectedIndex = 0;
	$scope.userMenu = false;
	$scope.notes = false;
	$scope.tabs = [{"path" : "sc", "title" : "Student Center", "dev" : false, "color" : "#FFC107"},
	 			{"path" : "sh", "title" : "Schedule", "dev" : false, "color" : "#4caf50"},
	 			{"path" : "nb", "title" : "Notebook", "dev" : false, "color" : "#9C27B0"},
	 			{"path" : "cs", "title" : "Club Search", "dev" : false, "color" : "#666"}, 
	 			{"path" : "uc", "title" : "UCard", "dev" : false, "color" : "#f44336"}, 
	 			{"path" : "pk", "title" : "Parking", "dev" : true, "color" : "#666"}, 
	 			{"path" : "mp", "title" : "Map", "dev" : false, "color" : "#666"}];

    //Notebook
    $scope.currentNotebook = null;
    $scope.notebookSection = "Notebook Sections";
    $scope.curIsSection = false;
	var notesPaneDone = true;

	 //Load other libraries
	$ocLazyLoad.load([{
    	name: 'ngCkeditor',
    	files: ['bower_components/ng-ckeditor/ng-ckeditor.css','bower_components/ng-ckeditor/ng-ckeditor.min.js','bower_components/ng-ckeditor/libs/ckeditor/ckeditor.js']
	},{
		name: 'leaflet-directive',
		files: ['bower_components/leaflet/dist/leaflet.js','bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js','style/leaflet.css']
	}]);
	var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$on('$locationChangeStart', function(event) {
        if ($location.path() == "/nb") {
        	$scope.notes = true;
        } else {
        	$scope.notes = false;;
        }
    });

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

        renderSidebar($scope.toggle);
    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);

        renderSidebar($scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };

    /////////////////////////////////
    //Notebook pullout view functions
    //The notebook pullout needs to render outside of the ng-view of the loaded page so it becomes mains problem
    //Using an agregious amount of $rootScope broadcasts to notify the actual notebook controller
    /////////////////////////////////

    //Hide the notebook pullout view
    $scope.hideNotesPane = function(event) {
        var parent = false;

        try {
            parent = event.target.offsetParent.id != "notesSidebar";
        } catch (err) {}

    	if (notesPaneDone && event.target.id != "notesSidebar" && parent && event.target.id != "addButtonIcon") {
    		$scope.showNotes = false;
    	}
    };

    //Show the notebook pullout view
    $scope.showNotesPane = function() {
    	$scope.showNotes = true;
    	notesPaneDone = false;

    	$timeout(function () {
    		notesPaneDone = true;
    	}, 250);
    };

    //Notify the notebook controller that a notebook item was clicked
    $scope.selectItem = function(item) {
        $rootScope.$broadcast("notebookItemSelected", item);
    };

    //Go back in the notes view
    $scope.back = function() {
        $rootScope.$broadcast("notebookBack");
    };

    //The notebook changed  sections
    $rootScope.$on("notebookChangedSection", function (event, item) {
        if (item != null && item != undefined) {
            if (item == "Notebook Sections") {
                $scope.curIsSection = false;
            } else {
                $scope.curIsSection = true;
            }
            
            $scope.notebookSection = item;
        }
    });

    //Watch for changes to the current notebook view
    $scope.$watch(function () {return currentNotebook}, function (newValue, oldValue) {
        $scope.currentNotebook = newValue;
    });

	//Ask Passport if our user is authed - Not used for information security, used only for UI
	$http({
	    method : 'GET',
	    url : '/authStatus'
	})
	.success(function(auth) {
		//Check that the user was authed
		if (angular.fromJson(auth).authStatus == 'valid') {
			$http({
			    method : 'GET',
			    url : '/userInfo/spire'
			})
			.success(function(resp) {
				//Set the user data object
			    userData = angular.fromJson(resp);
			    isAuthed = true;

			    //Simulate a successfull login
			    $location.path('/sc');						
				$("#loginBack").css("opacity", 0);
			    $scope.$emit('loginCompleted', null);
			});
		}
	});

	//Action performed by main (the top bar) when the login controller finishes
	$rootScope.$on('loginCompleted', function(event, args) {
		$timeout(function() {
			//Generate the users email (Used for Gravatar)
			$scope.userEmail = CryptoJS.MD5(userData.email).toString();
			
			$scope.$apply();
			$scope.$apply('showTopbar = true');
		}, 100);

		//Set the topbar values
		$scope.studentName = userData.studentName;
		$scope.spireID = userData.spireId;
		$scope.major = userData.major;
		$scope.fullName = userData.studentFullname;
	});
}]);

function renderSidebar(state) {
	if (state) {
    	$("#sidebar-user-icon-container").animate({width: 250}, 400);
    	$("#sidebar-username").animate({width: 250}, 400);
    	$("#sidebar-major").animate({opacity: 1, width: 250}, 400);
    	$("#sidebar-id").animate({opacity: 1, width: 250}, 400);
    } else {
    	$("#sidebar-user-icon-container").animate({width: 70}, 400);
    	$("#sidebar-username").animate({width: 70}, 400);
    	$("#sidebar-major").animate({opacity: 0, width: 70}, 200);
    	$("#sidebar-id").animate({opacity: 0, width: 70}, 200);
    }
}

//A 'fullscreen' route
sprox.directive('fullViewport', function($timeout) {
    return {
        link: function(scope, element, attr) {
        	$timeout(function() {
        		if (attr.fullViewport == "true"){
        			$(".row.header").css("margin-bottom","0px");
        		}else {
        			$(".row.header").css("margin-bottom","15px");
        		}
        	}, 10);
        }
    };
});