var sprox = angular.module('sprox', ['oc.lazyLoad','ngRoute', 'ngAnimate', 'ngDialog','ngBootstrapMaterial','ui.bootstrap','ngCookies']);

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


//Super hacky but....
var curSharePage = "";
var curShareSection = "Sections";

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