sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = userData.classesWeekly;
	$scope.colors =["#E53935", // Red
					"#1E88E5", // Blue
					"#43A047", // Green
					"#FB8C00", // Orange
					"#D81B60", // Pink
					"#5E35B1", // Deep Purple
					"#3949AB", // Indigo
					"#00897B", // Teal
					"#7CB342", // Light Green
					"#FDD835", // Yellow
					"#F4511E", // Deep Orange
					"#8E24AA", // Purple
					"#546E7A", // Blue Grey
					"#00ACC1", // Cyan
					"#FFB300", // Amber
					"#C0CA33", // Lime
					"#039BE5"] // Light Blue

	//We Don't Support Weekend Classes, if that even happens.
	$scope.finals = userData.finals;

	$scope.daysofweek = ['Mo','Tu','We','Th','Fr']
	$scope.filterDay = function(dayNum) {
			return daysofweek[dayNum]
	};
}]);


