
/**
 * Module dependencies.
 */
var util = require('util');

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    partials = require('express-partials'),
    flash = require('connect-flash'),
    socketIo = require('socket.io'),
    MemoryStore = require('connect/lib/middleware/session/memory'),
    querystring = require('querystring'),
    expressLayouts = require('express-ejs-layouts'),
    doT = require('express-dot'),
    ejs = require('ejs'),
    settings = require('./settings'),
    RedisStore = require('connect-redis')(express);

var app = express(),
    sessionMap = [],
    conns = [],
    context = {},
    memoryStore = new RedisStore(settings.redis);//new MemoryStore();

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

app.configure(function () {//noinspection JSValidateTypes
    "use strict";
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
        store: memoryStore,
        key: settings.sessionid_key
    }));


    app.use(express.static(path.join(__dirname, 'public')));

    app.locals.getSocket = function (sid) {
        return conns[sid];
    };

    app.locals.setAttr = function (name, value) {
        context[name] = value;
        return context;
    };

    app.locals.getAttr = function (name) {
        return context[name];
    };

    console.log("dirpath is " + __dirname);
});


app.configure('development', function () {
    "use strict";
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

//映射路由
routes(app);

var server = http.createServer(app);
var sio = socketIo.listen(server);
app.locals.setAttr("sio", sio);
sio.configure(function () {
    "use strict";
    sio.disable('log');
});

function parseCookie(cookiesStr) {
    "use strict";
    var Cookies = {};
    if (cookiesStr) {
        cookiesStr.split(';').forEach(function (Cookie) {
            var parts = Cookie.split('=');
            Cookies[parts[0].trim()] = (parts[1] || '').trim();
        });
    }

    return Cookies;
}

sio.set('authorization', function (handshakeData, callback) {
    "use strict";
    var cookie = parseCookie(handshakeData.headers.cookie),
        connet_sid = querystring.unescape(cookie[settings.sessionid_key]),
        matches = connet_sid.match("s:([^.]+)"),
        sid = null;
    if (null !== matches) {
        sid = matches[1];
        memoryStore.get(sid, function (error, session) {
            if (error) {
                console.log('get session failure:' + error);
                callback(error.message, false);
            } else if (null !== session) {
                console.log('session id = ' + sid);
                handshakeData.session = session;
                handshakeData.session.id = sid;
                callback(null, true);
            } else {
                callback('no session ', false);
            }
        });
    } else {
        callback('no session');
    }
});

server.on("error", function (err) {
    "use strict";
    console.log("***********************************************************************");
});

server.listen(app.get('port'), function () {
    "use strict";
    console.log("Express server listening on port " + app.get('port'));
});

sio.sockets.on('connection', function (socket) {
    "use strict";
    console.log('web socket connection established ...');
    var user = '';
    if (socket.handshake.session) {
        conns[socket.handshake.session.id] = socket;
        if (socket.handshake.session.user) {
            user = socket.handshake.session.user;
            socket.broadcast.emit('user connected', '大家好， ' + socket.handshake.session.user.name + ' 回来了');
        }
    }

    socket.on('disconnect', function () {
        console.log('[' + user.name + ']' + '离开了');
        sio.sockets.emit('user message', '[' + user.name + ']' + '离开了');
    });

    socket.on('user message', function (msg) {
        console.log('user message : ' + msg);
        //socket.emit('user message', msg);
    });

    socket.on('user leave', function (msg) {
        console.log('someone leave : ' + msg);
        //socket.emit('user message', msg);
    });
});


