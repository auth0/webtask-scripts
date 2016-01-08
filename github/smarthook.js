// Raw version of this file: https://raw.githubusercontent.com/auth0/webtask-scripts/master/github/smarthook.js

var async = require('async')
    , request = require('request');

return function (context, req, res) {
    var body = '';
    var webtask_code;

    async.series([
        function (callback) {
            // Collect payload of GitHub web hook
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                try {
                    body = JSON.parse(body);
                    if (!body || typeof body !== 'object')
                        throw new Error("Unexpected web hook payload.");
                    if (!body.repository || typeof body.repository.full_name !== 'string')
                        throw new Error("Repository not identified in web hook payload.");
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            // Obtain webtask code from GitHub
            var url = 'https://raw.githubusercontent.com/' 
                + body.repository.full_name + '/' 
                + (context.data.branch || 'master') +'/' 
                + (context.data.file || 'webtask.js');
            request({ 
                url: url,
                method: 'GET',
                encoding: 'utf8'
            }, function (error, gres, body) {
                if (error) 
                    return callback(error);
                if (gres.statusCode !== 200) 
                    return callback(new Error('Error obtaining ' + url + '. HTTP status ' + gres.statusCode));
                webtask_code = body;
                return callback();
            })
        },
        function (callback) {
            // Compile and run user function

            var func;
            var msg;
            try {
                // Create a factory function that calls custom code
                var factory = eval('(function () { ' + webtask_code + '})');
                // Call the factory function to create custom function instance
                func = factory();
                if (typeof func !== 'function') {
                    msg = 'The code does not return a JavaScript function.';
                    throw new Error(msg);
                }
                if (func.length !== 2) {
                    msg = 'The JavaScript function must have the following signature: (context, callback)';
                    throw new Error(msg);
                }
            }
            catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    code: 400,
                    error: 'Unable to compile submitted JavaScript. ' + e.toString(),
                    details: e.toString()
                }, null, 2));
                return callback();
            }

            // Construct arguments

            context.webhook = body;
            var args = [ context, function (err, data) {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        code: 400,
                        error: 'Script returned an error.',
                        details: err.toString(),
                        name: err.name,
                        message: err.message,
                        stack: err.stack
                    }, null, 2));
                    return callback();
                }

                try {
                    body = data ? JSON.stringify(data) : '{}';
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                }
                catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    body = JSON.stringify({
                        code: 400,
                        error: 'Error when JSON serializing the result of the JavaScript code.',
                        details: e.toString(),
                        name: e.name,
                        message: e.message,
                        stack: e.stack
                    });
                }

                res.end(body);
                return callback();
            }];
                
            // Invoke the function

            try {
                func.apply(this, args);
            }
            catch (e) {
                try {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        code: 500,
                        error: 'Script generated an unhandled synchronous exception.',
                        details: e.toString(),
                        name: e.name,
                        message: e.message,
                        stack: e.stack
                    }, null, 2));
                }
                catch (e1) {
                    // ignore
                }

                // terminate the process
                throw e;
            }

            return callback();
        }
    ], function (error) {
        try {
            if (error) {
                console.log('ERROR', error);
                res.writeHead(500);
                res.end(error.toString());
            }
        }
        catch (e) {
            // ignore
        }
    });
};