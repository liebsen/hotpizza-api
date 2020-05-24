const path = require("path")
const bson = require('bson')
const emailHelper = require('../email/helper')
const emailClient = emailHelper()
const ObjectId = require('mongodb').ObjectId

module.exports = {
  search: (req, res) => {
    req.app.db.collection(req.params.c).find(req.query)
    .toArray((err,docs) => {
      return res.json(docs)
    })
  },
  like: (req, res) => {
    req.app.db.collection(req.params.c).find({
      [req.query.where]: new RegExp(req.query.query)
    })
    .toArray((err,docs) => {
      return res.json(docs)
    })
  },
  list: (req, res) => {
    req.app.db.collection(req.params.c).find()
    .toArray((err,docs) => {
      return res.json(docs)
    })
  },
  item: (req, res) => {
    req.app.db.collection(req.params.c).find({
      _id: new ObjectId(req.params.id)
    }).toArray((err,docs) => {
      return res.json(docs[0])
    })
  },
  update: (req, res) => {
    delete req.body._id
    req.app.db.collection(req.params.c).findOneAndUpdate(
    {
      _id : new ObjectId(req.params.id)
    },
    {
      "$set" : req.body
    },
    { 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(doc){
      return res.json(doc.value)
    }).catch(function(err){
      if(err){
        return res.json({
          status: 'error: ' + err
        })
      }
    })
  },
  delete: (req, res) => {
    req.app.db.collection(req.params.c).deleteOne(
    {
      _id: new ObjectId(req.params.id)
    })
    .then(result => res.json({status:'deleted'}))
    .catch(err => console.error(`Delete failed with error: ${err}`))
  },
  create: (req, res) => {
    req.app.db.collection(req.params.c).insertOne(req.body, function (error, response) {
      if(error) {
        console.log('Error occurred while inserting');
      } else {
        return res.json(response.ops[0])
      }
    })
  }
}