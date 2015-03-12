// Raw version of this file: 

var request = require('request')
    , async = require('async')
    , querystring = require('querystring');

return function (context, req, res) {
    async.series([
        function (callback) {
            // Collect www-form-urlencoded paylod of a HTTPS form POST
            // FUTURE: This will be part of Auth0 Webtask core functionality
            var body = '';
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                try {
                    body = querystring.parse(body);
                    if (!body || typeof body !== 'object')
                        throw error(400, 'Unexpected payload.');
                    context.data.stripeToken = body.stripeToken;
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            // Validate input parameters
            var required_params = ['stripeToken', 'callback', 'STRIPE_SECRET_KEY'];
            for (var p in required_params)
                if (!context.data[required_params[p]])
                    return callback(
                        error(400, new Error('The `' + required_params[p] + '` parameter must be provided.')));
            callback();
        },
        function (callback) {
            // Process charge through Stripe
            request({ 
                url: 'https://api.stripe.com/v1/charges',
                method: 'POST',
                auth: {
                    user: context.data.STRIPE_SECRET_KEY,
                    pass: ''
                },
                form: {
                    source: context.data.stripeToken,
                }
            }, function (error, res, body) {
                if (error)
                    return callback(error);
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                    return callback(new Error('Unable to parse Stripe response as JSON.'));
                }
                var redirect_hash;
                if (res.statusCode === 200) {
                    redirect_hash = querystring.stringify({
                        status: body.status,
                        id: body.id
                    });
                }
                else {
                    var error = body.error ? body.error.message;
                    if (!error)
                        error = 'Unexpected HTTP response ' + res.statusCode + ' from Stripe';
                    redirect_hash = querystring.stringify({
                        error: error
                    });                    
                }
                var redirect_url = context.data.callback + '#' + redirect_hash;
                res.writeHead(302, { Location: redirect_url });
                res.end();
                return callback();
            });
        }
    ], function (error) {
        if (error) {
            try {
                console.log('ERROR', error);
                res.writeHead(error.code || 500);
                res.end(error.stack || error.message || error.toString());
            }
            catch (e) {
                // ignore
            }
        }
    });
}

function error(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
}
