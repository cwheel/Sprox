sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = {};
	var days = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
	var tfhour = false;
	$scope.showFinals = false;
	if (userData.finals != undefined){
		$scope.showFinals = true;
	}

	//Used to Only get WeekDay classes
	for(var i = 0; i < 5; i++){	
		$scope.weeklySchedule[i] = userData.classesWeekly[i + 1];
		$scope.weeklySchedule[i].name = days[i];
	}
	
	$scope.colors = colors;
	if (tfhour){
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
	}else{
		$scope.times =[	"8:00 am ",
						"9:00 am ",
						"10:00 am",
						"11:00 am",
						"12:00 pm",
						"1:00 pm ",
						"2:00 pm ",
						"3:00 pm ",
						"4:00 pm ",
						"5:00 pm ",
						"6:00 pm "]		
	}

	
	$scope.finals = userData.finals;

	$scope.daysofweek = ['Mo','Tu','We','Th','Fr']
	$scope.filterDay = function(dayNum) {
			return daysofweek[dayNum]
	};
	$scope.curDay = function(num){
		return new Date().getDay() == num + 1;
	}
}]);


