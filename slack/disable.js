//
// Summary: disables a user restricted to a specific channel
// Install:
//    $ sudo npm install wt -g
//    $ wt init <youremail>
//    $ wt create disable.js --name slack-disable \
//                        --secret SLACK_TOKEN=<get it from https://api.slack.com/web> \
//                        --secret SLACK_COMMAND_TOKEN=<create one at https://slack.com/services Slash Commands> \
//                        --secret SLACK_DOMAIN=yourdomain \
//                        --secret SLACK_ALLOWED_CHANNEL_PREFIX=ext
// Usage:
//    /disable-guest MemberID
//
// Credits to https://github.com/n4ch03 for the initial code
//
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
        return cb(null, "Please provide your slack domain (SLACK_DOMAIN)");

      var prefixes = context.data.SLACK_ALLOWED_CHANNEL_PREFIXES && context.data.SLACK_ALLOWED_CHANNEL_PREFIXES.split(',') || [ 'ext', 'cs-ext' ];
      if (!prefixes.some(function(prefix){
        return context.data.channel_name.slice(0, prefix.length) === prefix;
      })){
        return cb(null, "You can only disable guests in channels starting with any of `" + prefixes.join(', or ') +"`")  
      }

      var token = context.data.SLACK_TOKEN;
      var userId = context.data.text;
      var domain = context.data.SLACK_DOMAIN;

      if (context.data.channel_name === 'directmessage' ||
          context.data.channel_name === 'privategroup') {
        return cb(null, "You need to be in a public channel to disable an external user");
      }

      listUsers(token, domain).then(function(result){
        if (!result.ok){
          return cb(new Error(result.error));
        }

        var matches = result.members.filter(function(mem){
          return mem.id === userId;
        });

        if (!matches.length){
          return cb(new Error("No user with username: '" + username + "'"));
        }

        // all good - disable the user
        return disableUser(matches[0].id, token, domain)
          .then(function(json) {
            if (!json.ok) {
              return cb(new Error(json.error));
            } else {
              return cb(null, "User '" + username + "' disabled");
            }
          });
      }).catch(function(err) {
        return cb(err, null);
      });
    }

function disableUser(user, token, domain) {
  return request({
    json: true,
    method: 'POST',
    url: 'https://' + domain + '.slack.com/api/users.admin.setInactive',
    qs: {
      "user": user,
      "token": token,
      "set_active": true,
      "_attempts": 1
    }
  });
}

function listUsers(token, domain){
  return request({
    json: true,
    method: 'POST',
    url: 'https://' + domain + '.slack.com/api/users.list',
    qs: {
      "token": token
    }
  });
}
