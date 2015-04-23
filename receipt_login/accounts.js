var express         = require('express'),
    path            = require('path'),
    bodyParser  	= require ('body-parser'),
    session         = require('express-session'),
    cookieParser    = require('cookie-parser'),

    router 			= express.Router(),
 	databaseUrl 	= "receipting",
    collections 	= ["users", "banks", "usersAssigned", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog"],
    db 				= require("mongojs").connect(databaseUrl, collections);

router
    .use(bodyParser.urlencoded())
    .use(bodyParser.json())
    .use(cookieParser())
    .use(session({
        secret: 'secretatsec2015',
        maxAge: new Date(Date.now() + 3600000),
    }))

    .get('/login', function (req, res){
    	console.log("It came to login");
    	var msg = {error: 'none'};
    	if (req.session.loggdUser) {
    		console.log("and found user");
           res.redirect('/');
        } else {
        	console.log("and didnot find user");
            res.render('login', msg);
            console.log("done rendering");
        }
    })

    .get('/', function (req, res){
    	console.log(req.sessionID);
    	if (!req.session.loggdUser) {
    		console.log("It came to hommmme and redirected");
           res.redirect('/login');
        } else {
        	console.log("It came to hommmme and delivered index");
            res.render('index');
        }
    })

    .post('/login', function (req, res){
    	console.log("it came login post");
        var user = {
            uname: req.body.uname,
            passkey: req.body.passkey,
        };

        var formRoles = [];
        var currRoles = [];

  		db.users.findOne(user, function (err, data) {
	        if (data) {

	        	 // create a formRoles array to hold roles chosen at login
				if (req.body.adminrole == 'on') {
					formRoles.push('admin');
				}
				if (req.body.suprole == 'on') {
					formRoles.push('sup');
				}
				if (req.body.cashierrole == 'on') {
					formRoles.push('cashier');
				}
				if (req.body.efturole == 'on') {
					formRoles.push('eftu');
				}
				if (req.body.reprole == 'on') {
					formRoles.push('report');
				}

				if (formRoles.length == 0) {
					res.render('login', {error: 'Choose atleast one role'});
				} else if ((formRoles.indexOf('admin') !== -1) && (data.roles.indexOf('admin') == -1)) {
		   			res.render('login', {error: 'You do not have access to admin role'});
		   		} else if ((formRoles.indexOf('sup')  !== -1) && (data.roles.indexOf('sup') == -1)) {
		   			res.render('login', {error: 'You do not have access to sup role'});
		   		} else	if ((formRoles.indexOf('cashier')  !== -1) && (data.roles.indexOf('cashier') == -1)) {
		   			res.render('login', {error: 'You do not have access to cashier role'});
		   		} else	if ((formRoles.indexOf('eftu')  !== -1) && (data.roles.indexOf('eftu') == -1)) {
		   			res.render('login', {error: 'You do not have access to eftu role'});
		   		} else	if ((formRoles.indexOf('report')  !== -1) && (data.roles.indexOf('report') == -1)) {
		   			res.render('login', {error: 'You do not have access to report role'});
		   		} else {

		   			// create an array of roles that the user has choosen
   					if ((formRoles.indexOf('admin') !== -1) && (data.roles.indexOf('admin') !== -1)) {
						currRoles.push('admin');
	   				}
	   				if ((formRoles.indexOf('sup') !== -1) && (data.roles.indexOf('sup') !== -1)) {
	   					currRoles.push('sup');
	   				}
	   				if ((formRoles.indexOf('cashier') !== -1) && (data.roles.indexOf('cashier') !== -1)) {
	   					currRoles.push('cashier');
	   				}
	   				if ((formRoles.indexOf('eftu') !== -1) && (data.roles.indexOf('eftu') !== -1)) {
	   					currRoles.push('eftu');
	   				}
	   				if ((formRoles.indexOf('report') !== -1) && (data.roles.indexOf('report') !== -1)) {
	   					currRoles.push('report');
	   				}

	   				console.log("Choosen roles");
					for (var i=0; i<currRoles.length; i++) {
						console.log(currRoles[i]);
					}

					req.session.loggdUser = {username:data.uname,firstname:data.firstname,lastname:data.lastname, station:data.station,dbRoles:data.roles,currentRoles:currRoles};
	   				res.redirect('/');
				}
       		} else {
			    var msg = {error: 'Incorrect credentials'};
			    res.render('login', msg);
			}
    	});
	})

    .post('/logout', function (req, res) {
    	console.log("Logging out");
    	console.log("Session before deletion")
    	console.log(req.sessionID);
        req.session.destroy();
        console.log("Session after deletion");
        console.log(req.sessionID);
        res.redirect('/login');
    })

    .use(function (req, res, next){
    	if (req.session.loggdUser) {
    		req.user = req.session.loggdUser;
    	}
    	next();
    })


module.exports = router;
