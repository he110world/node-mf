var web = require('../../lib/web');

exports.helloserver = function (io) {
	io.end('Hello Client!');	// text: Hello Client!
};

exports.hellojson = function (io) {
	io.end({json:true});		// json: {"json":true}
};

exports.helloerror = function (io) {
	io.err('Don\'t panic!');
};

exports.push = function(io, id, evt, str) {
	io.push(id, evt, str);
	io.end();
};

exports.broadcast = function(io, evt, str) {
	io.broadcast(evt, str);
	io.end();
};

exports.pushjson = function(io, id, evt, obj) {
	io.push(id, evt, obj);
	io.end();
};

exports.broadcastjson = function(io, evt, obj) {
	io.broadcast(evt, obj);
	io.end();
};

exports.addCoin = function(io, add){
	io.hincrby('role', 'coin', add, function(coin){
		//io.hset('role', 'coin', coin);
		io.end();
	});
};

exports.html = function(io, title) {
	var main = web.main(title);
	main.row().h1('This is h1');
	var r2 = main.row();
	r2.h3('This is h3');
	r2.h4('This is h4');
	main.row().br().split(1,2,3,4,2,function(c1,c2,c3,c4,c5){
		c1.text('fuck');
		c2.text('you');
		c3.button('info', function(){
			alert('all');
		}).text('all');
		c4.button('danger', function(){
			alert('shit');
		}).text('shit');
		c5.text('!');
	});
	main.row().well().text('shit');
	var drop = main.row().dropdown('drop');
	drop.dropitem('http://www.google.com').text('google');
	drop.dropdivider();
	drop.dropitem('http://www.baidu.com').text('baidu');
	var result = main.compile();
	console.log(result);
	io.html(result);
};
