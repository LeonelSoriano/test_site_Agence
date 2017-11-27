'use strict';

/**
 * @ngdoc overview
 * @name siteAgenceApp
 * @description
 * # siteAgenceApp
 *
 * Main module of the application.
 */


angular
  .module('siteAgenceApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'dualmultiselect',
    'angular-loading-bar',
    'chart.js',
    'angular-growl'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });



  });

