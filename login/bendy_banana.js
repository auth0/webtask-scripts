// Webtask URL:
// https://sandbox.it.auth0.com/auth0-wf?webtask_no_cache=1&key=eyJhbGciOiJIUzI1NiIsImtpZCI6IjEifQ.eyJqdGkiOiI4MmY1YzEyNjA3YTE0YTEyYTUzNjFmMGFhZDliNGE0ZiIsImlhdCI6MTQyNTY5MjcxNCwidXJsIjoiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F1dGgwL3dlYnRhc2stc2NyaXB0cy9tYXN0ZXIvbG9naW4vYmVuZHlfYmFuYW5hLmpzIiwidGVuIjoiYXV0aDAtd2YiLCJwY3R4Ijp7ImF1dGgwX2RvbWFpbiI6ImF1dGgwLXdmLmF1dGgwLmNvbSIsImF1dGgwX2NsaWVudF9pZCI6ImdkVThudDVRYmRNQXBjODdlZDdlMUJUZVk0Nk83Q3pjIn19.bC9VOhFgCGOVBwOzX47nyA3deIV9DrQUqJC4Fvh1Www

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
                    body = querystring.parse(body);
                    if (!body || typeof body !== 'object')
                        throw error(400, "Unexpected payload.");
                    for (var i in body)
                        if (context.data[i] === undefined)
                            context.data[i] = body[i];
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
            console.log('CONTEXT', context);
            var html = require('ejs').render(view.stringify(), context);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(html);
            return callback();
        }
    ], function (error) {
        if (error) {
            try {            
                console.log('ERROR', error);
                res.writeHead(500);
                res.end(error.stack || error.message || error.toString());
            }
            catch (e) {
                // ignore
            }
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Bendy banana</title>
    <style>
        body { 
            background: #44C7F4;
        }
    </style>
<head>
<body>
    <h1>Bendy banana law</h1>
    <p>EU laws require us to ask for your acceptance of the provisions of 
    <a href="http://en.wikipedia.org/wiki/Commission_Regulation_%28EC%29_No_2257/94" target="_system">Bendy Banana Law</a> 
    before we can proceed.</p>
    <a href="<%- data.callback %>#state=<%- data.state %>&bendy_banana_acceptance=yes">I accept</a> 
    <a href="<%- data.callback %>#state=<%- data.state %>&bendy_banana_acceptance=no">I decline</a>
</body>
</html>
*/}