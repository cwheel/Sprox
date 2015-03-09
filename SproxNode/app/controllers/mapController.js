sprox.controller('mapController',['$scope', '$location', '$timeout', '$http', function($scope, $location, $timeout, $http) {
    $scope.fullscreen = true;
    $scope.pageClass = "mapFrame";
    //Points is the whole Array, pointFiltered is the arrays found after Search, PointFound are the currently displayed points on the map
    $scope.points = {};
    $scope.pointFiltered = {};
    $scope.pointFound = {};

    $scope.center = {
        lat: 42.3900,
        lng: -72.5270,
        zoom: 17  
    }

    $scope.searchQuery = "";
    var pointsLoaded = false;

    if(!$scope.pointsLoaded){
        var pointsLoaded = true;
        $timeout(function() {
            $http.get('data/points.json')
                .then(function(points){
                $scope.points = points.data;
            });        
        }, 1000);
    }
    angular.extend($scope, {
        tiles: {
           		url: "/maps/{z}/{x}/{y}.png"
        },
        maxBounds: {            
         	southWest: {
                  lat: 42.3705,
                  lng: -72.5458
            },
             northEast: {
                 lat: 42.4000,
                  lng: -72.5124
            }
        },
        defaults: {
                zoomControl:false,
                maxZoom:18,
                minZoom:16
            }
        });

    $scope.centerPoint = function(lng,lat,message){
        $scope.pointFound = {
            current:{
                lat: lat,
                lng: lng,
                message: message,
                focus: true
        }};
        $timeout(function(){
        $scope.center = {
            lat: lat,
            lng: lng,
            zoom: 17
        };
        }, 200);
    };

    $scope.checkMap = function(){
        $timeout(function(){
            if ($scope.pointFiltered.length < 15){
                $scope.pointFound = angular.copy($scope.pointFiltered);
            }else{
                $scope.pointFound = {};
            }
        },200);
    };

}]);
