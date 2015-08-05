"use latest";

let MongoClient = require('mongodb').MongoClient;


/**
 * Webtask wrapper for a MongoDB upsert, for more information checkout their API
 * http://docs.mongodb.org/v2.6/reference/method/db.collection.update/
 *
 * @param {String} context.data.MONGO_URL `--secret` It correspond to the connection url for the db instance.
 * @param {String} context.data.COLLECTION `--secret` The name of the db collection where you want to upsert the data
 * @param {String} context.data.query The query for the object you want to update. If this query throws
 *                    no results, then the dataToUpsert will be inserted into the collection
 * @param {Object} context.data.dataToUpsert Arbirtrary mongodb valid data to upsert in the collection
 */
module.exports = function mongoUpsert(context, callback) {

  let { MONGO_URL, COLLECTION, dataToUpsert, query } = context.data;

  if (!MONGO_URL) return callback(new Error('MONGO_URL secret is missing'))

  MongoClient.connect(MONGO_URL, (err, db) => {
    if(err) return callback(err);

    db.collection(COLLECTION)
      .update(query, { $set: dataToUpsert }, {upsert: true}, (err, result) => {
          if(err) return callback(err);

          db.close();
          callback(null, result);
      });
  });
};
