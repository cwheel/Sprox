sprox.controller('notesController',['$scope', '$location', '$timeout', '$http', '$rootScope', function($scope, $location, $timeout, $http, $rootScope) {
	//Enable fullscreen
	$scope.fullscreen = true;

	//Notebook data
	var notebook = {};
    var curSection = "Notebook Sections";
    var curTitle = "";
    var autosave = false;
    $scope.editorDisabled = true;

	//Notebook Attributes
	$scope.notebookPosition = "Notebook Sections";
	$scope.showBack = false;
    $scope.noteDelete = null;
    $scope.noteShare = null;
	$scope.editorContent = "";
    $scope.deleteItemTitle = "";

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
                autosave = false;
                $rootScope.$broadcast("notebookSetEditorDisabled", false);

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

    //A truely disgusting piece of work. Should be removed soon, wich seeing as it works pretty well probbaly means never...
    $scope.renderEditor = function() {
        //103px is the height of the top bar with the CKEditor bar as well
        $(".cke_contents").height($(window).height()-103);
    };

    //Watch the height and re-render the CKEditors height
    $scope.$watch($scope.getHeight, function(newValue, oldValue) {
        $scope.renderEditor();
    });

    //Initial Congiruation of CKEditor
    $timeout(function() {
        $scope.renderEditor();

        $scope.$watch('editorDisabled', function() {
            CKEDITOR.instances.editor1.setReadOnly($scope.editorDisabled);
        });
    }, 225);

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
       // $rootScope.$broadcast("notebookBack");
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
        notebook[item.section][item.newTitle] = notebook[item.section][item.title];
        delete notebook[item.section][item.title];

        //Send a notebookItemSelected event to update the section view
        currentNotebook = Object.keys(notebook[item.section]);
        $rootScope.$broadcast("notebookChangedSection", item.section);
    });

    //An item was deleted, update the notebook
    $rootScope.$on("notebookItemDeleted", function (event, item) {
        $scope.noteDelete = item;
        if ($scope.noteDelete.title != undefined) {
            $scope.deleteItemTitle = $scope.noteDelete.title;
        } else {
            $scope.deleteItemTitle = $scope.noteDelete.section;
        }
    });

    //Cancel the share operation
    $scope.noShareItem = function () {
        $scope.noteShare = null;
    };

    //Confirm the share operation
    $scope.shareItem = function () {
        $scope.noteShare = null;
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
    /*
	//CKEditor Fixes.... dirty, dirty fixes...
	$timeout(function() {
		//Remove the toolbar spacer
        $(".cke_toolbar_break").remove();

        //Add the toolbar titles
        $("#cke_1_top").prepend('<div id="writerTitle"></div>');
        $("#cke_1_top").append('<div id="saveStatus"></div>');

        //Glue the title to angular
        $scope.$watch('writerTitle', function() {
             $("#writerTitle").html($scope.writerTitle);
        });

        //Glue the save status to angular
        $scope.$watch('saveStatus', function() {
             $("#saveStatus").html($scope.saveStatus);
        });
        $scope.$watch('showSaveStatus', function() {
        	if ($scope.showSaveStatus) {
        		$("#saveStatus").css("visibility", "visible");
        	} else {
        		$("#saveStatus").css("visibility", "hidden");
        	}
        });

        //Float the toolbar buttons right
        $("#cke_1_toolbox").css('float', 'right');

        //Move the fullscreen button
        var fs = $("#cke_21").clone();
        $("#cke_21").remove();
        $("#cke_1_toolbox").append(fs);

        //Remove the source button
        $("#cke_37").remove();

        //Glue the editor read-state to angular
        

        //Remove the bottom bar
       	$("#cke_1_bottom").css('display', 'none');
    }, 700);
*/
}]);