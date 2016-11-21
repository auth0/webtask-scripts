'use latest';
import bodyParser from 'body-parser';
import express from 'express';
import Webtask from 'webtask-tools';
import { MongoClient } from 'mongodb';
const collection = 'push-notification';
const server = express();
server.use(bodyParser.json());

server.get('/', (req, res, next) => {

  const { MONGO_URL } = req.webtaskContext.data;
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) return next(err);

    db.collection(collection).find().toArray(function(err, results) {

      db.close();
      if (err) return next(err);
      res.status(200).send(results);
    })
  });
});


server.post('/', (req, res, next) => {
  const { MONGO_URL } = req.webtaskContext.data;
  // Do data sanitation here.
  const model = req.body;
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) return next(err);
    db.collection(collection).insertOne(model, (err, result) => {
      db.close();
      if (err) return next(err);
      res.status(201).send(result);
    });
  });
});

server.delete('/:sid', (req, res, next) => {
  const { MONGO_URL } = req.webtaskContext.data;
   const { sid } = req.params;
   MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) return next(err);
    db.collection(collection).remove({registration_id: sid}, (err, result) => {
      db.close();
      if (err) return next(err);
      res.status(204).send();
    });
  });

});

module.exports = Webtask.fromExpress(server);
