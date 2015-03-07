// Webtask URL:
// https://sandbox.it.auth0.com/auth0-wf?webtask_no_cache=1&eyJhbGciOiJIUzI1NiIsImtpZCI6IjEifQ.eyJqdGkiOiI5YjFjMGNlNjgyZTQ0NzlhODY1ZTE2Y2JlYjdjNzVmZiIsImlhdCI6MTQyNTY3Nzc4MywidXJsIjoiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F1dGgwL3dlYnRhc2stc2NyaXB0cy9tYXN0ZXIvbG9naW4vYXV0aDBfbG9naW4uanMiLCJ0ZW4iOiJhdXRoMC13ZiIsInBjdHgiOnsiYXV0aDBfZG9tYWluIjoiYXV0aDAtd2YuYXV0aDAuY29tIiwiYXV0aDBfY2xpZW50X2lkIjoiZ2RVOG50NVFiZE1BcGM4N2VkN2UxQlRlWTQ2TzdDemMifX0.MvwWuM__Y_z8WRUL4QnSA9foxL__eq2l6Q3ywcwzkmw

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
    <title>Login</title>
    <style>
        body { 
            background: #44C7F4;
        }
    </style>
    <script src="//cdn.auth0.com/js/lock-7.1.min.js"></script>
<head>
<body hidden>
    <h1>Unnecessary 3s delay to show we are in webtask...</h1>
    <script>
        var lock;
        document.addEventListener('DOMContentLoaded', function() {
            lock = new Auth0Lock('<%- data.auth0_client_id %>', '<%- data.auth0_domain %>');
            setTimeout(function () {
                lock.show({ 
                    popup: true,
                    connections: ['<%- data.strategy %>']
                    <% if (data.title) { %>
                    , dict: {
                        signin: {
                            title: '<%= data.title %>'
                        }
                    }
                    <% }; %>
                }, function(error, profile, token) {
                    var hash = '#state=<%= data.state %>&';
                    if (error) {
                        hash += 'error=' + encodeURIComponent(error.message || error.toString());
                    }
                    else {
                        hash += 'token=' + encodeURIComponent(token);
                    }
                    window.location.replace('<%- data.callback %>' + hash);
                });
            }, 3000);
        });
    </script>
</body>
</html>
*/}