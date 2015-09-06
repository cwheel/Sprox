sprox.controller('notesController',['$scope', '$location', '$timeout', '$http', '$rootScope', function($scope, $location, $timeout, $http, $rootScope) {
	//Enable fullscreen
	$scope.fullscreen = true;

	//Notebook data
	var notebook = {};
    var curSection = "Notebook Sections";
    var curTitle = "";
    var autosave = false;
    var newShares = {};
    var noteState = {};
    $scope.editorDisabled = true;

	//Notebook Attributes
	$scope.notebookPosition = "Notebook Sections";
	$scope.showBack = false;
    $scope.noteDelete = null;
    $scope.noteShare = null;
	$scope.editorContent = "";
    $scope.deleteItemTitle = "";
    $scope.editorTitle = "";

	$scope.editorOptions = {
		language: 'en', 
        toolbar: 'full',
        toolbar_full: [
            {name: 'Style',
                items: ['Format']},
            { name: 'basicstyles',
                items: [ 'Bold', 'Italic', 'Underline', 'Strike',  'BulletedList', 'NumberedList' , 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'FontSize', 'TextColor','Image', 'Table'] }
        ],
		uiColor: undefined,
		tabSpaces: 4,
		height: 600
	};

    //Request the notebook layout
    $http({
        method : 'GET',
        url : '/notebook/layout'
    })
    .success(function(resp) {
        notebook = angular.fromJson(resp);
    
        if (notebook['newShares'] != undefined) {
            newShares = notebook['newShares'];
            delete notebook['newShares'];
        }

        noteState = notebook['notebookState'];
        delete notebook['notebookState'];

        if (noteState.title == "WelcomeToNotebook" && noteState.section == "WelcomeToNotebook") {
             $rootScope.$broadcast("notebookShowWelcome", null);
        } else {
            autosave = false;
            curSection = noteState.section;

            $http({
                method : 'GET',
                url : '/notebook/note',
                params: noteState
            })
            .success(function(content) {
                notebook[curSection][noteState.title] = content;
                curNote = noteState.title;
                curTitle = noteState.title;
                $scope.editorContent = notebook[curSection][noteState.title];
                $scope.editorTitle = noteState.title;
                autosave = true;
            });
        }

        currentNotebook = Object.keys(notebook);
    });

    //A notebook item was clicked
    $rootScope.$on("notebookItemSelected", function (event, item) {
        autosave = true;
        if (item != null && item != undefined) {
            if (curSection == "Notebook Sections") {
                currentNotebook = Object.keys(notebook[item]);
                curSection = item;
                $rootScope.$broadcast("notebookChangedSection", item);
            } else {
                $scope.editorTitle = item;
                autosave = false;
                $rootScope.$broadcast("notebookSetEditorDisabled", false);

                $http({
                    method  : 'POST',
                    url     : '/notebook/setResumeNote',
                    data    : $.param({title : item, section : curSection}),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(resp) {
                    if (angular.fromJson(resp).status != 'success') {
                        console.warn("Failed to update the users resume note.");
                    }
                });

                if (notebook[curSection][item] == "") {
                    $http({
                        method : 'GET',
                        url : '/notebook/note',
                        params: {section : curSection, title : item}
                    })
                    .success(function(content) {
                        notebook[curSection][item] = content;
                        curNote = item;
                        curTitle = item;
                        $scope.editorTitle = curTitle;
                        $scope.editorContent = notebook[curSection][item];
                        autosave = true;
                    });
                } else {
                    curNote = item;
                    curTitle = item;
                    $scope.editorContent = notebook[curSection][item];
                    autosave = true;
                }
            }
        }
    });

    //Return the window height, for a $watch function
    $scope.getHeight = function() {
        return $(window).height();
    };

    //A truely disgusting piece of work. Should be removed soon, which seeing as it works pretty well probaly means never...
    $scope.renderEditor = function() {
        //103px is the height of the top bar with the CKEditor bar as well
        return $(".cke_contents").height($(window).height()-103);
    };

    //Watch the height and re-render the CKEditors height
    $scope.$watch($scope.getHeight, function(newValue, oldValue) {
        $scope.renderEditor();
    });

    //Initial Congiruation of CKEditor
    $scope.preRender = function () {
        if ($scope.renderEditor().length == 0) {
            $timeout($scope.preRender, 10);
        } else {
            var editor = Object.keys(CKEDITOR.instances)[0].replace("editor","");
            $(".cke_top").prepend('<div id="notesWriterTitle"></div>');

            $scope.$watch('editorDisabled', function() {
                CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].setReadOnly($scope.editorDisabled);
            });

            $scope.$watch('editorTitle', function(newTitle, oldTitle) {
                $("#notesWriterTitle").html(newTitle);
            });
        }
    }

    $scope.preRender();

    //The disable event for the editor
    $rootScope.$on("notebookSetEditorDisabled", function (event, item) {
        $scope.editorDisabled = item;
    });

    //A new note was added
    $rootScope.$on("notebookAddNewNote", function (event, item) {
        notebook[curSection][item] = "";
        curTitle = item;
        currentNotebook = Object.keys(notebook[curSection]);
        $rootScope.$broadcast("notebookChangedSection", curSection);
    });

    //The notebooks back button was clicked, return to the root level
    $rootScope.$on("notebookBack", function (event, item) {
        $rootScope.$broadcast("notebookChangedSection", "Notebook Sections");
        curSection = "Notebook Sections";
        currentNotebook = Object.keys(notebook);
    });

    //A new section was added, update the notebook
    $rootScope.$on("notebookAddNewSection", function (event, item) {
        notebook[item] = {};

        //Send a notebookBack event to update the root view
        $rootScope.$broadcast("notebookBack");
    });

    //The notebook is beinging the process of sharing a note
    $rootScope.$on("notebookShareItem", function (event, item) {
       $scope.noteShare = item;
    });

    //A section was renamed, update the notebook
    $rootScope.$on("notebookSectionRenamed", function (event, item) {
        notebook[item.newSection] = notebook[item.section];
        delete notebook[item.section];

        //Send a notebookBack event to update the root view
        $rootScope.$broadcast("notebookBack");
    });

    //An item was renamed, update the notebook
    $rootScope.$on("notebookItemRenamed", function (event, item) {
        if (curTitle == item.title) {
            $scope.editorTitle = item.newTitle;
        }

        notebook[item.section][item.newTitle] = notebook[item.section][item.title];
        delete notebook[item.section][item.title];

        //Send a notebookItemSelected event to update the section view
        currentNotebook = Object.keys(notebook[item.section]);
        $rootScope.$broadcast("notebookItemSelected", item.newTitle);
        $rootScope.$broadcast("notebookChangedSection", item.section);
    });

    //An item was deleted, update the notebook
    $rootScope.$on("notebookItemDeleted", function (event, item) {
        $scope.noteDelete = item;

        if ($scope.noteDelete.title != undefined) {
            $scope.deleteItemTitle = $scope.noteDelete.title;

            if (curTitle == $scope.noteDelete.title) {
                $scope.editorTitle = "";
            }
        } else {
            $scope.deleteItemTitle = $scope.noteDelete.section;
        }
    });

    //Update the current notebook title
    $rootScope.$on("notebookSetTitle", function (event, title) {
        $scope.editorTitle = title;
    });

    //Cancel the share operation
    $scope.noShareItem = function () {
        $scope.noteShare = null;
    };

    //Confirm the share operation
    $scope.shareItem = function () {
        $http({
            method  : 'POST',
            url     : '/notebook/share',
            data    : $.param({title : $scope.noteShare
                , recipient : $scope.shareForm.netid, section : curSection}),
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .success(function(resp) {
            if (angular.fromJson(resp).status == 'success') {
                $scope.noteShare = null;
            }
        });
    };

    //Delete an item once the user confirms
    $scope.deleteItem = function () {
        $http({
            method  : 'POST',
            url     : '/notebook/delete',
            data    : $.param($scope.noteDelete),
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .success(function(resp) {
            if (angular.fromJson(resp).status == 'success') {
                if ($scope.noteDelete.title != undefined) {
                    delete notebook[$scope.noteDelete.section][$scope.noteDelete.title];

                    if (Object.keys(notebook[curSection]).length == 0) {
                        $rootScope.$broadcast("notebookSetEditorDisabled", true);
                    }

                    if ($scope.deleteItemTitle == curTitle) {
                        autosave = false;
                        $scope.editorContent = "";
                    }

                    //Send a notebookItemSelected event to update the section view
                    currentNotebook = Object.keys(notebook[$scope.noteDelete.section]);
                    $rootScope.$broadcast("notebookChangedSection", $scope.noteDelete.section);
                } else {
                    delete notebook[$scope.noteDelete.section];

                    if (Object.keys(notebook).length == 0) {
                        $rootScope.$broadcast("notebookSetEditorDisabled", true);
                    }

                    //Send a notebookBack event to update the root view
                    $rootScope.$broadcast("notebookBack");
                }

                $scope.noteDelete = null;
            }
        });
    };

    //Don't delete an item
    $scope.noDeleteItem =  function () {
        $scope.noteDelete = null;
    };

    //Monitor changes to the editors content
    $scope.$watch('editorContent', function() {
        if (curTitle != "" && autosave) {
            $http({
                method  : 'POST',
                url     : '/notebook/save',
                data    : $.param({section : curSection, title : curTitle, content : $scope.editorContent}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .success(function(resp) {
                if (angular.fromJson(resp).status == 'success') {
                  notebook[curSection][curTitle] = $scope.editorContent;
                  //Send a notebookItemSelected event to update the section view
                  currentNotebook = Object.keys(notebook[curSection]);
                  $rootScope.$broadcast("notebookChangedSection", curSection);
                }
            });  
        }
    });
}]);