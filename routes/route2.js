var Topic = require('../models/topic.js');
var TopicDAO = require('../models/topicDAO.js');
var util = require('util');
var appUtil = require('../models/appUtil.js');

module.exports = function(app){
	console.log("load route " + __filename);
	
	app.post("/authed/topic/add", function(req, res, next){
			var errorMessage = null;
			if(null == req.body['content'] || '' == appUtil.trim(req.body['content'])){
				errorMessage = '内容不能为空';
			}else if(req.body['content'].length > 140){
				errorMessage = '内容长度超出140字';
			}

			if(errorMessage){
				res.send('{status:"error", msg:"' + errorMessage + '"}');
			}else{
				next();
			}
		},function(req, res){
			var topic = new Topic({
				userId: req.session.user.id,
				time: new Date(),
				content: req.body['content'],
				user:{name: req.session.user.name, id: req.session.user.id}
			});

			console.log(topic);
			var topicDAO = new TopicDAO();
			topicDAO.save(topic, function(err, t){
				if(err){
					res.send('{status:"error", msg:"发布失败，请重试"}');
				}else{
                    // var socket = app.locals.getSocket(req.session.id);
                    // if(socket){
                    //     socket.broadcast.emit('user message', req.session.user.name + ' <strong>:</strong> ' + topic.content);
                    // }
                    var sio = app.locals.getAttr("sio");
                    if(sio){
                    	sio.sockets.emit('all user message', req.session.user.name + ' <strong>:</strong> ' + topic.content);
                    }
					res.send('{status:"ok", msg:"发布成功"}');
				}
			});			
	});

	app.get('/topic/list', function(req, res){
	  var topicDAO = new TopicDAO();
	  topicDAO.find(null, function(err, topics){
	  	if(err){
	  		res.send('[]');
	  	}else{
	  		res.send(JSON.stringify(topics));
	  	}
	  });
	});
}