/*

  https://webtask.io/docs/sandboxjs

  1. npm install sandboxjs
  2. set codeFileName to your code File
  3. get webtask token via cli> 'wt profile ls'
  4  set token variable to value
  5. execute on via cli> 'node mysandbox.js'

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

var token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjIifQ.eyJqdGkiOiIwMThkYTU1NWNmMGQ0OWNjYmZiZDZhNGFiNmVlNDE4YiIsImlhdCI6MTQ2ODQyNjE3NCwiY2EiOlsiOTAwNzMzNGRiMDhjNGQ2M2E0MTNjZGFmM2YzYjYxNGMiXSwiZGQiOjEsInRlbiI6Ii9ed3QtZGluYWJlcnJ5LW91dGxvb2tfY29tLVswLTFdJC8ifQ.2DhK63o2NUQjPbpx4WV4bZwNLocXdYGMK9kZ1U9ajeY'
var profile = Sandbox.fromToken(token);

// This library lets you create a webtask and run it in one step as a shortcut
profile.run(code, function (err, res, body) {
  Assert.ifError(err);
  Assert.equal(res.statusCode, 200, 'The webtask executed as expected');
  Assert.equal(res.body, 'hello world', 'The webtask returned the expected string');
  
  console.log(res.body);
});