sprox.controller('ucController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.transactions = null;
	$scope.loading = true;

	$scope.options = {
		multiTooltipTemplate : function (label) {
			if (label.datasetLabel == "Cash") {
				return label.datasetLabel + ': $' + label.value.toFixed(2).toString();
			} else {
				return label.datasetLabel + ': ' + label.value.toString();
			}
		} 
	}; 

	$scope.usageLabels = [];
	$scope.usageSeries = ['Cash', 'Swipes'];

	$scope.usageData = [[],[]];

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

			var curWeek = 0;
			for (var i = 0; i < $scope.transactions.length; i++) {
				var week = moment($scope.transactions[i].date, "LL").startOf("week").format("MMM Do");
				
				if ($scope.usageLabels.indexOf(week) == -1) {
					$scope.usageData[0][curWeek] = 0;
					$scope.usageData[1][curWeek] = 0;

					for (var j = 0; j < $scope.transactions.length; j++) {
						var transWeek = moment($scope.transactions[j].date, "LL").startOf("week").format("MMM Do");

						if (transWeek == week) {
							if ($scope.transactions[j].cost.indexOf("$") > -1) {
								$scope.usageData[0][curWeek] = $scope.usageData[0][curWeek] + parseFloat($scope.transactions[j].cost.replace("$",""));
							} else if ($scope.transactions[j].cost.indexOf("Swipe") > -1) {
								$scope.usageData[1][curWeek]++;
							}
						}
					}
					$scope.usageLabels.push(week);
					curWeek++;
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