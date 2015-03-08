sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = []
	$scope.pageClass = "page-left";
	$scope.finals = []
	var fiveminpx = 8;
	var startTime = "8:00 AM";
	var freeTimeTotal = 0;

	if (userData.classesWeekly.Mo != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Mo));
	if (userData.classesWeekly.Tu != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Tu));
	if (userData.classesWeekly.We != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.We));
	if (userData.classesWeekly.Th != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Th));
	if (userData.classesWeekly.Fr != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Fr));

	for (var day in $scope.weeklySchedule){
		var a = $scope.weeklySchedule[day];
		a.displayName = getDayofWeek(parseInt(day));
		console.log(getDayofWeek(day));

		for(var curclass in a.classes){
			var freeTime = DiffTime(startTime,a.classes[curclass].th_s);
			var classDuration = DiffTime(a.classes[curclass].th_s,a.classes[curclass].th_e)
			if (curclass != 0 && freeTime > 15){
				console.log(freeTime);
				freeTimeTotal = freeTimeTotal + freeTime;
			}
			a.classes[curclass].freeTime = freeTime;
			a.classes[curclass].classDuration = classDuration;

			startTime = a.classes[curclass].th_e;
		}
		a.endTime = startTime;
		a.endTimePadding = DiffTime(startTime,"6:45 PM");
		a.freeTimeTotal = freeTimeTotal;
		freeTimeTotal = 0;
		startTime = "8:00 AM";
	}
	
	$scope.finals = userData.finals;
}]);

function dictWithDay(dict, day) {
	return {"classes" : dict}
}

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

sprox.directive('scheduleSize', function($timeout) {
    return {
        link: function(scope, element, attr) {
        	$timeout(function() {
        		var size = attr.scheduleSize * 1.4
        		element.css("height",size);
        	}, 1);
        }
    };
});