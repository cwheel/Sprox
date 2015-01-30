sprox.controller('scheduleController',['$scope', '$location', '$timeout', function($scope, $location, $timeout) {
	$scope.weeklySchedule = []
	$scope.pageClass = "page-left";
	$scope.finals = []
	if (userData.classesWeekly.Mo != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Mo, "Monday"));
	if (userData.classesWeekly.Tu != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Tu, "Tuesday"));
	if (userData.classesWeekly.We != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.We, "Wednesday"));
	if (userData.classesWeekly.Th != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Th, "Thursday"));
	if (userData.classesWeekly.Fr != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Fr, "Friday"));
	if (userData.classesWeekly.Sa != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Sa, "Saturday"));
	if (userData.classesWeekly.Su != "") $scope.weeklySchedule.push(dictWithDay(userData.classesWeekly.Su, "Sunday"));

	$scope.finals = userData.finals;
}]);

function dictWithDay(dict, day) {
	return {"day" : day, "classes" : dict}
}