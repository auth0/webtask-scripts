import test from 'tape';
import nock from 'nock';
import customerUpsert from './customer-upsert.js';


// Do not enable any other http call other than the ones mocked
nock.disableNetConnect();

test('Customer Upsert possitive test', (t) => {
  t.plan(4);
  let resultMock = { text: 'everything is alright' }
  var contextMock = {
    data: {
      //ATTENTION: this parameters are here only for testing purposes
      //you should always set this parameters as `--secret`
      INTERCOM_USER: 'not a real user',
      INTERCOM_PASSWORD: 'not a real password',
      payload: {
        email: 'test@auth0.com',
        attributes: {
          custom_attr1: 'hi!'
        }
      }
    }
  };

  let api = nock('https://api.intercom.io')
    .post('/users', body => {
        t.equal(body.email, contextMock.data.payload.email, 'it should send the email as part of the payload');
        t.deepEqual(body.custom_attributes, contextMock.data.attributes, 'it should send the attrs as payload');
        return true;
      })
    .reply(200, resultMock);



  customerUpsert(contextMock, (err, result) => {
    t.deepEqual(result, resultMock)
    t.ok(api.isDone(), 'it should make the POST call')
  })
});


test('Customer Upsert negative test', (t) => {
  t.plan(2);
  let resultMock = { text: 'something bad happened' }

  let api = nock('https://api.intercom.io')
    .post('/users', body => true)
    .reply(404);


  var context = {
    data: {
      email: 'test@auth0.com',
      INTERCOM_USER: 'not a real user',
      INTERCOM_PASSWORD: 'not a real password'
    }
  };

  customerUpsert(context, (err, result) => {
    t.ok(err instanceof Error, 'it should return a Javascript Error')
    t.ok(api.isDone(), 'it should make the POST call')
  })
});
