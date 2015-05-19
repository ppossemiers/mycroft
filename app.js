/*
(c) 2014 +++ Philippe Possemiers, ppossemiers@telenet.be +++
THIS CODE IS FREE - LICENSED UNDER THE MIT LICENSE
ACTIVE URL: https://github.com/ppossemiers/mycroft
*/

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var app = express();

db = require('nano')('https://' + process.env.API_KEY + ':' + process.env.API_PWD + '@3mobile.cloudant.com').db.use('mycroft');
//db = require('nano')('http://root:secret@localhost:5984').db.use('mycroft');

var mailer = require('express-mailer');
mailer.extend(app, {
  from: process.env.EMAIL,
  host: 'smtp.gmail.com',
  secureConnection: false,
  port: 587,
  transportMethod: 'SMTP',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PWD
  }
});

crypto = require('crypto');
esprima = require('esprima');
session = require('express-session');
_ = require('underscore');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('env', 'development');

app.use(function noCache(req, res, next){
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', 0);
  next();
});

app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('s3cr3t'));
app.use(session('d0ubles3cr3t'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forwarding to error handler
app.use(function(req, res, next){
  var err = new Error('404 - not found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next){
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
      error: {},
  });
});

module.exports = app;
