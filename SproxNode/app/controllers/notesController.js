sprox.controller('notesController',['$scope', '$location', '$timeout', '$http', '$rootScope', function($scope, $location, $timeout, $http, $rootScope) {
	//Enable fullscreen
	$scope.fullscreen = true;
    $scope.customTopBar = true;


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

    //Notebook
    $scope.currentNotebook = [];
    $scope.notebookSection = "Notebook Sections";
    $scope.curIsSection = false;
    $scope.notesRenaming = "";
    $scope.notesCurRename = {val : ""};
    $scope.notesCurMouse = "";
    $scope.showWelcome = false;
    var notesPaneDone = true;
    var notesDeleteClick = false;

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
            $scope.showWelcome = false;
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
    };

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
    $scope.notebookRenameItem = function (keyEvent) {
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

    //Check if we should show the welcome panel
    $rootScope.$on('notebookShowWelcome', function(event, args) {
       $scope.showWelcome = true;
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
        $scope.editorContent = "";
        $scope.editorTitle = "Untitled Note";
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