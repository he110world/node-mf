exports.login = function (io, udid){
	io.hget('udid->uid', udid, function(uid){
		if (uid) {
			io.end(io.login(uid));
		} else {
			io.err('invalid_udid');
		}
	});
};

exports.register = function (io, udid){
	io.hexists('udid->uid', udid, function(exists) {
		if (exists) {
			io.err('udid_exists');
		} else {
			io.hincrby('type->count', 'id', function(uid) {
				var ids = {udid:udid};
				io.hset('udid->uid', udid, uid);
				io.hset('uid->ids', uid, JSON.stringify(ids));
				io.end();
			});
		}
	});
};

exports.clear = function (io, udid) {
	io.hget('udid->uid', udid, function(uid){
		if (uid) {
			io.hdel('udid->uid', udid);
			io.hdel('uid->ids', uid);
			io.end();
		} else {
			io.err('invalid_udid');
		}
	});
};
