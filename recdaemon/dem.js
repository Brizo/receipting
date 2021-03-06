var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exec = require('child_process').exec;
var fs = require('fs');
PORT            = process.env.PORT || 3080;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.set("jsonp callback", true);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


app.all('/print', function(req, res, next){
   
    if (req.method === 'OPTIONS') {
      //console.log('!OPTIONS');
      var headers = {};
      // IE8 does not allow domains to be specified, just the *
      // headers["Access-Control-Allow-Origin"] = req.headers.origin;
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
      headers["Access-Control-Allow-Credentials"] = false;
      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
      headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
      res.writeHead(200, headers);
      
    }

    printBody = req.body;

    //SPU RECEIPT DEFINITION


    printCommand = 'perl c:\\Program\\html2ps\\bin\\html2ps C:\\recdaemon\\public\\Print\\spu.htm > C:\\recdaemon\\public\\Print\\spu.ps && gsprint C:\\recdaemon\\public\\Print\\spu.ps';
    //console.log(printBody.spuRec);
    fs.writeFile('C:\\recdaemon\\public\\Print\\spu.htm', printBody.spuRec, 'utf8',function(err, data){
      if (err) {
        console.log(err);
      };
      exec(printCommand);
    });
    //res.send("Printed Receipt!");
    res.end();
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.all('/setStationParams', function(req, res, next) {

    var station = JSON.stringify(req.body);

    fs.writeFile('public/json/stationParams.json', station, 'utf8', function(err){
      if (err) {
        res.send("An error occured");
      } else {
        res.send("Parameters successfully written");
      }
    });
   
});

app.post('/readStationParams', function(req, res){ 
    var station;
    fs.readFile('public/json/stationParams.json', 'utf8', function (err, data) {
        //if (err) throw err;
        station = JSON.parse(data);
        res.header('Access-Control-Allow-Origin', "*");
        res.send(data);
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




app.listen(PORT);
console.log('server started on port %s', PORT);
