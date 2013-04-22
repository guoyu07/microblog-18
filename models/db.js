var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var redis = require('redis');


module.exports.mongodb = new Db(settings.mongodb.db, new Server(settings.mongodb.host, Connection.DEFAULT_PORT, {}), {w: 1, safe:false});

module.exports.redis_cli = redis.createClient(settings.redis.port, settings.redis.host);