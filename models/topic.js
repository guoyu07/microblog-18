function Topic(topic){
	this.userId = null;
	this.content = null;
	this.posts = null;
	this.time = null;
	this.user = null;

	if(topic){
		this.userId = topic.userId;
		this.content = topic.content;
		this.posts = topic.posts;
		this.time = topic.time;
		this.user = topic.user;
	}
}

module.exports = Topic;