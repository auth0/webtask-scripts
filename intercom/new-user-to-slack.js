var request = require('request');

return function (context, callback) {
    if (context.body.data &&
        context.body.data.item &&
        context.body.data.item.custom_attributes &&
        context.body.data.item.custom_attributes[context.data.TAG_PROP]) {

      request({
        url: context.data.SLACK_URL,
        method: 'POST',
        json: true,
        body: {
          "text": context.data.SLACK_MESSAGE + context.body.data.item.email
        }
      },
      function (error, res, body) {
        return callback(error, body);
      });
    } else {
      return callback(null, "Nothing to do");
    }
};
