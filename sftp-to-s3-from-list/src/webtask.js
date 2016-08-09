import AWS from 'aws-sdk';
import ssh2 from 'ssh2';
import mime from 'mime';
import assert from 'assert';
import express from 'express';
import bodyParser from 'body-parser';
import { isArray, isString } from 'lodash';
import stream from 'stream';
// import replacestream from 'replacestream';

const app = express();

export default app;

// Parse application/x-www-form-urlencoded and application/json
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: false }));

app.post('/', sftpToS3FromList);

async function sftpToS3FromList(req, res) {
  const { webtaskContext, body } = req;
  const { data, storage } = webtaskContext;
  const { host, port, username, password, path, accessKeyId, secretAccessKey, bucket } = data;
  const listFiles = validateListFiles(body['listFiles[]'])
    ? JSON.parse(body['listFiles[]'])
    : null;

  // Check required secrets and params
  try {
    assert(host, 'host secret required');
    assert(port, 'port secret required');
    assert(username, 'username secret required');
    assert(password, 'password secret required');
    assert(path, 'path param required');
    assert(accessKeyId, 'accessKeyId secret required');
    assert(secretAccessKey, 'secretAccessKey secret required');
    assert(bucket, 'bucket secret required');
  } catch (e) {
    return res.status(500).json(e);
  }

  // SSH2, AWS S3 and S3 Upload Stream clients
  const SSH2Client = ssh2.Client;
  const connection = new SSH2Client();
  const s3Client = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    sslEnabled: true,
    params: {
      Bucket: bucket
    }
  });
  let files;

  try {
    // Write in storage files list to upload or get remaining files from storage
    if (listFiles) {
      files = { total: listFiles, remaining: listFiles };
      await storageSet(storage, files, { force: 1 });
    } else {
      files = await storageGet(storage);
    }

    if (!files) {
      throw new Error('There isn\'t a file list to upload, please send via POST form-data key ' +
        '`fileList[]`');
    }

    // eslint-disable-next-line no-console
    console.log(filesCount(files));

    // Start SSH2 connection and then SFTP connection
    await connectSSH2({ connection, host, port, username, password });
    const sftpConnection = await connectSFTP(connection);

    // Main: SFTP to S3 from list
    for (const filePath of files.remaining) {
      /* eslint-disable no-console */
      // Download file
      const readStream = await downloadFile(sftpConnection, filePath);
      console.log(`Successfully downloaded ${filePath} from SFTP`);
      // Upload file
      await uploadFile({ s3Client, path, filePath, readStream });
      console.log(`Successfully uploaded ${filePath} to S3`);
      // Remove file from storage.remaining
      const filesUpdated = Object.assign({}, files, {
        remaining: files.remaining.filter(item => item !== filePath)
      });
      files = filesUpdated;
      await storageSet(storage, filesUpdated, { force: 1 });
      // eslint-disable-line no-console
      console.log(`Successfully removed ${filePath} from storage`);
    }

    // End SSH2 and SFTP connections
    sftpConnection.end();
    connection.end();

    return res.status(200).json({ files: filesCount(files) });
  } catch (e) {
    connection.end();

    return res.status(500).json({ message: e.message, files: filesCount(files) });
  }
}

/**
 * Validate list of files received via POST x-www-form-urlencoded
 * e.g.: ['/file.js', '/path/file.js']
 *
 * @param {string} listFiles - Data received via POST x-www-form-urlencoded
 */
function validateListFiles(listFiles) {
  let parsedListFiles = null;

  if (!listFiles) return false;
  try {
    parsedListFiles = JSON.parse(listFiles);
  } catch (e) {
    return false;
  }

  if (!isArray(parsedListFiles)) return false;
  if (!parsedListFiles.every(filePath => isString(filePath))) return false;

  return true;
}

/**
 * Get files count of { total: [...], remaining: [...] }
 *
 * @param {object} files - { total: [...], remaining: [...] }
 */
function filesCount(files) {
  const total = files && files.total ? files.total.length : 0;
  const remaining = files && files.remaining ? files.remaining.length : 0;

  return { total, remaining };
}

/**
 * Start SSH2 connection
 *
 * @param {object} options
 * @param {object} options.connection - npm:ssh2 client connection
 * @param {string} options.host - SSH2 host url
 * @param {number} options.port - SSH2 port number
 * @param {string} options.username - SSH2 username
 * @param {string} options.password - SSH2 password
 */
function connectSSH2({ connection, host, port, username, password }) {
  return new Promise((resolve, reject) => {
    connection
      // Authentication was successful
      .on('ready', resolve)
      // An error occurred
      .on('error', reject)
      // Start connection
      .connect({ host, port, username, password });
  });
}

/**
 * Start SFTP connection
 *
 * @param {object} connection - npm:ssh2 client connection
 * @returns {object} npm:ssh2 SFTP connection
 */
function connectSFTP(connection) {
  return new Promise((resolve, reject) => {
    connection.sftp((errSftp, sftp) => {
      if (errSftp) {
        sftp.end();
        return reject(errSftp);
      }

      return resolve(sftp);
    });
  });
}

/**
 * Download file from SFTP
 *
 * @param {object} sftp - npm:ssh2 sftp connection
 * @param {string} filePath - File path. E.g. '/folder/file.js'
 * @returns {object} Read stream of the downloaded file
 */
function downloadFile(sftp, filePath) {
  return new Promise(resolve => {
    const readStream = sftp.createReadStream(filePath);
    return resolve(readStream);
  });
}

/**
 * Upload a file to AWS S3
 *
 * @param {object} options
 * @param {object} options.s3Client - AWS S3 client instance
 * @param {string} options.filePath - File path. E.g. '/folder/file.js'
 * @param {object} options.readStream - file read stream
 */
function uploadFile({ s3Client, path, filePath, readStream }) {
  return new Promise((resolve, reject) => {
    if (/\.(js|css|xml|htm|html)$/.test(filePath)) {
      // TODO: Find a way to make dynamically replacements with pipes and move to webtask params
      //
      // const replaces = [{
      //   search: 'a',
      //   replacement: 'b'
      // }, {
      //   search: 'c',
      //   replacement: 'a'
      // }, {
      //   search: 'foo',
      //   replacement: 'bar'
      // }];
      //
      // replaces.forEach(({ search, replacement }) => {
      //   readStream.pipe(replacestream(search, replacement));
      // });
      // readStream
      //   .pipe(uploadFromStream(s3Client, mime.lookup(filePath), filePath.replace(path, '')));

      readStream
        // Hacky workaround
        //
        // .pipe(replacestream('a', 'b'))
        // .pipe(replacestream('c', 'a'))
        // .pipe(replacestream('foo', 'bar'))
        .pipe(uploadFromStream(s3Client, mime.lookup(filePath), filePath.replace(path, '')));
    } else {
      readStream
        .pipe(uploadFromStream(s3Client, mime.lookup(filePath), filePath.replace(path, '')));
    }

    function uploadFromStream(s3, ContentType, Key) {
      const Body = new stream.PassThrough();
      const params = { ContentType, Key, Body };

      s3.upload(params, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });

      return Body;
    }
  });
}

/**
 * Webtask Storage API write data promisified
 *
 * @param {object} storage - Webtask Storage API
 * @param {object} data - Data to save on Webtask Storage
 * @param {object} data - Options for write on Webtask Storage
 */
function storageSet(storage, data, options) {
  return new Promise((resolve, reject) => {
    storage.set(data, options, (error) => {
      if (error) return reject(error);
      return resolve();
    });
  });
}

/**
 * Webtask Storage API read data promisified
 *
 * @param {object} storage - Webtask Storage API
 * @returns {object} Data from Webtask Storage
 */
function storageGet(storage) {
  return new Promise((resolve, reject) => {
    storage.get((error, data) => {
      if (error) return reject(error);
      return resolve(data);
    });
  });
}
