var express         = require('express'),
    path            = require('path'),
    fs              = require('fs'),
    api             = require('./api'),
    app = express();

app
    .use(express.static(path.join(__dirname, 'public')))
    .use('/api',api)
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', function(req, res) {
        res.render('index');
    });

module.exports = app;