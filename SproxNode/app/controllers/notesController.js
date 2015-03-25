sprox.controller('notesController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	//Enable fullscreen
	$scope.fullscreen = true;

	//Notebook data
	$scope.notebook = {};
	$scope.currentNotebook = $scope.notebook;

	//Notebook Attributes
	$scope.notebookPosition = "Notebook Sections";
	$scope.showBack = false;
	var colors = ["#F44336", "#E91E63", "#673AB7", "#3F51B5", "#2196F3", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];

	$scope.editorContent = "";

	$scope.editorOptions = {
		language: 'en', 
		uiColor: undefined,
		tabSpaces: 4,
		height: 600
	};

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
        $scope.$watch('editorDisabled', function() {
            CKEDITOR.instances.editor1.setReadOnly($scope.editorDisabled);
        });

        //Remove the bottom bar
       	$("#cke_1_bottom").css('display', 'none');
    }, 700);
}]);