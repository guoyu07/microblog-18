var util = require("util");
var mongodb = require('./db');

function TopicDAO(){

}

TopicDAO.prototype.save = function(topic, callback){
	mongodb.open(function(err, db){
		if(err){
	      mongodb.close();
	      return callback(err);
	    }
	    db.collection('topic', function(err, collection){
	    	if(err){
		      mongodb.close();
		      return callback(err);
		    }
		    collection.ensureIndex('userId', {}, function(err){
			    if(err){
			      mongodb.close();
			      return callback(err);
			    }
		    	collection.insert(topic, {safe: true}, function(err, post){
			      mongodb.close();
			      return callback(err, post);
		    	});
		    });
	    });
	});
};

TopicDAO.prototype.find = function(topic, callback){
	mongodb.open(function(err, db){
		if(err){
	      mongodb.close();
	      return callback(err);
	    }
	    db.collection('topic', function(err, collection){
	    	if(err){
		      mongodb.close();
		      return callback(err);
		    }
	    	collection.find(topic).sort({time: -1}).toArray(function(err, posts){
	    	  if(err){
			    mongodb.close();
			    return callback(err);
			  }
		      mongodb.close();
		      return callback(err, posts);
	    	});
	    });
	});
};

module.exports = TopicDAO;