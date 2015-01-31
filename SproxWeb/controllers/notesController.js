sprox.controller('notesController',['$scope', '$location', '$timeout', 'hotkeys', 'ngDialog', function($scope, $location, $timeout, hotkeys, ngDialog) {
	$scope.pageClass = "page-left";

	//Notebook data
	$scope.notebook = {};
	$scope.currentNotebook = $scope.notebook;

	//Notebook Attributes
	$scope.notebookPosition = "Notebook Sections";
	$scope.curSection = curShareSection;
	$scope.sectionColors = {};
	$scope.showBack = false;
	$scope.ignoreClick = false;
	$scope.showNotesScroller = false;
	$scope.curDeleteButton = "$_%";
	var colors = ["#F44336", "#E91E63", "#673AB7", "#3F51B5", "#2196F3", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];

	//Renaming
	$scope.curEditing = "$_%";
	$scope.curEditingKey = "";
	
	//Editor
	$scope.editorContent = "";
	$scope.editorChangeCount = 0;
	$scope.editorDisabled = true;
	$scope.writerTitle = "";
	$scope.saveStatus = "";
	$scope.showSaveStatus = false;

	$scope.editorOptions = {
		language: 'en', 
		uiColor: undefined,
		tabSpaces: 4,
		height: 600
	};
	
	//Autohide scrollbar
	var notesScrollTimer = null;
	$scope.scrollIsRunning = false;	

	//Delete item popup
	$scope.deleteItemTitle = "";

	//Recovery popup
	$scope.recoveryNoteTitle = "";

	//Share item popup
	$scope.shareItemTitle = curSharePage;
	$scope.shareUser = "";
	$scope.shareSections = [{id : '0', title : 'Pending NetID'}];
	$scope.shareSection = $scope.shareSections[0].id;
	$scope.lastUserSearch = "";

	///////////////////////////////////////////////////////////
	//Notes Setup
	///////////////////////////////////////////////////////////

	//Load the notebook Skeleton
	var loadSocket = new WebSocket(sproxSrv);
	
	loadSocket.onopen = function(event) {
		loadSocket.send("[notes_load_layout]" + username + "," + uuid);
	};

	loadSocket.onmessage = function(event) {
		if (event.data.substring(0, "[notes_layout_reply]".length) === "[notes_layout_reply]") {
			$scope.notebook = angular.fromJson(event.data.replace("[notes_layout_reply]", ""));
			loadSocket.close();

			for (var key in $scope.notebook) { 
				$scope.sectionColors[key] = $scope.notebook[key]["color"];
				delete $scope.notebook[key]["color"];
			}

			$scope.currentNotebook = $scope.notebook;
			$scope.$apply();
		}
	};

	//Add a hotkey for saving
	hotkeys.bindTo($scope)
    .add({
      combo: 'ctrl+s',
      description: 'Save the current notebook page',
      callback: function() {$scope.saveCurrentPage();}
    });

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

    ///////////////////////////////////////////////////////////
	//Notes View Clicks
	///////////////////////////////////////////////////////////

	$scope.add = function() {
		if ($scope.notebookPosition == "Notebook Sections") {
			if ("New Section" in $scope.notebook) {
				$scope.curEditing = $scope.notebook["New Section"];
				$scope.curEditingKey = "New Section";
			} else {
				$scope.notebook["New Section"] = {};

				$scope.curEditing = $scope.notebook["New Section"];
				$scope.curEditingKey = "New Section";
			}
		} else {
			$scope.showSaveStatus = true;
			$scope.saveCurrentPage();
			$scope.editorDisabled = false;
			$scope.$apply();

			if ("New Page" in $scope.notebook[$scope.curSection]) {
				$scope.curEditing = $scope.notebook[$scope.curSection]["New Page"];
				$scope.curEditingKey = "New Page";
			} else {
				$scope.notebook[$scope.curSection]["New Page"] = "";
			
				$scope.curEditing = $scope.notebook[$scope.curSection]["New Page"];
				$scope.curEditingKey = "New Page";
				$scope.writerTitle = "New Page";
				$scope.editorContent = "";
			}
		}
	};

	$scope.clickItem = function(itemTitle) {
		if ($scope.ignoreClick) {
			$scope.ignoreClick = false;
		} else {
			$scope.curEditing = "$_%";

			if ($scope.curSection == "Sections") {
				$scope.curSection = itemTitle;
				$scope.notebookPosition = itemTitle;
				$scope.currentNotebook = $scope.notebook[$scope.curSection];
				$scope.showBack = true;
			} else {
				$scope.showSaveStatus = true;
				$scope.saveCurrentPage();

				if ($scope.notebook[$scope.curSection][itemTitle] == "Loading...") {
					var loadSocket = new WebSocket(sproxSrv);
					
					loadSocket.onopen = function(event) {
						loadSocket.send("[notes_load_page]" + username + "," + uuid + "," + $scope.curSection + "," + itemTitle);
					};

					loadSocket.onmessage = function(event) {
						if (event.data.substring(0, "[notes_page_reply]".length) === "[notes_page_reply]") {
							var page = angular.fromJson(event.data.replace("[notes_page_reply]", ""));

							$scope.editorContent = atob(page["content"]);
							$scope.writerTitle = itemTitle;
							$scope.notebook[$scope.curSection][itemTitle] = $scope.editorContent;
							loadSocket.close();

							$scope.clickItem(itemTitle);
						}
					};
				} else {
					$scope.writerTitle = itemTitle;
					$scope.editorContent = $scope.notebook[$scope.curSection][itemTitle];
				}

				$scope.editorDisabled = false;
				$scope.$apply();
			}
		}
	};

	$scope.back = function() {
		$scope.saveCurrentPage();
		$scope.writerTitle = "";
		$scope.editorContent = "";

		$scope.notebookPosition = "Notebook Sections";
		$scope.currentNotebook = $scope.notebook;
		$scope.curSection = "Sections";
		$scope.showBack = false;
		$scope.showSaveStatus = false;
		$scope.editorDisabled = true;
	};

	///////////////////////////////////////////////////////////
	//Edit Items
	///////////////////////////////////////////////////////////

	$scope.doneEditing = function(itemNewTitle) {
		if (itemNewTitle != $scope.curEditingKey) {
			if ($scope.notebookPosition == "Notebook Sections") {
				$scope.notebook[itemNewTitle] = $scope.notebook[$scope.curEditingKey];
				delete $scope.notebook[$scope.curEditingKey];

				$scope.renameSection($scope.curEditingKey, itemNewTitle);
			} else {
				$scope.notebook[$scope.curSection][itemNewTitle] = $scope.notebook[$scope.curSection][$scope.curEditingKey];
				delete $scope.notebook[$scope.curSection][$scope.curEditingKey];
				$scope.writerTitle = itemNewTitle;

				$scope.renamePage($scope.curEditingKey, itemNewTitle);
			}
		}
		
		$scope.curEditing = "$_%";
		$scope.curEditingKey = "";
	};

	$scope.editItem = function(itemValue, itemTitle) {
		$scope.curEditing = itemValue;
		$scope.curEditingKey = itemTitle;
	};

	///////////////////////////////////////////////////////////
	//Share Items
	///////////////////////////////////////////////////////////

	$scope.shareItemDialog = function(itemTitle) {
		$scope.ignoreClick = true;

		//Bad hack for ngDialog's messed up controller system
		curSharePage = itemTitle;
		curShareSection = $scope.curSection;

		$scope.$apply();

		ngDialog.open({ template: 'share', controller : 'notesController', className: 'ngdialog-theme-default', showClose: false, scope: $scope, closeByDocument: false, closeByEscape: false});
	};

	$scope.shareUserUpdated = function() {
		if ($scope.shareUser.length > 2 && $scope.lastUserSearch != $scope.shareUser) {
			$scope.lastUserSearch = $scope.shareUser;

			var userLookup = new WebSocket(sproxSrv);
			userLookup.onopen = function(event) {
				userLookup.send("[notes_get_user_sections]" + username + "," + uuid + "," + $scope.shareUser);
			};

			userLookup.onmessage = function(event) {
				if (event.data.substring(0, "[notes_sections_reply]".length) === "[notes_sections_reply]") {
					var sections = event.data.replace("[notes_sections_reply]", "");
					
					if (sections == "none") {
						$scope.shareSections = [{id : '0', title : 'Shared Notes'}];
					} else {
						var splitSections = sections.split(',');
						var hasShared = false;
						$scope.shareSections = [];

						for (var i = 0; i < splitSections.length; i++) {
							if (splitSections[i] == "Shared Notes") {
								hasShared = true;
							}

							$scope.shareSections.push({id : i, title : splitSections[i]});
						}

						if (!hasShared) {
							$scope.shareSections.push({id : i, title : "Shared Notes"});
						}
					}

					$scope.shareSection = $scope.shareSections[0].id;
					$scope.$apply();
				}
			};
		}
	}

	$scope.shareItem = function() {
		curShareSection = "Sections";
		
		var share = new WebSocket(sproxSrv);
		share.onopen = function(event) {
			share.send("[notes_share_page]" + username + "," + uuid + "," + $scope.shareItemTitle + "," + $scope.curSection + "," + $scope.shareUser + "," + $scope.shareSections[$scope.shareSection].title);
		};
	};

	$scope.shareEnded = function() {
		curShareSection = "Sections";
	};

	///////////////////////////////////////////////////////////
	//Delete Items
	///////////////////////////////////////////////////////////

	$scope.deleteItemDialog = function(itemTitle) {
		$scope.ignoreClick = true;
		$scope.deleteItemTitle = itemTitle;

		ngDialog.open({ template: 'delete', className: 'ngdialog-theme-default', showClose: false, scope: $scope, closeByDocument: false, closeByEscape: false});
	};

	$scope.deleteItem = function() {
		if ($scope.curSection == "Sections") {
			delete $scope.notebook[$scope.deleteItemTitle];

			var rmSocket = new WebSocket(sproxSrv);
			rmSocket.onopen = function(event) {
				rmSocket.send("[notes_remove_section]" + username + "," + uuid + "," + $scope.deleteItemTitle);
			};
		} else {
			delete $scope.notebook[$scope.curSection][$scope.deleteItemTitle];

			$scope.writerTitle = "";
			$scope.editorContent = "";

			var rmSocket = new WebSocket(sproxSrv);
			rmSocket.onopen = function(event) {
				rmSocket.send("[notes_remove_page]" + username + "," + uuid + "," + $scope.curSection + "," + $scope.deleteItemTitle);
			};
		}
	};

	$scope.showDeleteButton = function(itemTitle) {
		$scope.curDeleteButton = itemTitle;
	};

	$scope.hideDeleteButton = function() {
		$scope.curDeleteButton = "$_%";
	};

	///////////////////////////////////////////////////////////
	//Notes Views Functions
	///////////////////////////////////////////////////////////

	$scope.sectionColor = function(sectionTitle) {
		if (sectionTitle == "Notebook Sections") return "#9C27B0";

		if (sectionTitle in $scope.sectionColors) {
			return $scope.sectionColors[sectionTitle];
		} else {
			$scope.sectionColors[sectionTitle] = colors[Math.floor(Math.random() * 8)+1];
			return $scope.sectionColors[sectionTitle];
		}
	};

	$scope.changeSectionColor = function(sectionTitle) {
		$scope.ignoreClick = true;

		for (var i = 0; i < colors.length; i++) {
			if (colors[i] == $scope.sectionColors[sectionTitle]) {
				if (i+1 < colors.length) {
					$scope.sectionColors[sectionTitle] = colors[i+1];
				} else {
					$scope.sectionColors[sectionTitle] = colors[0];
				}

				break;
			}
		}

		var colorSocket = new WebSocket(sproxSrv);
		colorSocket.onopen = function(event) {
			colorSocket.send("[notes_update_color]" + username + "," + uuid + "," + sectionTitle + "," + $scope.sectionColors[sectionTitle]);
		};
	};

	$scope.editorClass = function() {
		if ($scope.showBack) {
			return "editorFieldPage";
		} else {
			return "editorFieldSection";
		}
	};

	$scope.$watch('editorContent', function() {
		if ($scope.editorChangeCount > 20) {
			$scope.editorChangeCount = 0;
			$scope.saveCurrentPage();
		}

		$scope.editorChangeCount++;
	});

	$scope.onScroll = function() {
		$scope.showNotesScroller = true;

		if ($scope.scrollIsRunning) {
			$timeout.cancel(notesScrollTimer); 
		}

		$scope.scrollIsRunning = true;
		
		notesScrollTimer = $timeout(function() {
			$scope.showNotesScroller = false;
			$scope.scrollIsRunning = false;	
    	}, 4000);
	};

	///////////////////////////////////////////////////////////
	//Save functions
	///////////////////////////////////////////////////////////

	$scope.saveCurrentPage = function() {
		var content = $scope.editorContent;
		var title = $scope.writerTitle;
		var selection = $scope.curSection;

		if (!$scope.editorDisabled) {
			if ($scope.editorContent == "") {
				return;
			}

			$scope.saveStatus = "Saving...";

			if ($scope.writerTitle in $scope.notebook[$scope.curSection]) {
				$scope.notebook[$scope.curSection][$scope.writerTitle] = $scope.editorContent;
			}

			if (btoa(unescape(encodeURIComponent(content))) != "bnVsbA==" || selection == "Sections") {

				var saveSocket = new WebSocket(sproxSrv);
				var socketTimeout = null;
				
				saveSocket.onopen = function(event) {
					socketTimeout = $timeout(function() {
						$scope.saveStatus = "Save Failed!";
						$scope.$apply();

						$scope.saveRecoveryCopy();
    				}, 15000);

					saveSocket.send("[notes_save]" + username + "," + uuid + "," + selection + "," + title + "," + btoa(unescape(encodeURIComponent(content))));
				};

				saveSocket.onmessage = function(event) {
					$timeout.cancel(socketTimeout); 

					if (event.data.substring(0, "[notes_save_reply]".length) === "[notes_save_reply]") {
						if (event.data.replace("[notes_save_reply]", "") == "[save_complete]") {
							var now = new Date();
							var min = now.getMinutes();

							if (min < 10) { 
								min = "0" + min
							}

							$scope.saveStatus = "Saved last at " + now.getHours() + ":" + min;
							$scope.$apply();
						}

						saveSocket.close();
					}
				};

				saveSocket.onerror = function(event) {
					$scope.saveStatus = "Save Failed, retrying!"
					$scope.$apply();

					$scope.saveRecoveryCopy();

					$timeout(function() {
						$scope.saveCurrentPage();
    				}, 5000);
				};
			}
		}
	};

	$scope.autoSave = function() {
		$scope.saveCurrentPage();

		$timeout(function() {
			$scope.autoSave();
		}, 30000);
	};

	$timeout(function() {
		$scope.autoSave();
	}, 30000);

	///////////////////////////////////////////////////////////
	//Note Recovery
	///////////////////////////////////////////////////////////

	$scope.saveRecoveryCopy = function() {
		if(typeof(Storage) !== "undefined") {
			var note = JSON.stringify({"section" : $scope.curSection, "pageTitle" : $scope.writerTitle, "pageContent" : $scope.editorContent});
			localStorage.setItem("notesRecovery@" + CryptoJS.MD5(user).toString(), note);
		} else {
			console.warn("Browser doesn't support saving a recovery copy!")
		}
	};

	$scope.hasRecovery = function() {
		if (typeof(Storage) !== "undefined") {
			if (localStorage.getItem("notesRecovery@" + CryptoJS.MD5(user).toString()) !== null) {
				return true;
			}
		}
	};

	$scope.recoverItem = function() {
		var rItem = JSON.parse(localStorage.getItem("notesRecovery@" + CryptoJS.MD5(user).toString()));

		$scope.writerTitle = rItem["pageTitle"];
		$scope.curSection = rItem["section"];
		$scope.editorContent = rItem["pageContent"];
		$scope.notebookPosition = $scope.curSection; 
		$scope.currentNotebook = $scope.notebook[$scope.curSection];
		$scope.editorDisabled = false;
		$scope.showBack = true;
		$scope.showSaveStatus = true;

		$scope.$apply();
		$scope.saveCurrentPage();

		localStorage.removeItem("notesRecovery@" + CryptoJS.MD5(user).toString());
	};

	//Check if there's a document to recover
	if ($scope.hasRecovery()) {
		$scope.recoveryNoteTitle = JSON.parse(localStorage.getItem("notesRecovery@" + CryptoJS.MD5(user).toString()))['pageTitle'];
		console.log($scope.recoveryNoteTitle);
		$scope.$apply();

		ngDialog.open({ template: 'recovery', className: 'ngdialog-theme-default', showClose: false, scope: $scope, closeByDocument: false, closeByEscape: false});
	}

	///////////////////////////////////////////////////////////
	//Rename Items
	///////////////////////////////////////////////////////////

	$scope.renamePage = function(oldName, newName) {
		var rnSocket = new WebSocket(sproxSrv);
		
		rnSocket.onopen = function(event) {
			rnSocket.send("[notes_remove_page]" + username + "," + uuid + "," + $scope.curSection + "," + oldName);
		};

		$scope.saveCurrentPage();
	};

	$scope.renameSection = function(oldName, newName) {
		var rnSocket = new WebSocket(sproxSrv);
		
		rnSocket.onopen = function(event) {
			rnSocket.send("[notes_rename_section]" + username + "," + uuid + "," + newName + "," + oldName + ",");
		};
	};
}]);

///////////////////////////////////////////////////////////
//Directives
///////////////////////////////////////////////////////////

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

sprox.directive('scroll', ['$parse', function($parse) {
    return {
        link: function(scope, element, attr) {
          var fn = $parse(attr['scroll']);
          
          element.on('mousewheel', function (event) {
          	fn(scope, { $event: event });
          });
        }
    };
}]);

sprox.directive('showscroll', ['$parse', function($parse) {
    return {
        link: function(scope, element, attr) {
        	scope.$watch(attr.showscroll, 

        	function (newValue) {
        	    if (newValue) {
        	    	element.css("overflow", "overlay");
        	    } else {
        	       	element.css("overflow", "hidden");
        	    } 
        	},true);
        }
    };
}]);

sprox.directive('selectedrow', ['$parse', function($parse) {
    return {
        link: function(scope, element, attr) {
        	scope.$watch(attr.selectedrow, 
        		function (newValue) {
        	    	if (newValue) {
        	    		attr.$set('state', 'selected');
        	    		element.css("background", "rgb(197, 216, 221)");
        	    	} else {
        	    		attr.$set('state', '');
        	       		element.css("background", "#FFF");
        	    	} 
        	},true);

        	element.on('mouseleave', function (event) {
        		if (attr.state == "selected") {
        			element.css("background", "rgb(197, 216, 221)");
        		} else {
        			element.css("background", "#FFF");
        		}
        	});

        	element.on('mouseenter', function (event) {
        		element.css("background", "#E0E0E0");
        	});
        }
    };
}]);