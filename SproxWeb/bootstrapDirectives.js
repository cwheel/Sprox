sprox.directive('edgelessPanel', function() {
    return {
        compile: function(element, attrs, transclude) {
       		element.css("border-top-right-radius", "20px");
        	element.css("border-top-left-radius", "20px");
        }
    };
});

//Requires a data attribute, data-model-state to work (init w/ false)
sprox.directive('showModel', function() {
    return {
        link: function(scope, element, attr) {
        	scope.$watch(attr.showModel, 

        	function (shouldShow) {
        	    if (shouldShow && !attr['data-model-state']) {
        	    	$(element[0]).modal({show: true});
        	    	attr['data-model-state'] = true;
        	    } else if (!shouldShow && attr['data-model-state']) {
        	       	$(element[0]).modal({show: false});
        	       	attr['data-model-state'] = false;
        	    } 
        	}, true);
        }
    };
}]);