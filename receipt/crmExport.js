var databaseUrl = "receipting";
var collections = ["users", "banks", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog"];
var db = require("mongojs").connect(databaseUrl, collections);

var fs = require('fs');

var currDate = new Date();
function genDate(dateString){
    var todayDay = dateString.getDate();
    var todayMonth = dateString.getMonth()+1;
    var todayYear = dateString.getFullYear().toString().substring(2,4);
    var todayFullDate = genZero(todayDay,2)+"/"+genZero(todayMonth,2)+"/"+todayYear;

    return todayFullDate;
}

function genRecDate(dateString){
    var recDateDay = dateString.getDate();
    var recDateMonth = dateString.getMonth()+1;
    var recDateYear = dateString.getFullYear();

    var receiptDate = recDateYear+""+genZero(recDateMonth,2)+""+genZero(recDateDay,4);

    return receiptDate;
}

function to2Digits(num){
    var strLength = num.toString().length;
    var str = (num).toString();
    if (strLength == 1) {
        str = "0"+str;
        return str;
    }else {
        return str;
    }
}

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

console.log("Starting!!");

dateFrom = new Date(currDate.getFullYear()+"-"+genZero((currDate.getMonth()+1),2)+"-"+genZero(currDate.getDate(),2)+" 00:00");
dateTo   = new Date(currDate.getFullYear()+"-"+genZero((currDate.getMonth()+1),2)+"-"+genZero(currDate.getDate(),2)+" 23:59");

console.log("The Dates: "+dateFrom+"  "+dateTo);

db.receipts.find({ created_on: { $gte: dateFrom, $lte: dateTo }}).sort({recNum:1}, function (error,data){
    cursor = data;
    var cursorLength = cursor.length;
    console.log("Total "+cursorLength);

    var dataFileStr = ''; 
    var dataFiles = {};
    var counts = {};

    for (var i = 0; i <= cursorLength-1; i++) {
        receipt = cursor[i];
        //console.log(receipt);
        //console.log(dataFiles);
        var DTString = receipt.recDate;
        var newDate = new Date(DTString);
        var batchDay = newDate.getDate();
        var todayDay = currDate.getDate();
        var prevDay = todayDay - batchDay;

        var receiptDateDT = new Date();

        var dateRecDay = receiptDateDT.getDate();

        var dateRecMon = receiptDateDT.getMonth()+1;

        var dtRecDate = genZero(dateRecDay,2)+genZero(dateRecMon,2);

        var d = new Date(receipt.recDate);
        console.log(d.getDate());
        var datestr = to2Digits(d.getDate())+"/"+to2Digits(d.getMonth()+1)+"/"+d.getFullYear().toString();
        if (receipt.recType == "spu") {
            dataFileStr = '';
            dataFileStr=receipt.recNum+","+datestr+","+receipt.custName+","+receipt.account+","+receipt.amtdue+","+receipt.custAddr+","+receipt.custCity+"\n";
            stationNum = "st"+receipt.stnNum;
            if (dataFiles[stationNum] != undefined) {
                dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                counts[stationNum] += 1;
            } else {
                dataFiles[stationNum] = '';
                counts[stationNum] = 0;
                dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                counts[stationNum] += 1; 
            } 
        }         
    };
     for (key in dataFiles){
        var fileName = "CRM"+key.substring(2)+dtRecDate+".csv";

        if (dataFiles.hasOwnProperty(key)) {
            fs.writeFile(fileName, dataFiles[key], function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        }
    }

});

setTimeout(function(){
    process.kill();
},1000);