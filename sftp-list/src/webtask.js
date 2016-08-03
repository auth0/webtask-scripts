import ssh2 from 'ssh2';
import assert from 'assert';

const Client = ssh2.Client;
const connection = new Client();

function sftpList({ data }, callback) {
  const { host, port, username, password, path } = data;

  assert(host, 'host required');
  assert(port, 'port required');
  assert(username, 'username required');
  assert(password, 'password required');
  assert(path, 'path required');

  // We need to set up the events before starting the connection
  connection
    // Authentication was successful
    .on('ready', () => {
      // Starts an SFTP session
      connection.sftp((errSftp, sftp) => { // eslint-disable-line consistent-return
        if (errSftp) {
          sftp.end();
          connection.end();
          return callback(errSftp);
        }

        // List all files under path of `path`
        list(sftp, path, (err, filesList) => {
          sftp.end();
          connection.end();

          return err
            ? callback(err)
            : callback(null, filesList);
        });
      });
    })
    // An error occurred.
    .on('error', err => {
      connection.end();
      return callback(err);
    })
    // Start connection
    .connect({ host, port, username, password });
}

/*
 * List all files under a path
 */
let countList = 0;
function list(sftp, path, cb, listFiles = []) {
  countList++;
  const isFile = name => name.indexOf('.') !== -1;

  // eslint-disable-next-line consistent-return
  sftp.readdir(path, (err, files) => {
    if (err) return cb(err);

    files.forEach(file => {
      const filePath = path + file.filename;

      if (isFile(file.filename)) {
        listFiles.push(filePath);
      } else {
        list(sftp, `${filePath}/`, cb, listFiles);
      }
    });

    if (!--countList) return cb(null, listFiles);
  });
}

export default sftpList;
