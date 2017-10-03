/*

This script adds a ticket to zendesk, submission by agent on behalf of customer.

Zendesk API
https://developer.zendesk.com/rest_api/docs/core/tickets#creating-a-ticket-with-a-new-requester

example curl: 
curl https://{zenDeskAccount}.zendesk.com/api/v2/tickets.json \
-d '{"ticket": {"requester": {"name": "Billy Bob", "email": "billybob@webtask.io"}, "submitter_id": 1, "subject": "Testing zen api", "comment": { "body": "what a great api" }}}' \
-H "Content-Type: application/json" -v -u {zenDeskApiUser}/token:{zenDeskApiUserAccessToken} -X POST

Requirements for connection
1. Existing Zendesk account with API access enabled
2. zenDesk account/subdomain such as {acct}.zendesk.com
2. Username
3. Access token for Username

Required Ticket Data From Customer
1. name
2. email
3. subject
4. description

How to Use this script
1. use webtask cli 'wt create zendesk.js'
2. use returned url to call webtask with querystring values such as 
    {webtask.io.urlRoot}/zendesk?webtask_no_cache=1&acct={acct}&user={user}&token={token}&rname={rname}&remail={remail}&subject={subject}&text={text}


*/
var request = require('request');

module.exports = function (context, callback) {
  
  var zenAccount, zenApiUser, zenApiToken, zenTicketRequesterName, zenTicketRequesterEmail, zenTicketSubject, zenTicketDescription
      
  zenAccount = context.data.acct;
  zenApiUser = context.data.user;
  zenApiToken = context.data.token;
  zenTicketRequesterName = context.data.rname;    
  zenTicketRequesterEmail = context.data.remail;
  zenTicketSubject = context.data.subject;
  zenTicketDescription = context.data.text;
      
  if(!zenAccount ||
    !zenApiUser ||
    !zenApiToken ||
    !zenTicketRequesterName ||
    !zenTicketRequesterEmail || 
    !zenTicketSubject || 
    !zenTicketDescription) callback("invalid parameters, call with &acct={acct}&user={user}&token={token}&rname={rname}&remail={remail}&subject={subject}&text={text}");     
      
  var url = 'https://' + zenAccount + '.zendesk.com/api/v2/tickets.json';
  var data = '{"ticket": {"requester": {"name": "' + zenTicketRequesterName + '", "email": "' + zenTicketRequesterEmail + '"}, "submitter_id": 1, "subject": "' + zenTicketSubject + '", "comment": { "body": "' + zenTicketDescription + '" }}}';
  var auth = 'Basic ' + new Buffer(zenApiUser + '/token:' + zenApiToken).toString('base64');

  request({
      url: url,
      method: 'POSt',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': auth  
      },
      body: data
  }, function (err, resp, result) {      
      callback(err, result);
  });
  
  
};