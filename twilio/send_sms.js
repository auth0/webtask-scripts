var request = require('request');

return function (context, callback) {
    var required_params = ['twilio_auth_token', 'twilio_account_sid', 'to', 'from', 'message'];
    for (var p in required_params)
        if (!context.data[required_params[p]])
            return callback(new Error('The `' + required_params[p] + '` parameter must be provided.'));

    request({ 
        url: 'https://api.twilio.com/2010-04-01/Accounts/' + context.data.twilio_account_sid + '/Messages', 
        method: 'POST',
        auth: {
            user: context.data.twilio_account_sid,
            pass: context.data.twilio_auth_token
        },
        form: {
            From: context.data.from,
            To: context.data.to,
            Body: context.data.message
        }
    }, function (error, res, body) {
        callback(error, body);
    });
}
