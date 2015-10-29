sprox.controller('clubSearchController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.clubs = {};
	$scope.searchQuery = "";
	$scope.search = function() {
		if ($scope.searchQuery != "") {
            var searchSocket = new WebSocket(sproxSrv);
            
            searchSocket.onopen = function(event) {
                searchSocket.send("[club_search]" + username + "," + uuid + "," + $scope.searchQuery);
            };

            searchSocket.onmessage = function(event) {
                if (event.data.substring(0, "[club_search_reply]".length) === "[club_search_reply]") {
                    $scope.clubs = angular.fromJson(event.data.replace("[club_search_reply]", ""));
                    $scope.$apply();
                    searchSocket.close();
                }
            }; 
        } else {
            $scope.clubs = {};
            $scope.$apply();
        }	 
    };
}]);
