var GitHubApi = require('github@0.2.4'),
  github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "",
    timeout: 5000,
    headers: {
      "user-agent": "auth0-pr-checker"
    }
  });

module.exports = function(context, callback) {
  var token = context.data.GITHUB_API_TOKEN,
    payload = context.data;

  if (!token) {
    callback('Invalid token. Please verify that the secret is correctly configured.');
    return;
  }

  if (!payload) {
    callback('Invalid payload. Please check your WebHook configuration in GitHub.');
    return;
  }

  // Authenticate with GitHub
  github.authenticate({
    type: 'oauth',
    token: token
  });

  var action = payload.action;
  console.log('Action received:' + action);

  // We only want to check the PR status when opened, labeled or unlabeled.
  if (action === 'opened' || action === 'labeled' || action === 'unlabeled') {
    checkLabelStatus(payload, callback);
  } else {
    // Ignore action
    callback();
  }
};

/** HELPER FUNCTIONS **/
function checkLabelStatus(payload, callback) {
  status = {
    user: payload.repository.owner.login,
    repo: payload.repository.name,
    sha: payload.pull_request.head.sha,
    context: 'auth0/labels'
  };

  github.issues.getIssueLabels({
    number: payload.pull_request.number,
    user: status.user,
    repo: status.repo
  }, function(err, data) {
    createStatus(err, data, callback);
  });
}

function createStatus(err, data, callback) {
  if (err) {
    callback(err);
  } else {
    if (data.length === 0) {
      status.state = 'error';
      status.description = 'This PR is not labeled. Please select one or more labels.';
    } else {
      status.state = 'success';
      status.description = 'The labels are OK.';
    }

    github.statuses.create(status, function(err, data) {
      if (err) {
        callback(err);
      } else {
        callback(null, 'Completed!');
      }
    });
  }
}
