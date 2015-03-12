sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = userData.classesWeekly;
	$scope.colors =["#F44336", // Red
					"#3F51B5", // Indigo
					"#4CAF50", // Green
					"#FF9800", // Orange
					"#E91E63", // Pink
					"#673AB7", // Deep Purple
					"#2196F3", // Blue
					"#009688", // Teal
					"#8BC34A", // Light Green
					"#FFEB3B", // Yellow
					"#FF5722", // Deep Orange
					"#9C27B0", // Purple
					"#607D8B", // Blue Grey
					"#00BCD4", // Cyan
					"#FFC107", // Amber
					"#CDDC39", // Lime
					"#03A9F4"] // Light Blue

	//We Don't Support Weekend Classes, if that even happens.
	$scope.finals = userData.finals;

	$scope.daysofweek = ['Mo','Tu','We','Th','Fr']
	$scope.filterDay = function(dayNum) {
			return daysofweek[dayNum]
	};
}]);


