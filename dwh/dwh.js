// wt create wt.js -s pg_username=webtask -s pg_password=******* -s tunnel_rsa_private_key="-----BEGIN RSA PRIVATE KEY-----\n........\n-----END RSA PRIVATE KEY----"
return function (context, cb) {    

  var err;
  ['pg_username', 'pg_password', 'pg_db'].forEach(function (i) {
      if (typeof context.data[i] !== 'string') {
          err = i;
      }
  });
  if (err) {
      try {
          console.log('ERROR: request without ' + err + '.');
          res.writeHead(400);
          return res.end('Missing ' + err);
      }
      catch (e) {
          // ignore
      }
  }

  var Promise = require('bluebird');

  var pg = require('pg');
  var conString = "postgres://" + context.data.pg_username + ":" + context.data.pg_password + "@localhost:5439/" + context.data.pg_db;

  function tunnel() {
    if (global.ssh_initialized) return Promise.resolve();

    var spawn = require('child_process').spawn;
    var fs = require('fs');
    var tmp = require('tmp');
    var tmpobj = tmp.fileSync();
    var key_file = tmpobj.name;
    console.log('creating temp file', key_file)
    var key = context.data.tunnel_rsa_private_key;
    fs.writeFileSync(key_file, key);

    var proc = spawn('ssh', ['-o StrictHostKeyChecking=no','-o UserKnownHostsFile=/dev/null', '-o GlobalKnownHostsFile=/dev/null', '-vvN', '-L', 
                    '5439:' + context.data.pg_server, 
                    context.data.tunnel_userhost,
                    '-i', key_file, 's']);
    
    return new Promise(function (resolve) {
      function wait (data) {
        console.log(data.toString());
        if (data.toString().indexOf('Entering interactive session.') > -1) {
          proc.stderr.removeListener('data', wait);
          global.ssh_initialized = true;
          resolve(proc);
        }
      }
      proc.stderr.on('data', wait);
    });
  }

  tunnel()
    .then(function () {
      console.log('connected tunnel')
      pg.connect(conString, function(err, client, done) {
        console.log('connected to pg');
        if(err) {
          console.log('error connecting', err)
          return cb(err)
        }
        client.query(context.data.q, function(err, result) {
          done();
          if (err) {
            console.log('error running query', err);
            return cb(err);
          }

          cb(null, { rows: result.rows });
        });
      });
    });
}