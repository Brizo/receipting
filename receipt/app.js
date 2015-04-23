var express         = require('express'),
    path            = require('path'),
    fs              = require('fs'),
    api             = require('./api'),
    session         = require('express-session'),
    cookieParser    = require('cookie-parser'),
    app             = express();
    PORT            = process.env.PORT || 3000;

app
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .use(express.static(path.join(__dirname, 'public')))
    .use('/api',api)
    .get('/', function (req, res){
        res.render('index')
    });

app.listen(PORT);
console.log('server started on port %s', PORT);