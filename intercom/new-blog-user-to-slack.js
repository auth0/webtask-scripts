var request = require('request');

return function (context, callback) {
    
    console.log(context.body.data.item.custom_attributes);
    // https://hooks.slack.com/services/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
  //   request({
  //       url: "https://slack.com/api/chat.postMessage",
  //       method: 'POST',
  //       json: true,
  //       body: {
  //         token: context.data.slack_token,  // Passed using secret params
  //         channel: context.data.slack_channel,
  //         user: context.data.slack_user || 'Webtask',
  //         text: 'Push in `' + repo.full_name + '`'
  //       }
  //   },
  //   function (error, res, body) {
  //     callback(error, body);
  // });
};