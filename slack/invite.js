// invites an external user to the active channel (as a single guest channel)
// wt create invite.js --name slack-invite --secret SLACK_TOKEN=<get it from slack admin interface> --secret SLACK_CHANNEL_NAME=ext --secret SLACK_COMMAND_TOKEN=..create a slash command in slack... --secret SLACK_DOMAIN=yourdomain
var request = require('request-promise');
var token;
var domain;

module.exports =
    function (context, cb) {
      if (!context.data.SLACK_TOKEN) 
        return cb(null, "For invites to work you need a slack Admin token (SLACK_TOKEN)");
      
      if (context.data.SLACK_COMMAND_TOKEN !== context.data.token) 
        return cb(null, "Tokens don't match, make sure to use the token provided in the Slash Command integration (SLACK_COMMAND_TOKEN)");
      
      if (!context.data.SLACK_DOMAIN)
        return cb(null, "Please provide your slack domain (SLACK_DOMAIN)")
      
      if (context.data.channel_name.slice(0, 3) !== 'ext')
        return cb(null, "You can only invite guests to channels starting with `ext`")
      
      var token = context.data.SLACK_TOKEN;
      var mail = context.data.text;
      var domain = context.data.SLACK_DOMAIN;

      if (context.data.channel_name === 'directmessage' ||
          context.data.channel_name === 'privategroup') {
        return cb(null, "You need to be in a public channel to invite an external user");
      }

      // all good - invite the user
      inviteUser(mail, token, domain, context.data.channel_id)
        .then(function(json) {
          if (!json.ok) {
            if (json.error === 'already_invited') {
              cb(null, "The user " + mail + " was already invited. If the user didn't get the invite email please contact a Slack admin to resend the invite. Also take into account that a single guest channel can only be on a single channel :)");
            } else {
              cb(null, "There was an error: " + json.error);
            }
          } else {
            cb(null, "Invitation sent to <" + mail + "> for this channel: " + context.data.channel_name);
          }
        })
        .catch(function(err) {
          cb(err, null);
        });
    }


function inviteUser(email, token, domain, channel) {
  return request({
    json: true,
    method: 'POST',
    url: 'https://' + domain + '.slack.com/api/users.admin.invite',
    qs: {
      "email": email,
      "ultra_restricted": 1,
      "token": token,
      "set_active": true,
      "_attempts": 1,
      "channels": channel
    }
  });
}