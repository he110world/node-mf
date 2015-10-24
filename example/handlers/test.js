exports.helloworld = function (io) {
	io.end({msg:'Hello Client!'});
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
	try {
		io.push(id, evt, obj);
	} catch (e) {
	}

	io.end();
};

exports.broadcastjson = function(io, evt, obj) {
	try {
		io.broadcast(evt, obj);
	} catch (e) {
	}

	io.end();
};
