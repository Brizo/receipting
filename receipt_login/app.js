var express         = require('express'),
    path            = require('path'),
    fs              = require('fs'),
    api             = require('./api'),
    users           = require('./accounts'),
    session         = require('express-session'),
    cookieParser    = require('cookie-parser'),
    app             = express();

app
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .use(express.static(path.join(__dirname, 'public')))
    .use(users)
    .use('/api',api)
    .get('*', function (req, res){
        console.log("refreshing");
        if (!req.user) {
           res.redirect('/login');
        } else {
            res.render('index')
        }
    });

module.exports = app;