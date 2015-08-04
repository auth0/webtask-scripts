import test from 'tape';
import mongoUpsert from './upsert.js';


// This tests required a local mongod instance running in your local
const MONGO_URL = 'mongodb://127.0.0.1:27017/webtask_test';
const randomString = () => Math.random().toString(36).substring(7);

test('Mongo Upsert possitive test', (t) => {
  t.plan(6);

  let collection = 'test';
  let query = { email: `${randomString()}@auth0.com` };
  let dataToUpsert = Object.assign({}, query, { name: 'Jim Morrison' });

  let contextMock = {
    data: {
      //ATTENTION: this parameter is here only for testing purposes
      //you should always set it as `--secret`
      MONGO_URL,
      collection,
      query,
      dataToUpsert
    }
  };

  //Insert
  mongoUpsert(contextMock, (err, { result }) => {
    t.ok(result.upserted, 'it should insert when the query has no matches');
    t.equal(result.ok, 1);
    t.equal(result.nModified, 0);


    dataToUpsert.name = 'Kiwi Zulu';

    // Update
    mongoUpsert(contextMock, (err, { result }) => {
      t.ok(!result.upserted);
      t.equal(result.ok, 1);
      t.equal(result.nModified, 1, 'it should update the existing document');
    })
  })
});

test('Mongo Upsert negative test: no mongo URL', (t) => {
  t.plan(1);

  let contextMock = { data: {} };

  mongoUpsert(contextMock, (err, result) => {
    t.ok(err instanceof Error, 'it should return a javascript error');
  })
});
