sprox.controller('parkingController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.pageClass = "page-left";

	$scope.checkParking = function() {
		if (parking !== null) {
			$scope.showLoading = false;
			$scope.showPermit = true;

			$scope.permitNumber = parking.permit;
			$scope.permitColor = parking.color;

			if (parking.endDate != "") {
				var day = 24*60*60*1000;
				var expiryDate = new Date("20" + parking.endDay.split("/")[2],parking.endDay.split("/")[0],parking.endDay.split("/")[1]);
				var now = new Date();
				
				$scope.daysLeft = Math.round(Math.abs((now.getTime() - expiryDate.getTime())/(day))) + " Days Left";
			}

			$scope.$apply();
		} else {
			$scope.showLoading = true;
			$scope.showPermit = false;
			$scope.$apply();

			$timeout($scope.checkParking, 500);
		}
	}

	$scope.checkParking();
}]);