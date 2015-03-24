angular.module('receipt')
	.controller('manageUsers',['$q','$document','$scope','$http', '$compile', 'manageData','getParams','recSwitch',  function($q,$document,$scope, $http, $compile, manageData, getParams, recSwitch){
		$scope.loginstatus = true;
		$scope.hasuserinfo = false;
		$scope.loginState = "Not Logged In!"
		$scope.adminrole = false;
		$scope.suprole = false;
		$scope.cashierrole = false;
		$scope.reprole = false;
		$scope.isAdmin = false;
		$scope.isSup = false;
		$scope.isCashier= false;
		$scope.isReporter = false;
		$scope.alert = false;
		$scope.ustnNum = '--select--';
		$scope.hasLoginError = false;
		$scope.loginError = "Enter Your id";
		$scope.userRemoved = false;
		$scope.changePwd = false;

		// get Station values from local station params file
		// Then use info to create a service to store station info
		// This service is used by all other controllers where station info is needed
		$scope.stationParams = function () {
			getParams.success(function (data){
				$scope.stn = data.stnName;
				$scope.stnCode = data.stnBatchCode;
				$scope.stnNo = data.stnId;

				var currStn = {stnname:$scope.stn, stnbatchcode:$scope.stnCode, stnnum:$scope.stnNo};
				manageData.setCurrStation(currStn);
			});
		}
		// Initialise station values
		// Done at app boostrap
		$scope.stationParams();

		// Logout function
		// Refreshes the current page
		$scope.logout = function (){
			window.location.reload(true); 
		}

		// get users' last login log from log collection
		// to be used to find out if user logged in today
		// and to set user's last login date
		$scope.getUserLog = function(user, stn) {
			var deferred = $q.defer();
			var user = {uname: user, stnno: stn};
			$http.post('/getUserLog', user).success(function(data) {
				if (!(data.length == 0)){
					deferred.resolve(data[0]);
				} else {
					data = "None";
					deferred.resolve(data);
				}
			}).error(function (data) {
				deferred.reject(data[0]); 
			});
			return deferred.promise;
		}

		$scope.calPassAge = function (passdate) {
			var logdDate = new Date(passdate);
			var today = new Date();

			var t2 = logdDate.getTime();
	        var t1 = today.getTime();

	        return parseInt((t1-t2)/(24*3600*1000));
		}

		// loggin in a user
		// capture form values
		// get station info from service
		// get user info from database to compare with form values
		// define errors and if none, capture current loggd user info in a service
		// get user info from service , loggin user, create batch and log loggin action
		$scope.validate = function(){
			$scope.loginErrorMsgs = [];
			$scope.userformroles = [];
			var userroleError = "Choose at least one role";
			var userNpssWdError = "Incorrect username/password combination";
			var userStnError = "You do not have access to this station";
			var daemonError = "Receipt daemon not started";
			var adminRError = "You do not have admin rights";
			var supRError = "You do not have supervisor rights";
			var cashierRError = "You are not registered a cashier";
			var reportRError = "You do not have access to reports";
			var eftuRError = "You do not have access to EFT uploading";
			var userPassAgeError = "Your password has expired, You need to change it";

			// get login values from form and set loginuser
			var loginUser = {uname:$scope.uname, passkey:$scope.passkey};

			// get station information from service and store it in scope
			$scope.currentStn = manageData.getCurrStation();

			//authenticate user
			manageData.authenticate(loginUser).success(function (data){
				//user values from database
	            $scope.usernameD = data.uname;
		      	$scope.userpassD = data.passkey;
		      	$scope.passdateD = data.passdate;
		      	$scope.passageD = $scope.calPassAge($scope.passdateD);
		      	$scope.firstnameD = data.firstname;
		      	$scope.lastnameD = data.lastname;
		      	$scope.userstationD = data.station;
		      	$scope.userolesD = data.roles;

		      	console.log("Password age is :");
		      	console.log($scope.passageD);

		      	if ($scope.uname != $scope.usernameD && $scope.passkey != $scope.userpassD) {
		      		$scope.loginErrorMsgs.push(userNpssWdError);
					$scope.hasLoginError = true;
				} else if ($scope.passageD > 2 && ($scope.newPasskey != null)) {
		      		$scope.loginErrorMsgs.push(userPassAgeError);
					$scope.hasLoginError = true;
					$scope.changePwd = true;
				} else if (($scope.currentStn != null) && ($scope.userstationD != $scope.currentStn.stnnum)) {
		      		$scope.loginErrorMsgs.push(userStnError);
					$scope.hasLoginError = true;
				} else if (!$scope.adminrole && !$scope.suprole && !$scope.cashierrole && !$scope.reprole && !$scope.efturole) {
					$scope.loginErrorMsgs.push(userroleError);
					$scope.hasLoginError = true;
		      	} else if ($scope.cashierrole && ($scope.currentStn == null)) {
		      		$scope.loginErrorMsgs.push(daemonError);
					$scope.hasLoginError = true;
				} else if ($scope.adminrole && ($scope.userolesD.indexOf("admin") <= -1)) {
					$scope.loginErrorMsgs.push(adminRError);
					$scope.hasLoginError = true;
				} else if ($scope.suprole && ($scope.userolesD.indexOf("sup") <= -1)) {
					$scope.loginErrorMsgs.push(supRError);
					$scope.hasLoginError = true;
				} else if ($scope.cashierrole && ($scope.userolesD.indexOf("cashier") <= -1)) {
					$scope.loginErrorMsgs.push(cashierRError);
					$scope.hasLoginError = true;
				} else if ($scope.efturole && ($scope.userolesD.indexOf("eftu") <= -1)) {
					$scope.loginErrorMsgs.push(eftuRError);
					$scope.hasLoginError = true;
				} else if ($scope.reprole && ($scope.userolesD.indexOf("report") <= -1)) {
					$scope.loginErrorMsgs.push(reportRError);
					$scope.hasLoginError = true;
		      	}else {
					$scope.loginState = "Logged In";

					// define currently loggedin user
					var loggdUser={username:$scope.usernameD, userpass:$scope.userpassD, firstname:$scope.firstnameD,
							lastname:$scope.lastnameD, userstn:$scope.userstationD, useroles:$scope.userolesD};

					// store currently loggedin user information in a service
		          	manageData.setCurrLoginUser(loggdUser);

		          	// initialize current user with the user object defined above;
					$scope.currUser = loggdUser;

					// set user last login
					// this will be used in determining whether a new batch should be created or not
					// first get the user last login date and then store it in a service
					if ($scope.currentStn != null) {
						$scope.getUserLog($scope.currUser.username, $scope.currentStn.stnnum).
		            	then (function (data) {
		            		manageData.setUserLastLogD(data.time);
		            	});
					}
		           
		            
		            // matching useroles from form and database
					if ($scope.adminrole && ($scope.userolesD.indexOf("admin") > -1)) {
						$scope.isAdmin = true;
					}
					if ($scope.suprole && ($scope.userolesD.indexOf("sup") > -1)) {
						$scope.isSup = true;
					}
					if ($scope.efturole && ($scope.userolesD.indexOf("eftu") > -1)) {
						var fnb = 66;
						var st1 = 55;
						var st2 = 77;
						var st3 = 88;
						var ned1 = 55;
						var ned2 = 99;

						var eft = true;

						manageData.setEft(eft);

						$scope.getUserLog($scope.currUser.username, fnb).
		            		then (function (data) {
		            			manageData.setFnbLastLogD(data.time);
		            		});
		            	$scope.getUserLog($scope.currUser.username, st1).
		            		then (function (data) {
		            			manageData.setSt1LastLogD(data.time);
		            		});
		            	$scope.getUserLog($scope.currUser.username, st2).
		            		then (function (data) {
		            			manageData.setSt2LastLogD(data.time);
		            		});
		            	$scope.getUserLog($scope.currUser.username, ned1).
		            		then (function (data) {
		            			manageData.setNed1LastLogD(data.time);
		            		});
		            	$scope.getUserLog($scope.currUser.username, ned2).
		            		then (function (data) {
		            			manageData.setNed2LastLogD(data.time);
		            		});

		            	$scope.isEftu = true;
					}
					if ($scope.cashierrole && ($scope.userolesD.indexOf("cashier") > -1)) {
						$scope.isCashier = true;
						var cashier = true;
						manageData.setCashier(cashier);
					}
					if ($scope.reprole && ($scope.userolesD.indexOf("report") > -1)) {
						$scope.isReporter = true;
					}
		          
		            $scope.loginstatus = false;
					$scope.hasLoginError = false;

					$scope.changePwd = true;

					// define login event
					// if cashier was not selected, it means the deamon is not needed  and so no station as 
					// station information is from deamon
					if ($scope.currentStn == null) {
						var log = {action:"userLogin", loggedInUser:$scope.currUser.username, station:"none", time:Date().toString()};
					} else {
						var log = {action:"userLogin", loggedInUser:$scope.currUser.username, station:$scope.currentStn.stnnum, time:Date().toString()}; 
			        }

			        // add login event defined above
			        recSwitch.insertLog(log).success(function () {

			        });
		        } // end if of else
	        }).error(function (error) {
	        	console.log(error);
	        });//authenticate function ends		
		}//validate function ends

		$scope.addUser = function(){
			$scope.hasAdduserError = false;
			$scope.addUserErrorMsgs = [];
			$scope.userInserted = false;
			$scope.userInsertedMsg = '';
			var passwordMissMatchError = "Passwords do not match";
			var userRoleError = "Assign at least role to the user";
			var emptyUserNameError = "Username cannot be empty";
			var emptyPasswordError = "Password cannot be empty";
			var emptyPassword2Error = "Password two cannot be empty";
			var emptyFirstNameError = "Firstname cannot be empty";
			var emptyLastNameError = "Lastname cannot be empty";
			var emptyStationError = "Station cannot be empty";
			var stationNotNumError = "Station should be number";
			var userExistError = "User Name already used";

			console.log($scope.userExist);

			//check if fields are filled
			if ($scope.usernme == null){
				$scope.addUserErrorMsgs.push(emptyUserNameError);
				$scope.hasAdduserError = true;
			} else if ($scope.usernme == null){
				$scope.addUserErrorMsgs.push(emptyUserNameError);
				$scope.hasAdduserError = true;
			} else if ($scope.userpss == null){
				$scope.addUserErrorMsgs.push(emptyPasswordError);
				$scope.hasAdduserError = true;
			} else if ($scope.userpss2 == null){
				$scope.addUserErrorMsgs.push(emptyPassword2Error);
				$scope.hasAdduserError = true;
			} else if ($scope.firstname == undefined){
				$scope.addUserErrorMsgs.push(emptyFirstNameError);
				$scope.hasAdduserError = true;
			} else if ($scope.lastname == undefined){
				$scope.addUserErrorMsgs.push(emptyLastNameError);
				$scope.hasAdduserError = true;
			} else if ($scope.stnNum == null){
				$scope.addUserErrorMsgs.push(emptyStationError);
				$scope.hasAdduserError = true;
			} else if (!Number($scope.stnNum)){
				$scope.addUserErrorMsgs.push(stationNotNumError);
				$scope.hasAdduserError = true;
			} else if ($scope.userExist == false){
				$scope.addUserErrorMsgs.push(userExistError);
				$scope.hasAdduserError = true;
			} else if (!$scope.adminRole && !$scope.cashierRole && !$scope.supRole && !$scope.reportRole) {
				$scope.addUserErrorMsgs.push(userRoleError);
				$scope.hasAdduserError = true;
			}

			//check if entered passwords match
			else if ($scope.userpss !== $scope.userpss2) {
				$scope.addUserErrorMsgs.push(passwordMissMatchError);
				$scope.hasAdduserError = true;
			}else {
				//initial user roles
				$scope.cashier = false;
				$scope.administrator = false;
				$scope.supervisor = false;
				$scope.report = false;
				$scope.eftu = false;

				//store user roles selected
				var userroles = [];

				if ($scope.adminRole) {
					userroles.push ("admin");
				}
				if ($scope.cashierRole){
					userroles.push ("cashier");
				}
				if ($scope.supRole){
					userroles.push ("sup");
				}
				if ($scope.reportRole){
					userroles.push ("report");
				}
				if ($scope.eftuRole){
					userroles.push ("eftu");
				}

				//create user object from form
				var newuser = {uname:$scope.usernme, passkey:$scope.userpss, firstname:$scope.firstname, lastname:$scope.lastname, station:$scope.stnNum, roles:userroles, passdate:Date().toString()};

				manageData.insertUser(newuser)
		            .success(function (resp) {
		            	$scope.userInsertedMsg = resp;
		                $scope.userInserted = true;
		               
		                // log login event
						if ($scope.currentStn == null) {
							var log = {action:"addUser", addedUser:$scope.usernme, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
						} else {
							var log = {action:"addUser", addedUser:$scope.usernme, actionBy:$scope.currUser.username, station:$scope.currentStn.stnnum, time:Date().toString()}; 
						}
						recSwitch.insertLog(log).success(function () {

						});
		                $scope.clearNewUser();
		            }).
		            error(function(error) {
		                $scope.addUserErrorMsgs.push(error);
						$scope.hasAdduserError = true;
		            });
		    }
		}//add user function ends

		$scope.showUsers = function(){
		    manageData.getUsers()
		    	.then(function (data) {
		      		$scope.users = data;
		    	});
		}

		$scope.clearNewUser = function () {
			$scope.usernme = '';
			$scope.userpss = '';
			$scope.userpss2 = '';
			$scope.firstname = '';
			$scope.lastname = '';
			$scope.stnNum = '';
			$scope.adminRole = '';
			$scope.supRole = '';
			$scope.cashierRole = '';
			$scope.reportRole = '';
			$scope.eftuRole = '';
		}

		$scope.clearLogin = function () {
			$scope.uname = '';
			$scope.passkey = '';
			$scope.ustnNum = '--select--';
			$scope.adminrole = '';
			$scope.suprole = '';
			$scope.cashierrole = '';
			$scope.reprole = '';
			$scope.efturole = '';
		}

		$scope.clearEditUser = function () {
			$scope.usernmeU = '';
			$scope.userpssU = '';
			$scope.firstnameU = '';
			$scope.lastnameU = '';
			$scope.adminRoleU = '';
			$scope.roleSupU = '';
			$scope.cashierRoleU = '';
			$scope.reproleU = '';
		}

		$scope.getUser = function (uName) {
			var uname = uName;
			$scope.cuname = '';
			$http.post('/getUser/' + uname).success(function(data) {

				console.log(data);
		      	// used to display edit user form when user is found
		      	if (data == "User not in database") {
		      		$scope.hasuserinfo = false;
		      		$scope.userExist = false;
		      	} else {
		      		$scope.usernmeU = data.uname;
			      	$scope.userpssU = data.passkey;
			      	$scope.firstnameU = data.firstname;
			      	$scope.lastnameU = data.lastname;
			      	$scope.currentStnU = data.station;
			      	var useroles = data.roles; //array of user roles
		      		$scope.hasuserinfo = true;
		      		$scope.userExist = true;
		      	
			      	//retrieve user roles
			      	if (useroles.indexOf("admin") > -1) {
			      		$scope.adminRoleU = true;
			      	}
			      	if (useroles.indexOf("sup") > -1) {
			      		$scope.roleSupU = true;
			      	}
			      	if (useroles.indexOf("cashier") > -1) {
			      		$scope.cashierRoleU = true;
			      	}
			      	if (useroles.indexOf("report") > -1) {
			      		$scope.reproleU = true;
			      	}
		      	}
		    }).error (function (error) {
		    	console.log(error);
		    })
		}

		$scope.updateUser = function (user) {
			var userrolesU = [];
			var id = user;

			$scope.hasUpdateuserError = false;
			$scope.updateUserErrorMsgs = [];
			$scope.userUpdated = false;
			$scope.userUpdatedMsg = '';

			//store selected user roles
			if ($scope.adminRoleU) {
				userrolesU.push ("admin");
			}
			if ($scope.cashierRoleU){
				userrolesU.push ("cashier");
			}
			if ($scope.roleSupU){
				userrolesU.push ("sup");
			}
			if ($scope.reproleU){
				userrolesU.push ("report");
			}

			// create the user object
			var updateuser = {uname: $scope.usernmeU, passkey:$scope.userpssU, firstname : $scope.firstnameU, lastname: $scope.lastnameU, roles:userrolesU};

			$http.post('/updateUser/' + id, updateuser).success(function (resp) {
				$scope.showUsers();
				$scope.userUpdatedMsg = resp;
		        $scope.userUpdated = true;

		        // log login event
				if ($scope.currentStn == null) {
					var log = {action:"UpdateUser", actionBy:$scope.currUser.username, updatedUser:$scope.usernmeU, station:"none", time:Date().toString()};
				} else {
					var log = {action:"UpdateUser", actionBy:$scope.currUser.username, updatedUser:$scope.usernmeU, station:$scope.currentStn.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});

				$scope.clearEditUser();

			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.removeUser = function (uname) {
			var id = uname;
			$http.delete('/deleteUser/' + id).success(function(resp) {
				manageData.getUsers()
		    		.then(function (data) {
		      			$scope.users = data;
		      			$scope.userRemoveMsg = resp;
						$scope.userRemoved = true;

						// log login event
						if ($scope.currentStn == null) {
							var log = {action:"removeUser", removedUser:uname, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
						} else {
							var log = {action:"removeUser", removedUser:uname, actionBy:$scope.currUser.username, station:$scope.currentStn.stnnum, time:Date().toString()}; 
						}
						recSwitch.insertLog(log).success(function () {

						});
		    	});
				
			}).error(function () {
				console.log("An Error occured");
			});
		}

		$scope.closeTransferCashier = function () {
			$scope.hasuserinfo = false;
			$scope.cuname = '';
		}

		$scope.closeAssignCashier = function () {
			$scope.hasuserinfo = false;
			$scope.cuname = '';
		}

		$scope.cancelCashierTransfer = function () {
			$scope.hasuserinfo = false;
			$scope.clearEditUser();
		}

		$scope.cancelCashierAssign = function () {
			$scope.hasuserinfo = false;
			$scope.clearEditUser();
		}

		$scope.transfereCashier = function (id) {
			var cashierId = id;
			var updateCashier = {station:$scope.transferStn};
			$http.post('/transfereCashier/' + cashierId, updateCashier).success(function (resp){
				// log login event
				if ($scope.currentStn == null) {
					var log = {action:"transfereCashier", transferedCashier:cashierId, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"transfereCashier", transferedCashier:cashierId, actionBy:$scope.currUser.username, station:$scope.currentStn.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});
			});
		}

		$scope.assignCashier = function (id) {
			var cashierId = id;
			var updateCashier = {station:$scope.transferStn, startDate : $scope.transferStartDate, endDate: $scope.transferEndDate};
			$http.post('/assignCashier/' + cashierId, updateCashier).success(function (resp){
				// log login event
				if ($scope.currentStn == null) {
					var log = {action:"assignCashier", assignedCashier:cashierId, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"assignCashier", assignedCashier:cashierId, actionBy:$scope.currUser.username, station:$scope.currentStn.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});
			})
		}

		$scope.refreshCust = function(){
			$http.post('/refreshCust').success(function(resp){
			});
		}

		$scope.refreshQuotes = function(){
			$http.post('/refreshQuotes').success(function(resp){
			});
		}
	}])//manageUsers controller ends

	.controller('stationCtrl',['$q','$scope','$http','$compile', 'recSwitch','manageData', function($q,$scope, $http, $compile, recSwitch,manageData){
		var stationIdError = "Enter Station Id";
		var stationNameError = "Enter Station Name";
		var stationBCodeError = "Enter Station Batch Code";
		$scope.hasAddStationError = false;
		$scope.addStationErrorMsgs = [];
		$scope.hasStation = false;
		$scope.hasPStation = false;
		$scope.stnRemoved = false;

		// Get station and user information from service
		$scope.currStation = manageData.getCurrStation();
		$scope.currUser = manageData.getCurrLoginUser();

		$scope.showStations = function(){
		 	manageData.getStations()
		    	.then(function (data) {
		    		$scope.stations = data;
		    	});
		}

		$scope.addStation = function(){
			$scope.stationInserted = false;
			$scope.stationInsertedMsg = '';
			$scope.hasAddStationError = false;
			$scope.addStationErrorMsgs = [];
			var stationIdError = "Station ID cannot be empty";
			var stationNotNumError = "Station ID should be a number";
			var stationNameError = "Station name cannot be empty";
			var stationBCodeError = "Station batchcode cannot be empty";
			var stationAccntError = "Station account cannot be empty";
			var stationBnkCError = "Station bank code cannot be empty";
			$scope.stnRemoved = false;

			if ($scope.stnId == null){;
				$scope.addStationErrorMsgs.push(stationIdError);
				$scope.hasAddStationError = true;
			}else if (!Number($scope.stnId)) {
				$scope.addStationErrorMsgs.push(stationNotNumError);
				$scope.hasAddStationError = true;
			}else if ($scope.stnName == null){;
				$scope.addStationErrorMsgs.push(stationNameError);
				$scope.hasAddStationError = true;
			}else if ($scope.stnBatchCode == null){
				$scope.addStationErrorMsgs.push(stationBCodeError);
				$scope.hasAddStationError = true;
			}else if ($scope.stnAccount == null){
				$scope.addStationErrorMsgs.push(stationAccntError);
				$scope.hasAddStationError = true;
			}else if ($scope.stnBankCode == null){
				$scope.addStationErrorMsgs.push(stationBnkCError);
				$scope.hasAddStationError = true;
			}else{
				// station object definition
				var newstation = {stnId:Number($scope.stnId), stnName:$scope.stnName, stnBatchCode:$scope.stnBatchCode, stnAccount:$scope.stnAccount, stnBankCode:$scope.stnBankCode};
				$http.post('/addNewStation', newstation ).success(function (resp) {
					$scope.stationInsertedMsg = resp;
					$scope.stationInserted = true;
					$scope.clearNewStation();

					// log login event
					if ($scope.currStation == null) {
						var log = {action:"AddStation", addedStation:$scope.stnId ,actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
					} else {
						var log = {action:"AddStation", addedStation:$scope.stnId, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
					}
					recSwitch.insertLog(log).success(function () {

					});
				}).error(function () {
					console.log("An error Occured");
				});
			}
		}

		$scope.clearNewStation = function () {
			$scope.stnId = '';
			$scope.stnName = '';
			$scope.stnBatchCode = '';
			$scope.stnAccount = '';
			$scope.stnBankCode = '';
		}

		$scope.getEditStation = function (stnId) {
			$scope.hasStation = true;
			var id = Number(stnId);
			
			manageData.getStation(stnId)
				.then(function(data) {
					$scope.editStn = data;
			      	$scope.stnIdU = data.stnId;
			      	$scope.stnNameU = data.stnName;
			      	$scope.stnBatchCodeU = data.stnBatchCode;	  	      		      	
			    });
		}

		$scope.getParamStation = function (stnId) {
			$scope.hasPStation = true;
			var id = Number(stnId);
			
			manageData.getStation(stnId)
				.then(function(data) {
			      	$scope.stnIdParam = data.stnId;
			      	$scope.stnNameParam = data.stnName;
			      	$scope.stnBatchCodeParam = data.stnBatchCode;
			      	$scope.stnLastBatchParam = data.stnLastBatch;
			      	$scope.stnLastReceiptParam = data.stnLastReceipt;      		      	
			    });
		}

		$scope.clearStationParam = function () {
			$scope.stnNumParam = '';
		    $scope.stnIdParam = '';
		    $scope.stnNameParam = '';
		    $scope.stnBatchCodeParam = '';
		    $scope.stnLastBatchParam = '';
		    $scope.stnLastReceiptParam = '';
		    $scope.stnAccount = "";
		    $scope.stnBankCode = "";
		}
		// to collapse the setstation update form
		$scope.closeSetParams = function (){
			$scope.clearStationParam();
			$scope.hasPStation = false;
		}

		$scope.updateStation = function (id) {
			$scope.currUser = manageData.getCurrLoginUser();
			//station object definition
			var updatestation = {stnId: $scope.stnIdU, stnName:$scope.stnNameU, stnBatchCode:$scope.stnBatchCodeU, stnLastBatch:$scope.stnLastBatchU, stnLastReceipt:$scope.stnLastReceiptU};
			$http.post('/updateStation/' + id, updatestation).success(function (resp) {
				$scope.showStations();
				$scope.clearEditStation();
				console.log(resp);
				// log login event
				console.log($scope.currUser);
				if ($scope.currStation == null) {
					var log = {action:"updateStation", updatedStation:$scope.stnIdU ,actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"updateStation", updatedStation:$scope.stnIdU, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});
			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.setStationParams = function () {

			var systemparams = {stnId:$scope.stnIdU, stnName:$scope.stnNameU, stnBatchCode:$scope.stnBatchCodeU, stnLastBatch:$scope.stnLastBatchU, stnLastReceipt:$scope.stnLastReceiptU};

			$http.post('http://localhost:3080/setStationParams', systemparams).success(function (resp) {
				$scope.clearEditStation();

				// log login event
				if ($scope.currStation == null) {
					var log = {action:"setStationParams", stationId:$scope.stnIdU ,actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"setStationParams", stationId:$scope.stnIdU, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});
			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.clearEditStation = function() {
			$scope.editStn = '';
		    $scope.stnIdU = '';
		    $scope.stnNameU = '';
		    $scope.stnBatchCodeU = '';
		    $scope.stnLastBatchU = '';
		    $scope.stnLastReceiptU = '';	 
		}

		$scope.removeStation = function (stnId) {
			var id = Number(stnId);
			$http.delete('/deleteStation/' + id).success(function(resp) {
				manageData.getStations().
					then(function (data){
						$scope.stations = data;
						$scope.stnRemoveMsg = resp;
						$scope.stnRemoved = true;

						// log login event
						if ($scope.currStation == null) {
							var log = {action:"removeStation", removedStation:stnId ,actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
						} else {
							var log = {action:"removeStation", removedStation:stnId, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
						}
						recSwitch.insertLog(log).success(function () {

						});
					});
			});
		}
	}])// station controller ends

	.controller('customerCtrl', ['$scope','$http','$compile','recSwitch','manageData', function($scope, $http,$compile, recSwitch,manageData){

		// Get station and user information from service
		$scope.currStation = manageData.getCurrStation();
		$scope.currUser = manageData.getCurrLoginUser();

		$scope.showCustomers = function(){
			$http.post('/showAllCustomers').success(function (data) {
				custData = '';
				data.forEach(function(customer){
					custData += '<tr><td>'+customer.Account+'</td><td>'+customer.NAME+'</td><td>'+customer.DEPOT_NAME+'</td><td>'+customer.Address+'</td></tr>';
				});
				
				$('#showCustTblData').html('');
				var $custData1 = $(custData).appendTo('#showCustTblData');
				$compile($custData1)($scope);
				//$('#adminTab').on('click', '#adminUsers', function(){
					$('.custable').dataTable();
					//});
							
			}).error(function (){
			});
		}

		$scope.addCustomer = function(){
			$scope.customerInserted = false;
			$scope.customerInsertedMsg = '';
			$scope.hasAddCustomerError = false;
			$scope.addCustomerErrorMsgs = [];
			var addCustomerIdError = "Customer number cannot be empty";
			var addIsNotNumIdError = "Customer number should be numeric";
			var addCustomerNameError = "Customer name cannot be empty";
			var addCustomerAddr1Error = "Customer address one cannot be empty";
			var addCustomerAddr2Error = "Customer address two cannot be empty";
			var addCustomerAddr3Error = "Customer address three cannot be empty";
			var addCustomerRefError = "Customer address one cannot be empty";
			var addCustomerRefError = "Customer Reference cannot be empty";

			if ($scope.custNo == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerIdError);
				$scope.hasAddCustomerError = true;
			}else if (!Number($scope.custNo)) {
				$scope.addCustomerErrorMsgs.push(addIsNotNumIdError);
				$scope.hasAddCustomerError = true;
			}else if ($scope.custName == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerNameError);
				$scope.hasAddCustomerError = true;
			}else if ($scope.custAddr1 == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerAddr1Error);
				$scope.hasAddCustomerError = true;
			}else if ($scope.custAddr2 == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerAddr2Error);
				$scope.hasAddCustomerError = true;
			}else if ($scope.custAddr3 == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerAddr3Error);
				$scope.hasAddCustomerError = true;
			}else if ($scope.custRef == null){;
				$scope.addCustomerErrorMsgs.push(addCustomerRefError);
				$scope.hasAddCustomerError = true;
			}else {
				// customer object definition
				var newcustomer = {CUSTNO:$scope.custNo, CUSTNAME:$scope.custName, CUSTADDR1:$scope.custAddr1, CUSTADDR3:$scope.custAddr2, CUSTADDR3:$scope.custAddr3, CUSTREF:$scope.custRef};

				$http.post('/addNewCustomer', newcustomer ).success(function (resp) {
			
					$scope.customerInsertedMsg = resp;
					$scope.customerInserted = false;
					$scope.clearNewCustomer();

					// log login event
					if ($scope.currStation == null) {
						var log = {action:"AddCustomer", addedCustomer:$scope.custNo, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
					} else {
						var log = {action:"AddCustomer", addedCustomer:$scope.custNo, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
					}
					recSwitch.insertLog(log).success(function () {

					});

				}).error(function () {
					console.log("An error occured");
				});
			}
		}

		$scope.clearNewCustomer = function () {
			$scope.custNo = '';
			$scope.custName = '';
			$scope.custAddr1 = '';
			$scope.custAddr2 = '';
			$scope.custAddr2 = '';
			$scope.custRef = '';
		};

		$scope.getEditCustomer = function (custno) {
			var id = custno;
			$http.post('/getCustomer/' + id).success(function(data) {
		      	$scope.custNoU = data[0].CUSTNO;
		      	$scope.custNameU = data[0].CUSTNAME;
		      	$scope.custAddr1U = data[0].CUSTADDR1;
		      	$scope.custAddr2U= data[0].CUSTADDR2;
		      	$scope.custAddr3U = data[0].CUSTADDR3;
		      	$scope.custRefU = data[0].CUSTREF; //array of user
		    });// $http.get ends
		}

		$scope.updateCustomer = function (custId) {
			var id = custId;
			if (id == undefined) {
				return;
			}
			// station object definition
			var updatecustomer = {custno:$scope.custNoU, custName:$scope.custNameU, custAddr1:$scope.custAddr1U, custAddr2:$scope.custAddr2U, custAddr3:$scope.custAddr3U, custRef:$scope.custRefU};

			$http.post('/updateCustomer/' + id, updatecustomer).success(function (resp) {
				$scope.clearEditCustomer();

				// log login event
				if ($scope.currStation == null) {
					var log = {action:"UpdateCustomer", updatedCustomer:$scope.custNoU, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"UpdateCustomer", updatedCustomer:$scope.custNoU, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});

			}).error(function () {
				console.log("Error occured");
			});
		}

		$scope.removeCustomer = function (uname) {
			var id = uname;
			$http.delete('/deleteCustomer/' + id).success(function(resp) {
				// log login event
				if ($scope.currStation == null) {
					var log = {action:"removeCustomer", removedCustomer:uname, actionBy:$scope.currUser.username, station:"none", time:Date().toString()};
				} else {
					var log = {action:"removeCustomer", removedCustomer:uname, actionBy:$scope.currUser.username, station:$scope.currStation.stnnum, time:Date().toString()}; 
				}
				recSwitch.insertLog(log).success(function () {

				});
			}).error(function () {
				console.log("Error occured");
			});
		}

		$scope.clearEditCustomer = function () {
			$scope.custIdU = '';
		    $scope.custNameU = '';
		    $scope.custAddr1 = '';
		    scope.custAddr2 = '';
		    $scope.custAddr3 = '';
		    $scope.custRefU = ''; //array of user
		}
	}])// customer controller ends

	.controller('receiptCtrl', ['$q','$scope','$http', 'getParams','recSwitch', 'recTypeService', 'manageData','$compile','recSwitch', function($q,$scope, $http,  getParams, recSwitch, recTypeService, manageData, $compile,recSwitch){
		$scope.payMethSPU = recTypeService.getPayMethSPU();
		$scope.payMethCP = recTypeService.getPayMethCP();
		$scope.payMethOP = recTypeService.getPayMethOP();
		$scope.payMethDP = recTypeService.getPayMethDP();
		$scope.payMethVT = recTypeService.getPayMethVT();
		$scope.glCodeOP = "--Select--";
		$scope.stneft = "--Select--";
		$scope.glCodeAvail = true;
		$scope.cheqnum = null;
		$scope.glCode = "--Select--"
		$scope.newGLBox = false;
		$scope.hasinfo = false; // hide cancel receipt form
		$scope.newSusp = false;
		$scope.susBtn = "SUSP";
		$scope.isEFT = false;
		$scope.adminFeeCheckd = false;
		$scope.connFeeCheckd = false;
		$scope.secFeeCheckd = false;
		$scope.totalAmnt = 0;
		$scope.eftStnSelected = false;

		$scope.$watch('payMethSPU', function(newValue,scope) {
			if (newValue == "Cheque"){
				$scope.choseChequeSPU = true;
				//$scope.resetMessagesDiv();
			} else {$scope.choseChequeSPU = false;
				//$scope.resetMessagesDiv();
			};
			$scope.recDate = Date().toString();
		});

		$scope.$watch('payMethCP', function(newValue,scope) {
			if (newValue == "Cheque"){
				$scope.choseChequeCP = true;
			} else {$scope.choseChequeCP = false;};
			$scope.recDate = Date().toString();
		});

		$scope.$watch('payMethOP', function(newValue,scope) {
			if (newValue == "Cheque"){
				$scope.choseChequeOP = true;
			} else {$scope.choseChequeOP = false;};
			$scope.recDate = Date().toString();
		});

		$scope.$watch('payMethDP', function(newValue,scope) {
			if (newValue == "Cheque"){
				$scope.choseChequeDP = true;
			} else {$scope.choseChequeDP = false;};
			$scope.recDate = Date().toString();
		});

		$scope.$watch('payMethVT', function(newValue,scope) {
			if (newValue == "Cheque"){
				$scope.choseChequeVT = true;
			} else {$scope.choseChequeVT = false;};
			$scope.recDate = Date().toString();
		});
		// END OF WATCHERS

		// Get station and user information from service
		$scope.currStation = manageData.getCurrStation();
		$scope.currUser = manageData.getCurrLoginUser();

		// Get user last login date
		this.setUserLastLogD = function (date) {
			this.lastlogin = date;
		}

		// Get current date/time	
		$scope.getDate = function () {
			var date = new Date();
			$scope.recDate = date.getFullYear()+ date.getMonth();
		}

	    //  Invoked when eft user chooses bank
		//	sets the station no
		//	get station information
		//	initialize stationEft and use if to get incr values
		//	NB : This is for changing batch, rec, trans on the fly
		$scope.changeStn = function (stnno) {
			$scope.isEFT = manageData.getEft();

			if (stnno == '--Select--') {
				$scope.eftStnSelected = true;
				$scope.eftStnSelectedMsg = "Select Station first";
				$scope.RecNo = '';
				$scope.newBatchNumNum = '';
				$scope.newTransNo = '';
			} else {
				$scope.eftStnSelected = false;
				$scope.eftStnSelectedMsg = '';

				var stnno = Number(stnno);
				$scope.eftStnNum = stnno;
				manageData.getStation(stnno)
					.then(function (data) {
						$scope.stationEft = data;
							
						$scope.createBatchnReceipts();
						var log = {action:"userLogin", loggedInUser:$scope.currUser.username,station:$scope.stationEft.stnId, time:Date().toString()};
				    	recSwitch.insertLog(log).success(function () {
						});
			    });
			}
		}

		$scope.getCustomer = function (custNo, type) {
			var num = custNo;

			$http.post('/getCustomer', {custno:num}).success(function(data){

				// customer information from database
				if (type == 'spu'){
					$scope.custCurrBSPU = data.Current_Balance;
					$scope.custNameSPU = data.NAME;
					$scope.custAddrSPU = data.Address;
					$scope.custCitySPU = data.City;
					$scope.custAccSPU = data.Account;
				}else{
					$scope.custCurrBDP = data.Current_Balance;
					$scope.custNameDP = data.NAME;
					$scope.custAddrDP = data.Address;
					$scope.custCityDP = data.City;
					$scope.custAccDP = data.Account;
				}

				// log event
				var log = {action:"getCustomer", actionBy:$scope.currUser.username, retrievedCustomer:data.NAME, station:$scope.currStation.stnId, time:Date().toString()};
	            recSwitch.insertLog(log).success(function () {
	            });
		    });
		}

		$scope.getGlCodes = function () {
			$http.post('/getGlCodes').success(function(data) {
				// glcodes from database
				$scope.glCodes = data;
		    });	
		}

		// done on app boostrap because it is needed by otherpaments tab
		$scope.getGlCodes();

		$scope.getQuotation = function (quoteRef){
			var ref = quoteRef;

			$http.post('/getQuotation', {QuoteDesc:ref}).success(function(data) {
				// quotation from database
				$scope.quotes = data;
		      	$scope.quotes.groupName = data.oppo_GroupCustName;
		      	$scope.quotes.balance = data.Quot_nettamt;
		    });		
		}

		// **** open suspence input field and set account no for it ****
		// toggle is based on the value of the button
		$scope.openSusp = function (btnMsg) {
			if (btnMsg == 'SUSP') {
				$scope.newSusp = true; 
				$scope.susBtn = "NORM";
				$scope.accountDP = "8888888886";
			} else {
				$scope.closeSusp();
			}
		}

		// close suspence account input fields
		$scope.closeSusp = function () {
			$scope.newSusp = false; 
			$scope.susBtn = "SUSP";
			$scope.accountDP = "";
		}

		// **** show receipts function ****
		// called when doing a reprint
		$scope.showReceipts = function(){
			var stnCode = {station : $scope.currStation.stnbatchcode};
			$http.post('/showAllReceipts', stnCode).success(function (data) {
				recData = '';
				data.forEach(function(receipt){
					recData += '<tr><td>'+receipt.recNum+'</td><td>'+receipt.custName+'</td><td>'+receipt.cashier+'</td><td>'+receipt.recDate+'</td><td><a data-dismiss="modal" data-toggle="modal" ng-click="reprintReceipt(\''+receipt.recNum+'\')"><button>Print</button></a></td></tr>';
				});
				
				$('#showRecTblData').html('');
				var $recData1 = $(recData).appendTo('#showRecTblData');
				$compile($recData1)($scope);
				$('.rectable').dataTable();			
			}).error(function (){
			});
		}
		// reprint receipt
		$scope.reprintReceipt = function(receiptNo) {
			$http.post('/getReceipt', {recNo:receiptNo}).success(function (data) {
				$scope.receiptR = data;
				if($scope.receiptR.recType == "spu") {
						//REPRINT SPU RECEIPT
			            spuRecR = [
						  	'<body>',
	                        '<table>',
			                '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
	                   		'<tr><td colspan=2><center><b>Payment Receipt **R**</b></center></td></tr>',
						  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.receiptR.recNum+'</i></span></td></tr>',
						  	'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.receiptR.recBatch+'</i></span></td></tr>',
						  	'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.receiptR.transNo+'</i></span></td></tr>',
						  	'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.receiptR.recDate+'</i></span></td></tr>',
						  	'<tr><td><span><b>Account No:</b></span></td><td><span><i>'+$scope.receiptR.account+'</i></span></td></tr>',
						  	'<tr><td><span><b>Customer</b></span></td><td><span>'+$scope.receiptR.custName+'</span><br><span>'+$scope.receiptR.custAddr+'</span><br><span>'+$scope.receiptR.custCity+'</span></td><td>&nbsp;</td></tr>',
						  	'<tr><td><span><b>Pay Method:</b></span></td><td><span><i>'+$scope.receiptR.payMeth+'</i></span></td></tr>',
						  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Tendered:</b></span></td><td><span><i>E '+$scope.receiptR.amttendered+'</i></span></td></tr>',
						  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$scope.receiptR.change+'</i></span></td></tr>',
						  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.receiptR.cashier+'</i></span></td></tr>',
						  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.receiptR.station+'</i></span></td></tr>',
						  	'</table>',
						  	'</body>',
							'<hr>'].join('\n');
						
						$http.post('http://localhost:3080/print', {spuRec:spuRecR}).success(function (resp) {
						});
					}else if ($scope.receiptR.recType == "deposits") {
						//REPRINT DEPOSITS RECEIPT
						capRecR = [
							'<body>',
	                        '<table>',
	                     	'<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
			                '<tr><td colspan=2><center><b>Payment Receipt **R**</b></center></td></tr>',
							'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.receiptR.recNum+'</i></span></td></tr>',
							'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.receiptR.recBatch+'</i></span></td></tr>',
							'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.receiptR.transNo+'</i></span></td></tr>',
							'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.receiptR.recDate+'</i></span></td></tr>',
							'<tr><td><span><b>Quotation:</b></span></td><td><span><i>'+$scope.receiptR.quoteRef+'</i></span></td></tr></table>',
							'<table><tr><td><span><b>Customer</b></span></td><td><span>'+$scope.quotes.custName+'</span><br></td></tr></table>',
							'<tr><td><span><b>Paid By:</b></span></td><td><span><i>'+$scope.receiptR.payMeth+'</i></span></td></tr>',
							'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
							'<tr><td><span><b>Tendered:</b></span></td><td><span><i>E '+$scope.receiptR.amttendered+'</i></span></td></tr>',
							'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$scope.receiptR.change+'</i></span></td></tr>',
						  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.receiptR.cashier*'</i></span></td></tr>',
						  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.receiptR.station+'</i></span></td></tr>',
							'</table>',
							'</body>',
							'<hr>'].join('\n');
						  	
						  	$http.post('http://localhost:3080/print', {spuRec:capRecR}).success(function (resp) {
						    
							});				
					}else if ($scope.receiptR.recType == "capital"){
						//REPRINT CAPITAL RECEIPT
						capRecR = [
						  	'<body>',
	                        '<table>',
	                		'<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
			                '<tr><td colspan=2><center><b>Payment Receipt **R**</b></center></td></tr>',
						  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.receiptR.recNum+'</i></span></td></tr>',
							'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.receiptR.recBatch+'</i></span></td></tr>',
							'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.receiptR.transNo+'</i></span></td></tr>',
							'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.receiptR.recDate+'</i></span></td></tr>',
						  	'<tr><td><span><b>Quotation:</b></span></td><td><span><i>'+$scope.receiptR.quoteRef+'</i></span></td></tr>',
						  	'<tr><td><span><b>Customer</b></span></td><td><span>'+$scope.receiptR.custName+'</span><br></td></tr>',
						  	'<tr><td><span><b>Paid By:</b></span></td><td><span><i>'+$scope.receiptR.payMeth+'</i></span></td></tr>',
						  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scopereceiptR.receiptR.amtdue+'</i></span></td></tr>',
							'<tr><td><span><b>Tendered:</b></span></td><td><span><i>E '+$scope.receiptR.amttendered+'</i></span></td></tr>',
							'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$scope.receiptR.change+'</i></span></td></tr>',
						  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.receiptR.cashier*'</i></span></td></tr>',
						  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.receiptR.station+'</i></span></td></tr>',
						  	'</table>',
						  	'</body>',
							'<hr>'].join('\n');
						  	
						  	$http.post('http://localhost:3080/print', {spuRec:capRecR}).success(function (resp) {
						   
						  	});
					} else if ($scope.receiptR.recType == "visits") {
						//REPRINT VISITS RECEIPT
						vtRecR = [
						  	'<body>',
	                        '<table>',
	                		'<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
			                '<tr><td colspan=2><center><b>Payment Receipt **R**</b></center></td></tr>',
						  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.receiptR.recNum+'</i></span></td></tr>',
							'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.receiptR.recBatch+'</i></span></td></tr>',
							'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.receiptR.transNo+'</i></span></td></tr>',
							'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.receiptR.recDate+'</i></span></td></tr>',
						  	'<tr><td><span><b>Customer :</b></span></td><td><span><i>'+$scope.custName+'</i></span></td></tr>',
						  	'<tr><td><span><b>Method:</b></span></td><td><span><i>'+$scope.receiptR.payMeth+'</i></span></td></tr>',
						  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scopereceiptR.receiptR.amtdue+'</i></span></td></tr>',
							'<tr><td><span><b>Tendered:</b></span></td><td><span><i>E '+$scope.receiptR.amttendered+'</i></span></td></tr>',
							'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$scope.receiptR.change+'</i></span></td></tr>',
						  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.receiptR.cashier*'</i></span></td></tr>',
						  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.receiptR.station+'</i></span></td></tr>',
						  	'</table>',
							'</body>',
							'<hr>'].join('\n');
						
						$http.post('http://localhost:3080/print', {spuRec:vtRecR}).success(function (resp) {
						  
						});
					} else if ($scope.receiptR.recType == "otherPayments") {
						//REPRINT OTHER PAYMENTS RECEIPT
						opRecR = [
						    '<body>',
	                        '<table>',
	                		'<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
			                '<tr><td colspan=2><center><b>Payment Receipt **R**</b></center></td></tr>',
						  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.receiptR.recNum+'</i></span></td></tr>',
							'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.receiptR.recBatch+'</i></span></td></tr>',
							'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.receiptR.transNo+'</i></span></td></tr>',
							'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.receiptR.recDate+'</i></span></td></tr>',
						  	'<tr><td><span><b>Customer :</b></span></td><td><span><i>'+$scope.custName+'</i></span></td></tr>',
						  	'<tr><td><span><b>Method:</b></span></td><td><span><i>'+$scope.receiptR.payMeth+'</i></span></td></tr>',
						  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scopereceiptR.receiptR.amtdue+'</i></span></td></tr>',
							'<tr><td><span><b>Tendered:</b></span></td><td><span><i>E '+$scope.receiptR.amttendered+'</i></span></td></tr>',
							'<tr><td><span><b>Amount:</b></span></td><td><span><i>E '+$scope.receiptR.amtdue+'</i></span></td></tr>',
						  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$scope.receiptR.change+'</i></span></td></tr>',
						  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.receiptR.cashier*'</i></span></td></tr>',
						  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.receiptR.station+'</i></span></td></tr>',
						  	'</table>',
						  	'</body>',
							'<hr>'].join('\n');
						  
						$http.post('http://localhost:3080/print', {spuRec:opRecR}).success(function (resp) {
						   
						});
					}
			});
		}

		// **** Update auto incremental values function ****
		// called after inserting a receipt
		$scope.updateAutoIncVals = function (stnNum,newRecNo, newTransNo, newMPayID) {
			var updateValues = {station: stnNum, recNo:newRecNo, transNo:newTransNo, mPayID:newMPayID};
			$http.post('/updateAutoIncrements', updateValues).success(function(resp){
			}).error(function(){
			});
		}

		// **** function to find if user logged in on current day *****
		// Compares today's date with the last login date from user's latest login date; 
		$scope.calDateDiff = function (logDate) {
			var deferred = $q.defer();

			// current date
			logdDate = new Date(logDate);
			var today = new Date();
			var todayDay = today.getDate();
			var todayMon = today.getMonth();
			var todayYear = today.getFullYear();

			// User last log in date
			var logDay = logdDate.getDate();
			var logMon = logdDate.getMonth();
			var logYear = logdDate.getFullYear();

			// if user loggd in today, set variable to true, else false
			if ((todayDay == logDay) && (todayMon == logMon) && (todayYear == logYear)) {
				var logginToday = true;
				deferred.resolve(logginToday);
			}else {
				var logginToday = false;
				deferred.resolve(logginToday);
			}
			return deferred.promise;
		}

		// **** function to get user's latest previous batch *****
		// needed when user was found to have loggd in today
		// which means they have to continue with that batch not created a new one
		$scope.getPrevBatch = function (stn) {
			var deferred = $q.defer();
			if ($scope.isEFT){
				var batch = {stnNum:stn.stnId, openBy:$scope.currUser.username};
			} else {
				var batch = {stnNum:stn.stnnum, openBy:$scope.currUser.username};
			}

			$http.post('/getBatch', batch).success(function(data) {
				deferred.resolve(data);
			}).error(function (data) {
				deferred.reject(data); 
			});
			return deferred.promise;
		}

		// ***** Function to get station's autoincremental values ******
		// in order to create a new batch, receipt or trans no obtain latest previous autoincremental values for the given station
		// return it to requested function
		$scope.getAutInVals = function (stn) {
			var deferred = $q.defer();
			var getValues = {station:stn};
			$http.post('/getValues', getValues).success(function (data){
				deferred.resolve(data);
			}).error(function (data) {
				deferred.reject(data); 
			});
			return deferred.promise;
		}

		// after using obtained batchno and incrementing it, update collection
		$scope.incrementBatchNo = function (stn, batchNo) {
			var updateBatch = {station:stn, batchNum: batchNo};
			$http.post('/incrementBatch', updateBatch).success(function (resp){
			}); 
		}

		// Create new batch
		// done when user was found not to have loggedin today
		// first get auto incremental values and increment it by one (done by getAutInVals)
		// use batch no to create leading zeros to maitain 3 digits
		// then join that with batch code for current station
		$scope.createNewBatch = function(stn) {
			if ($scope.isEFT){
				var stnno = stn.stnId;
			} else {
				var stnno = stn.stnnum;
			}
			$scope.getAutInVals(stnno)
				.then(function (data) {	 
					$scope.newBatchNo = data.batchNo + 1;     		
					var batch = "" + $scope.newBatchNo;
					if (batch.length > 2) {
						var batch = "" + 1;
						$scope.newBatchNo = 1;
					}
					while (batch.length < 2) {
						batch = "0" + batch;
					}

					if ($scope.isEFT){
						$scope.newBatchNum = stn.stnBatchCode + batch;
						var newbatch = {batchNo : $scope.newBatchNum, openBy : $scope.currUser.username, status : "open", timeOpened: Date().toString(), station:stn.stnId, stnCode :stn.stnBatchCode};
					} else {
						$scope.newBatchNum = stn.stnbatchcode + batch;
						var newbatch = {batchNo : $scope.newBatchNum, openBy : $scope.currUser.username, status : "open", timeOpened: Date().toString(), station:stn.stnnum, stnCode :stn.stnbatchcode};
					}
					
					$http.post('/createNewBatch', newbatch).success(function(resp) {
						manageData.setUserCurrBatch(resp._id);
						if ($scope.isEFT){
							$scope.incrementBatchNo(stn.stnId,$scope.newBatchNo);
						} else {
							$scope.incrementBatchNo(stn.stnnum,$scope.newBatchNo);
						}
					}).error(function (data) {
					});
		    	});
		}

		// *** Actual generation of receipt and trans no function ****
		// first set station number
		// Then get auto incremental values for that station
		// increment receipt and transno for display on view
		// set station code
		// use code to generate receipt no, maintaining 5 digits
		$scope.generateRecNo = function (stn) {
			if ($scope.isEFT){
				var stnno = stn.stnId;
			} else {
				var stnno = stn.stnnum;
			}

			$scope.getAutInVals(stnno)
				.then (function (data) {

					$scope.newRecNo = data.recNo + 1;
					$scope.newTransNo = data.transNo + 1;

					if ($scope.newRecNo >= 9999){
				    	$scope.newRecNo = 1;
					} else {
						$scope.newRecNo = data.recNo + 1;
					}
				
					//  Check if eft and change the code ==> used for receiptno creation 
					// otherwise use the orignal station 
					if ($scope.isEFT) {
						var code = $scope.stationEft.stnBatchCode;
					} else {
						var code = stn.stnbatchcode;
					}
					
					// create receipt string without the zeros
					var str = "" + $scope.newRecNo;

					if (str.length > 5) {
						str = "" + 1;
					}
					//add zeros to the string above and maintain 5 digits
					while (str.length < 5) {
						str = "0" + str;
					}
					// generate final receipt number
					$scope.RecNo = code + str;
				});
		}

		// ******* function to determine the creation of batch, receipt no, and trans no *******
		// first check if user logged in today
		// if not, create new batch else use prev batch
		// create receipt and transaction numbers
		// set current batch into service
		$scope.createBatchnReceipts = function (){
			// check if logged in user is doing eft
			// if so change station to be that choosen by the user on the fly
			// get user lastlogin according to the station
			// otherwise get lastlogin of the orignal station
			if ($scope.isEFT){
				$scope.currStation = $scope.stationEft;

				if ($scope.currStation.stnId == 66) {
					$scope.userlastlog = manageData.getFnbLastLogD();
				} else if ($scope.currStation.stnId== 55) {
					$scope.userlastlog = manageData.getSt1LastLogD();
				} else if ($scope.currStation.stnId == 77) {
					$scope.userlastlog = manageData.getSt2LastLogD();
				} else if ($scope.currStation.stnId == 88) {
					$scope.userlastlog = manageData.getNed1LastLogD();
				} else if ($scope.currStation.stnId == 99) {
					$scope.userlastlog = manageData.getNed2LastLogD();
				}

			} else {
				$scope.userlastlog = manageData.getUserLastLogD();
			}
			
			$scope.calDateDiff($scope.userlastlog)
				.then(function (data){
					if (!data){										
						$scope.createNewBatch($scope.currStation);
						$scope.generateRecNo($scope.currStation);
					}else if (data){												
						$scope.getPrevBatch($scope.currStation).
							then(function (prevb) {
								$scope.newBatchNum = prevb.batchNo;
								$scope.generateRecNo($scope.currStation);
								manageData.setUserCurrBatch(prevb._id);
							});
					}
				});
		}

		// **** get the value or isCashier from service ****
		// This is done at application bootstrap so that when a user logsin,
		// the batch, receipt, and transaction numbers will be populated
		$scope.isCashier = manageData.getCashier();

		if ($scope.isCashier) {
			$scope.createBatchnReceipts();
		}

		// **** Decrement quatation after payment function ****
		$scope.updateQuotation = function () {				
			$scope.newBalance = $scope.quotes.balance - $scope.recamtCP;
			var updatedQuote = {qDescription: $scope.quoteRef, qBalance:$scope.newBalance};
			$http.post('/updateRecQuote', updatedQuote).success(function (resp) {
				
			});
		}

		// **** Decrement aging after payment function ****
		$scope.updateAging = function () {
			$scope.newBalance = $scope.custCurrBSPU - $scope.recamtSPU;
			var updatedAging = {account: $scope.custAccSPU, balance:$scope.newBalance};
				$http.post('/updateAging', updatedAging).success(function (resp) {	
			});
		}

		// *** Add new gl code ****
		// done when user chose new gl code and filled it in
		$scope.insertGlCode = function () {
			var newGlCode = {glcode: $scope.glCodeOP2, glCodeDesc:$scope.glCodeDesc};
			$http.post('/addNewGlCode', newGlCode ).success(function (resp) {
			}).error(function () {
				console.log("An error occured");
			});
		}

		// *** shows input field for new gl code function ****
		// invoked when user selects new gl code
		$scope.openNewGLBox = function () {
			if ($scope.glCodeOP == "Other"){
				$scope.newGLBox = true;
				$scope.glCodeAvail = false;
			}
		}

		// *** hides input field for add new gl code function ***
		// invoked when use hits back  button
		$scope.closeNewGLBox = function () {
			$scope.glCodeOP = '--Select--';
			$scope.newGLBox = false;
			$scope.glCodeAvail = true;
		}

		// *** sets admin fee environment variable ***
		// sets isAdminfee true so that it can be directed to otherpayments
		// show or hide admin fee input field
		$scope.setAdminFee = function () {
			$scope.adminFeeCheckd = !$scope.adminFeeCheckd;
			$scope.isAdminFee = true;
			$scope.glCode = "HF889999A978";
		}

		$scope.resetAdmin = function () {
			$scope.isAdminFee = true;
		}

		// *** sets connection fee environment variable ***
		// show or hide conn fee input field
		$scope.setConnFee = function () {
			$scope.connFeeCheckd = !$scope.connFeeCheckd;
			$scope.isConnFee = true;
		}

		// *** sets connection fee environment variable ***
		// show or hide conn fee input field
		$scope.setCapFee = function () {
			$scope.capFeeCheckd = !$scope.capFeeCheckd;
			$scope.isCapFee = true;
		}

		$scope.resetCap = function () {
			$scope.isCapFee = true;
		}

		// *** sets security fee environment variable ***
		// show or security conn fee input field
		$scope.setSecFee = function () {
			$scope.secFeeCheckd = !$scope.secFeeCheckd;
			$scope.isSecFee = true;
		}

		// **** create receipt object function ****
		// define receipt, do checks,  
		$scope.insertRec = function (type) {
			$scope.currUserBatch = manageData.getUserCurrBatch();
			var recType = type;
			var cashier = $scope.currUser.firstname +" "+ $scope.currUser.lastname;

			// receipt object definition
			if (recType == 'spu') {
				if ($scope.choseCheque) {
					$scope.chequeTot = $scope.recamtSPU;
				}

				if ($scope.isEFT){
					$scope.currStation.stnname = $scope.stationEft.stnName;
					$scope.currStation.stnnum = $scope.stationEft.stnId;
					$scope.stationCode = $scope.stationEft.stnBatchCode;
					$scope.payMethSPU = "eft";
				}

				var glCode = "HF008888000";
				var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoSPU, bankCode: $scope.bankCodeSPU, drawerName: $scope.drawerNameSPU};
				
				$scope.paymentMethod = $scope.payMethSPU;
				$scope.change = $scope.changeamtSPU;
				$scope.CUSTOMERname = $scope.custNameSPU;

				if ($scope.isMultiPay) {
					if ($scope.payMethSPU == "Cash" || $scope.payMethSPU == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch: $scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountSPU,recType:recType, glCode: glCode , custName:$scope.custNameSPU, 
							custAddr: $scope.custAddrSPU, custCity: $scope.custCitySPU,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtSPU) ,amttendered: Number($scope.tendamtSPU), change: Number($scope.changeamtSPU), 
						payMeth:$scope.payMethSPU};
					}else {			
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountSPU, recType:recType, glCode: glCode , custName:$scope.custNameSPU, 
							custAddr: $scope.custAddrSPU, custCity: $scope.custCitySPU,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtSPU) ,amttendered: Number($scope.tendamtSPU), change: Number($scope.changeamtSPU), 
							payMeth:$scope.payMethSPU,cheQue: newCheque };
					}
				} else if (!$scope.isMultiPay){
					if ($scope.payMethSPU == "Cash" || $scope.payMethSPU == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch: $scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountSPU,recType:recType, glCode: glCode , custName:$scope.custNameSPU, 
							custAddr: $scope.custAddrSPU, custCity: $scope.custCitySPU,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtSPU) ,amttendered: Number($scope.tendamtSPU), change: Number($scope.changeamtSPU), 
						payMeth:$scope.payMethSPU};
					}else {			
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountSPU, recType:recType, glCode: glCode , custName:$scope.custNameSPU, 
							custAddr: $scope.custAddrSPU, custCity: $scope.custCitySPU,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtSPU) ,amttendered: Number($scope.tendamtSPU), change: Number($scope.changeamtSPU), 
							payMeth:$scope.payMethSPU,cheQue: newCheque };
					}
				}

	            //Check if Receipt is Valid
	            if ((($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque") || ($scope.paymentMethod == "eft"))&&($scope.change >= 0)&&($scope.CUSTOMERname != null)) {
				//PRINT SPU RECEIPT

			    	var balance = Number($scope.custCurrBSPU) - Number($scope.recamtSPU);
		            spuRec = [
					  '<body>',
		              '<table>',
		              '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
		              '<tr><td colspan=2><center><b>Payment Receipt</b></center></td></tr>',
		              '<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.RecNo+'</i></span></td></tr>',
		              '<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.newBatchNum+'</i></span></td></tr>',
		              '<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.newTransNo+'</i></span></td></tr>',
		              '<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.recDate.substring(0,21)+'</i></span></td></tr>',
		              '<tr><td><span><b>Account No:</b></span></td><td><span><i>'+$scope.accountSPU+'</i></span></td></tr>',
		              '<tr><td><span><b>Customer</b></span></td><td><span>'+$scope.custNameSPU+'</span><br><span>'+$scope.custAddrSPU+'</span><br><span>'+$scope.custCitySPU+'</span></td><td>&nbsp;</td></tr>',
		              '<tr><td><span><b>Prev Balance</b></span></td><td><span><i>'+$scope.custCurrBSPU+'</i></span></td></tr>',
		              '<tr><td><span><b>Pay Method:</b></span></td><td><span><i>'+$scope.payMethSPU+'</i></span></td></tr>',
		              '<tr><td><span><b>Tendered:</b></span></td><td><span><i>'+$("#tendamtspu").text()+'</i></span></td></tr>',
		              '<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtspu").text()+'</i></span></td></tr>',
		              '<tr><td><span><b>Change:</b></span></td><td><span><i>'+$("#changeamtspu").text()+'</i></span></td></tr>',
		              '<tr><td><span><b>Curr Balance</b></span></td><td><span><i>'+balance+'</i></span></td></tr>',
		              '<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.currUser.firstname+'--'+$scope.currUser.lastname+'</i></span></td></tr>',
		              '<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.currStation.stnname+'</i></span></td></tr>',
		              '</table>',
		              '</body>',
		              '<hr>'].join('\n');

		            // Only print receipt when not on EFT
		            if (!$scope.isEFT) {
		                $http.post('http://localhost:3080/print', {spuRec:spuRec}).success(function (resp) {  
		                });
		            }            
				}
			} else if (recType == 'capital') {

				if ($scope.choseCheque) {
					$scope.chequeTot = $scope.recamtCP;
				}

				if ($scope.isEFT){
					$scope.currStation.stnname = $scope.stationEft.stnName;
					$scope.currStation.stnnum = $scope.stationEft.stnId;
					$scope.stationCode = $scope.stationEft.stnBatchCode;
					$scope.payMethCP = "eft";
				}

				$scope.paymentMethod = $scope.payMethCP;
				$scope.change = $scope.changeamtCP;
				$scope.CUSTOMERname = $scope.quotes.groupName;

				if ($scope.isMultiPay) {
					if ($scope.isAdminFee){
						var glCode = $scope.glCode;
						recType = "otherPayments";
					}else {
						var glCode = "HF008888089";
					}
					var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoCP, bankCode: $scope.bankCodeCP, drawerName: $scope.drawerNameCP};

					if ($scope.payMethCP == "Cash" || $scope.payMethCP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, quoteRef: $scope.quoteRef,recType:recType, glCode: glCode, custName: $scope.quotes.groupName, 
							cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtCP) , amttendered: Number($scope.tendamtCP), change: Number($scope.changeamtCP),payMeth:$scope.payMethCP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, quoteRef: $scope.quoteRef,recType:recType, glCode: glCode, custName: $scope.quotes.groupName, 
							cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtCP) , amttendered: Number($scope.tendamtCP), change: Number($scope.changeamtCP),payMeth:$scope.payMethCP,cheQue: newCheque};
					}
					// after rectype was changed to otherpayments, restore it back to capital
					recType = "capital";

				} else if (!$scope.isMultiPay) {
					if ($scope.isAdminFee){
						var glCode = $scope.glCode;
						recType = "otherPayments";
					}else {
						var glCode = "HF008888089";
					}
					var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoCP, bankCode: $scope.bankCodeCP, drawerName: $scope.drawerNameCP};

					if ($scope.payMethCP == "Cash" || $scope.payMethCP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, quoteRef: $scope.quoteRef,recType:recType, glCode: glCode, custName: $scope.quotes.groupName, 
							cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtCP) , amttendered: Number($scope.tendamtCP), change: Number($scope.changeamtCP),payMeth:$scope.payMethCP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, quoteRef: $scope.quoteRef,recType:recType, glCode: glCode, custName: $scope.quotes.groupName, 
							cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtCP) , amttendered: Number($scope.tendamtCP), change: Number($scope.changeamtCP),payMeth:$scope.payMethCP,cheQue: newCheque};
					}
					recType = "capital";
				}


	            //Check if Receipt is Valid
	            if ((($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque") || ($scope.paymentMethod == "eft"))&&($scope.change >= 0)&&($scope.CUSTOMERname != null)) {
				capRec = [
				  '<body>',
	              '<table>',
	              '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
	              '<tr><td colspan=2><center><b>Payment Receipt</b></center></td></tr>',
				  '<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.RecNo+'</i></span></td></tr>',
				  '<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.newBatchNum+'</i></span></td></tr>',
				  '<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.newTransNo+'</i></span></td></tr>',
				  '<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.recDate+'</i></span></td></tr>',
				  '<tr><td><span><b>Quotation:</b></span></td><td><span><i>'+$scope.quoteRef+'</i></span></td></tr></table>',
				  '<table><tr><td><span>'+$scope.quotes.groupName+'</span><br></td><td>&nbsp;</td></tr></table>',
				  '<table><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span><b>CURRENT BALANCE</b></span></td><td><span><i>'+$("#quotebal").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Paid By:</b></span></td><td><span><i>'+$scope.payMethCP+'</i></span></td></tr>',
				  '<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtcp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Tendered:</b></span></td><td><span><i>'+$("#tendamtcp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtcp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$("#changeamtcp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.currUser.firstname+'--'+$scope.currUser.lastname+'</i></span></td></tr>',
				  '<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.currStation.stnname+'</i></span></td></tr>',
				  '</table>',
				  '</body>',
			      '<hr>'].join('\n');
				  
				// Only print receipt when not on EFT
				if (!$scope.isEFT) {
	                $http.post('http://localhost:3080/print', {spuRec:capRec}).success(function (resp) {  
	        	    });
	            }

			}
			} else if (recType == 'otherPayments') {

				if ($scope.choseCheque) {
					$scope.chequeTot = $scope.recamtOP;
				}

				if ($scope.isEFT){
					$scope.currStation.stnname = $scope.stationEft.stnName;
					$scope.currStation.stnnum = $scope.stationEft.stnId;
					$scope.stationCode = $scope.stationEft.stnBatchCode;
					$scope.payMethOP = "eft";
				}

				$scope.paymentMethod = $scope.payMethOP;
				$scope.change = $scope.changeamtOP;
				$scope.CUSTOMERname = $scope.custNameOther;
				
				if ($scope.isMultiPay) {			
					var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoOP, bankCode: $scope.bankCodeOP, drawerName: $scope.drawerNameOP};

					if ($scope.payMethOP == "Cash" || $scope.payMethOP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum,recDate: $scope.recDate, recType:recType, custName: $scope.custNameOther, glCode: $scope.glCodeOP, 
							custAddr: $scope.custAddr1Other, custCity: $scope.custAddr2Other,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtOP), amttendered: Number($scope.tendamtOP), change: Number($scope.changeamtOP),payMeth:$scope.payMethOP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum,recDate: $scope.recDate, recType:recType, custName: $scope.custNameOther,glCode: $scope.glCodeOP, 
							custAddr: $scope.custAddr1Other, custCity: $scope.custAddr2Other,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtOP), amttendered: Number($scope.tendamtOP), change: Number($scope.changeamtOP),payMeth:$scope.payMethOP, cheQue: newCheque};
					}
				} else if (!$scope.isMultiPay) {
					var newCheque = {batchId:$scope.currUserBatch,chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoOP, bankCode: $scope.bankCodeOP, drawerName: $scope.drawerNameOP};

					if ($scope.payMethOP == "Cash" || $scope.payMethOP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum,recDate: $scope.recDate, recType:recType, custName: $scope.custNameOther, glCode: $scope.glCodeOP, 
							custAddr: $scope.custAddr1Other, custCity: $scope.custAddr2Other,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtOP), amttendered: Number($scope.tendamtOP), change: Number($scope.changeamtOP),payMeth:$scope.payMethOP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum,recDate: $scope.recDate, recType:recType, custName: $scope.custNameOther,glCode: $scope.glCodeOP, 
							custAddr: $scope.custAddr1Other, custCity: $scope.custAddr2Other,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtOP), amttendered: Number($scope.tendamtOP), change: Number($scope.changeamtOP),payMeth:$scope.payMethOP, cheQue: newCheque};
					}
				}

	                //Check if Receipt is Valid
	                if ((($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque") || ($scope.paymentMethod == "Cheque"))&&($scope.change >= 0)&&($scope.CUSTOMERname != null)) {
				//PRINT OTHER PAYMENTS RECEIPT
				opRec = [
				  	'<body>',
	                '<table>',
	                '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
	                '<tr><td colspan=2><center><b>Payment Receipt</b></center></td></tr>',
				  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.RecNo+'</i></span></td></tr>',
				  	'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.newBatchNum+'</i></span></td></tr>',
				  	'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.newTransNo+'</i></span></td></tr>',
				  	'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.recDate+'</i></span></td></tr>',
				  	'<tr><td><span><b>Customer :</b></span></td><td><span><i>'+$scope.custNameOther+'</i></span></td></tr></table>',
				  	'<table><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span><b>OTHER</b></span></td><td><span><i>'+$("#recamtop").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Method:</b></span></td><td><span><i>'+$scope.payMethOP+'</i></span></td></tr>',
				  	'<tr><td><span><b>Tendered:</b></span></td><td><span><i>'+$("#tendamtop").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtop").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$("#changeamtop").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.currUser.firstname+'--'+$scope.currUser.lastname+'</i></span></td></tr>',
				  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.currStation.stnname+'</i></span></td></tr>',
				  	'</table>',
				  	'</body>',
				    '<hr>'].join('\n');

				// Only print receipt when not on EFT  	
				if (!$scope.isEFT) {
	                $http.post('http://localhost:3080/print', {spuRec:opRec}).success(function (resp) {  
	                });
	            }
			}
			} else if (recType == 'visits') {

				if ($scope.choseCheque) {
					$scope.chequeTot = $scope.recamtVT;
				}

				if ($scope.isEFT){
					$scope.currStation.stnname = $scope.stationEft.stnName;
					$scope.currStation.stnnum = $scope.stationEft.stnId;
					$scope.stationCode = $scope.stationEft.stnBatchCode;
					$scope.payMethVT = "eft";
				}

				$scope.paymentMethod = $scope.payMethVT;
				$scope.change = $scope.changeamtVT;
				$scope.CUSTOMERname = $scope.custNameVT;
				
				if ($scope.isMultiPay) {
					var glCode = "HF008888089";
					var newCheque = {chequeTot:$scope.chequeTot, chequeNospu: $scope.chequeNoVT, bankCode: $scope.bankCodeVT, drawerName: $scope.drawerNameVT};
					
					if ($scope.payMethVT == "Cash" || $scope.payMethVT == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate,recType:recType, custName:$scope.custNameVT,glCode: glCode, 
							custAddr: $scope.custAddr1VT, custCity: $scope.custAddr2VT,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtVT),amttendered: Number($scope.tendamtVT), change: Number($scope.changeamtVT),payMeth:$scope.payMethVT};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate,recType:recType, custName:$scope.custNameVT,glCode: glCode, 
							custAddr: $scope.custAddr1VT, custCity: $scope.custAddr2VT,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtVT),amttendered: Number($scope.tendamtVT), change: Number($scope.changeamtVT),payMeth:$scope.payMethVT,cheQue: newCheque};
					}
				} else if (!$scope.isMultiPay) {
					var glCode = "HF008888089";
					var newCheque = {chequeTot:$scope.chequeTot, chequeNospu: $scope.chequeNoVT, bankCode: $scope.bankCodeVT, drawerName: $scope.drawerNameVT};
					
					if ($scope.payMethVT == "Cash" || $scope.payMethVT == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate,recType:recType, custName:$scope.custNameVT,glCode: glCode, 
							custAddr: $scope.custAddr1VT, custCity: $scope.custAddr2VT,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtVT),amttendered: Number($scope.tendamtVT), change: Number($scope.changeamtVT),payMeth:$scope.payMethVT};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate,recType:recType, custName:$scope.custNameVT,glCode: glCode, 
							custAddr: $scope.custAddr1VT, custCity: $scope.custAddr2VT,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtVT),amttendered: Number($scope.tendamtVT), change: Number($scope.changeamtVT),payMeth:$scope.payMethVT,cheQue: newCheque};
					}
				}

	                //Check if Receipt is Valid
	                if ((($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque"))&&($scope.change >= 0)&&($scope.CUSTOMERname != null)) {
				//PRINT VISIT RECEIPT
				vtRec = [
				  	'<body>',
	                '<table>',
	                '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
	                '<tr><td colspan=2><center><b>Payment Receipt</b></center></td></tr>',
				  	'<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.RecNo+'</i></span></td></tr>',
				  	'<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.newBatchNum+'</i></span></td></tr>',
				  	'<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.newTransNo+'</i></span></td></tr>',
				  	'<tr><td><span><b>Date:</b></span></td><td><span><i>'+$scope.recDate+'</i></span></td></tr>',
				  	'<tr><td><span><b>Customer :</b></span></td><td><span><i>'+$scope.custNameVT+'</i></span></td></tr></table>',
				  	'<table><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span><b>VISIT FEE</b></span></td><td><span><i>'+$("#recamtvt").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Method:</b></span></td><td><span><i>'+$scope.payMethVT+'</i></span></td></tr>',
				  	'<tr><td><span><b>Tendered:</b></span></td><td><span><i>'+$("#tendamtvt").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtspu").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Change:</b></span></td><td><span><i>E '+$("#changeamtvt").text()+'</i></span></td></tr>',
				  	'<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.currUser.firstname+'--'+$scope.currUser.lastname+'</i></span></td></tr>',
				  	'<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.currStation.stnname+'</i></span></td></tr>',
				  	'</table>',
					'</body>',
				    '<hr>'].join('\n');
				// Only print receipt when not on EFT
				if (!$scope.isEFT) {
	                $http.post('http://localhost:3080/print', {spuRec:vtRec}).success(function (resp) {  
	                });
	            }
			}
			} else if (recType == 'deposits') {
				
				if ($scope.choseCheque) {
					$scope.chequeTot = $scope.recamtDP;
				}

				if ($scope.isEFT){
					$scope.currStation.stnname = $scope.stationEft.stnName;
					$scope.currStation.stnnum = $scope.stationEft.stnId;
					$scope.stationCode = $scope.stationEft.stnBatchCode;
					$scope.payMethDP = "eft";
				}

				$scope.paymentMethod = $scope.payMethDP;
				$scope.change = $scope.changeamtDP;
				$scope.CUSTOMERname = $scope.custNameDP;

				if ($scope.isMultiPay) {
					var glCode = "HF008888012";
					var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoDP, bankCode: $scope.bankCodeDP, drawerName: $scope.drawerNameDP};

					if ($scope.payMethDP == "Cash" || $scope.payMethDP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountDP,recType:recType, glCode: glCode, custName:$scope.custNameDP, 
							custAddr: $scope.custAddrDP, custCity: $scope.custCityDP,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtDP), amttendered: Number($scope.tendamtDP), change: Number($scope.changeamtDP),payMeth:$scope.payMethDP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,mPayID:$scope.mpayid,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountDP,recType:recType, glCode: glCode, custName: $scope.custNameDP, 
							custAddr: $scope.custAddrDP, custCity: $scope.custCityDP,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtDP), amttendered: Number($scope.tendamtDP), change: Number($scope.changeamtDP),payMeth:$scope.payMethDP,cheQue: newCheque};
					}
				} else if (!$scope.isMultiPay) {
					var glCode = "HF008888012";
					var newCheque = {chequeTot:$scope.chequeTot, chequeNo: $scope.chequeNoDP, bankCode: $scope.bankCodeDP, drawerName: $scope.drawerNameDP};

					if ($scope.payMethDP == "Cash" || $scope.payMethDP == "eft") {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountDP,recType:recType, glCode: glCode, custName:$scope.custNameDP, 
							custAddr: $scope.custAddrDP, custCity: $scope.custCityDP,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtDP), amttendered: Number($scope.tendamtDP), change: Number($scope.changeamtDP),payMeth:$scope.payMethDP};
					}else {
						var newRec = {cashierUname: $scope.currUser.username,batchId:$scope.currUserBatch,mPay:$scope.isMultiPay,mPayPos:$scope.mPayPos,recNum: $scope.RecNo, transNo: $scope.newTransNo, recBatch:$scope.newBatchNum, recDate: $scope.recDate, account: $scope.accountDP,recType:recType, glCode: glCode, custName: $scope.custNameDP, 
							custAddr: $scope.custAddrDP, custCity: $scope.custCityDP,cashier: cashier, stnName:$scope.currStation.stnname, stnNum:$scope.currStation.stnnum, amtdue: Number($scope.recamtDP), amttendered: Number($scope.tendamtDP), change: Number($scope.changeamtDP),payMeth:$scope.payMethDP,cheQue: newCheque};
					}
				}

	                //Check if Receipt is Valid
	                if ((($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque") || ($scope.paymentMethod == "eft"))&&($scope.change >= 0)&&($scope.CUSTOMERname != null)) {
				//PRINT DEPOSIT RECEIPT
				depRec = [
				  '<body>',
	              '<table>',
	              '<tr><td colspan=2><center><u><b>Swaziland Electricity Company</b></u></center></td></tr>',
	              '<tr><td colspan=2><center><b>Payment Receipt</b></center></td></tr>',
				  '<tr><td><span><b>Receipt No:</b></span></td><td><span><i>'+$scope.RecNo+'</i></span></td></tr>',
				  '<tr><td><span><b>Batch No:</b></span></td><td><span><i>'+$scope.newBatchNum+'</i></span></td></tr>',
				  '<tr><td><span><b>Transaction No:</b></span></td><td><span><i>'+$scope.newTransNo+'</i></span></td></tr>',
				  '<tr><td><span><b>Date:</b></span></td><td><span><i>'+$("#spuDate").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Account #:</b></span></td><td><span><i>'+$scope.accountDP+'</i></span></td></tr>',
				  '<tr><td><span>'+$scope.custNameDP+'</span><br><span>'+$scope.custAddrDP+'</span><br><span>'+$scope.custCityDP+'</span></td><td>&nbsp;</td></tr></table>',
				  '<table><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span><b>DEPOSIT</b></span></td><td><span><i>'+$("#recamtdp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Method:</b></span></td><td><span><i>'+$scope.payMethDP+'</i></span></td></tr>',
				  '<tr><td><span><b>Tendered:</b></span></td><td><span><i>'+$("#tendamtdp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Amount:</b></span></td><td><span><i>'+$("#recamtdp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Change:</b></span></td><td><span><i>'+$("#changeamtdp").text()+'</i></span></td></tr>',
				  '<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+$scope.currUser.firstname+'--'+$scope.currUser.lastname+'</i></span></td></tr>',
				  '<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.currStation.stnname+'</i></span></td></tr>',
				  '</table>',
				  '</body>',
				  '<hr>'].join('\n');
				// Only print receipt when not on EFT  
				if (!$scope.isEFT) {
	                $http.post('http://localhost:3080/print', {spuRec:depRec}).success(function (resp) {  
	                });
	            }
			}
			}

			$scope.recInserted = false;
			// check if payment method was selected
			if (($scope.paymentMethod == "Cash") || ($scope.paymentMethod == "Cheque") || ($scope.paymentMethod == "eft")) {
				// check if tendered amount is not less than actual amount
				if ($scope.change >= 0) {
					// check if customer is known by the system
					if ($scope.CUSTOMERname != null) {
						$scope.payMethodIsNotSet = false;
						$scope.changeIsNotValid = false;
						$scope.nameIsEmpty = false;

						// add new receipt
						// increment auto incremental values
						// get new receipt and transaction no values
						// deduct from aging
						// clear previous entered values
						$http.post('/addNewReceipt', newRec ).success(function (resp) {
							$scope.recInserted = true;
							$scope.recInsertedMsg = resp;
							$scope.insertReceiptMessageFunction(recType);

							if (recType == "spu") {
								$scope.updateAutoIncVals($scope.currStation.stnnum, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
								$scope.generateRecNo($scope.currStation);
								$scope.updateAging();
								$scope.clearInsertSpuRec();
							}
							else if(recType == "capital"){
								$scope.updateAutoIncVals($scope.currStation.stnnum, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
								$scope.generateRecNo($scope.currStation);
								$scope.updateQuotation();
								$scope.clearInsertCapitalRec();
							}
							else if(recType == "otherPayments"){
								$scope.updateAutoIncVals($scope.currStation.stnnum, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
								$scope.generateRecNo($scope.currStation);
								$scope.clearInsertOtherPRec();
							}
							else if(recType == "visits"){
								$scope.updateAutoIncVals($scope.currStation.stnnum, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
								$scope.generateRecNo($scope.currStation);
								$scope.clearInsertVisitsRec();
							}
							else if(recType == "deposits"){
								$scope.updateAutoIncVals($scope.currStation.stnnum, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
								$scope.generateRecNo($scope.currStation);
								$scope.clearInsertDepositsRec();
							}
						}).error(function () {
							console.log("An error occured");
						});
					} else {
						$scope.nameIsEmpty = true;
						$scope.nameErrorMsg = "Customer details NOT Valid";
						$scope.insertReceiptMessageFunction(recType);
					}
				} else {
					$scope.changeIsNotValid = true;
					$scope.changeErrorMsg = "Tendered Amount should be more than Due Amount";
					$scope.insertReceiptMessageFunction(recType);
				}
			} else {
				$scope.payMethodIsNotSet = true;
				$scope.payMethodErrorMsg = "Select Payment Method";
				$scope.insertReceiptMessageFunction(recType);
			}

		if ($scope.newGLBox){
			$scope.insertGlCode();
		} // end insert gl code function
	}// end insert add receipt function

	// create error messages
	$scope.messageExists = false;
	$scope.insertReceiptMessageFunction = function (type){
		if (($scope.recInserted)||($scope.nameIsEmpty)||($scope.changeIsNotValid)||($scope.payMethodIsNotSet) || $scope.stnIsNotSet) {
			switch (type){
				case "spu" : $scope.messageExistsSpu = true;break;
				case "capital" : $scope.messageExistsCP = true;break;
				case "visits" : $scope.messageExistsVT = true;break;
				case "deposits" : $scope.messageExistsDP = true;break;
				case "otherPayments" : $scope.messageExistsOP = true;break;
			};

		};
	}

		//reset messages div
		$scope.resetMessagesDiv = function (){
			if (($scope.payMethSPU!='--Select--')||($scope.payMethCP!='--Select--')||($scope.payMethVT!='--Select--')||($scope.payMethDP!='--Select--')||($scope.payMethOP!='--Select--')) {
				$scope.payMethodIsNotSet = false;
			}	
			$scope.messageExistsSpu = false;
			$scope.messageExistsCP = false;
			$scope.messageExistsVT = false;
			$scope.messageExistsDP = false;
			$scope.messageExistsOP = false;
		}

		// *** Insert quatation ***
		$scope.insertQuote = function () {
			var type = {name:"CAPITAL ACCOUNT", gl:"GL999999999"};
			var newQuote = {recNum: $scope.recno, recType: type, recBatch:$scope.recBatch, group: {grpRef: $scope.quoteRef, description: $scope.quotes.groupName}, 
				user: {name:$scope.cashierName, surname: $scope.cashierSurname}, station:$scope.st, amtdue: $scope.recamt , transNo: $scope.transno};

			$http.post('/addNewQuote', newQuote ).success(function (resp) {
				$scope.clearInsertQuote();
				
			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.clearInsertSpuRec = function () {
			$scope.accountSPU = '';
			$scope.recamtSPU = '';
			
			if (!($scope.isMultiPay)) {
				$scope.tendamtSPU = '';
				$scope.payMethSPU = '--Select--';
			}
			$scope.custCurrBSPU = '';
			$scope.changeamtSPU = '';
			$scope.custNameSPU = '';
			$scope.custAddrSPU = '';
			$scope.custCitySPU = '';
			$scope.custAccSPU = '';
		}


		$scope.clearInsertVisitsRec = function () {
			$scope.custNameVT = '';
			$scope.recamtVT = '';
			$scope.custAddr1VT = '';
			$scope.custAddr2VT = '';


			//soft reset if multipay
			if (!($scope.isMultiPay)) {
				$scope.tendamtVT = '';
				$scope.payMethVT = '--Select--';
			}
			$scope.changeamtVT = '';
			}

		$scope.clearInsertDepositsRec = function () {
			$scope.accountDP = '';
			$scope.recamtDP = '';
	                
			//soft reset if multipay
	                if (!($scope.isMultiPay)) {
	                        $scope.tendamtDP = '';
	                        $scope.payMethDP = '--Select--';
	                }
			$scope.changeamtDP = '';
			$scope.custNameDP = '';
			$scope.custAddrDP = '';
			$scope.custCityDP = '';
		}

		$scope.clearInsertOtherPRec = function () {
			$scope.custNameOther = '';
			$scope.glCodeOP = '';
			$scope.glCodeDesc = '';
			$scope.recamtOP = '';
			$scope.custAddr1Other = '';
			$scope.custAddr2Other = '';

			//set soft reset if multipay
			if (!($scope.isMultiPay)) {
				$scope.tendamtOP = '';
				$scope.payMethOP = '--Select--';
			}

			$scope.recType = '';
			$scope.changeamtOP = '';
		}

		$scope.clearInsertCapitalRec = function () {
			$scope.quoteRef = '';
			$scope.recamtCP = '';

			//set soft reset if multipay
			if (!($scope.isMultiPay)) {
				$scope.tendamtCP = '';
				$scope.payMethCP = '--Select--';
			}
			$scope.changeamtCP = '';
			$scope.quotes.balance = '';
			$scope.quotes.groupName = '';
		}

		$scope.clearInsertQuote = function () {
			$scope.recno = '';
			$scope.recBatch = '';
			$scope.quoteRef = '';
			$scope.quotes.groupName = '';
			$scope.cashierName = '';
			$scope.cashierSurname = '';
			$scope.transno = '';
		}

		$scope.calcChange = function(type,tendamt, recamt){
			switch (type) {
				case "spu" :
		    		$scope.changeamtSPU = Number(tendamt) - Number(recamt);
				    if ($scope.isMultiPay) {
				    	if (($scope.changeamtSPU > 0) && (($scope.balance == $scope.cashTot)||($scope.balance == $scope.chequeTot))) {
				    		$scope.mPayPos = "B";
				    	} else if ($scope.changeamtSPU > 0) {
							$scope.mPayPos = "M";
						} else if ($scope.changeamtSPU == 0) {
							$scope.mPayPos = "E";
						}
					} else {
						$scope.mPayPos = " ";
					}
		    		break;
		    	case "capital" :

		    		// Check if capital fee was clicked and the field is not empty
		    		// check if its been modified or not,
		    		// if not modified, add capital fee to total amount, else recreate total amount
		    		// The first time you select capital, $scope.first will not hv been initialized
		    		// Anytime its modified, $scope.first will hv been initialized, hence the recreation
		    		if ($scope.isCapFee && ($scope.recamtCPTF != null)) {

		    			if ($scope.first) {
		    				$scope.totalAmnt = Number($scope.recamtCPTF);
		    				if ($scope.recamtCPAF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPAF);
		    				}
		    				if ($scope.recamtCPCF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPCF);
		    				}
		    				if ($scope.recamtCPSF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPSF)
		    				}
		    			} else {
		    				$scope.totalAmnt += Number($scope.recamtCPTF);
		    			}
		    			
		    			$scope.first = true;
		    			$scope.isCapFee = false;
		    		} 

		    		if ($scope.isAdminFee && ($scope.recamtCPAF != null)) {
		    			
		    			if ($scope.second) {
		    				$scope.totalAmnt = Number($scope.recamtCPAF);
		    				if ($scope.recamtCPTF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPTF);
		    				}
		    				if ($scope.recamtCPCF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPCF);
		    				}
		    				if ($scope.recamtCPSF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPSF)
		    				}

		    			} else {
		    				if ($scope.first) {
		    					$scope.totalAmnt += Number($scope.recamtCPAF);
		    				} else {
		    					$scope.totalAmnt += Number($scope.recamtCP) + Number($scope.recamtCPCF);
		    				}
		    			}
		    			
		    			$scope.second = true;
		    			$scope.isAdminFee = false;
		    			
		    		} 
		    		if ($scope.isConnFee && ($scope.recamtCPCF != null)) {
		    			
		    			if ($scope.third) {
		    				$scope.totalAmnt = Number($scope.recamtCPCF);
		    				if ($scope.recamtCPTF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPTF);
		    				}
		    				if ($scope.recamtCPAF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPAF);
		    				}
		    				if ($scope.recamtCPSF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPSF)
		    				}
		    			} else {
		    				if ($scope.first || $scope.second) {
		    					$scope.totalAmnt += Number($scope.recamtCPCF);
			    			} else {
			    				$scope.totalAmnt += (Number($scope.recamtCP) + Number($scope.recamtCPCF));
			    			}
		    			}

		    			$scope.third = true;
		    			$scope.isConnFee = false;

		    		}
		    		if ($scope.isSecFee && ($scope.recamtCPSF != null)) {

		    			if ($scope.fourth) { 
		    				$scope.totalAmnt = Number($scope.recamtCPSF);
		    				if ($scope.recamtCPTF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPTF);
		    				}
		    				if ($scope.recamtCPAF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPAF);
		    				}
		    				if ($scope.recamtCPCF != null){
		    					$scope.totalAmnt += Number($scope.recamtCPCF)
		    				}
		    			} else {
		    				if ($scope.first || $scope.second || $scope.third) {
								$scope.totalAmnt += Number($scope.recamtCPSF);
			    			} else {
			    				$scope.totalAmnt += (Number($scope.recamtCP) + Number($scope.recamtCPCF));
			    			}
		    			}

		    			$scope.fourth = true;
		    			$scope.isSecFee = false;

		    		}

		    		$scope.recamtCP = $scope.totalAmnt;
		    		$scope.changeamtCP = Number(tendamt) - Number($scope.totalAmnt);
		    	
				    if ($scope.isMultiPay) {
					    if (($scope.changeamtCP > 0) && (($scope.balance == $scope.cashTot)||($scope.balance == $scope.chequeTot))) {
					    		$scope.mPayPos = "B";
					    } else if ($scope.changeamtCP > 0) {
								$scope.mPayPos = "M";
							} else {
								$scope.mPayPos = "E";
							}
					} else {
						$scope.mPayPos = " ";
					}
		    		break;
		    	case "otherPayments" :
		    		$scope.changeamtOP = Number(tendamt) - Number(recamt);
		    		  if ($scope.isMultiPay) {
					    if (($scope.changeamtOP > 0) && (($scope.balance == $scope.cashTot)||($scope.balance == $scope.chequeTot))) {
					    		$scope.mPayPos = "B";
					    } else if ($scope.changeamtOP > 0) {
								$scope.mPayPos = "M";
							} else {
								$scope.mPayPos = "E";
							}
					} else {
						$scope.mPayPos = " ";
					}
		    		break;
		    	case "deposits" :
		    		$scope.changeamtDP = Number(tendamt) - Number(recamt);
		    		  if ($scope.isMultiPay) {
					    if (($scope.changeamtDP > 0) && (($scope.balance == $scope.cashTot)||($scope.balance == $scope.chequeTot))) {
					    		$scope.mPayPos = "B";
					    } else if ($scope.changeamtDP > 0) {
								$scope.mPayPos = "M";
							} else {
								$scope.mPayPos = "E";
							}
					} else {
						$scope.mPayPos = " ";
					}
		    		break;
		    	case "visits" :
		    		$scope.changeamtVT = Number(tendamt) - Number(recamt);
				    if ($scope.isMultiPay) {
					    if (($scope.changeamtVT > 0) && (($scope.balance == $scope.cashTot)||($scope.balance == $scope.chequeTot))) {
					    		$scope.mPayPos = "B";
					    } else if ($scope.changeamtVT > 0) {
								$scope.mPayPos = "M";
							} else {
								$scope.mPayPos = "E";
							}
					} else {
						$scope.mPayPos = " ";
					}
		    		break;
			}
			
		}

	 	$scope.getCancelRec = function (recId) {
			var idD = recId;			
			$http.post('/getReceipt/' + idD).success(function(data) {
				
			    $scope.receiptNo = '';
			    var type = data.recType;
			    if (type == "spu") {
				$scope.account = data.account;
				$scope.cust = data.custName;
			    } else if (type == "capital") {
				$scope.account = data.quoteRef;
				$scope.cust = data.custName;
			    } else if (type == "deposits") {
				$scope.account = data.account;
				$scope.cust = data.customer;
			    } else {
				$scope.cust = data.custName;
			    }	
			    $scope.recNum = data.recNum;
			    $scope.cashier = data.cashier;
			    $scope.station = data.stnName;
			    $scope.amtdue = data.amtdue;
			    $scope.hasinfo = true;
			});
		}

		$scope.clearCancelRec = function () {
		    $scope.hasinfo = false;
			$scope.id = '';
			$scope.user = '';
			$scope.cust = '';
			$scope.station = '';
			$scope.amtdue = '';
			$scope.receiptNoC = '';
		}

		$scope.cancelCancelRec = function () {
		    $scope.hasinfo = false;
			$scope.clearCancelRec();
		}

		$scope.cancelReceipt = function (recId) {
			var idD = recId;

			$http.post('/cancelRec/' + idD).success (function (resp) {
				$scope.clearCancelRec();

				// log event
				var log = {action:"cancelReceipt", canceledReceipt:recId, actionBy:$scope.currUser.username, station:$scope.currStation.stnId, time:Date().toString()};
	            recSwitch.insertLog(log).success(function () {
	            });
			})
		}

	    //MultiPay Operations

		$scope.id='';
		$scope.isMultiPay = false;
		$scope.payMeth = "--Select--";
		//$scope.payMethSPU = 'Cash';
		$scope.bankCode = '';
		$scope.drawerName = '';
		//$scope.payMethSPU = ["--Select--", "Cash", "Cheque"]; ?????
		
		$scope.closeMultiPay = function() {
			$scope.isMultiPay = false;
		}

		$scope.testCash = function (payMeth) {
			//var test = payMeth;
			if ($scope.payMeth == 'Cash') {
				return true;
			}
		}

		$scope.testCheque = function (payMeth) {
			//var test = payMeth;
			if ($scope.payMeth == 'Cheque') {
				return true;
			}
		}

		$scope.cancelMultiPayProcess = function (){
			$scope.id='';
			$scope.payMeth = '--Select--';
			$scope.chequeNo = '';
			$scope.bankCode = '';
			$scope.drawerName = '';
			$scope.balance = '';
			$scope.cashTot = '';
			$scope.chequeTot = '';
		}

		$scope.acceptMultiPay = function (){
			$scope.getAutInVals($scope.currStation.stnId);
			$scope.mpayid = $scope.mpayid + 1;
			$scope.updateAutoIncVals($scope.stationCode, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);
			$scope.isMultiPay = true;

			$scope.bankCodeSPU=$scope.bankCode;
			$scope.bankCodeCP=$scope.bankCode;		
			$scope.bankCodeDP=$scope.bankCode;
			$scope.bankCodeVT=$scope.bankCode;
			$scope.bankCodeOP=$scope.bankCode;

			$scope.chequeNoSPU=$scope.chequeNo;
			$scope.chequeNoCP=$scope.chequeNo;
			$scope.chequeNoDP=$scope.chequeNo;
			$scope.chequeNoVT=$scope.chequeNo;
			$scope.chequeNoOP=$scope.chequeNo;
			
			$scope.drawerNameSPU=$scope.drawerName;
			$scope.drawerNameCP=$scope.drawerName;
			$scope.drawerNameDP=$scope.drawerName;
			$scope.drawerNameVT=$scope.drawerName;
			$scope.drawerNameOP=$scope.drawerName;

			if ($scope.payMeth == 'Cash') {
				//set Pay Method
				$scope.payMethSPU = 'Cash';
				$scope.payMethCP = 'Cash';
				$scope.payMethDP = 'Cash';
				$scope.payMethVT = 'Cash';
				$scope.payMethOP = 'Cash';
				$scope.balance = $scope.cashTot;
				//set tendered Amount
				$scope.tendamtSPU = $scope.balance;
				$scope.tendamtCP = $scope.balance;
				$scope.tendamtDP = $scope.balance;
				$scope.tendamtVT = $scope.balance;
				$scope.tendamtOP = $scope.balance;

			}else if ($scope.payMeth == 'Cheque'){
				//set Pay Method
				$scope.balance = $scope.chequeTot;
				$scope.payMethSPU = 'Cheque';
				$scope.payMethCP = 'Cheque';
				$scope.payMethDP = 'Cheque';
				$scope.payMethVT = 'Cheque';
				$scope.payMethOP = 'Cheque';
				//set tendered Amount
				$scope.tendamtSPU = $scope.balance;
				$scope.tendamtCP = $scope.balance;
				$scope.tendamtDP = $scope.balance;
				$scope.tendamtVT = $scope.balance;
				$scope.tendamtOP = $scope.balance;
			}

		}

		$scope.terminateMultiPay = function () {
			$scope.removeReceipts($scope.mpayid);
			$scope.mpayid = $scope.mpayid - 1;
			$scope.updateAutoIncVals($scope.stationCode, $scope.newRecNo, $scope.newTransNo, $scope.mpayid);		
			$scope.isMultiPay = false;
		}

		$scope.removeReceipts = function (mpayid) {
			var id = mpayid;
			$scope.mPayID = Number(id);
			$http.delete('/deleteMPay/' + id).success(function(resp) {
			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.softRemoveReceipts = function (mpayid) {

			var id = mpayid;
			$scope.mPayID = Number(id);
			$http.post('/softDeleteMPay/' + id).success(function(resp) {
				
				// log event
				var log = {action:"sodftDeleteMpay", deletedMpay:mpayid, actionBy:$scope.currUser.username, station:$scope.currStation.stnId, time:Date().toString()};
	            recSwitch.insertLog(log).success(function () {
	            });

			}).error(function () {
				console.log("An error occured");
			});

			//clear things here
		}

		$scope.showMultiPays = function(){
		    $http.post('/showAllMultiPays').success(function (data) {
		        $scope.multiPay = data;
		        mPayData = '';
		        data.forEach(function(mPay){
		            mPayData += '<tr><td>'+mPay.mPayID+'</td><td>'+mPay.recNum+'</td><td>'+mPay.recBatch+'</td><td><a data-dismiss="modal" data-toggle="modal" ng-click="softRemoveReceipts(\''+mPay.mPayID+'\')"><button>Cancel</button></a></td></tr>';
		        });
		        $('#showMultiPayRecsTblData').html('');
		        var $mPayData1 = $(mPayData).appendTo('#showMultiPayRecsTblData');
		        $compile($mPayData1)($scope);
		        $('.mpaytable').dataTable();	            
		    }).error(function (){
		        console.log("An error occured");
		    });
		}

		$scope.initMultiPay = function () {
			$scope.id='';
			$scope.payMeth = '--Select--';
			$scope.chequeNo = '';
			$scope.bankCode = '';
			$scope.drawerName = '';
			$scope.balance = '';
			$scope.cashTot = '';
			$scope.chequeTot = '';
		}

		$scope.mPayCheck = function () {
			if ($scope.isMultiPay) {
				return true;
			}
		}

		$scope.mPayChange = function(){
		    	$scope.changeamt = Number($scope.balance) - Number($scope.recamt);
		    	$scope.balance = $scope.changeamt;
		}


		$scope.multiPayDecreament = function(chng){
			if (chng>=0){
				if ($scope.isMultiPay) {
					var change = chng;
					$scope.balance = change;
		
					//set Change as New Tendered Amount
					$scope.tendamtSPU = change.toFixed(2);
					$scope.tendamtCP = change.toFixed(2);
					$scope.tendamtDP = change.toFixed(2);
					$scope.tendamtVT = change.toFixed(2);
					$scope.tendamtOP = change.toFixed(2);

					if ($scope.balance>0.00){
						$scope.isMultiPay = true;
					} else if ($scope.balance <= 0.00) {
						$scope.isMultiPay = false;
						$scope.tendamtSPU = '';
						$scope.tendamtCP = '';
						$scope.tendamtDP = '';
						$scope.tendamtVT = '';
						$scope.tendamtOP = '';
					}
				}
			}
		}

		$scope.printBatchTotal = function(){
	      batchTotal = [
			  '<center><u><b>Swaziland Electricity Company</b></u></center>',
			  '<p></p><center><b>Batch Totals Report</b></center>',
			  '<p></p><p>',
			  '<center>',
			  '<table>',
			  '<tr><td><span><b>Batch Number:</b></span></td><td><span><i>H63</i></span></td></tr>',
			  '<tr><td><span><b>Date:</b></span></td><td><span><i>Tue Nov 11 2014 02:47:31</i></span></td></tr>',
			  '</table><p></p>',
			  '<table>',
			  '<tr><td><span><b>Cash Amount:</b></span></td><td><span><i>E 11,039</i></span></td></tr>',
			  '<tr><td><span><b>Cheque Amount:</b></span></td><td><span><i>E 0.00</i></span></td></tr>',
			  '<tr><td><span><b>Bankable Total:</b></span></td><td><span><i><u><b>E 11,039</b></u></i></span></td></tr>',
			  '<tr><td><span><b>Speed Point Amount:</b></span></td><td><span><i>E 0.00</i></span></td></tr>',
			  '<tr><td><span><b>Bank Transfers:</b></span></td><td><span><i>E 0.00</i></span></td></tr>',
			  '<tr><td><span><b>Non-Bankable Total:</b></span></td><td><span><i><u><b>E 0.00</b></u></i></span></td></tr>',
			  '<tr><td><span><b>Batch Total:</b></span></td><td><span><i><u><b>E 11,039</b></u></i></span></td></tr>',
			  '<tr><td><span><b>Cashier:</b></span></td><td><span><i>Alpha Dovoza</i></span></td></tr>',
			  '<tr><td><span><b>Station:</b></span></td><td><span><i>HQ</i></span></td></tr>',
			  '</table>',
			  '</center>'].join('\n');
		  
		  $http.post('http://localhost:3080/print', {spuRec:batchTotal}).success(function (resp) {
		  });
	    }

	}])// receipt Controller ends

	.controller('quotationCtrl', ['$scope','$http','$compile','recSwitch','manageData', function($scope, $http,$compile, recSwitch, manageData){

		// Get station and user information from service
		$scope.currStation = manageData.getCurrStation();
		$scope.currUser = manageData.getCurrLoginUser();

		$scope.showQuotes = function(){
			$http.post('/showAllQuotes').success(function (data) {

				quoteData = '';
				data.forEach(function(quotation){
					quoteData += '<tr><td>'+quotation.Oppo_Description+'</td><td>'+quotation.Quot_nettamt+'</td><td>'+quotation.quot_amountpermember+'</td><td>'+quotation.oppo_GroupCustName+'</td></tr>';
				});
				
				$('#showQuotesTblData').html('');
				var $quoteData1 = $(quoteData).appendTo('#showQuotesTblData');
				$compile($quoteData1)($scope);
				$('.quotetable').dataTable();
			});
	    }
	    
		$scope.addQuote = function(){
			$scope.quoteInserted = false;
			$scope.quoteInsertedMsg = '';
			$scope.hasAddQuoteError = false;
			$scope.addQuoteErrorMsgs = [];
			var addQuoteIdError = "Quote ID cannot be empty";
			var refIsNotNumError = "Quote Ref should be numeric";
			var addQuoteRefError = "Quote Ref cannot be empty";
			var addQuoteCreatedByError = "Quote Created By cannot be empty";
			var addQuoteGrpError = "Quote group name cannot be empty";
			var addQuoteDescError = "Quote decsription cannot be empty";
			
			if ($scope.qReference == null){;
				$scope.addQuoteErrorMsgs.push(addQuoteRefError);
				$scope.hasAddQuoteError = true;
			} else if ($scope.qCustGroupName == null){;
				$scope.addQuoteErrorMsgs.push(addQuoteGrpError);
				$scope.hasAddQuoteError = true;
			} else {
				// quotation object definition

				var ref = 'Quotation for '+$scope.qReference;
				var newquote = {Quot_Description:ref, oppo_groupcustname: $scope.qCustGroupName, Quot_CreatedDate :Date().toString(), Quot_CreatedBy:$scope.cashierUname};
				$http.post('/addNewQuote', newquote ).success(function (resp) {
					$scope.quoteInsertedMsg = resp;
					$scope.quoteInserted = true;
					$scope.clearNewQuote();

					// log event
					var log = {action:"addQuote", addedQuote:ref, actionBy:$scope.currUser.username, station:$scope.currStation.stnId, time:Date().toString()};
		            recSwitch.insertLog(log).success(function () {
		            });

				}).error(function () {
					console.log("An error occured");
				});
			}
		}

		$scope.clearNewQuote = function () {
			$scope.custNo = '';
			$scope.custName = '';
			$scope.custAddr1 = '';
			$scope.custAddr2 = '';
			$scope.custAddr2 = '';
			$scope.custRef = '';
		}

		$scope.getEditQuote = function (custno) {
			var id = custno;
			
			$http.post('/getQuote/' + id).success(function(data) {
				// initialise model with database customer values
		      	$scope.custNoU = data[0].CUSTNO;
		      	$scope.custNameU = data[0].CUSTNAME;
		      	$scope.custAddr1U = data[0].CUSTADDR1;
		      	$scope.custAddr2U= data[0].CUSTADDR2;
		      	$scope.custAddr3U = data[0].CUSTADDR3;
		      	$scope.custRefU = data[0].CUSTREF; //array of user
		    });// $http.get ends
		}

		$scope.updateQuote = function (custId) {
			var id = custId;
			if (id == undefined) {
				return;
			}
			// update quote object definition
			var updatequote = {custno: $scope.custNoU, custName:$scope.custNameU, custAddr1 : $scope.custAddr1U, custAddr2: $scope.custAddr2U, custAddr3: $scope.custAddr3U, custRef:$scope.custRefU};

			$http.post('/updateQuote/' + id, updatequote).success(function (resp) {
				$scope.clearEditQuote();
				// log event
				var log = {action:"addQuote", addedQuote:ref, actionBy:$scope.currUser.username, station:$scope.currStation.stnId, time:Date().toString()};
		        recSwitch.insertLog(log).success(function () {
		        });

			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.removeQuote = function (qref) {

			var id = uname;
			$http.delete('/deleteQuote/' + id).success(function(resp) {
				// log event
				var log = {action:"deleteQuote", deletedQuote:qref, actionBy:$scope.currUser.username, station:$scope.currStation.stnId, time:Date().toString()};
		        recSwitch.insertLog(log).success(function () {
		        });
			}).error(function () {
				console.log("An error occured");
			});
		}

		$scope.clearEditQuote = function () {
			$scope.custNoU = '';
		    $scope.custNameU = '';
		    $scope.custAddr1 = '';
		    scope.custAddr2 = '';
		    $scope.custAddr3 = '';
		    $scope.custRefU = ''; //array of user
		}
	}]) // quotation controler ends

	/*receipt.controller('multiPayCtrl', ['$scope','$http', 'recSwitch','recTypeService', function($scope, $http, recSwitch, recTypeService){

		
			
	}]);*/

	.controller('usersTblCtrl',['$scope','$http', function($scope, $http){

	}])

	.controller('stnTblCtrl',['$scope','$http', function($scope, $http){

	 }])

	.controller('repCtrl',['$scope','$http', '$q', 'manageData', 'getParams', function($scope, $http, $q, manageData, getParams){

	  $(".form_datetime").datetimepicker({format: 'yyyy-mm-dd', autoclose:true, todayBtn:true, weekStart: 1, todayHighlight: 1, startView: 2, minView: 2, forceParse: 0});

	  // GET STATION AND USER INFORMATION FROM SERVICE
	  $scope.currStation = manageData.getCurrStation();
	  $scope.currUser = manageData.getCurrLoginUser();

	  // INITIALIZE CASHIER AND STATION
	  $scope.cashier = $scope.currUser.firstname +' '+$scope.currUser.lastname;
	  if ($scope.currStation != null) {
	  	$scope.station = $scope.currStation.stnname;
	  }

	  // TODAY'S DATE 
	  var today = new Date();
	  var day = today.getDate();
	  var month = today.getMonth();
	  var year = today.getFullYear();

	  $scope.today = year+'/'+month+'/'+day;

	  $scope.getAllStns = function(){
	    var deferred = $q.defer();
	    $http.post('/showAllStations').success(function (resp) {
	      deferred.resolve(resp);
	    }).error(function (resp) {
	      deferred.reject(resp); 
	    });

	    return deferred.promise;
	  }

	  $scope.refreshStns = function(){
	    $scope.getAllStns()
	    .then(function(data){
	      $scope.myStns = data;
	    });
	  }

	  $scope.refreshStns();

	  //Batch Totals Report
	  $scope.getBatchTotals = function(batchNum){
	    manageData.getCurrBatch($scope.currStation.stnnum, $scope.currUser.username).
	    	then(function (data) {
	    		$scope.currBatch = data;
	    		queryObj = {batchId:$scope.currBatch.batchNo, myStn:$scope.currStation.stnnum, dateFrom:$scope.batchTotDateFrom, dateTo:$scope.batchTotDateTo, cashierUname: $scope.currUser.username}
			    //Get all container objects
			    $http.post('/getBatchReceipts', queryObj).success(function(resp){
			      $scope.batchTotAmt = 0;
			      $scope.batchCashAmt = 0;
			      $scope.batchChequeAmt = 0;
			      $scope.batchSpeedPtAmt = 0;
			      $scope.batchBankTrans = 0;
			      $scope.batchNumRecs = resp.length;

			      resp.forEach(function(rec){
			        $scope.batchTotAmt += rec.amtdue;

			        if (rec.payMeth == "Cash") {
			          $scope.batchCashAmt += rec.amtdue;
			        }else if (rec.payMeth == "Cheque") {
			          $scope.batchChequeAmt += rec.amtdue;
			        }else if (rec.payMeth == "eft") {
			          $scope.batchBankTrans += rec.amtdue;
			        };
			      });

			    });
	    	});
	  }

	  $scope.printBatchTotal = function(){

	        batchTotal = [
	        '<center><u><b>Swaziland Electricity Company</b></u></center>',
	        '<p></p><center><b>Batch Totals Report</b></center>',
	        '<p></p><p>',
	        '<center>',
	        '<table>',
	        '<tr><td><span><b>Batch Number:</b></span></td><td><span><i>H63</i></span></td></tr>',
	        '<tr><td><span><b>Date:</b></span></td><td><span><i>Tue Nov 11 2014 02:47:31</i></span></td></tr>',
	        '</table><p></p>',
	        '<table>',
	        '<tr><td><span><b>Cash Amount:</b></span></td><td><span><i> E'+$scope.batchCashAmt.toFixed(2)+'</i></span></td></tr>',
	        '<tr><td><span><b>Cheque Amount:</b></span></td><td><span><i>E'+$scope.batchChequeAmt.toFixed(2)+'</i></span></td></tr>',
	        '<tr><td><span><b>Bankable Total:</b></span></td><td><span><i><u><b>E'+($scope.batchCashAmt+$scope.batchChequeAmt).toFixed(2)+'</b></u></i></span></td></tr>',
	        '<tr><td><span><b>Speed Point Amount:</b></span></td><td><span><i>E'+$scope.batchSpeedPtAmt.toFixed(2)+'</i></span></td></tr>',
	        '<tr><td><span><b>Bank Transfers:</b></span></td><td><span><i>E'+$scope.batchBankTrans.toFixed(2)+'</i></span></td></tr>',
	        '<tr><td><span><b>Non-Bankable Total:</b></span></td><td><span><i><u><b>E'+($scope.batchSpeedPtAmt+$scope.batchBankTrans).toFixed(2)+'</b></u></i></span></td></tr>',
	        '<tr><td><span><b>Batch Total:</b></span></td><td><span><i><u><b>E'+$scope.batchTotAmt.toFixed(2)+'</b></u></i></span></td></tr>',
	        '<tr><td><span><b>Cashier:</b></span></td><td><span><i>'+manageData.getUserCurrBatch()+'</i></span></td></tr>',
	        '<tr><td><span><b>Station:</b></span></td><td><span><i>'+$scope.batchTotStn+'</i></span></td></tr>',
	        '</table>',
	        '</center>'].join('\n');
	      
	      	$http.post('http://localhost:3080/print', {spuRec:batchTotal}).success(function (resp) {
	      	});
	    }

	}]); // report controler ends

// *********************************************** CONTROLLERS END *************************************
