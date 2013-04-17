
/**
 * Module dependencies.
 */
var util = require('util');
var emitter = require('events').EventEmitter();

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , partials = require('express-partials')
  , flash = require('connect-flash')
  , socketIo = require('socket.io')
  , MemoryStore = require('connect/lib/middleware/session/memory')
  , querystring = require('querystring')
  , expressLayouts = require('express-ejs-layouts')
  , doT = require('express-dot')
  , ejs = require('ejs')
  ;

var app = express();
var settings = require('./settings');
var MongoStore = require('connect-mongo')(express);
var sessionMap = [];
var memoryStore = new MemoryStore();
//    new MongoStore({
//    db: settings.db
//});//new MemoryStore();

var socketPort = 8888;
var conns = [];
var context = {};
expressLayouts.register('ejs');

doT.setGlobals({
    layout: false,
    partialCache: false
});

doT.setTemplateSettings({
    evaluate:    /\<\%([\s\S]+?\}?)\%\>/g,
    interpolate: /\<\%=([\s\S]+?)\%\>/g,
    encode:      /\<\%!([\s\S]+?)\%\>/g,
    use:         /\<\%#([\s\S]+?)\%\>/g,
    useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
    define:      /\<\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\>/g,
    defineParams:/^\s*([\w$]+):([\s\S]+)/,
    conditional: /\<\%\?(\?)?\s*([\s\S]*?)\s*\%\>/g,
    iterate:     /\<\%~\s*(?:\%\>|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\>)/g
});

app.configure(function()//noinspection JSValidateTypes
{
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('.dot', doT.__express);
  app.engine('.ejs', ejs.__express);

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(flash());
  app.use(express.methodOverride());
  app.use(expressLayouts.layout);//使ejs 和 doT能并存
//  app.use(partials());//必须放在app.use(app.router);前面，否则不起作用
  app.use(express.cookieParser());
  app.use(express.session({
    secret: settings.cookieSecret,
    store: memoryStore
  }));

  //app.use(app.router);
  
  app.use(express.static(path.join(__dirname, 'public')));

  app.locals.getSocket = function(sid){
      return conns[sid];
  };

  app.locals.setAttr = function(name, value){
    context[name] = value;
    return context;
  };

  app.locals.getAttr = function(name){
    return context[name];
  };

  console.log("dirpath is " + __dirname);
});


app.configure('development', function(){
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));  
});

//映射路由
routes(app);

var server = http.createServer(app);
var sio = socketIo.listen(server);
app.locals.setAttr("sio", sio);
sio.configure(function () {
  sio.disable('log');
});

function parseCookie(cookiesStr){
    var Cookies = {};
    cookiesStr && cookiesStr.split(';').forEach(function( Cookie ) {
        var parts = Cookie.split('=');
        Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
    });

    return Cookies;
}

sio.set('authorization', function(handshakeData, callback){

    var cookie = parseCookie(handshakeData.headers.cookie);
    var connet_sid = querystring.unescape(cookie['connect.sid']);
    var matches = connet_sid.match("s:([^.]+)");
    var sid = null;
    if(null != matches){
        sid = matches[1];
        memoryStore.get(sid, function(error, session){
            if(error){
                console.log('get session failure:' + error);
                callback(error.message, false);
            }else{
                if(null != session){
                    console.log('session id = ' + sid);
                    handshakeData.session = session;
                    handshakeData.session.id = sid;
                    callback(null, true);
                }else{
                    callback('no session ', false);
                }

            }
        })
    }else{
        callback('no session');
    }
});

server.on("error", function(err){
  console.log("***********************************************************************");
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

sio.sockets.on('connection', function(socket){
    console.log('web socket connection established ...');
    if(socket.handshake.session){
        conns[socket.handshake.session.id] = socket;
        if(socket.handshake.session.user){
            socket.broadcast.emit('user connected', '大家好， ' + socket.handshake.session.user.name + ' 回来了');
        }
    }

    socket.on('user message', function (msg) {
      console.log('user message : ' + msg);
      //socket.emit('user message', msg);
    });
});


