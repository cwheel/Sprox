sprox.controller('ucController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.transactions = null;
	$scope.loading = true;

	$scope.usageLabels = [];
	$scope.usageSeries = ['Series A', 'Series B'];

	  $scope.usageData = [
	    [65, 59, 80, 81, 56, 55, 40],
	    [28, 48, 40, 19, 86, 27, 90]
	  ];

	$scope.checkFunds = function() {
		if (funds !== 0) {
			$scope.loading = false;
			$scope.showCard = true;
			$scope.cvalue = true;
			$scope.ucardLibraryBarcode = userData.ucardLibraryBarcode;
			$scope.debit = funds[0].debit;
			$scope.dinningDollars = funds[0].dd;
			$scope.dinningSwipes = funds[0].swipes;
			$scope.guestSwipes = funds[0].guests;
			$scope.transactions = funds[1];

			for (var i = 0; i < $scope.transactions.length; i++) {
				if ($scope.usageLabels.indexOf($scope.transactions[i].location) == -1) {
					console.log($scope.transactions[i].location);
					$scope.usageLabels.push($scope.transactions[i].location);
				}
			}

			if ("CValue" == funds.mealPlanType) {
				$scope.cvalue = false;
			}
		} else {
			$timeout($scope.checkFunds, 500);
		}
	}

	$scope.checkFunds();
}]);