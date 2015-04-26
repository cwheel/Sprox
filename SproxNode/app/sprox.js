var sprox = angular.module('sprox', ['oc.lazyLoad','ngRoute', 'ngAnimate', 'ngDialog', 'ngBootstrapMaterial', 'ui.bootstrap', 'ngCookies', 'ngTouch', 'chart.js']);

//Globals
var user;
var userData;
var uuid;
var baseSelectOffset;
var developer = false;
var username;
var funds = null;
var parking = null;
var isAuthed = false;
var canSendNotifs = false;
var lastClassNotif = "";
var askCache = false;
var askedForNotif = false;
var suppressNotifs = false;
var isFirst = true;
var lockAnimation = false;
var notifs = [];
var colors =[
			"#E53935", // Red
			"#1E88E5", // Blue
			"#43A047", // Green
			"#5E35B1", // Deep Purple
			"#F4511E", // Deep Orange
			"#D81B60", // Pink
			"#3949AB", // Indigo
			"#00897B", // Teal
			"#7CB342", // Light Green
			"#FB8C00", // Orange
			"#8E24AA", // Purple
			"#546E7A", // Blue Grey
			"#00ACC1", // Cyan
			"#FFB300", // Amber
			"#FDD835", // Yellow
			"#C0CA33", // Lime 
			"#039BE5"] // Light Blue

var currentNotebook;
var curNote = "";

sprox.config(['$routeProvider','$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/', {
			templateUrl : 'pages/login.html',
			controller  : 'loginController'
		})
		.when('/sc', {
			templateUrl : 'pages/studentcenter.html',
			controller  : 'studentCenterController'
		})
		.when('/cs', {
			templateUrl : 'pages/clubsearch.html',
			controller  : 'clubSearchController'
		})
		.when('/uc', {
			templateUrl : 'pages/uc.html',
			controller  : 'ucController'
		})
		.when('/pk', {
			templateUrl : 'pages/parking.html',
			controller  : 'parkingController'
		})
		.when('/mp', {
			templateUrl : 'pages/map.html',
			controller  : 'mapController'
		})
		.when('/sh', {
			templateUrl : 'pages/schedule.html',
			controller  : 'scheduleController'
		})
		.when('/nb', {
			templateUrl : 'pages/notebook.html',
			controller  : 'notesController'
		})
		.when('/mpl', {
			templateUrl : 'pages/mapPreloader.html',
			controller  : 'scheduleController'
		});
		
		$locationProvider.html5Mode(true);
}]);