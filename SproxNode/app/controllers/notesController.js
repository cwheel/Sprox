sprox.controller('notesController',['$scope', '$location', '$timeout', '$http', function($scope, $location, $timeout, $http) {
	$scope.fullscreen = true;
    $scope.customTopBar = true;

	var notebook = {};
    var autosave = false;
    var newShares = {};
    var noteState = {};
    var notesPaneDone = true;
    var notesDeleteClick = false;
    var curEditingSection = "";

    $scope.editorDisabled = true;
	$scope.showBack = false;
    $scope.noteDelete = null;
    $scope.noteShare = null;
	$scope.editorContent = "";
    $scope.deleteItemTitle = "";
    $scope.editorTitle = "";
    $scope.currentNotebook = [];
    $scope.notebookSection = "Notebook Sections";
    $scope.curIsSection = false;
    $scope.notesRenaming = "";
    $scope.notesCurRename = {val : ""};
    $scope.notesCurMouse = "";
    $scope.showWelcome = false;

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

    //Disable the editor at the start
    $scope.editorDisabled = true;

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
             $scope.showWelcome = true;
        } else {
            autosave = false;
            $scope.notebookSection = noteState.section;

            $http({
                method : 'GET',
                url : '/notebook/note',
                params: noteState
            })
            .success(function(content) {
                notebook[$scope.notebookSection][noteState.title] = content;
                curNote = noteState.title;
                $scope.editorTitle = noteState.title;
                $scope.editorContent = notebook[$scope.notebookSection][noteState.title];
                $scope.editorDisabled = false;
                autosave = true;
            });
        }

        currentNotebook = Object.keys(notebook);
    });

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
                 $scope.editorDisabled = false;
            }
            
            notebookItemSelected(item);
        }
    };

    //Go back in the notes view
    $scope.notesBack = function() {
        notebookBack();
    };

    //Begin renaming a notes item
    $scope.notesRenameItem = function(item) {
        $scope.notesCurRename.val = item;
        $scope.notesRenaming = item;
    };

    //Begin sharing a notebook note
    $scope.notesShareItem = function(item) {
       $scope.noteShare = item;
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
            notebook["Untitled Section"] = {};
            notebookBack();
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
                    notebook[$scope.notebookSection]["Untitled Note"] = "";
                    $scope.editorContent = "";
                    $scope.editorTitle = "Untitled Note";
                    currentNotebook = Object.keys(notebook[$scope.notebookSection]);
                    notebookChangedSection($scope.notebookSection);

                    $scope.editorDisabled = false;
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

                if ($scope.notesRenaming == curEditingSection) {
                    curEditingSection = $scope.notesCurRename.val;
                }

                $http({
                    method  : 'POST',
                    url     : '/notebook/renameSection',
                    data    : $.param(data),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(resp) {
                    if (angular.fromJson(resp).status == 'success') {
                        notebook[data.newSection] = notebook[data.section];
                        delete notebook[data.section];

                        notebookBack();
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
                        if ($scope.editorTitle == data.title) {
                            $scope.editorTitle = data.newTitle;
                        }

                        notebook[data.section][data.newTitle] = notebook[data.section][data.title];
                        delete notebook[data.section][data.title];

                        currentNotebook = Object.keys(notebook[data.section]);
                        notebookItemSelected(data.newTitle);
                        notebookChangedSection(data.section);
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

        $scope.noteDelete = data;

        if ($scope.noteDelete.title != undefined) {
            $scope.deleteItemTitle = $scope.noteDelete.title;
        } else {
            $scope.deleteItemTitle = $scope.noteDelete.section;
        }
    };

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
                , recipient : $scope.shareForm.netid, section : $scope.notebookSection}),
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

                    if (Object.keys(notebook[$scope.notebookSection]).length == 0) {
                        $scope.editorDisabled = true;
                    }

                    if ($scope.deleteItemTitle == $scope.editorTitle) {
                        autosave = false;
                        $scope.editorContent = "";
                        $scope.editorTitle = "";
                    }

                    //Send a notebookItemSelected event to update the section view
                    currentNotebook = Object.keys(notebook[$scope.noteDelete.section]);
                    //notebookItemSelected($scope.noteDelete.section);
                } else {
                    delete notebook[$scope.noteDelete.section];
                    
                    if ($scope.noteDelete.section == curEditingSection) {
                        autosave = false;
                        $scope.editorContent = "";
                        $scope.editorTitle = "";
                        curEditingSection = "";
                    }

                    if (Object.keys(notebook).length == 0) {
                        $scope.editorDisabled = true;
                    }

                    //Send a notebookBack event to update the root view
                    notebookBack();
                }

                $scope.noteDelete = null;
            }
        });
    };

    //Don't delete an item
    $scope.noDeleteItem =  function () {
        $scope.noteDelete = null;
    };

    //The notebooks back button was clicked, return to the root level
    function notebookBack() {
        curEditingSection = $scope.notebookSection;
        notebookChangedSection("Notebook Sections");
        $scope.notebookSection = "Notebook Sections";
        currentNotebook = Object.keys(notebook);
    }

    //The notebook changed  sections
    function notebookChangedSection(item) {
        if (item != null && item != undefined) {
            if (item == "Notebook Sections") {
                $scope.curIsSection = false;
            } else {
                $scope.curIsSection = true;
            }
            
            $scope.notebookSection = item;
        }
    }

    //A notebook item was clicked
    function notebookItemSelected(item) {
        autosave = true;
        if (item != null && item != undefined) {
            if ($scope.notebookSection == "Notebook Sections") {
                currentNotebook = Object.keys(notebook[item]);
                $scope.notebookSection = item;
                notebookChangedSection(item);
                curEditingSection = item;
            } else {
                $scope.editorTitle = item;
                autosave = false;
                $scope.editorDisabled = false;

                $http({
                    method  : 'POST',
                    url     : '/notebook/setResumeNote',
                    data    : $.param({title : item, section : $scope.notebookSection}),
                    headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .success(function(resp) {
                    if (angular.fromJson(resp).status != 'success') {
                        console.warn("Failed to update the users resume note.");
                    }
                });

                if (notebook[$scope.notebookSection][item] == "") {
                    $http({
                        method : 'GET',
                        url : '/notebook/note',
                        params: {section : $scope.notebookSection, title : item}
                    })
                    .success(function(content) {
                        notebook[$scope.notebookSection][item] = content;
                        curNote = item;
                        $scope.editorTitle = item;
                        $scope.editorContent = notebook[$scope.notebookSection][item];
                        autosave = true;
                    });
                } else {
                    curNote = item;
                    $scope.editorTitle = item;
                    $scope.editorContent = notebook[$scope.notebookSection][item];
                    autosave = true;
                }
            }
        }
    }

    //Monitor changes to the editors content
    $scope.$watch('editorContent', function() {
        if ($scope.editorTitle != "" && autosave) {
            var data = {section : $scope.notebookSection, title : $scope.editorTitle, content : $scope.editorContent};

            if (curEditingSection != "") {
                data.section = curEditingSection;
            }

            $http({
                method  : 'POST',
                url     : '/notebook/save',
                data    : $.param(data),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .success(function(resp) {
                if (angular.fromJson(resp).status == 'success') {
                  notebook[$scope.notebookSection][$scope.editorTitle] = $scope.editorContent;
                  //Send a notebookItemSelected event to update the section view
                  currentNotebook = Object.keys(notebook[$scope.notebookSection]);
                  notebookChangedSection($scope.notebookSection);
                }
            });  
        }
    });
}]);