var util = require("util");
var mongodb = require('./db');

function User(user){
	this.id = null;
	this.email = null;
	this.password = null;

	if(user){
		this.id = user.id;
		this.email = user.email;
		this.name = user.name;
		this.password = user.password;
	}
	
}

module.exports = User;
