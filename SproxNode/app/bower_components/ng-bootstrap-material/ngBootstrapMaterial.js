'use strict';

angular.module('ngBootstrapMaterial', []).directive('materialInput', function() {
    return {
        compile: function(scope, attr, tr) {
          $.material.input("#" + attr.id);
        }
    };
}).directive('materialRipple', function() {
    return {
        compile: function(scope, attr, tr) {
          $.material.ripples(scope[0]);
        }
    };
}).directive('materialCheckbox', function() {
    return {
        compile: function(scope, attr, tr) {
          $.material.checkbox("#" + attr.id);
        }
    };
}).directive('materialRadio', function() {
    return {
        compile: function(scope, attr, tr) {
          $.material.radio("#" + attr.id);
        }
    };
}).directive('materialRippleNavigation', function() {
    //Requires a data attribute to work, data-ripple (init w/ false)
    return {
        link: function(scope, element, attr) {
            if (!attr['data-ripple']) {
                if (attr.id.substring(0, "{{".length) !== "{{") {
                    $.material.ripples(element[0]);
                    attr.$set("data-ripple", true);
                }
            }
        }
    };
});