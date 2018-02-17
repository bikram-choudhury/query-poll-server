var express = require('express'),
    router = express.Router(),
    _ = require('underscore'),
    db = require('../database/db');
var ObjectId = require('mongodb').ObjectID;

router.get('/get/:docId', (req, res) => {
  var docId = req.params.docId || '',
      objId = docId && ObjectId(docId);
  db.get().collection('test_collection').find({_id:objId}).toArray(function (err,doc) {
    if (err) res.status(500).send('Internal Server Error !');
    res.json(doc);
  })
});

router.get('/update/:docId', (req, res) => {
  var updateObj = {fname: 'Bikram-Choudhury-1',isActv:false},
      docId = req.params.docId || '';
  db.get().collection('test_collection').update({_id: ObjectId(docId)},{$set:updateObj},function(err,docs){
    if(err) throw err;
    res.json(docs);
  });
});


router.get('/:docId?', (req, res) => {
  var exclude = {
    createdAt:false,
    updatedAt:false,
    isActv:false
  },
  docId = req.params.docId || '',
  objId = docId && ObjectId(docId),
  query = docId && {_id:objId} || {};
  console.log(query);
  db.get().collection('queries').find(query,exclude).sort({createdAt:1}).toArray(function (error,docs) {
    if(error) res.status(500).send('Internal Server Error !');
    res.status(200).send({
      code:0,
      message: 'All queries shown !',
      list: docs
    });
  })
  /*db.get().collection('test_collection').find({},exclude).sort({ createdAt:1 }).toArray(function(err,docs) {
    res.json(docs);
  })
  db.get().collection('test_collection').find({"_id": ObjectId("5a126005f4b36018d70ab170") }, function(err,docs) {
    res.json(docs);
  })
  db.get().collection('test_collection').insertMany([
    {fname: 'Bikram-1',lname: 'choudhury-1', isActv: true },
    {fname: 'Bikram-2',lname: 'choudhury-2', isActv: true },
    {fname: 'Bikram-3',lname: 'choudhury-3', isActv: false }
  ], function(err,result) {
    res.json(result.insertedIds);
  });*/

});

function checkQueryExistance(req,res,next) {
  if(req.body && req.body.docId){
    var body = req.body,
        title = req.body.title || '',
        regex = title && new RegExp(["^",title,"$"].join(""),"i");
    if(regex){
      db.get().collection('queries').find({ title: regex}).toArray(function (err,docs) {
        if(err) res.status(500).send('Internal Server Error - 1 !');
        if(docs && !_.isEmpty(docs)){
          req.isExist = docs;
        }
        next();
      })
    } else {
      next();
    }
  } else{
    next();
  }
}

function saveDistinctQuery(req,res,next) {
  if(req.body){
    if(req.isExist && !_.isEmpty(req.isExist)){
			res.status(200).send({
				code:2,
				message: 'Query already Exist !'
			});
		} else if(req.body.rowId){
      var docId = req.body.rowId,
          body = req.body,
          updateObj = {
            title : body.title || '',
            query : body.query || '',
            answer : body.answer || '',
            updatedAt : new Date()
          };
      db.get().collection('queries').update({_id: ObjectId(docId)},{$set:updateObj},function(err,docs){
        if(err) res.status(500).send('Internal server error !');

        res.status(200).send({
					code: 0,
					message: 'Query stored successfully !',
					resultId: docs.insertedIds
				});

      })

    } else {
      var body = req.body,
          saveObj = {
            title : body.title || '',
            query : body.query || '',
            answer : body.answer || '',
            isActive : true,
            createdAt : new Date()
          };
      db.get().collection('queries').insert(saveObj,function(err,docs){
        if(err) res.status(500).send('Internal server error !');

        res.status(200).send({
					code: 0,
					message: 'Query stored successfully !',
					resultId: docs.insertedIds
				});

      })

    }
  } else {
    res.status(200).send({
      code:1,
      message: 'Invalid Document !'
    });
  }
}

router.post('/save', checkQueryExistance, saveDistinctQuery);

router.delete('/:docId', (req, res) => {
  if(req.params.docId){
    var docId = req.params.docId;
    db.get().collection('queries').remove({_id:ObjectId(docId)},function (err,result) {
      if(err) res.status(500).send('Internal Server Error !');;
      res.status(200).send({
        code:0,
        message: 'Document deleted successfully !'
      });
    })
  }
});

//404 - Page not found handler.
router.use(function(req,res,next){
	res.json({"status":"failed","err":"404"});
});



module.exports = router;
