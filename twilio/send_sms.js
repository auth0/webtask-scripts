var request = require('request');

return function (context, callback) {
    var required_params = ['TWILIO_AUTH_TOKEN', 'TWILIO_ACCOUNT_SID', 'to', 'TWILIO_NUMBER', 'message'];
    for (var p in required_params)
        if (!context.data[required_params[p]])
            return callback(new Error('The `' + required_params[p] + '` parameter must be provided.'));

    request({ 
        url: 'https://api.twilio.com/2010-04-01/Accounts/' + context.data.TWILIO_ACCOUNT_SID + '/Messages', 
        method: 'POST',
        auth: {
            user: context.data.TWILIO_ACCOUNT_SID,
            pass: context.data.TWILIO_AUTH_TOKEN
        },
        form: {
            From: context.data.TWILIO_NUMBER,
            To: context.data.to,
            Body: context.data.message
        }
    }, function (error, res, body) {
        callback(error, body);
    });
}
