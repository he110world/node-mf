var share = require('../../lib/share')
var Class = require('../class');

exports.login = function (io, udid){
	console.log('login udid:',udid)
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
			io.err('existing_udid');
		} else {
			io.hincrby('type->count', 'id', 1, function(uid) {
				var ids = {udid:udid};
				io.hset('udid->uid', udid, uid);
				io.hset('uid->ids', uid, JSON.stringify(ids));
				
				io.id = uid;
				var role = new Class.Role(uid);
				//role.addCoin(100);
				io.hmset('role', role);

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

			io.id = uid;
			io.del('role');
			io.del('package');
			io.del('techs');
			io.del('rtechs');
			io.smembers('buildings', function(buildings){
				buildings.forEach(function(key, i){
					var cNum = io.hget('building.' + key, 'columnLimit');
					var columnName = [];
					for(var i = 0; i < cNum; i++){
						columnName.push('.column.' + i);
					}
					columnName.forEach(function(key, i){
						io.del('building.' + key + columnName[i]);
					});
					io.del('building.' + key);
					
					io.del('buildings');
					io.smembers('heros', function(heros){
						heros.forEach(function(key, i){
							io.del('hero.' + key);
						});
						io.del('heros');
						io.del('index');
						io.end();
					});
				});
			});
		} else {
			io.err('invalid_udid');
		}
	});
};

exports.view = function (io) {
	var keysArr = [];
	for (var i=1; i<arguments.length; i++) {
		var tmp = arguments[i].split('$');
		for (var j=0; j<tmp.length; j++) {
			if(tmp && tmp[j]){
				keysArr.push(tmp[j]);
			}
		}
	}
	
	var processed = 0;
	var keyType = {};
	keysArr.forEach(function(key, i){
		io.type(key, function(type){
			console.log(io.id,i,key,type);
			switch (type) {
				case 'list':
				io.lrange(key, 0, -1);
				break;
				case 'string':
				io.get(key);
				break;
				case 'set':
				io.smembers(key);
				break;
				case 'hash':
				io.hgetall(key);
				break;
				case 'sorted_set':
				io.zrange(key, 0, -1);
				break;
				case 'none':
				break;
			}
			++processed;
			if(processed == keysArr.length){
				io.end();
			}
		});
	});
	
};

exports.time = function(io){
	io.end(Date.now());
}
