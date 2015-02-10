sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = []
	$scope.pageClass = "page-left";
	$scope.finals = []
	var fiveminpx = 8;
	var startTime = "8:00 AM";

	if (userData.classesWeekly.Mo != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Mo));
	if (userData.classesWeekly.Tu != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Tu));
	if (userData.classesWeekly.We != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.We));
	if (userData.classesWeekly.Th != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Th));
	if (userData.classesWeekly.Fr != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Fr));

	for (var day in $scope.weeklySchedule){
		for(var curclass in $scope.weeklySchedule[day].classes){
			var a = $scope.weeklySchedule[day];
			var freeTime = DiffTime(startTime,a.classes[curclass].th_s);
			var classDuration = DiffTime(a.classes[curclass].th_s,a.classes[curclass].th_e)
			a.classes[curclass].freeTime = freeTime;
			a.classes[curclass].classDuration = classDuration;
			startTime = a.classes[curclass].th_e;
		}
		startTime = "8:00 AM";
	}
	

	console.log(userData.classesWeekly);
	console.log($scope.weeklySchedule);
	$scope.finals = userData.finals;
}]);

function dictWithDay(dict, day) {
	return {"day" : day, "classes" : dict}
}
function getDayofWeek(i){
	switch (i){
		case 0:
			return "Mo";
			break;
		case 1:
			return "Tu";
			break;
		case 2:
			return "We";
			break;
		case 3:
			return "Th";
			break;
		case 4:
			return "Fr";
			break;
	}
}
function DiffTime(start, stop){
		var tstart = new Date("02/08/14 " + start);
		var tstop = new Date("02/08/14 " + stop)
		console.log(tstop + " " + stop);
		console.log(tstart + " " + start);
		tstart = tstop - tstart;
		console.log(tstart/60/60/1000);
		return (tstart/60/1000)
	
}

