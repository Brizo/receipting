var express		= require('express'),
	bodyParser	= require ('body-parser'),
	session		= require ('express-session'),
	session 	= require('express-session'),
	crypto		= require ('crypto');

var router  = express.Router(),
    databaseUrl = "receipting",
    collections = ["users", "banks", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog"],
    db = require("mongojs").connect(databaseUrl, collections);

function hash (password) {
	return crypto.createHash('sha256').update(password).digest('hex');
}

router
	.use(bodyParser.urlencoded())
	.use(bodyParser.json())
	.use(session({secret: 'ahsljlsjdhslkdjflsdhfeowjnsdfdjls'}))
	.get('/login', function (req, res) {
		res.render('login');
	})
	.post('/login', function (req, res) {
		var user = {
			username: req.body.username,
			password: hash(req.body.password)
		};

		db.users.findOne(user, function (err, data) {
			if (data) {
				req.session.userId = data.uname;
				res.redirect('index');
			} else {
				req.redirect('/login');
			}
		})
	})
	.get('/logout', function (req, res) {
		req.session.userId = null;
		res.redirect('routes/index');
	});
	/*.use (function (req, res, next) {
		if (!req.session.userId) {
			db.users.findOne({uname: req.session.userId}, function (req, data) {
				req.user = data;	 
			});
		}
		next();
	});*/

module.exports = router;


