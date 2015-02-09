sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = []
	$scope.pageClass = "page-left";
	$scope.finals = []
	var five-min-px = 8;

	for((userData.classesWeekly.Mo.length)

	if (userData.classesWeekly.Mo != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Mo));
	if (userData.classesWeekly.Tu != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Tu));
	if (userData.classesWeekly.We != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.We));
	if (userData.classesWeekly.Th != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Th));
	if (userData.classesWeekly.Fr != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Fr));

	

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
	var tstart = new Date("02/08/14 " + start).getMinutes();
	var tstop = new Date("02/08/14 " + stop).getMinutes();
	return (tstop - tstart)
}