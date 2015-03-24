angular.module('receipt')
	.service('manageData', ['$http','$q', function($http,$q){
		this.insertUser = function(user){
			return $http.post('/addNewUser', user);
		}

		this.authenticate = function (loginUser) {
			return $http.post('/userAuthenticate', loginUser);
		}

		this.getUsers = function(){
			var deferred = $q.defer();
			$http.post('/showAllUsers').success(function (resp) {
				deferred.resolve(resp);
			}).error(function (resp) {
				deferred.reject(resp); 
			});

			return deferred.promise;
		}

		this.getStations = function(){
			var deferred = $q.defer();
			$http.post('/showAllStations').success(function (resp) {
				deferred.resolve(resp);
			}).error(function (resp) {
				deferred.reject(resp); 
			});

			return deferred.promise;
		}

		this.getStation = function(stnId){
			var deferred = $q.defer();
			$http.post('/getStation', {station:stnId}).success(function (resp) {
				deferred.resolve(resp);
			}).error(function (resp) {
				deferred.reject(resp); 
			});

			return deferred.promise;
		}

		this.getCurrBatch = function(stn,user){
			var batch = {stnNum:stn, openBy:user};
			var deferred = $q.defer();
			$http.post('/getBatch', batch).success(function (resp) {
				deferred.resolve(resp);
			}).error(function (resp) {
				deferred.reject(resp); 
			});

			return deferred.promise;
		}

		this.getLogdInUser = function () {
			return $http.post('/getLogdInUser');
		}

		this.getBatchInfo = function() {
			return $http.post('/');
		}

		this.lastlogin = null;

		this.setUserLastLogD = function (date) {
			this.lastlogin = date;
		}

		this.getUserLastLogD = function (date) {
			return this.lastlogin;
		}

		this.lastloginfnb = null;

		this.setFnbLastLogD = function (date) {
			this.lastloginfnb = date;
		}

		this.getFnbLastLogD = function () {
			return this.lastloginfnb;
		}

		this.lastloginst1 = null;

		this.setSt1LastLogD = function (date) {
			this.lastloginst1 = date;
		}

		this.getSt1LastLogD = function () {
			return this.lastloginst1;
		}

		this.lastloginst2 = null;

		this.setSt2LastLogD = function (date) {
			this.lastloginst2 = date;
		}

		this.getSt2LastLogD = function () {
			return this.lastloginst2;
		}

		this.lastloginned1 = null;

		this.setNed1LastLogD = function (date) {
			this.lastloginned1 = date;
		}

		this.getNed1LastLogD = function () {
			return this.lastloginned1;
		}

		this.lastloginned2 = null;

		this.setNed2LastLogD = function (date) {
			this.lastloginned2 = date;
		}

		this.getNed2LastLogD = function () {
			return this.lastloginned2;
		}

		this.getAutoIncVals = function(stn){
			var deferred = $q.defer();
			var stnCode = stn;
			var getValues = {station:stnCode};
			$http.post('/getValues', getValues).success(function (resp) {
				deferred.resolve(resp);
			}).error(function (resp) {
				deferred.reject(resp); 
			});

			return deferred.promise;
		}

		this.currBatch = null;
	  
	  	this.setUserCurrBatch = function (batchObjId) {
	    	this.currBatch = String(batchObjId);
	  	};

	  	this.getUserCurrBatch = function (batchObjId) {
	    	return this.currBatch;
	  	};

	  	this.setEftVal = null;

	  	this.setEft = function (eftstate) {
	    	this.setEftVal = eftstate;
	  	};

	  	this.getEft = function () {
	    	return this.setEftVal;
	  	};


	  	this.currLoginUser = null;

	  	this.setCurrLoginUser = function (userObj) {
	    	this.currLoginUser = userObj;
	  	};

	  	this.getCurrLoginUser = function () {
	    	return this.currLoginUser;
	  	};

	  	this.currStation = null;

	  	this.setCurrStation = function (stnObj) {
	    	this.currStation = stnObj;
	  	};

	  	this.getCurrStation = function () {
	    	return this.currStation;
	  	};

	  	this.currCashier = null;

	  	this.setCashier = function (cashierObj) {
	    	this.currCashier = cashierObj;
	  	};

	  	this.getCashier = function () {
	    	return this.currCashier;
	  	};

	}])
	.factory('getParams', function($http) { 
    	return $http.post('http://localhost:3080/readStationParams');
	})

	.service('recSwitch', ['$http',function($http) {
		this.insertLog = function(log) {
			return $http.post('/addNewLog', log);
		}
	}])

	.factory('recTypeService', function($http){
		var recTypes = {};

		recTypes.payMethSPU = "--Select--";
		recTypes.payMethCP = "--Select--";
		recTypes.payMethOP = "--Select--";
		recTypes.payMethDP = "--Select--";
		recTypes.payMethVT = "--Select--";

		recTypes.activeTab = "";
		recTypes.actTabPayMeth = "--Select--";

		recTypes.getPayMethSPU = function(){
			return recTypes.payMethSPU;
		}

		recTypes.setPayMethSPU = function(payMeth){
			recTypes.payMethSPU = payMeth;
		}

		recTypes.getPayMethCP = function(){
			return recTypes.payMethCP;
		}

		recTypes.setPayMethCP = function(payMeth){
			recTypes.payMethCP = payMeth;
		}

		recTypes.getPayMethOP = function(){
			return recTypes.payMethOP;
		}

		recTypes.setPayMethOP = function(payMeth){
			recTypes.payMethOP = payMeth;
		}

		recTypes.getPayMethDP = function(){
			return recTypes.payMethDP;
		}

		recTypes.setPayMethDP = function(payMeth){
			recTypes.payMethDP = payMeth;
		}

		recTypes.getPayMethVT = function(){
			return recTypes.payMethVT;
		}

		recTypes.setPayMethVT = function(payMeth){
			recTypes.payMethSPU = payMeth;
		}

		recTypes.setActiveTab = function(myTab){
			recTypes.activeTab = myTab;
		}

		recTypes.setPayMeth = function(myPayMeth){
			recTypes.actTabPayMeth = myPayMeth;
		}

		return recTypes;

	});