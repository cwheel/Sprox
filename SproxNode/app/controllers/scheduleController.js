sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = userData.classesWeekly;

	$scope.finals = userData.finals;
}]);


function getDayofWeek(i){
	switch (i){
		case 0:
			return "Monday";
			break;
		case 1:
			return "Tuesday";
			break;
		case 2:
			return "Wensday";
			break;
		case 3:
			return "Thursday";
			break;
		case 4:
			return "Friday";
			break;
	}
}

function DiffTime(start, stop){
		var tstart = new Date("02/08/14 " + start);
		var tstop = new Date("02/08/14 " + stop);
		console.log(tstart);
		tstart = tstop - tstart;
		return (tstart/60/1000)
	
}
