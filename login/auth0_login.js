// Raw version of this file: http://bit.ly/1A1wkC3

var async = require('async')
    , querystring = require('querystring');

return function (context, req, res) {
    async.series([
        function (callback) {
            // Collect www-form-urlencoded paylod
            // TODO: shoudl this be core webtask functionality?
            var body = '';
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                try {
                    context.payload = querystring.parse(body);
                    if (!body || typeof body !== 'object')
                        throw error(400, "Unexpected payload.");
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            // Create model and view
            var html = require('ejs').render(view.stringify(), context);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(html);
        }
    ], function (error) {
        try {
            if (error) {
                console.log('ERROR', error);
                res.writeHead(500);
                res.end(error.stack || error.message || error.toString());
            }
        }
        catch (e) {
            // ignore
        }
    });
};

function error(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
}

function view() {/*
<html>
<head>
    <title>Login</title>
<style>
    body { 
        background: #44C7F4;
    }
</style>
<head>
<body>
    <h1>Webtask!</h1>
</body>
</html>
*/}