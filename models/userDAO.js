var util = require("util");
var mongodb = require('./db').mongodb;

function UserDAO(){
	
}

UserDAO.prototype.find = function(user, callback) {
	mongodb.open(function(err, db){
	    if(err){
	      mongodb.close();
	      return callback(err);
	    }
	    db.collection("user", function(err, collection){
	      if(err){
	        mongodb.close();
	        return callback(err);
	      }
	      collection.find(user).toArray(function(err, results){
	        if(err){
	          mongodb.close();
	          return callback(err,results);
	        }     

	        mongodb.close();

	        callback(err,results);
	      });
	      
	    });
	  });
};

UserDAO.prototype.save = function(user, callback) {
	mongodb.open(function(err, db){
	    if(err){
	      mongodb.close();
	      return callback(err);
	    }
	    db.eval("getUserId();", function(err, data){
	      if(err){
	        mongodb.close();
	        return callback(err);
	      }

	      user.id = data;
	      db.eval('setUserId(' + data + ')', function(err, data){
	      	if(data){
	      		db.collection('user', function(err, collection){
		      	if(err){
			       mongodb.close();
			       return callback(err);
			    }
			    collection.ensureIndex('email', {unique: true}, function(err){
			    	if(err){
				       mongodb.close();
				       return callback(err);
				    }
				    collection.insert(user, {safe: true}, function(err, backUsers){
				    	mongodb.close();
				    	var u = null;
				    	if(err){
				    		u = user;
				    	}else{
				    		console.log('insert user');
				    		u = backUsers[0];
				    	}
				    	callback(err, u);
				    });
			    });
		      });	      
	      	}else{
	      		callback({code:-1, err: 'get user id failure'},user);
	      	}
	      });
	    });
	  });
};

UserDAO.prototype.toString = function(){
	return "{id:" + this.id + ", name:" + this.name + ", email:" + this.email + "}";
}

module.exports = UserDAO;
