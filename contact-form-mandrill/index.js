var mandrill = require('mandrill-api/mandrill');
var querystring = require('querystring');

var message = { message: '', error: false };

module.exports = function (context, req, res) {
  var queryData = '';
  if (req.method !== 'POST') {
    message.message = 'Error, not allowed, only post';
    message.error = true;
    response(res, message);
  }

  req.on('data', function (data) {
    queryData += data;
    if (queryData.length > 1e6) {
      queryData = '';
      // Flood attack or faulty client, nuke request
      req.connection.destroy();
    }
  });

  req.on('end', function () {
    var post = querystring.parse(queryData);
    var customEmail = validation(res, post);
    if (customEmail.status) {
      sendEmail(context, res, customEmail);
    } else {
      message.message = 'Error validation';
      message.error = true;
      response(res, message);
    }
  });
};

function response(res) {
  var statusCode = message.error ? 400 : 200;
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(message));
}

function validation(res, post) {
  var validParams = [{
    id: 'name',
    label: 'Name',
    required: true
  }, {
    id: 'email',
    label: 'Email',
    required: true
  }, {
    id: 'role',
    label: 'Role',
    required: true
  }, {
    id: 'company',
    label: 'Company',
    required: true
  }, {
    id: 'message',
    label: 'Message',
    required: true
  }];
  var data = {
    'Reply-To': '',
    html: '',
    subject: post.subject,
    status: true
  };

  if (!hasOwnPropertyValue(post, 'subject') ||
    !(hasOwnPropertyValue(post, 'email') && validEmail(post.email))) {
    message.message = 'Error validation';
    message.error = true;
    response(res, message);
    data.status = false;
  }

  validParams.forEach(function (item) {
    if (item.id === 'email') {
      data['Reply-To'] = post[item.id];
    }
    if (item.required && !hasOwnPropertyValue(post, item.id)) {
      message.message = 'Error validation ' + item.id;
      message.error = true;
      response(res, message);
      data.status = false;
    }
    data.html += '<p><strong>' + item.label + ':</strong> ' + (post[item.id] || '') + '</p>';
  });

  // Fix line breaks
  data.html = data.html.replace(/(?:\r\n|\r|\n)/g, '<br />');

  return data;
}

function hasOwnPropertyValue(obj, property) {
  return obj.hasOwnProperty(property) && !!obj[property].length;
}

function validEmail(value) {
  var email = new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i);

  return email.test(value);
}

function sendEmail(context, res, custom) {
  var mandrillClient = new mandrill.Mandrill(context.data.MANDRILL_KEY);
  var email = {
    html: custom.html,
    subject: custom.subject,
    from_email: context.data.from_email,
    to: [{
      email: context.data.to
    }],
    headers: {
      'Reply-To': custom['Reply-To']
    },
    tags: [
      'contact-form'
    ]
  };

  mandrillClient.messages.send({ message: email }, function () {
    message.message = 'Succes! Mail sent';
    message.error = false;
    response(res, message);
  }, function (e) {
    message.message = 'A mandrill error occurred: ' + e.name + ' - ' + e.message;
    message.error = true;
    response(res, message);
  });
}
