sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = {};
	var days = ["Monday","Tuesday","Wensday","Thursday","Friday"]
	var tfhour = false
	//Used to Only get WeekDay classes
	for(var i = 0; i < 5; i++){	
		$scope.weeklySchedule[i] = userData.classesWeekly[i + 1];
		$scope.weeklySchedule[i].name = days[i];
	}
	
	$scope.$apply();
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
	if (!tfhour){
		$scope.times =[	"8:00 am",
						"9:00 am",
						"10:00 am",
						"11:00 am",
						"12:00 pm",
						"1:00 pm",
						"2:00 pm",
						"3:00 pm",
						"4:00 pm",
						"5:00 pm",
						"6:00 pm"]
	}else{
		$scope.times =[	"800",
						"900",
						"1000",
						"1100",
						"1200",
						"1300",
						"1400",
						"1500",
						"1600",
						"1700",
						"1800"]
	}

	
	$scope.finals = userData.finals;

	$scope.daysofweek = ['Mo','Tu','We','Th','Fr']
	$scope.filterDay = function(dayNum) {
			return daysofweek[dayNum]
	};
}]);


