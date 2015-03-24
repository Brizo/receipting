var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var fs = require('fs');

// define routes
var routes = require('./routes/index');

// instantiate application
var app = express();

// connect to db
var databaseUrl = "receipting";
var collections = ["users", "banks", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog"];
var db = require("mongojs").connect(databaseUrl, collections)

// MySql  --> Aging Analysis
var mysql = require('mysql');
var mysqlconn = mysql.createConnection({
    host: '147.110.192.250',
    user: 'root',
    password: 'secret09',
    database: 'sebinfo',
    insecureAuth: true,
    port: 3306
});
 
// MSSQL --> CRM Quotations
var mssql = require('mssql');
var mssqlconf = {
    user: 'sa',
    password: 'P@ssw0rd',
    server: '147.110.192.53'
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'secret',
    store: new MongoStore({
    db: 'receipting',
    host: '127.0.0.1',
    port: 27017,
    resave: false,
    saveUninitialized: false
  })
 }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', routes);

/***********************************************
      INTEGRATION ROUTES
***********************************************/

app.post('/refreshCust', function(req, res){
    mysqlconn.connect();
    var query = mysqlconn.query('select * from Aging', function(err, result, fields){
        if (err) {
            throw err;
        }

        db.customers.remove(function(err, data) {
            if (!data) {
                res.send("Error Could Not Refresh Data, Please check Connection to 147.110.192.253!");
            }
            else {
                result.forEach(function(cust){
                    db.customers.insert(cust);
                });
                res.send('customers refereshed successfully!');
            }
        });

        mysqlconn.end();
    })

});

app.post('/refreshQuotes',function(req, res){
    mssql.connect(mssqlconf, function(err){
        if (err) {
            throw err;
        }
        var request = new mssql.Request();
        request.query('select a.Oppo_OpportunityId, a.Oppo_Description, a.oppo_GroupCustName, a.oppo_NumberOfMembers, b.Quot_nettamt, b.quot_amountpermember, b.quot_version, c.gsm_CustUniqueReference, d.Comp_CompanyId from crm.dbo.Quotes b left join crm.dbo.Opportunity a on a.Oppo_OpportunityId = b.Quot_opportunityid left join crm.dbo.GroupSchemeMember c on b.Quot_opportunityid = c.gsm_OpportunityId left join crm.dbo.Company d on c.gsm_CompanyId = d.Comp_CompanyId', function(err, recordset){
            if(err){throw err};
            db.quotes.remove(function(err, data) {
            if(!data){
                res.send("Error Could Not Refresh Data, Please check Connection to 147.110.192.250!");
            }
            else {
                versions = {};
                recordset.forEach(function(quote){
                    if (quote.Oppo_Description in versions) {
                        oldV = versions[quote.Oppo_Description];
                        newV = quote.quot_version;
                        if (newV > oldV) {
                            db.quotes.remove({Oppo_Description:quote.Oppo_Description}, function(err, data){
                                if (!err) {
                                    db.quotes.insert(quote);
                                    versions[quote.Oppo_Description] = quote.quot_version;
                                };
                            });
                        };
                    }else{
                        db.quotes.insert(quote);
                        versions[quote.Oppo_Description] = quote.quot_version;
                    }
                });
                res.send('quotationss refereshed successfully!');
            }
        });
        });
    });
});

//**********************************************
//    RETRIEVE INDIVIDUAL DOCUMENTS ROUTES
//***********************************************
// user to be authenticated
app.post('/userAuthenticate', function(req, res) {
    var user = {
        uname: req.body.uname, 
        passkey: req.body.passkey
    }
    db.users.findOne(user, function (err, data){
        if (err || !data) {
            res.send("User doesnot exist");
        } else {
            res.send(data);
        } 
    });
});

// get a specific user
app.post('/getUser/:uname', function(req, res) {
    var username = req.params.uname;
    db.users.findOne({"uname":username}, function(err, data) {
        if (err || !data) {
            res.send("User not in database");
        } else {
            res.send(data);
        } 
    });
});

// get a specific receipt
app.post('/getReceipt/:id', function(req, res) {
    var recId = req.params.id;
    db.receipts.findOne({recNum:recId}, function(err, data) {
        if (err || !data) {
            res.send("Receipt not in database");
        } else {
            res.send(data);
        }
    });
});

// get a specific customer
app.post('/getCustomer', function(req, res) {
    var accnt = req.body.custno;
    db.customers.findOne({"Account":accnt}, function(err, data) {
        if (err || !data) {
            res.send("Customer not in database");
        } else {
            res.send(data);
        }
    });
});

// get a specific station
app.post('/getStation', function(req, res) {
    var num = Number(req.body.station);
    db.stations.findOne({stnId:num}, function(err, data) {
        if (err || !data) {
            res.send("Station not in database");
        } else {
            res.send(data);
        }
    });
});

// get a specific receipt
app.post('/getReceipt', function(req, res) {
    var recNum = req.body.recNo;
    db.receipts.findOne({"recNum":recNum}, function(err, data) {
        if (err || !data) {
            res.send("Receipt not in database");
        } else {
            res.send(data);
        }
    });
});

// get a single quotation
app.post('/getQuotation', function(req, res) {

    var ref = req.body.QuoteDesc;
    db.quotes.findOne({Oppo_Description:ref}, function(err, data) {
        if (err || !data) {
            res.send("Quotation not in database");
        } else {
            res.send(data);
        }
    });
});

// get autoincrement values
app.post('/getValues', function(req, res) {
    var stationNum = req.body.station;
    db.receiptIncrVals.findOne({station: stationNum},function(err, data) {
        if (err || !data) {
            res.send("No AutoIcremental values for this station in database");
        } else {
            res.send(data);
        }
    });
});

// get the login log
app.post('/getUserLog', function(req, res){
    var userName = req.body.uname;
    var stnNo = req.body.stnno;
    var logAction = "userLogin";
    db.receiptlog.find({action:logAction, loggedInUser:userName, station : stnNo}).sort({"_id":-1}, function(err, data){
        if( err || !data) {
            res.send("No User log in database!");
        } else {
            res.send(data);
        }
    });
});

// get previous batch
app.post('/getBatch', function(req, res){
    var station = req.body.stnNum;
    var user = req.body.openBy;
    db.batches.find({station: station, openBy:user}).sort({_id:-1}, function(err, data){
        if( err || !data) {
            res.send("No batches found for this station!");
        } else {
            res.send(data[0]); 
        }
    });
});

//***********************************************
//     RETRIVE ALL DOCUMENTS ROUTES
//**********************************************

// get all users from db route
app.post('/showAllUsers', function(req, res){
    db.users.find(function(err, data){
        if ( err || !data) {
            res.send("No users found");
        } else {
            res.send(data);
        }
    });
});

// get all stations from db route
app.post('/showAllStations', function(req, res){
    db.stations.find(function(err, data){
        if (err || !data) {
            res.send("No stations found");
        } else {
            res.send(data);
        }
    });
});

// get all receipts for particular Batch
app.post('/getBatchReceipts', function(req, res) {
    var query = req.body;
    var batchId = query.batchId;
    var stn = Number(query.myStn);
    var dateFrom = new Date(query.dateFrom+" 00:00");
    var dateTo   = new Date(query.dateTo+" 23:59");
    db.receipts.find({ created_on: { $gte: dateFrom, $lte: dateTo }, stnNum:stn, cashierUname:query.cashierUname},function(err, data) {
        if (err || !data) {
            res.send("No Batches found");
        } else {
            res.send(data);
        }
    });
});

// get all Multi-Pay Receipts
app.post('/showAllMultiPays', function(req, res){
    db.receipts.find({$and:[{mPayID:{$ne:null}},{status:{$ne:"deleted"}}]}, function(err, data){
        if (err || !data) {
            res.send("No multipays found");
        } else {
            res.send(data);
        }
    });
});

// get all customers from db route
app.post('/showAllCustomers', function(req, res){
        db.customers.find({Status: "LIVE "}, function(err, data){
        if( err || !data) {
            res.send("No customers found");
        } else {
            res.send(data);
        };
    });
});

// get all receipts from db route
app.post('/showAllReceipts', function(req, res){
        var stnCode = req.body.station;
        db.receipts.find({recNum : new RegExp('^'+stnCode)}, function(err, data){
        if( err || !data) {
             res.send("No receipts found");
        } else {
            res.send(data);
        };
    });
});

// get all banks from db route
app.post('/showAllBanks', function(req, res){
    db.banks.find(function(err, data){
        if( err || !data) {
            res.send ("No Banks found");
        } else {
            res.send(data);
        };
    });
});

// get all batches from db route
app.post('/showAllBatches', function(req, res){
    db.batches.find(function(err, data){
        if( err || !data) {
            res.send("No batches found");
        } else {
            res.send(data);
        };
    });
});

// get all batches from db route
app.post('/showAllQuotes', function(req, res){
    db.quotes.find(function(err, data){
        if(err || !data) {
            res.send("No quote found");
        } else {
            res.send(data);
        };
    });
});

// get all glcodes from db route
app.post('/getGlCodes', function(req, res){
    db.glcodes.find(function(err, data){
        if(err || !data) {
            res.send("No glcode found");
        } else {
            res.send(data);
        };
    });
});

// **************************************************
//   ADD NEW DOCUMENTS
//**************************************************

// add new user into db route
app.post('/addNewUser', function(req, res) {
    var newuser = req.body;
    db.users.insert(newuser, function (err, data) {
        if (err) {
            res.send("An error Occured");
        } else {
            res.send("User Added");
        }
    }); 
});

// add new log
app.post('/addNewLog', function(req, res) {
    var newlog = req.body;
    db.receiptlog.insert(newlog, function (err, data) {
        if (err) { 
            res.send("An error Occured");
        } else {
            res.send("Log Added");
        }
    });
});

// add new station route
app.post('/addNewStation', function(req, res) {
    var newstation = req.body;
    db.stations.insert(newstation);
    db.receiptIncrVals.insert({batchNo:0, recNo:0, station:newstation.stnId, transNo:0}, function (err, data) {
        if(err) {
            res.send("An error Occured");
        } else {
            res.send("Station saved");
        }
    });
});

// add new bank route
app.post('/addNewBank', function(req, res) {
    var newbank = req.body;
    db.banks.insert(newbank, function (err, data) {
        if(err) {
            res.send("An error Occured");
        } else {
            res.send("Bank saved");
        }
    });
});

// add new batch
app.post('/createNewBatch', function(req, res) {
    newBatch = req.body;
    newBatch["created_on"] = new Date(newBatch.timeopened);
    db.batches.insert(newBatch, function (err, data) {
        if (err) {
            res.send("An error Occured");
        } else {
            db.batches.find().sort({_id:-1}, function(err, data){
                res.send(data[0]);
            });
        }
    });
});

// add new customer route
app.post('/addNewCustomer', function(req, res) {
    var newcustomer = req.body;
    db.customers.insert(newcustomer, function (err, data) {
        if(err) {
            res.send("An error Occured");
        } else {
            res.send("Customer saved");
        }
    });
});

// add new receipt route
app.post('/addNewReceipt', function(req, res){
    newreceipt = req.body;
    newreceipt["created_on"] = new Date(newreceipt.recDate);
    db.receipts.insert(newreceipt, function (err, data) {
        if(err) {
            res.send("An error Occured");
        } else {
            res.send("Receipt saved");    
        } 
    });
});

// add new quotation into db route
app.post('/addNewQuote', function(req, res){
    var newQuote = req.body;
    db.quotes.insert(newQuote, function (err, data) {
        if (err) {
            rres.send("An error Occured");
        } else {
            res.send("Quote saved");
        }
    });
});

// add new glCode into db route
app.post('/addNewGlCode', function(req, res){
    var newGlCode = req.body.glcode;
    var newGlCodeDesc = req.body.glCodeDesc
    db.glcodes.insert({glcode:newGlCode, glCodeDesc:newGlCodeDesc}, function (err, data) {
        if(err) {
            res.send("An error Occured");
        } else {
            res.send("glcode saved");
        }
    });
});

// Configure station 
app.post('/setStationParams', function(req, res){
    id = req.body.stnId;
    station = req.body.stnName;
    batchcode = req.body.stnBatchCode;
    lastbatch = req.body.stnLastBatch;
    lastreceipt = req.body.stnLastReceiptU;
    fs.writeFile('public/json/stationParams.json', '{"stnId":'+id+',"stnName":"'+station+'", "stnBatchCode":"'+batchcode+'", "stnLasBatch":"'+lastbatch+'","stnLastReceipt":"'+lastreceipt+'"}', 'utf8',
    function(err, data){
        if (err) {
            throw error;
        }
        res.send("Station parameters initialised");
        
    });
});

//******************************************************
//    DELETE DOCUMENTS
//*****************************************************

// delete a user rout
app.delete('/deleteUser/:username', function(req, res) {
    var user = req.params.username;
    db.users.remove({uname:user}, function(err, deleted) {
        if (err) {
            res.send(err);
        } else {
            res.send ("User removed");
        }
    });
});

// terminate Multi-Pay
app.delete('/deleteMPay/:mpayid', function(req, res) {
    var recs = Number(req.params.mpayid);
    db.receipts.remove({mPayID:recs}, function(err, deleted) {
        if (err) {
            res.send(err);
        } else {
            res.send ("Multi-Pay removed");
        }    
    });
});

// delete a customer 
app.delete('/deleteCustomer/:custId', function(req, res) {
    var cust = req.params.custId;
    db.customers.remove({custId:user}, function(err, deleted) {
        if (err) {
            res.send(err);
        } else {
            res.send ("Customer removed");
        }
    });
});

// delete a station route
app.delete('/deleteStation/:stnId', function(req, res) {
    var station = Number(req.params.stnId);
    db.stations.remove({stnId:station}, function(err, deleted) {
        if (err) {
            res.send(err);
        } else {
            res.send ("Station removed");
        }
    });
});

//*****************************************************
//     UPDATE DOCUMENTS
//*****************************************************

// update status for Multi-Pay
app.post('/softDeleteMPay/:mpayid', function(req, res) {
    var recs = Number(req.params.mpayid);
    db.receipts.update({mPayID:recs},{$set: {status: "deleted"}}, { multi: true }, function(err, deleted) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send ("Multi-Pay removed");
        }    
    });
});

// Increment batch
app.post('/incrementBatch', function (req, res) {
    var stn = req.body.station;
    var newBatchNo = req.body.batchNum;
    db.receiptIncrVals.update({station:stn},{$set: {batchNo:newBatchNo}}, function (err, saved){
        if (err) {
            res.send ("An error occured");
        } else {
            res.send("Batch num incremented");
        }
    });
});

// update user route
app.post('/updateUser/:uname', function(req, res) {
    var username = req.params.uname;
    var user = req.body;
    db.users.update({uname:username},{$set: {uname: user.uname, passkey : user.passkey, firstname: user.firstname, lastname: user.lastname, roles: user.roles }}, function (err, saved) {
        if (err) {
            res.send("An error occured");    
        } else {
            res.send("User successfully updated");
        }
    });
});

app.post('/setLastLogin', function(req, res) {
    var username = req.body.username;
    var lastlogin = req.body.lastlogin;
    db.users.update({uname:username},{$set: {lastlogin: lastlogin}}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        }
        else {
            res.send("User successfully updated");
        }
    });
});

// update receipt quote route
app.post('/updateRecQuote', function(req, res) {
    var Quot_descr = req.body.qDescription;
    var Quot_balance = req.body.qBalance;
    db.quotes.update({Oppo_Description:Quot_descr},{$set: {Quot_nettamt: Quot_balance}}, function (err, saved) {
        if(err) {
            res.send("An error occured");
        }
        else {
            res.send("User successfully updated");
        }
    });
});

// update aging route
app.post('/updateAging', function(req, res) {
    var account = req.body.account;
    var newBalance = req.body.balance;
    db.customers.update({Account:account},{$set: {Current_Balance: newBalance}}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send("User successfully updated");
        }
    });
});

// update autoincrements route
app.post('/updateAutoIncrements', function(req, res) {
    var stn = Number(req.body.station);
    var recno = req.body.recNo;
    var transno = req.body.transNo;
    var MPayID = req.body.mPayID;
    db.receiptIncrVals.update({station:stn},{$set: {recNo:recno, transNo: transno, mPayID: MPayID}}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send("Autoincremental values successfully updated");
        }
    });
});

// transfer cashier route
app.post('/transfereCashier/:id', function (req, res) {
    var cashierId = req.params.id;
    var transferStn = req.body.station;
    db.users.update({uname:cashierId},{$set: {station:transferStn}}, function (err, saved){
        if (err) {
            res.send ("An error occured");
        } else {
            res.send("Cashier transfered");
        }
    })
});

// assign cashier route
app.post('/assignCashier/:id', function (req, res) {
    var cashierId = req.params.id;
    var transferStn = req.body.station;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    db.users.update({uname:cashierId},{$set: {station:transferStn, transStartDate: startDate, transEndDatev: endDate}}, function (err, saved){
        if (err) {
            res.send ("An error occured");
        } else {
            res.send("Cashier Assigned");
        }
    })
});

// update receipt route
app.post('/cancelRec/:idD', function(req, res) {
    var receipt = req.body.idD;
    var receiptNum = idD;
    var recid = req.params.recNum;
    db.receipts.update({recNum:receipt},{$set: {status: "cancelled"}}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send("Receipt Cancelled");
        }
    });
});

// update customer route
app.post('/updateCustomer/:custId', function(req, res) {
    var customer = req.body;
    var custid = req.params.custId;
    db.customers.update({CUSTNO:custid},{$set: {CUSTNO: customer.custno, CUSTNAME: customer.custNameU, CUSTADDR1:customer.custAddr1 , CUSTADDR2: customer.custAddr2, CUSTADDR3: customer.custAddr3 , CUSTREF: customer.custRef }}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send("Customer successfully updated");
        }
    });
});

// update station route
app.post('/updateStation/:stnId', function(req, res) {  
    var station = req.body;
    var stnid = req.params.stnId;

    db.stations.update({stnId:stnid},{$set: {stnName: station.stnName, stnBatchCode : station.stnBatchCode, stnLastBatch: station.stnLastBatch, stnLastReceipt:station.stnLastReceipt}}, function (err, saved) {
        if (err) {
            res.send("An error occured");
        } else {
            res.send("Station successfully updated");
        }
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
