/*

  https://webtask.io/docs/sandboxjs

  1. npm install sandboxjs
  2. set codeFileName to your code File
  3. get webtask token via cli> 'wt profile ls'
  4  set token variable to value
  5. execute on via cli> 'node mysandbox.js'

  What you want to change:
  1. mycode.js location or content
  2. token
  
  What you don't want to change:
  You don't NEED to change anything else for the sandbox to return the webtask response

*/
var fs = require('fs');
var Assert = require('assert');
var Sandbox = require('sandboxjs'); 

var codeFileName = './mycode.js';
var code = fs.readFileSync(codeFileName).toString();
//var code = 'module.exports = function(cb) { cb(null, \'hello world\'); }';

if(!code){
  console.log("code is empty");
  return;
}

// use webtask cli to generate token
var token = '--SAMPLE-TOKEN-ONLY--';

var profile = Sandbox.fromToken(token);

// This library lets you create a webtask and run it in one step as a shortcut
profile.run(code, function (err, res, body) {
  Assert.ifError(err);
  Assert.equal(res.statusCode, 200, 'The webtask executed as expected');
  Assert.equal(res.body, 'hello world', 'The webtask returned the expected string');
  
  console.log(res.body);
});