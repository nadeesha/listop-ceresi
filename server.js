'use strict';

var express = require('express');

// Constants
var PORT = 8080;

// App
var app = express();

app.get('/api/v1/:app/:action', function (req, res) {
  return res.send(200, {
  	app: req.params.app,
  	action: req.params.action
  });
});

app.listen(PORT);

console.log('Running on http://localhost:' + PORT);