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
    var monthLength = num.toString().length;
    var month = (1+num).toString();
    if (monthLength == 1) {
        month = "0"+month;
        return month;
    }else {
        return month;
    }
}

function genLeft(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = " "+myfield;
        }
    } else {
    myfield = myfield.substring(0, alocSpace);
    }

    return myfield;
}

function posDec(amt) {
  var newValue = amt.toString();
  var n = newValue.indexOf(".");
  substr1 = newValue.substring(0,n);
  substr2 = newValue.substring(n,newValue.length);
  newSubStr1 = genLeft(substr1,9);
  return newSubStr1+substr2;
}

function genSpace(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = myfield +" ";
        } 
    } else {
        myfield = myfield.substring(0, alocSpace);
    }

    return myfield;
       
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

function toDec(value){
    var newValue = value.toString();
    var n = newValue.indexOf(".");   
    var substr1 = newValue.substring(0,n);
    var substr2 = newValue.substring(n+1,newValue.length);  


    if (n < 0){
        var newValue = newValue+".00";
    } else if (n==1) {
       var newValue = "0."+substr2;
       if (substr2.length == 1){
          var newValue = substr1+"."+substr2+"0";
        }
    } else {
        if (substr2.length == 1){
          var newValue = substr1+"."+substr2+"0";
        }
    }
    return newValue;
}

console.log("Starting!!");
    var sumAmntDue = 0;
    var recordCount = 0;

dateFrom = new Date(currDate.getFullYear()+"-"+genZero((currDate.getMonth()+1),2)+"-"+genZero(currDate.getDate(),2)+" 00:00");
dateTo   = new Date(currDate.getFullYear()+"-"+genZero((currDate.getMonth()+1),2)+"-"+genZero(currDate.getDate(),2)+" 23:59");

console.log("The Dates: "+dateFrom+"  "+dateTo);

db.receipts.find({ created_on: { $gte: dateFrom, $lte: dateTo }}).sort({recNum:1}, function (error,data){
    cursor = data;
    var cursorLength = cursor.length;
    console.log("Total "+cursorLength);

    var dataFileStr = ''; 
    var dataFiles = {};
    var totals = {};
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

        sumAmntDue += Number(receipt.amtdue);
        recordCount += 1;

        var d = new Date(receipt.recDate);
        var datestr = d.getFullYear().toString()+to2Digits(d.getMonth())+to2Digits(d.getDay());
        var quad8 = "88888";
        var se = "SE";
        var eleven = 11;
        var numString = "9999920305";
        var accountSpace = "          ";
        var otherPaymentsGl = "HF889999A9";;
        var zero = 0;

        if (receipt.recType == "spu"){
            receipt.itemcode = 2;
        } else if (receipt.recType == "capital"){
            receipt.itemcode = 7;
        }else if (receipt.recType == "deposits") {
            receipt.itemcode = 5;
        }else if (receipt.recType == "visits") {
            receipt.itemcode = 9;
        } else if (receipt.recType == "otherPayments") {
            receipt.itemcode = 3;
        }

        if (receipt.payMeth == "Cheque"){ 

            var bankChar = receipt.cheQue.bankCode.substring(0,1);  

            if (receipt.recType == "spu") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch + datestr +quad8 + " " + receipt.stnNum +se + receipt.recNum +  datestr +  eleven + receipt.account +"            " + zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8) +" "+ numString+genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                } 
            } else if (receipt.recType == "capital") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) +receipt.recBatch + datestr + quad8 + " " + receipt.stnNum + se +receipt.recNum + datestr  + eleven +"            " + genSpace(receipt.quoteRef,10) + zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
            } else if (receipt.recType == "visits") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4) + receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum + datestr + eleven +"            " + genSpace(receipt.glCode,10)+ zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
            } else if (receipt.recType == "deposits") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4)+ receipt.recBatch + datestr + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr +  eleven +"            " + genSpace(receipt.glCode,10)+  zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ numString+""+ genSpace(receipt.customer,40) +" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }

            }else if (receipt.recType == "otherPayments") {
                if (receipt.custAddr == null) {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68))+"\n"; 
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
               } else {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
               }        
            }
        } else {
            if (receipt.recType == "spu") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch +  datestr + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr  + eleven +receipt.account +"            " + zero +" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                console.log(posDec(toDec(receipt.amtdue)));
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
                
            } else if (receipt.recType == "capital") {
                dataFileStr = '';

                dataFileStr=(receipt.mPayPos + receipt.itemcode +  genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + " "+ receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"            " + genSpace(receipt.quoteRef,10) + zero+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
                    
            } else if (receipt.recType == "visits") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr + eleven +"            " + genSpace(receipt.glCode,10)+ zero+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                 if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }

            } else if (receipt.recType == "deposits") {
                dataFileStr = '';
                dataFileStr=(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) + receipt.recBatch +  datestr  + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr  + eleven +"            " + genSpace(receipt.glCode,10)+ zero+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ numString+" "+ genSpace(receipt.custName,40) +" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
            }else if (receipt.recType == "otherPayments") {
                if (receipt.custAddr == null) {
                dataFileStr = ''
                dataFileStr=(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
                } else {
                dataFileStr = ''
                dataFileStr=(receipt.mPayPos +receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch + datestr + quad8 + " " + receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68))+"\n";
                stationNum = "st"+receipt.stnNum;
                if (dataFiles[stationNum] != undefined) {
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr; 
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1;
                } else {
                    dataFiles[stationNum] = '';
                    totals[stationNum] = 0;
                    counts[stationNum] = 0;
                    dataFiles[stationNum] = dataFiles[stationNum]+dataFileStr;
                    totals[stationNum] += receipt.amtdue;
                    counts[stationNum] += 1; 
                }
                }
            }

        }
    };
     for (key in dataFiles){
        var fileName = "dt"+key.substring(2)+dtRecDate+".txt";
        var fileName1 = "DT"+key.substring(2)+dtRecDate;

        console.log(totals[key]);
        dataFiles[key]+=("*END* "+fileName1+" "+key.substring(2)+" IPS11A01   "+genZero(counts[key],2) +genLeft(posDec(toDec(totals[key])),13))+"\n";
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