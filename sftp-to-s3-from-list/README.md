# Webtask SFTP to AWS S3 from list of files

Copy all files from a SFTP (via a list of files) to AWS S3. Especially to use with [Webtask SFTP List](https://github.com/auth0/webtask-scripts/tree/master/sftp-list).

## Run locally

For testing purposes

`npm start`

## Deploy to webtask

`npm run deploy`

## Example

Fill config files:

`config/default.config.json`:
```json
{
  "secret": {
    "host": "<ssh2 host url>",
    "port": "<ssh2 port>",
    "username": "<SSH2 USER>",
    "password": "<SSH2 user password>",
    "path": "<Path to replace with '' while uploading to S3>",
    "accessKeyId": "<AWS Access Key ID>",
    "secretAccessKey": "<AWS Secret Access Key>",
    "bucket": "<AWS S3 Bucket>",
    "path": "<path to replace when uploading to S3>"
  },
  "param": {}
}
```
`config/webtask.config.json`:
```json
{
  "WEBTASK_NAME": "sftp-to-s3-from-list",
  "WEBTASK_TOKEN": "<Webtask token>"
}

```
Deploy to webtask: `npm run deploy`

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## License

Webtask SFTP List is [MIT licensed](./LICENSE.md).
