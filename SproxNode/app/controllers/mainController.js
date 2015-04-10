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
    $scope.currentNotebook = [];
    $scope.notebookSection = "Notebook Sections";
    $scope.curIsSection = false;
    $scope.notesRenaming = "";
    $scope.notesCurRename = {val : ""};
    $scope.notesCurMouse = "";
	var notesPaneDone = true;
    var notesDeleteClick = false;
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

    /////////////////////////////////
    //Notebook pullout view functions
    //The notebook pullout needs to render outside of the ng-view of the loaded page so it becomes mains problem
    //Using an agregious amount of $rootScope broadcasts to notify the actual notebook controller
    /////////////////////////////////

    //Disable the editor at the start
    $rootScope.$broadcast("notebookSetEditorDisabled", true);

    //Hide the notebook pullout view
    $scope.hideNotesPane = function(event) {
        var parent = false;

        try {
            parent = event.target.offsetParent.id != "notesSidebar";
        } catch (err) {}

    	if (notesPaneDone && event.target.id != "notesSidebar" && parent && event.target.id != "addButtonIcon" && event.target != "button.btn btn-default" && event.target != "button.btn btn-primary") {
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
    $scope.selectNotesItem = function(item) {
        if (notesDeleteClick) {
            notesDeleteClick = !notesDeleteClick;
            return;
        }

        if ($scope.notesRenaming == "") {
            if ($scope.curIsSection) {
                 $rootScope.$broadcast("notebookSetEditorDisabled", false);
            }
            
            $rootScope.$broadcast("notebookItemSelected", item);
        }
    };

    //Go back in the notes view
    $scope.notesBack = function() {
        $rootScope.$broadcast("notebookBack");
    };

    //Begin renaming a notes item
    $scope.notesRenameItem = function(item) {
        $scope.notesCurRename.val = item;
        $scope.notesRenaming = item;
    };

    //Begin sharing a notebook note
    $scope.notesShareItem = function(item) {
       $rootScope.$broadcast("notebookShareItem", item);
    }

    //Add a new note
    $scope.notesAddNew = function() {
        if ($scope.currentNotebook["Untitled Section"] != undefined) {
            $scope.notesCurRename.val = "Untitled Section";
            $scope.notesRenaming = "Untitled Section";
        } else if ($scope.currentNotebook["Untitled Note"] != undefined) {
            $scope.notesCurRename.val = "Untitled Note";
            $scope.notesRenaming = "Untitled Note";
        } else if ($scope.notebookSection == "Notebook Sections") {
            $rootScope.$broadcast("notebookAddNewSection", "Untitled Section");
            $scope.notesCurRename.val = "Untitled Section";
            $scope.notesRenaming = "Untitled Section";
        } else {
            $http({
                method  : 'POST',
                url     : '/notebook/save',
                data    : $.param({section : $scope.notebookSection, title : "Untitled Note", content : ""}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .success(function(resp) {
                if (angular.fromJson(resp).status == 'success') {
                    $rootScope.$broadcast("notebookAddNewNote", "Untitled Note");
                    $rootScope.$broadcast("notebookSetEditorDisabled", false);
                    $scope.notesCurRename.val = "Untitled Note";
                    $scope.notesRenaming = "Untitled Note";
                }
            });
        }
    }

    //Save the rename
    $scope.notesSaveRename = function() {
        if ($scope.notesCurRename.val != $scope.notesRenaming && $scope.notesCurRename.val != "") {
            if (!$scope.curIsSection) {
                var data = {section : $scope.notesRenaming, newSection : $scope.notesCurRename.val};

                $http({
                    method  : 'POST',
                    url     : '/notebook/renameSection',
                    data    : $.param(data),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(resp) {
                    if (angular.fromJson(resp).status == 'success') {
                        $rootScope.$broadcast("notebookSectionRenamed", data);
                    }
                });

            } else {
                var data = {section : $scope.notebookSection, title : $scope.notesRenaming, newTitle : $scope.notesCurRename.val};
                
                $http({
                    method  : 'POST',
                    url     : '/notebook/rename',
                    data    : $.param(data),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(resp) {
                    if (angular.fromJson(resp).status == 'success') {
                        $rootScope.$broadcast("notebookItemRenamed", data);
                    }
                });
            }
        }
        
        $scope.notesRenaming = "";
        $scope.notesCurRename = {val : ""};
    }

    //Handles enter key in the edit field of a note name
    $scope.notebookRenameItemEnter = function (keyEvent) {
        if (keyEvent.which === 13) {
            $scope.notesSaveRename();

            keyEvent.stopPropagation();
            keyEvent.preventDefault();  
            return false;
        }
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

    //Delete an item in the notebook ivew
    $scope.notesDeleteItem = function (item) {
        var data;
        notesDeleteClick = true;

        if (!$scope.curIsSection) {
            data = {section : item};
        } else {
            data = {section : $scope.notebookSection, title : item};
        }

        $rootScope.$broadcast("notebookItemDeleted", data);
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