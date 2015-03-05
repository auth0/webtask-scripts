var async = require('async');

return function (context, req, res) {
    var body = '';

    async.series([
        function (callback) {
            // Collect payload of GitHub web hook
            req.on('data', function (chunk) { body += data; });
            req.on('end', function () {
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            console.log('WEBHOOK RECEIVED', body);
            callback();
        }
    ], function (error) {
        try {
            if (error) {
                console.log('ERROR', error);
                res.writeHead(500);
                res.end(error.toString());
            }
            else {
                res.writeHead(201);
                res.end();
            }
        }
        catch (e) {
            // ignore
        }
    });
};