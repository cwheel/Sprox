sprox.controller('ucController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.transactions = null;
	$scope.loading = true;

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

			if ("CValue" == funds.mealPlanType) {
				$scope.cvalue = false;
			}
		} else {
			$timeout($scope.checkFunds, 500);
		}
	}

	$scope.checkFunds();
}]);