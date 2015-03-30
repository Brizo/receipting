var receipt = angular.module('receipt',['datatables'])
 .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
	  .when('/contacts', {
	    controller: 'listCtrl',
		templateUrl: 'views/list.html'
	  })
	  .when('/contacts/new', {
	    controller: 'newCtrl',
		templateUrl: 'views/new.html'
	  });

	$locationProvider.html5Mode({     // angular 1.3 style, otherwise for prev versions : $locationProvider.html5Mode(true);
	  enabled: true,
	  requireBase: false
	});
  }]);