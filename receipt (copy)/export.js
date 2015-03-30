cursor = db.receipts.find({recBatch:"Q1"}).sort({recNum:1});

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
    var substr1 = newValue.substring(0,n-1);
    var substr2 = newValue.substring(n+1,newValue.length);	


    if (n < 0){
        var newValue = newValue+".00";
    } else if (n==1) {
       var newValue = "0."+substr2;
   

    } else {
        if (substr2.length == 1){
          var newValue = substr1+"."+substr2+"0";
        }
    }
    return newValue;
}

var sumAmntDue = 0;
var recordCount = 0;

while (cursor.hasNext()) {
    receipt = cursor.next();

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
        	print(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch + datestr +quad8 + " " + receipt.stnNum +se + receipt.recNum +  datestr +  eleven + receipt.account +"            " + zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8) +" "+ numString+genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
    	} else if (receipt.recType == "capital") {
    		print(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) +receipt.recBatch + datestr + quad8 + " " + receipt.stnNum + se +receipt.recNum + datestr  + eleven +"            " + genSpace(receipt.quoteRef,10) + zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
    	} else if (receipt.recType == "visits") {
    		print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4) + receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum + datestr + eleven +"            " + genSpace(receipt.glCode,10)+ zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
    	} else if (receipt.recType == "deposits") {
    		print(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4)+ receipt.recBatch + datestr + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr +  eleven +"            " + genSpace(receipt.glCode,10)+  zero+ " "+ genSpace(posDec(toDec(receipt.amtdue)),18) +" " + genSpace(bankChar,8)+" "+ numString+ numString+""+ genSpace(receipt.custName,40) +" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
    	}else if (receipt.recType == "otherPayments") {
            if (receipt.custAddr == null) {
               print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(toDec(receipt.amtdue),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68)); 
           } else {
              print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(toDec(receipt.amtdue),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
           }        
        }
    } else {
        if (receipt.recType == "spu") {
            print(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch +  datestr + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr  + eleven +receipt.account +"            " + zero +" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
        } else if (receipt.recType == "capital") {
            print(receipt.mPayPos + receipt.itemcode +  genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + " "+ receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"            " + genSpace(receipt.quoteRef,10) + zero+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68));
        } else if (receipt.recType == "visits") {
            print(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr + eleven +"            " + genSpace(receipt.glCode,10)+ zero+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
        } else if (receipt.recType == "deposits") {
            print(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) + receipt.recBatch +  datestr  + quad8 + " " + receipt.stnNum  + se  + receipt.recNum  + datestr  + eleven +"            " + genSpace(receipt.glCode,10)+ zero+" "+" "+ genSpace(posDec(toDec(receipt.amtdue)),27) +" "+ numString+ numString+" "+ genSpace(receipt.custName,40) +" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
        }else if (receipt.recType == "otherPayments") {
            if (receipt.custAddr == null) {
               print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + " " + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(toDec(receipt.amtdue),18) +" " + genSpace(bankChar,8)+" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custName,30)+" "+genSpace(receipt.custName,68)); 
            } else {
                print(receipt.mPayPos +receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch + datestr + quad8 + " " + receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"            " + genSpace(otherPaymentsGl,10) + zero+ " "+genSpace(toDec(receipt.amtdue),27) +" "+ numString+ genSpace(receipt.custName,40)+" "+genSpace(receipt.custAddr,30)+" "+genSpace(receipt.custCity,68));
            }
        }

    }

}
print("*END* DT210302 21 PS11A01   "+recordCount + genLeft(sumAmntDue,13)); 
