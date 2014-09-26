'use strict';

var express = require('express');
var npm = require('npm');
var uuid = require('node-uuid');

// todo: move to tingo/memcached maybe?
var tasks = {};

// Constants
var PORT = 8080;

// App
var app = express();

app.post('/api/v1/vendor/:app/:action', function(req, res) {
    var app;

    try {
        app = require(req.params.app);
    } catch (e) {
        return res.send(400, {
            message: req.params.app + ' does not seem to be available'
        });
    }

    var action = req.params.action;

    app[action](req.body.line, function(err, result) {
        if (err) {
            res.send(400);
        } else {
            if (result.wait) {
                // we'll be polling round the mountain when she comes
            } else {
                return res.send(200, {
                    message: result.message
                });
            }
        }
    });
});

app.put('/api/v1/npm/install/:package', function(req, res) {
    var reference = uuid.v4();

    if (!req.params.package) {
        res.send(400, {
            message: 'invalid package name'
        });
    } else {
        res.send(202, {
            message: 'app is being installed',
            refid: reference
        });

        tasks[reference] = {
            status: 'pending'
        };
    }

    npm.load({
        loaded: false
    }, function(err) {
        npm.config.set('save', 'true');

        if (err) {
            console.log(err);

            tasks[reference] = {
                status: 'error',
                data: err
            };
        }

        npm.commands.install([req.params.package], function(err, data) {
            if (err) {
                console.log(err);

                tasks[reference] = {
                    status: 'error',
                    data: err
                };
            } else {
                tasks[reference] = {
                    status: 'done',
                    data: data
                };
            }
        });

        npm.on('log', function(message) {
            console.log(message);
        });
    });
});

app.get('/api/v1/npm/packages', function(req, res) {
    res.send(200, {
        packages: require('./package.json').dependencies
    });
});

app.get('/api/v1/tasks/:refid', function(req, res) {
    return res.send(200, {
        status: tasks[req.params.refid]
    });
});

app.get('/api/status', function(req, res) {
    res.send(200, {
        at: Date.now()
    });
});

app.listen(PORT);

console.log('Running on http://localhost:' + PORT);
