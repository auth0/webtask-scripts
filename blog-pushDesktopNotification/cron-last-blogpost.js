'use latest';
import request from 'request';
import rp from 'request-promise';
import { MongoClient } from 'mongodb';

module.exports = function(ctx,cb) {

  const MONGO_URL = ctx.data.MONGO_URL;
  if (!MONGO_URL) return cb(new Error('MONGO_URL secret is missing'));

  rp("https://auth0.com/blog/last.json").then(function(body){

    const post = JSON.parse(body);
    MongoClient.connect(MONGO_URL, (err, db) => {

      db.collection('last-post').find().count((err, count) => {
        if(err) return cb(null, err);
        if(!count){
          const data= {state: "last", title: post.title, date: post.fullDate};
          db.collection('last-post')
            .insertOne(data,function (err, result) {
              if(err) return cb(null, err);
                return cb(null,'new document');
              });
        }

        db.collection('last-post').find().toArray((err, res) => {
          if(err) return cb(null, err);
          if(res[0].date === post.fullDate && res[0].title === post.title){
            return cb(null,'Document Ok');
          }

          //update bd with last post
          updateDocument(db, post).then((res) => {

            db.collection('push-notification').distinct('registration_id', {}, {}, function (err, rid) {
              if(err) return cb(null, err);
              if(rid.length > 0){
                return sendNotification(rid).then(() => {
                  return cb(null,'sent notification');
                }).catch((e)=>{
                  return cb(null,e);
                });
              }

              return cb(null, 'Not registration_id');
            })
          })
        })

      });

    });

  }).catch(function(err){
    return cb(null, err);
  })


  function updateDocument(db, post){
    return new Promise((resolve, reject)=>{
      db.collection('last-post').update(
          { state: "last" },{state: "last", title: post.title, date: post.fullDate},
          { upsert: true }
        );
      resolve('updatedDocument');
    })
  }


  function sendNotification(rid){
    return new Promise((resolve, reject)=>{
      const options = {
        uri:'https://android.googleapis.com/gcm/send',
        method: 'POST',
        headers:{
          "Authorization": `key=${ctx.data.GCM_API_KEY}`,
          "Content-Type": "application/json"
        },
        json: true,
        body:{
          registration_ids: rid
        }
      };

      rp(options).then(function(body){
        resolve(body)
      }).catch(function(err){
        reject(err);
      })
    })

  }

};
