//Connect to db
console.log("Connecting to DB.");
var databaseUrl = "receipting";
var collections = ["users", "banks", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog", "usersAssigned"];
var db = require("mongojs").connect(databaseUrl, collections);

console.log("Starting...");
//define functions
function genZero(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = "0"+myfield;
        }
    } else {
    myfield = myfield.substring(0, alocSpace);
    }

    return myfield;
}

//define variables
var currDate = new Date();
var todayDate= new Date(currDate.getFullYear()+"-"+genZero((currDate.getMonth()+1),2)+"-"+genZero(currDate.getDate(),2)+" 00:00");

//check valid assignments
//1)Go through usersAssigned collection, Check for status pending
db.usersAssigned.find({assignStatus:"pending"}).sort({_id:1}, function (error,data){
    cursor = data;
    var cursorLength = cursor.length;
    console.log("Total "+cursorLength);
    for (var i=0; i <= cursorLength-1; i++){
        assignedUser = cursor[i];
        var aSDate = new Date(assignedUser.startDate);
        var aEDate = new Date(assignedUser.endDate);
        var theStartDate = new Date(aSDate.getFullYear()+"-"+genZero((aSDate.getMonth()+1),2)+"-"+genZero(aSDate.getDate(),2)+" 00:00");
        var theEndDate = new Date(aEDate.getFullYear()+"-"+genZero((aEDate.getMonth()+1),2)+"-"+genZero(aEDate.getDate(),2)+" 23:59");

        console.log("The Start Date: "+theStartDate);
        console.log("The End Date: "+theEndDate);
        console.log("The Current Date: "+todayDate);
        if ((theStartDate<=todayDate)&&(todayDate<=theEndDate)){
            db.users.update({uname:assignedUser.uname},{$set:{station:assignedUser.currStn}});
            db.usersAssigned.update({uname:assignedUser.uname},{$set:{assignStatus:"active"}});
            console.log("Just Assigned: "+assignedUser.uname);
        } else if (theStartDate>todayDate) {
            console.log("Current Date is Not withing Range for user: "+assignedUser.uname);
        } else {
            console.log("Nooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo!!!");
        }
        console.log("-------------------------------------------------------------------------------------");
    }
});

//check invalid assignments
db.usersAssigned.find({assignStatus:"active"}).sort({_id:1}, function (error,data){
    cursor = data;
    var cursorLength = cursor.length;
    console.log("Total "+cursorLength);
    for (var i=0; i <= cursorLength-1; i++){
        toUnAssignUser = cursor[i];
        var aSDateU = new Date(toUnAssignUser.startDate);
        var aEDateU = new Date(toUnAssignUser.endDate);
        var theStartDateU = new Date(aSDateU.getFullYear()+"-"+genZero((aSDateU.getMonth()+1),2)+"-"+genZero(aSDateU.getDate(),2)+" 00:00");
        var theEndDateU = new Date(aEDateU.getFullYear()+"-"+genZero((aEDateU.getMonth()+1),2)+"-"+genZero(aEDateU.getDate(),2)+" 23:59");

        console.log("The Start Date: "+theStartDateU);
        console.log("The End Date: "+theEndDateU);
        console.log("The Current Date: "+todayDate);
        if ((theStartDateU<todayDate)&&(theEndDateU<todayDate)){
            db.users.update({uname:toUnAssignUser.uname},{$set:{station:toUnAssignUser.permStn}});
            db.usersAssigned.update({uname:toUnAssignUser.uname},{$set:{assignStatus:"inactive"}});
            console.log("Just Assigned: "+toUnAssignUser.uname);
        } else if (theStartDateU>todayDate) {
            console.log("Current Date is Not withing Range for user: "+toUnAssignUser.uname);
        } else {
            console.log("Nooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo!!!");
        }
        console.log("-------------------------------------------------------------------------------------");
    }
});

setTimeout(function(){
    process.kill();
},1000);