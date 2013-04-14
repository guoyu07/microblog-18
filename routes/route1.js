var util = require("util");
var User = require("../models/user");
var UserDAO = require("../models/userDAO.js");
var TopicDAO = require('../models/topicDAO.js');
var Constants = require("../models/constants.js");
var appUtil = require("../models/appUtil.js");

module.exports = function(app){
	console.log("load route " + __filename);

	app.get('/', function(req, res){
	  res.render('index.ejs', { title: '微博客', layout:'layout.ejs'});
	});

	app.get('/reg', function(req, res){
	  res.render("reg.ejs", {title: '注册'});
	});

	app.get('/login', function(req, res){	  
	  if(null != req.session.user){
	  	res.redirect("/home");
	  }else{
	  	res.render("login.ejs", {title: '登录'});
	  }
	});

	app.get('/logout', function(req, res){
	  req.session.user = null;
	  res.redirect("/login");
	});

	app.get('/home', function(req, res){
	  //console.log(util.inspect(req.socket.emit));
	  if(null != req.session.user){
	  	res.render("home.ejs", {title: '个人中心', layout: Constants.VIEW.LOGINED_USER});
	  }else{
	  	req.flash('error', '您尚未登录，请先登录');
	  	res.redirect("/login");
	  }
	});

	app.post('/doLogin', function(req, res){
	  if(null != req.session.user){
	  	res.render("home.ejs", {title: '个人中心', layout: Constants.VIEW.LOGINED_USER});
	  	return;
	  }

	  var userDAO = new UserDAO();
	  userDAO.find({email: req.body['email'], password: req.body['password']}, function(err, users){
	  	if(err){	  
	  		req.flash('error', '服务器错误');		
	  		res.redirect("/login");
	  	}
	  	
	  	console.log("user login:" + JSON.stringify(users));

	  	if(null != users && users.length > 0){
	  		req.session.user = users[0];
            var socket = app.locals.getSocket(req.session.id);
            if(socket){
              socket.broadcast.emit('user message', req.session.user.name + ' come back');
            }
	  		res.redirect("/home");
	  	}else{
	  		req.flash('error', '用户名或密码不正确');
	  		res.redirect("/login");

	  	}
	  });	  
	});

	app.post("/doReg", function(req, res, next){
			var errorMessage = null;
			if(null == req.body['user.email'] || '' == appUtil.trim(req.body['user.email'])){
				errorMessage = '邮件地址不能为空';
			}else if(!Constants.REGEX.EMAIL.test(req.body['user.email'])){
				errorMessage = '邮件地址格式不正确';
			}else if(null == req.body['user.name'] || '' == appUtil.trim(req.body['user.name'])){
				errorMessage = '昵称不能为空';
			}else if(null == req.body['user.password'] || '' == appUtil.trim(req.body['user.password'])){
				errorMessage = '密码不能为空';
			}else if(null == req.body['user.confirmPassword'] || '' == appUtil.trim(req.body['user.confirmPassword'])){
				errorMessage = '确认密码不能为空';
			}else if(req.body['user.password'] != req.body['user.confirmPassword']){
				errorMessage = '确认密码和密码不一致';
			}

			if(null == errorMessage){
				next();
			}else{
				req.flash('error', errorMessage);
	  			res.redirect("/reg");
			}
		},
		function(req, res){
			var user = new User();
			var newUser = {
				email: req.body['user.email'],
				name: req.body['user.name'],
				password: req.body['user.password']
			};
			var userDAO = new UserDAO();
			userDAO.save(newUser, function(err, u){
				if(err){
					if(err.errorCode == -1){
						req.flash('error', '注册失败，请重试');
					}else if(err.err.indexOf('unique_email') > -1){
						req.flash('error', '邮件地址已被使用');
					}else{
						console.log('register error: ' + util.inspect(err));
						req.flash('error', '注册失败');
					}
					req.flash('user', u);
					res.redirect("/reg");
				}else{
					console.log("register user: " + JSON.stringify(u));
					req.session.user = u;
					res.redirect("/home");
				}
			});
	});

	app.get("/user/list", function(req, res){
	  var user = new User();
	  userDAO.find(null, function(users){
	  	console.log(util.inspect(users));
	  	var userList = [];
	  	if(users != null && users.length > 0){
	  		for(var i in users){
	  			userList[i] = new User(users[i]);
	  		}
	  	}
	  	res.send("用户列表:" + "<br/>" + userList);
	  });	  
	  
	});	

	app.get(/^\/user\/(\d+)/, function(req, res){
	  var user = new User();
	  userDAO.find({id: parseInt(req.params[0])}, function(users){
	  	console.log(util.inspect(users));
	  	if(users == null || users.length == 0){
	  		res.send("request url:" + req.url + "<br/>" + "id: " + req.params[0] + "<br/>" + "不存在的用户");
	  	}else{
	  		res.send("request url:" + req.url + "<br/>" + "id: " + req.params[0] + "<br/>" + new User(users[0]));
	  	}	  	
	  });  
	});

	app.get("/error", function(req, res){
		throw ERROR();
	});

	app.get("/dot", function(req, res){
		console.log('dot test');
		res.render("dotTest.dot");//, {layout: 'layout.dot'}
//        res.render("dotTest.dot", {layout: false});
	});
	
}