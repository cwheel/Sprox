sprox.controller('ucController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.transactions = null;

	$scope.checkFunds = function() {
		if (funds !== null) {
			$scope.showLoading = false;
			$scope.showCard = true;
			$scope.cvalue = true;
			$scope.ucardLibraryBarcode = userData.ucardLibraryBarcode;
			$scope.debit = funds.debit;
			$scope.dinningDollars = funds.dd;
			$scope.dinningSwipes = funds.swipes;
			$scope.guestSwipes = funds.gswipes;
			$scope.transactions = funds.transactions;

			if ("CValue" == funds.mealPlanType) {
				$scope.cvalue = false;
			}

			$scope.$apply();
		} else {
			$scope.showLoading = true;
			$scope.showCard = false;
			$scope.$apply();

			$timeout($scope.checkFunds, 500);
		}
	}

	$scope.checkFunds();
}]);