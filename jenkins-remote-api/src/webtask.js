import axios from 'axios';

function jenkinsRemoteApi({ data }, callback) {
  const JENKINS_URL = data.JENKINS_URL;
  const JENKINS_USER = data.JENKINS_USER;
  const JENKINS_TOKEN = data.JENKINS_TOKEN;
  const JENKINS_PATH = data.JENKINS_PATH;

  const httpClient = axios.create({
    baseURL: JENKINS_URL,
    auth: {
      username: JENKINS_USER,
      password: JENKINS_TOKEN
    }
  });

  httpClient('/crumbIssuer/api/json')
    .then(response => {
      const crumbIssuer = response.data;

      return httpClient({
        method: 'post',
        url: JENKINS_PATH,
        headers: {
          [crumbIssuer.crumbRequestField]: crumbIssuer.crumb
        }
      });
    })
    .then(response => callback(null, response.data))
    .catch(error => callback(error.response.data));
}


export default jenkinsRemoteApi;
