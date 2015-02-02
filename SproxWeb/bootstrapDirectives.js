sprox.directive('edgelessPanel', function() {
    return {
        compile: function(element, attrs, transclude) {
       		element.css("border-top-right-radius", "20px");
        	element.css("border-top-left-radius", "20px");
        }
    };
});
