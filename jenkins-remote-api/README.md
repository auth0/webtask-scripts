# Webtask Jenkins Remote API

Webtask to use Jenkins Remote API with CSRF Protection and keep safe your Jenkins token.

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
  "params": {},
  "secret": {
    "JENKINS_USER": "user@company.com",
    "JENKINS_TOKEN": "<jenkins token>",
    "JENKINS_URL": "https://jenkins.company.com",
    "JENKINS_PATH": "/job/website/build"
  }
}

```
`config/webtask.config.json`:
```json
{
  "WEBTASK_NAME": "build-company-website",
  "WEBTASK_TOKEN": "<webtask token>"
}

```
Deploy to webtask: `npm run deploy`

and finally just:
```sh
curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET https://webtask.it.auth0.com/api/run/wt-user/build-company-website
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## License

Webtask Jenkins Remote API is [MIT licensed](./LICENSE.md).
