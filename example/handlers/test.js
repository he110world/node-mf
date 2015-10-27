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
