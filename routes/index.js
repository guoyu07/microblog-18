var util = require("util");

module.exports = function(app){

	console.log("init route index ...");	

	//--------------------------------------  locals  --------------------------------------
	app.use(function locals(req, res, next){  	  
	  res.locals({req: req});
	  res.locals({session: req.session});
	  res.locals({error: req.error});
	  res.locals({success: req.success});
	  res.locals({docs: req.docs});
	  res.locals({flash: req.flash});
	  next();
	});

	//--------------------------------------  TRACE  --------------------------------------
	app.all("/*", function(req, res, next){
		console.log("TRACE: " + req.method + " " + req.url + " PARAMS: " + JSON.stringify(req.body));
		//console.log();
		try{			
			next();
		}catch(err){
			errorHandler(err, req, res, next);
		}
	});

	//----------------------------------  SECURITY FILTER  ----------------------------------
	app.all('/authed/*',function securityFilter(req, res, next){
		console.log(req.session.user);
		if(null == req.session.user || '' == req.session.user){
			req.flash('error', '您尚未登录，请先登录');
			res.redirect('/login');
		}else{
			next();
		}
	});

	//---------------------------------- LOAD ROUTE -----------------------------------------

	require("./route1")(app);
	require("./route2")(app);	
	
	//---------------------------------------  错误处理  -------------------------------------

	//404处理
	app.get("*", function(req, res){        
	  res.render("404", {title: "请求资源不存在"});
	});

	//异常处理	

	app.use(function error(err, req, res, next){

	  console.log("====================== ERROR HANDLER ======================");
	  
	  if(err){
	    console.log(err.stack);
	    res.render("500", {title: "服务器内部错误"});             
	  }else{
	    next();
	  }    
	});

	//-----------------------------------------------------------------------------------------
}