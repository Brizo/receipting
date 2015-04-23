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

var currDate = new Date();
var sumAmntDue = 0;
var recordCount = 0;

batchQuery = db.batches.find();

print("RECEIVED_BY"+",RECEIPT_DATE"+",TOT_RECEIVED"+",BRANCH_CODE"+",BANK_ACCT_NO"+",REF"+",ACCOUNT_CODE"+",AMT_RECEIVED"+",RECEIPT_DESC"+",RECEIPT_REF"+",ACCOUNT_CODE"+",AMT_RECEIVED"+",RECEIPT_DESC"+",RECEIPT_REF"+",ACCOUNT_CODE"+",AMT_RECEIVED"+",RECEIPT_DESC"+",RECEIPT_REF"+",ACCOUNT_CODE"+",AMT_RECEIVED"+",RECEIPT_DESC"+",RECEIPT_REF"+",ACCOUNT_CODE"+",AMT_RECEIVED"+",RECEIPT_DESC"+",RECEIPT_REF");

while (batchQuery.hasNext()) {
	batch = batchQuery.next();

	var DTString = batch.timeOpened;
    var newDate = new Date(DTString);
    var batchDay = newDate.getDate();
    var todayDay = currDate.getDate();
    var prevDay = todayDay - batchDay;

    receiptBatch = batch.batchNo;
    receiptQuery = db.receipts.find({recBatch:receiptBatch});

    //initialize values
    var sumAmntDueSPU = 0;
    var sumAmntDueDP = 0;
    var sumAmntDueOP = 0;
    var sumAmntDueCP = 0;
    var sumAmntDueVT = 0;
    var accCodeSPU = "";
    var accCodeDP = "";
    var accCodeOP = "";
    var accCodeCP = "";
    var accCodeVT = "";
    var descSPU = "";
    var descDP = "";
    var descOP = "";
    var descCP = "";
    var descVT = "";
    var batchSPU = "";
    var batchDP = "";
    var batchOP = "";
    var batchCP = "";
    var batchVT = "";
    if (prevDay <= 16) {
	    while (receiptQuery.hasNext()){
	    	var receipt = receiptQuery.next();
	    	//declare vars
	    	var receiptType = receipt.recType;
	    	var receiptAmount = receipt.amtdue;
	    	var recBatch = receipt.recBatch;
	    	var receiptStation = receipt.stnNum;


	    	if (receiptType == "spu") {
	        	sumAmntDueSPU += Number(receiptAmount);
	        	accCodeSPU = "HHH1701";
	        	descSPU = "SPU DEBTORS";
	        	batchSPU = recBatch;
	    	} else if (receiptType == "capital") {
	    		sumAmntDueDP += Number(receiptAmount);
	    		accCodeDP = "HHK3008";
	    		descDP = "SPU DEPOSITS"; 
	    		batchDP = recBatch;
	    	} else if (receiptType == "visits") {
	    		sumAmntDueOP += Number(receiptAmount);
	    		accCodeOP = "HHH1714";
	    		descOP = "OTHER PAYMENTS";
	    		batchOP = recBatch;
	    	} else if (receiptType == "deposits") {
	    		sumAmntDueCP += Number(receiptAmount);
	    		accCodeCP = "HHJ2002";
	    		descCP = "SPU CONNECTIONS";
	    		batchCP = recBatch;
	    	}else if (receiptType == "otherPayments") {
	    		sumAmntDueVT += Number(receiptAmount);
	    		accCodeVT = "HF889999A975";
	    		descVT = "SPU VISITS";
	    		batchVT = recBatch;
	    	}

	    	sumAmntDue = sumAmntDueSPU+sumAmntDueDP+sumAmntDueOP+sumAmntDueCP+sumAmntDueVT;
			if ((receiptStation == 3)||(receiptStation == 8)||(receiptStation == 9)||(receiptStation == 10)||(receiptStation == 11)||(receiptStation == 12)||(receiptStation == 13)||(receiptStation == 14)||(receiptStation == 15)||(receiptStation == 24)||(receiptStation == 25)) {
				var bankAccount = "0140037364203";
				var bankCode = "66066442";
			} else if ((receiptStation == 4)||(receiptStation == 6)||(receiptStation == 7)||(receiptStation == 16)||(receiptStation == 20)||(receiptStation == 21)) {
				var bankAccount = "020000340341";
				var bankCode = "360164";
			};
			var theFinalTest = receiptStation;
	    }; // exit receipt loop

	    print("679"+","+genDate(newDate)+","+sumAmntDue+","+bankCode+","+bankAccount+","+genRecDate(newDate)+","+accCodeSPU+","+sumAmntDueSPU+","+descSPU+","+batchSPU+","+accCodeDP+","+sumAmntDueDP+","+descDP+","+batchDP+","+accCodeOP+","+sumAmntDueOP+","+descOP+","+batchOP+","+accCodeCP+","+sumAmntDueCP+","+descCP+","+batchCP+","+accCodeVT+","+sumAmntDueVT+","+descVT+","+batchVT);
	} // end of if
}; //exit batch loop
