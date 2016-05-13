'use strict';

import AWS from 'aws-sdk';
import ssh2 from 'ssh2';
import mime from 'mime';
import s3UploadStream from 's3-upload-stream';

const Client = ssh2.Client;
const connection = new Client();

module.exports = sftp2s3;

function sftp2s3({ data }, callback) {
  const s3 = new AWS.S3({
    accessKeyId: data.AWS_ACCESS_KEY_ID,
    secretAccessKey: data.AWS_ACCESS_KEY_SECRET,
    region: data.AWS_REGION,
    sslEnabled: true
  });

  let countList = 0;
  let countFiles = 0;
  let countDownload = 0;
  let countUpload = 0;

  connection
    .on('ready', () => {
      connection.sftp((err, sftp) => {
        if (err) {
          connection.end();
          callback(err);
        }

        list(sftp, data.root, listFiles => {
          download(sftp, listFiles, (file, readable) => {
            upload(sftp, file, readable);
          });
        });
      });
    })
    .on('error', err => {
      connection.end();
      callback(err);
    });

  connection.connect({
    host: data.host,
    port: data.port,
    username: data.username,
    password: data.password
  });

  function list(sftp, path, cb, listFiles = []) {
    countList++;

    sftp.readdir(path, (err, files) => {
      if (err) {
        sftp.end();
        connection.end();
        callback(err);
      }

      files.forEach(file => {
        if (isFile(file.filename)) {
          countFiles++;
          listFiles.push(path + file.filename);
        } else {
          list(sftp, `${path}${file.filename}/`, cb, listFiles);
        }
      });

      if (!--countList) {
        cb(listFiles);
      }
    });
  }

  function isFile(name) {
    return name.indexOf('.') !== -1;
  }

  function download(sftp, listFiles, cb) {
    listFiles.forEach(filePath => {
      const readStream = sftp.createReadStream(filePath);
      cb(filePath, readStream);
      readStream.on('end', () => countDownload++);
      readStream.on('error', err => {
        sftp.end();
        connection.end();
        callback(err);
      });
    });
  }

  function upload(sftp, filePath, readable) {
    const s3Stream = s3UploadStream(s3);
    const uploadParams = {
      Key: filePath.replace(data.root, ''),
      Bucket: data.S3_BUCKET,
      ContentType: mime.lookup(filePath)
    };
    const writable = s3Stream.upload(uploadParams);

    writable.on('error', err => callback(err));
    writable.on('uploaded', () => {
      countUpload++;
      console.log(countUpload, filePath.replace(data.root, ''), 'uploaded.');

      if (countUpload === countDownload && countUpload === countFiles) {
        sftp.end();
        connection.end();
        callback(null, {
          message: `Successfully copied ${countFiles} files`
        });
      }
    });

    readable.pipe(writable);
  }
}
