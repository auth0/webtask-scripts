# Webtask SFTP List

Webtask to get a list of all files under a path on a SFTP server.

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
  "param": {
    "path": "/static/"
  },
  "secret": {
    "host": "124.123.123.123",
    "port": "1233",
    "username": "ftp-user",
    "password": "ftp-user-password"
  }
}

```
`config/webtask.config.json`:
```json
{
  "WEBTASK_NAME": "sftp-list-website",
  "WEBTASK_TOKEN": "<webtask token>"
}

```
Deploy to webtask: `npm run deploy`

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## License

Webtask SFTP List is [MIT licensed](./LICENSE.md).
