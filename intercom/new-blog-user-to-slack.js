var request = require('request');

return function (context, callback) {
    if (context.body.data && 
        context.body.data.item && 
        context.body.data.item.custom_attributes && 
        context.body.data.item.custom_attributes.blog_subs) {
      request({
        url: "https://hooks.slack.com/services/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",
        method: 'POST',
        json: true,
        body: {
          "text": "A new user has subscribed to the blog " + context.body.data.item.email
        }
      },
      function (error, res, body) {
        return callback(error, body);
      });
    } else {
      return callback(null, "Nothing to do");
    }
};