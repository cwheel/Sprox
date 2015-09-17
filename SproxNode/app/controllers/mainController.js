sprox.controller('mainController',['$rootScope', '$scope', '$timeout', '$location', 'ngDialog', '$ocLazyLoad', '$http', '$cookieStore', '$document', function($rootScope, $scope, $timeout, $location, ngDialog, $ocLazyLoad, $http, $cookieStore, $document) {
	//Initilization
	$scope.showTopbar = false;
	$scope.showSearch = false;
	$scope.showDropDown = false;
	$scope.showNotes = false;
	$scope.selectedIndex = 0;
	$scope.userMenu = false;

	//Load other libraries
	$ocLazyLoad.load([{
    	name: 'ngCkeditor',
    	files: ['bower_components/ng-ckeditor/ng-ckeditor.css','bower_components/ng-ckeditor/ng-ckeditor.js','bower_components/ng-ckeditor/libs/ckeditor/ckeditor.js']
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
            $scope.showWelcome = false;
        	$scope.notes = false;
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
sprox.directive('customTopbar', function($timeout) {
    return {
        link: function(scope, element, attr) {
            $timeout(function() {
                if (attr.customTopbar == "true"){
                    $("#standardTopbar").css("display","none");
                    $("#standardTopbar").css("width","0%");
                }else {
                    $("#standardTopbar").css("display","table");
                    $("#standardTopbar").css("width","100%");
                }
            }, 10);
        }
    };
});

sprox.directive('sglclick', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
              var fn = $parse(attr['sglclick']);
              var delay = 300, clicks = 0, timer = null;
              element.on('click', function (event) {
                clicks++; 
                if(clicks === 1) {
                  timer = setTimeout(function() {
                    scope.$apply(function () {
                        fn(scope, { $event: event });
                    }); 
                    clicks = 0;
                  }, delay);
                  } else {
                    clearTimeout(timer);
                    clicks = 0;
                  }
              });
            }
        };
    }]);

sprox.directive('showFocus',[ '$timeout', function($timeout) {
  return function(scope, element, attrs) {
    scope.$watch(attrs.showFocus, 
      function (newValue) { 
        $timeout(function() {
            newValue && element[0].focus();
        });
      },true);
  };    
}]);