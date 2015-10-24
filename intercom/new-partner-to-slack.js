var request = require('request');

return function (context, callback) {
    if (context.body.data) {

      request({
        url: context.data.SLACK_URL,
        method: 'POST',
        json: true,
        body: {
          "text": context.body.data.content
        }
      },
      function (error, res, body) {
        return callback(error, body);
      });
    } else {
      return callback(null, "Nothing to do");
    }
};
