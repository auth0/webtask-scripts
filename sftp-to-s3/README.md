# SFTP to AWS S3
Copy all files from SFTP to AWS S3

## Install

* `npm install`

## Config

Fill fields from `config/default.config.json` and `config/webtask.config.json`.

Example of `config/default.config.json`:
```json
{
  "secret": {
    "host": "sftp.host.com",
    "port": "2222",
    "username": "sftp-user",
    "password": "sftp-password",
    "AWS_ACCESS_KEY_ID": "aws-access-key-id",
    "AWS_ACCESS_KEY_SECRET": "aws-access-key-secret",
    "AWS_REGION": "aws-region",
    "S3_BUCKET": "s3-bucket"
  },
  "param": {
    "root": "/copy/files/from/this/folder/"
  }
}
```

Example of `config/webtask.config.json`:
```json
{
  "webtaskName": "sftp-to-s3",
  "webtaskToken": "Your webtask token here. Run `wt profile ls`"
}
```
## Development (test)

* `npm run development`

## Deploy to webtask

* `npm run deploy`

## Todo

Add support to change the content of files with `replacestream`.
Example of config in `config/default.config.json`:

```json
{
  "param": {
    "replace": [{
      "match": "/\.(js|css|xml|htm|html)$/",
      "search": "development.website.com",
      "replacement": "production.website.com"
    },
    {
      "match": "/\.(json|xml|htm|html)$/",
      "search": "barbar",
      "replacement": "foofo"
    }]
  }
}
```
