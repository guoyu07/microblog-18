$(function(){


	// var socket = io.connect();

    
	// socket.on('connect', function(){
	// 	$("#status").html('scoket connection established');
	// });

	// socket.on('message', function(message){
	// 	$("#status").html(message);
	// });

	// socket.on('user message', function(message){
	// 	$("#status").html(message);
	// });

	// socket.on('user connected', function(message){
	// 	$("#status").html(message);
	// });
	

	$.get('/topic/list'
		,function(data){
			if(data && data.length > 0){
				//socket.emit('user message', 'load ' + data.length + ' topics');
				$('#topics').html(new EJS({url: '/js/index/topics.ejs'}).render({posts: data}));
			}
		}
		,null
		,'json'
	);
});