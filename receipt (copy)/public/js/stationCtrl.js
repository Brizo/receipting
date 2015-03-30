
.controller('stationCtrl', ['$scope','$http', function($scope, $http){

	$scope.showStations = function(){
		$http.get('/showAllStations').success(function (data) {
			$scope.stations = data;
			
		}).error(function (){
			alert("An unexpected error occured!");
		});
	}
	$scope.showStations();

	$scope.addStation = function(){
		if ($scope.stnId == undefined) {
			alert("Enter Station ID");
			return; 
		}

		var newstation = {stnId: $scope.stnId, stnName:$scope.stnName, stnBatchCode : $scope.stnBatchCode, stnLastBatch: $scope.stnLastBatch, stnLastReceipt:$scope.stnLastReceipt};

		$http.post('/addNewStation', newstation ).success(function (resp) {
			console.log(resp);
			$scope.clearNewStation();

		}).error(function () {
			alert("Error");
		});
	};



	$scope.clearNewStation = function () {
		$scope.stnId = '';
		$scope.stnName = '';
		$scope.stnBatchCode = '';
		$scope.stnLastBatch = '';
		$scope.stnLastReceipt = '';
	}

	$scope.getEditStation = function (stnId) {
		var id = stnId;
		
		$http.get('/getStation/' + id).success(function(data) {
			$scope.stnUId = data[0].stnId;
	      	$scope.stnUame = data[0].stnName;
	      	$scope.stnUBatchCode = data[0].stnBatchCode;
	      	$scope.stnULastBatch = data[0].stnLastBatch;
	      	$scope.stnULastReceipt = data[0].stnLastReceipt; 
	      	
	      	console.log(data[0]);
	      	console.log(data[0]);
	      	console.log($cope.stnUName);
	      	
	    });// $http.get ends
	}

	$scope.updateStation = function (stnId) {
		console.log($scope.stnUBatchCode);
		var id = stnId;
		var updatestation = {stnId: $scope.stnUId, stnName:$scope.stnUName, stnUBatchCode : $scope.stnUBatchCode, stnuLastatch: $scope.stnULastBatch, stnULastReceipt:$scope.stnULastReceipt};

		$http.post('/updateStation/' + id, updatestation).success(function (resp) {
			alert(resp);
			$scope.clearEditStation();

		}).error(function () {
			alert("Error");
		});
	}

	$scope.removeStation = function (stnId) {

		var id = stnId;
		$http.delete('/deleteStation/' + id).success(function(resp) {
			alert(resp);
		}).error(function () {
				alert("Error");
		});
	}

}]);