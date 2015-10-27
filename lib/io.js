/*
	Protocal:
		json: <json data>
		text: <text data>
		err: <error message>
 */
 
var pubsub  = require('node-internal-pubsub');
var auth = require('./auth');
var share = require('./share');
var slice = Array.prototype.slice;

////////////////////////////////////////////////////////////////////////////////////////
function IO (dblist, id, req, resp, errcb) {
	this.obj = {};
	this.id = id || 0;
	this.db = dblist;
	this.errcb = errcb || this.err;
	this.req = req;
	this.resp = resp;
}

// concat keys
function ck (a,b) {
	return b ? a+':'+b : a;
}

// concat dots
function cd (a,b) {
	return b ? a+'.'+b : a;
}

function merge(obj, key, value) {
	if (typeof key == 'string') {
		return merge(obj, key.split('.'), value);
	} else if (key.length==1 && value!==undefined) {
		var mobj = obj[key[0]];
		if (mobj !== null && typeof mobj === 'object' && typeof value === 'object') {
			for (var v in value) {
				mobj[v] = value[v];
			}
			return mobj;
		} else {
			return obj[key[0]] = value;
		}
	} else if (key.length==0) {
		return obj;
	} else {
		obj[key[0]] = obj[key[0]] || {};
		return merge(obj[key[0]], key.slice(1), value);
	}
}

// IOCursor has all prototypes of IO. See bottom of the source.
function getCursor (self) {
	if (self.ret) {
		return self;
	}
	return new IOCursor(self);
}

IO.prototype.ip = function() {
	return share.ip(this.req);
};

IO.prototype.login = function(credentials) {
	return auth.login(credentials);
};

IO.prototype._cb = function(p, ret, cb) {
	// store return value
	var r = this.ret[p] = this.ret[p] || [];
	r.push(ret);
	if (typeof cb === 'function') {
		// callback return
		cb.apply(this, r);
		this.ret[p] = [];
	}
};

// redis_op (0 arg)
function r0_j0 (self, cmd, key, id, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
}

// redis_op (0 arg), json_op (1 arg)
function r0_j1 (self, cmd, key, id, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, function(err, ret){
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual) {
			merge(self.obj, key, ret);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

// redis_op (1 arg), json_op (1 arg)
function r1_j1 (self, cmd, key, id, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, val, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual) {
			merge(self.obj, key, ret);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

// redis_op (1 arg)
function r1_j0 (self, cmd, key, id, val, cb) {
	var s = self.shard(key, id);	
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, val, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
}

// redis_op (n args)
function rn_j0 (self, cmd, id, argobj) {
	var args = slice.call(argobj);
	var last = args.length - 1;
	var cb = args[last];
	if (typeof cb === 'function') {	// user cb
		args.splice(last);
	} else {
		cb = null;
	}
	var key = args[0];
	var s = self.shard(key, id);
	args[0] = s.key;
	var cursor = getCursor(self);
	var db = self.db[s.partition];
	db[cmd].apply(db, args.concat(function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	}));	
	return cursor;
}

// json_op (1 arg), redis_op (1 arg)
function j1_r1 (self, cmd, key, id, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	if (s.individual) {
		merge(self.obj, key, val);
	}
	self.db[s.partition][cmd](s.key, val, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
}

////////////////////////////////////////////////////////////////////////////////////////
// bitcount key [start end]
IO.prototype.bitcount = function(key, start, end, cb) {
	return rn_j0(this, 'bitcount', this.id, arguments);
};

IO.prototype.del = function(key, cb) {
	var self = this;
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	if (s.individual) {
		merge(self.obj, key, null);
	}
	self.db[s.partition].del(s.key, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
};

IO.prototype.type = function(key, cb) {
	var self = this;
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].type(s.key, function(err, ret){
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
};

IO.prototype.time = function(cb) {
	var s = self.shard('', id);
	var cursor = getCursor(self);
	self.db[s.partition].time(function(err, ret){
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
};

IO.prototype.decr = function(key, cb) {
	return r0_j1(this, 'decr', key, this.id, cb);
};

IO.prototype.decrby = function(key, dec, cb) {
	return r1_j1(this, 'decrby', key, this.id, dec, cb);
};

IO.prototype.get = function(key, cb) {
	return r0_j1(this, 'get', key, this.id, cb);
};

IO.prototype.getbit = function(key, offset, cb) {
	return r1_j0(this, 'getbit', key, this.id, offset, cb);
};

IO.prototype.getset = function(key, val, cb) {
	return r1_j0(this, 'getset', key, this.id, val, cb);
};

IO.prototype.incr = function(key, cb) {
	return r0_j1(this, 'incr', key, this.id, cb);
};

// key inc
IO.prototype.incrby = function(key, inc, cb) {
	return r1_j1(this, 'incrby', key, this.id, inc, cb);
};

// key inc
IO.prototype.incrbyfloat = function(key, inc, cb) {
	return r1_j1(this, 'incrbyfloat', key, this.id, inc, cb);
};

// key ms val
IO.prototype.psetex = function(key, ms, val, cb) {
	return rn_j0(this, 'psetex', this.id, arguments);
};

// key val
IO.prototype.set = function(key, val, cb) {
	return j1_r1(this, 'set', key, this.id, val, cb);
};

// key offset val
IO.prototype.setbit = function(key, offset, val, cb) {
	return rn_j0(this, 'setbit', this.id, arguments);
};

// key seconds val
IO.prototype.setex = function(key, s, val, cb) {
	return rn_j0(this, 'setex', this.id, arguments);
};

// key val
IO.prototype.setnx = function(key, val, cb) {
	return j1_r1(this, 'setnx', key, this.id, val, cb);
};

// key val
IO.prototype.strlen = function(key, cb) {
	return r0_j0(this, 'strlen', key, this.id, cb);
};

////////////////////////////////////////////////////////////////////////////////////////
function hget (self, key, id, hkey, cb) {
	var s = self.shard(key, id);	
	var cursor = getCursor(self);
	self.db[s.partition].hget(s.key, hkey, function(err, val){
		if (err) {
			self.errcb(err);
			return;
		}

		// save to client
		if (s.individual) {
			merge(self.obj, cd(key, hkey), val);
		}
		cursor._cb(s.partition, val, cb);
	});
	return cursor;
}

function hgetall (self, key, id, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].hgetall(s.key, function(err, val){
		if (err) {
			self.errcb(err);
			return;
		}

		// save to client
		if (s.individual) {
			merge(self.obj, key, val);
		}
		cursor._cb(s.partition, val, cb);
	});
	return cursor;
}

function hmget (self, key, id, arr, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].hmget(s.key, arr, function(err, val) {
		if (err) {
			self.errcb(err);
			return;
		}
		// save client
		if (s.individual && val) {
			var obj = {};
			for (var i=0; i<arr.length; i++) {
				obj[arr[i]] = val[i];
			}
			merge(self.obj, key, obj);
		}
		cursor._cb(s.partition, val, cb);
	});
	return cursor;
}

function hmset (self, key, id, mod, cb) {
	var s = self.shard(key, id);
	if (s.individual) {
		merge(self.obj, key, mod);
	}
	var cursor = getCursor(self);
	self.db[s.partition].hmset(s.key, mod, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
}

function hincrby (self, cmd, key, id, hkey, inc, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, hkey, inc, function(err, val) {
		if (err) {
			self.errcb(err);
			return;
		}

		// save to client
		if (s.individual) {		
			merge(self.obj, cd(key,hkey), val);
		}
		cursor._cb(s.partition, val, cb);
	});
	return cursor;
}

function hset (self, cmd, key, id, hkey, val, cb) {
	var s = self.shard(key, id);
	if (s.individual) {
		merge(self.obj, cd(key,hkey), val);
	}
	if (typeof val === 'object') {
		val = JSON.stringify(val);
	}
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, hkey, val, function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	});
	return cursor;
}

function hdel (self, id, argobj) {
	var args = slice.call(argobj);
	var key = args[0];
	var last = args.length-1;
	var cb = args[last];
	if (typeof cb === 'function') {
		args.splice(last);
	}
	var s = self.shard(key, id);

	// tell client
	if (s.individual) {
		var obj = {};
		for (var i=0; i<args.length; i++) {
			obj[cd(key,args[i])] = null;
		}
		merge(self.obj, key, obj);
	}

	// add dbkey to redis cmd
	var cursor = getCursor(self);
	var db = self.db[s.partition];
	db.hdel.apply(db, args.concat(function(err, ret){
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	}));
	return cursor;
}

// hdel: key hkey [hkey ...]
IO.prototype.hdel = function() {
	return hdel(this, this.id, arguments);
};

// hexits: key hkey
IO.prototype.hexists = function(key, hkey, cb) {
	return r1_j0(this, 'hexists', key, this.id, hkey, cb);
};

// hget: key hkey
IO.prototype.hget = function(key, hkey, cb) {
	return hget(this, key, this.id, hkey, cb);
};

// hgetall: key
IO.prototype.hgetall = function(key, cb) {
	return hgetall(this, key, this.id, cb);
};

// hincrby: key hkey inc
IO.prototype.hincrby = function(key, hkey, inc, cb) {
	return hincrby(this, 'hincrby', key, this.id, hkey, inc, cb);
};

// hincrbyfloat: key hkey inc
IO.prototype.hincrbyfloat = function(key, hkey, inc, cb) {
	return hincrby(this, 'hincrbyfloat', key, this.id, hkey, inc, cb);
};

// hkeys: key
IO.prototype.hkeys = function(key, cb) {
	return r0_j0(this, 'hkeys', key, this.id, cb);
};

// hel: key
IO.prototype.hlen = function(key, cb) {
	return r0_j0(this, 'hlen', key, this.id, cb);
};

// hmget: key arr
IO.prototype.hmget = function(key, arr, cb) {
	return hmget(this, key, this.id, arr, cb);
};

// hmset: key mod
IO.prototype.hmset = function(key, mod, cb) {
	return hmset(this, key, this.id, mod, cb);
};

// key hkey val
IO.prototype.hset = function(key, hkey, val, cb) {
	return hset(this, 'hset', key, this.id, hkey, val, cb);
};

// key hkey json
IO.prototype.hsetjson = function(key, hkey, json, cb) {
	return hset(this, 'hset', key, this.id, hkey, json, cb);
};

// key hkey val
IO.prototype.hsetnx = function(key, hkey, val, cb) {
	return hset(this, 'hsetnx', key, this.id, hkey, val, cb);
};

// key
IO.prototype.hvals = function(key, cb) {
	return r0_j0(this, 'hvals', key, this.id, cb);
};

////////////////////////////////////////////////////////////////////////////////////////
function linsert (self, key, id, before_after, pivot, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].linsert(s.key, before_after, pivot, val, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}

		if (s.individual) {
			merge(self.obj, key, 1);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function lpop (self, cmd, key, id, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual && ret!==null) {
			merge(self.obj, cd(key,ret), null);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function lpush (self, cmd, id, argobj) {
	var args = slice.call(argobj);
	var key = args[0];
	var last = args.length-1;
	var cb = args[last];
	if (typeof cb === 'function') {
		args.splice(last);
	}
	var s = self.shard(key, id);
	if (s.individual) {
		var obj = {};
		for (var i=0; i<args.length; i++) {
			obj[args[i]] = 1;
		}
		merge(self.obj, key, obj);
	}
	var cursor = getCursor(self);
	var db = self.db[s.partition];
	db[cmd].apply(db, args.concat(function(err, ret){
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	}));
	return cursor;
}

function lpushx (self, cmd, key, id, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition][cmd](s.key, val, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual && ret>0) {
			merge(self.obj, cd(key,val), 1);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function lrange (self, key, id, start, stop, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].lrange(s.key, start, stop, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual && ret!==null) {
			var obj = {};
			for (var i=0; i<ret.length; i++) {
				obj[ret[i]] = 1;
			}
			merge(self.obj, key, obj);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function lrem (self, key, id, count, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].lrem(s.key, count, val, function(err, ret) {
		if (err) {
			errcb(err);
			return;
		}
		if (s.individual && ret > 0) {
			merge(self.obj, cd(key,val), null);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function lset (self, key, id, index, val, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].lset(s.key, index, val, function(err, ret) {
		if (err) {
			errcb(err);
			return;
		}
		if (s.individual) {
			merge(self.obj, cd(key,val), 1);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function rpoplpush (self, key, id, dest, cb) {
	var sr = self.shard(key, id);
	var sl = self.shard(dest, id);
	var cursor = getCursor(self);
	if (sr.partition === sl.partition) {	// same partition
		self.db[sr.partition].rpoplpush(sr.key, sl.key, function(err, ret) {
			if (err) {
				errcb(err);
				return;
			}
			if (ret !== null) {
				if (sr.individual) {
					merge(self.obj, cd(key,ret), null);
				}
				if (sl.individual) {
					merge(self.obj, cd(dest,ret), 1);
				}
			}
			cursor._cb(sr.partition, ret, cb);
		});
	} else {	// different partition: simulate with rpop & lpush
		self.db[sr.partition].rpop(sr.key, function(err, r){
			if (err) {
				errcb(err);
				return;
			}
			if (r === null) {
				cursor._cb(sr.partition, r, cb);
				return;
			}

			self.db[sl.partition].lpush(sl.key, r, function(err, l){
				if (err) {
					errcb(err);
					return;
				}
				if (sr.individual) {
					merge(self.obj, cd(key,r), null);
				}
				if (sl.individual) {
					merge(self.obj, cd(dest,r), 1);
				}
				cursor._cb(sl.partition, r, cb);
			});
		});
	}
	return cursor;
}

// lindex: key index
IO.prototype.lindex = function(key, index, cb) {
	return r1_j0(this, 'lindex', key, this.id, cb);
};

// linsert key before/after pivot val
IO.prototype.linsert = function(key, before_after, pivot, val, cb) {
	return linsert(this, key, this.id, before_after, pivot, val, cb);
};

// llen: key
IO.prototype.llen = function(key, cb) {
	return r0_j0(this, 'llen', key, this.id, cb);
};

// lpop: key
IO.prototype.lpop = function(key, cb) {
	return lpop(this, key, this.id, cb);
};

// lpush: key val val val ...
IO.prototype.lpush = function() {
	return lpush(this, 'lpush', this.id, arguments);
};

// lpushx: key val
IO.prototype.lpushx = function(key, val, cb) {
	return lpushx(this, 'lpushx', key, this.id, val, cb);
};

// lrange key start stop
IO.prototype.lrange = function(key, start, stop, cb) {
	return lrange(this, key, this.id, start, stop, cb);
};

// lrem key count val
IO.prototype.lrem = function(key, count, val, cb) {
	return lrem(this, key, this.id, count, val, cb);
};

// lset: key index val
IO.prototype.lset = function(key, index, val, cb) {
	return lset(this, key, this.id, index, val, cb);
};

// rpop: key
IO.prototype.rpop = function(key, cb) {
	return lpop(this, 'rpop', key, this.id, cb);
};

// rpoplpush: key dest
IO.prototype.rpoplpush = function(key, dest, cb) {
	return rpoplpush(this, key, this.id, dest, cb);
};

// rpush: key val val val ...
IO.prototype.rpush = function() {
	return lpush(this, 'rpush', this.id, arguments);
};

// rpushx: key val
IO.prototype.rpushx = function(key, val, cb) {
	return lpushx(this, 'rpushx', key, this.id, val, cb);
};

///////// SET

////////////////////////////////////////////////////////////////////////////////////////
function smove (self, key, id, dest, member, cb) {
	var s_from = self.shard(key, id);
	var s_to = self.shard(dest, id);
	var cursor = getCursor(self);
	if (s_from.partition === s_to.partition) {	// same partition
		self.db[s_from.partition].smove(s_from.key, s_to.key, member, function(err, ret) {
			if (err) {
				self.errcb(err);
				return;
			}
			if (ret !== null) {
				if (s_from.individual) {
					merge(self.obj, cd(key,member), null);
				}
				if (s_to.individual) {
					merge(self.obj, cd(dest,member), 1);
				}
			}
			cursor._cb(s_from.partition, ret, cb);
		});
	} else {	// simulate with srem & sadd
		self.db[s_from].srem(s_from.key, member, function(err, ret){
			if (err) {
				self.errcb(err);
				return;
			}
			if (ret === null) {
				cursor._cb(s_from.partition, ret, cb);
				return;
			}
			self.db[s_to].sadd(s_to.key, member, function(err, ret){
				if (s_from.individual) {
					merge(self.obj, cd(key,member), null);
				}
				if (s_to.individual) {
					merge(self.obj, cd(dest,member), 1);
				}	
				cursor._cb(s_to.partition, ret, cb);
			});
		});
	}
	return cursor;
}

function smembers (self, key, id, cb) {
	var s = self.shard(key, id);
	var cursor = getCursor(self);
	self.db[s.partition].smembers(s.key, function(err, ret) {
		if (err) {
			self.errcb(err);
			return;
		}
		if (s.individual && ret!==null) {
			var obj = {};
			for (var i=0; i<ret.length; i++) {
				obj[ret[i]] = 1;
			}
			merge(self.obj, key, obj);
		}
		cursor._cb(s.partition, ret, cb);
	});
	return cursor;
}

function srem (self, id, argobj) {
	var args = slice.call(argobj);
	var key = args[0];
	var last = args.length-1;
	var cb = args[last];
	if (typeof cb === 'function') {
		args.splice(last);
	}
	var s = self.shard(key, id);
	if (s.individual) {
		var obj = {};
		for (var i=1; i<args.length; i++) {
			obj[args[i]] = null;
		}
		merge(self.obj, key, obj);
	}
	var cursor = getCursor(self);
	var db = self.db[s.partition];
	db.srem.apply(db, args.concat(function(err, ret) {
		if (err) {
			self.errcb(err);
		} else {
			cursor._cb(s.partition, ret, cb);
		}
	}));
	return cursor;
}

// sadd: key member [member ...]
IO.prototype.sadd = function() {
	return lpush(this, 'sadd', this.id, arguments);
};

// scard: key
IO.prototype.scard = function(key, cb) {
	return r1_j0(this, 'scard', key, this.id, cb);
};

// key member
IO.prototype.sismember = function(key, member, cb) {
	return r1_j0(this, 'sismember', key, this.id, member, cb);
};

// smembers: key
IO.prototype.smembers = function(key, cb) {
	return smembers(this, key, this.id, cb);
};

// smove: key dest member
IO.prototype.smove = function(key, dest, member, cb) {
	return smove(this, key, this.id, dest, member, cb);
};

// spop: key
IO.prototype.spop = function(key, cb) {
	return lpop(this, 'spop', key, this.id, cb);
};

// srandmember key [count] => arr
IO.prototype.srandmember = function() {
	return rn_j0(this, 'srandmember', this.id, arguments);
};

// srem: key member [member ...]
IO.prototype.srem = function() {
	return srem(this, this.id, arguments);
};

////////////////////////////////////////////////////////////////////////////////////////
// zadd: key score member [score member ...]
IO.prototype.zadd = function() {
	return rn_j0(this, 'zadd', this.id, arguments);
};

// zcard: key
IO.prototype.zcard = function() {
	return rn_j0(this, 'zcard', this.id, arguments);
};

// key min max
IO.prototype.zcount = function() {
	return rn_j0(this, 'zcount', this.id, arguments);
};

// key inc member
IO.prototype.zincrby = function() {
	return rn_j0(this, 'zincrby', this.id, arguments);
};

// key min max
IO.prototype.zlexcount = function() {
	return rn_j0(this, 'zlexcount', this.id, arguments);
};

// key start stop [withscores]
IO.prototype.zrange = function() {
	return rn_j0(this, 'zrange', this.id, arguments);
};

// key min max [limit offset count]
IO.prototype.zrangebylex = function() {
	return rn_j0(this, 'zrange', this.id, arguments);
};

// key min max [limit offset count]
IO.prototype.zrevrangebylex = function() {
	return rn_j0(this, 'zrevrangebylex', this.id, arguments);
};

// key min max [withscores] [limit offset count]
IO.prototype.zrangebyscore = function() {
	return rn_j0(this, 'zrangebyscore', this.id, arguments);
};

// zrank: key member
IO.prototype.zrank = function(key, member, cb) {
	return r1_j0(this, 'zrank', key, this.id, member, cb);
};

// zrem: key member
IO.prototype.zrem = function(key, member, cb) {
	return rn_j0(this, 'zrem', key, this.id, member, cb);
};

// key min max
IO.prototype.zremrangebylex = function() {
	return rn_j0(this, 'zremrangebylex', this.id, arguments);
};

// key start stop
IO.prototype.zremrangebyrank = function() {
	return rn_j0(this, 'zremrangebyrank', this.id, arguments);
};

// key min max
IO.prototype.zremrangebyscore = function() {
	return rn_j0(this, 'zremrangebyscore', this.id, arguments);
};

// key start stop [withscores]
IO.prototype.zrevrange = function() {
	return rn_j0(this, 'zrevrange', this.id, arguments);
};

// key max min [withscores] [limit offset count]
IO.prototype.zrevrangebyscore = function() {
	return rn_j0(this, 'zrevrangebyscore', this.id, arguments);
};

// key member
IO.prototype.zrevrank = function() {
	return rn_j0(this, 'zrevrank', this.id, arguments);
};

// key member
IO.prototype.zscore = function(key, member, cb) {
	return rn_j0(this, 'zscore', key, this.id, member, cb);
};

////////////////////////////////////////////////////////////////////////////////////////
var utils = utils || {};
utils.FNV_OFFSET_32 = 0x811c9dc5;
utils.hash = function (input) {
    var hval = utils.FNV_OFFSET_32;

    // Strips unicode bits, only the lower 8 bits of the values are used
    for (var i = 0; i < input.length; i++) {
        hval = hval ^ (input.charCodeAt(i) & 0xFF);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }

    return hval >>> 0;
}

IO.prototype.shard = function(key, id) {
	var result = {};
	var n = this.db.length;
	if ((!key || /^[\w\.]+$/.test(key)) && id) {	// no key or key is variable name & id is non-zero => concat id to key
		result.partition = id % n;
		result.key = ck(key, id);
		result.individual = true;
	} else {
		result.partition = utils.hash(key) % n;
		result.key = key;
		result.individual = false;
	}
	return result;
};

// respond error msg to player
IO.prototype.err = function (msg) {
	var resp = this.resp;
	if (resp) {
		resp.statusCode = 400;
		resp.statusMessage = 'err: ' + msg;

		share.log(this.id || share.ip(this.req), '<===', resp.statusCode, resp.statusMessage);

		resp.end();
	}
};

// create another IO object
IO.prototype.fork = function (id, resp, errcb) {
	return new IO(this.db, id, null, resp, errcb);
};

// merge obj to this.obj
IO.prototype.merge = function(obj) {
	for (var key in obj) {
		merge(this.obj, key, obj[key]);
	}
};

// replace this.obj with obj, if obj != null
IO.prototype.end = function (evt, obj) {
	var s = this.shard('', this.id);
	this.db[s.partition].ping(function(){	// sync data
		if (!obj) {
			obj = evt;
			evt = null;
		}
		if (!obj) {
			obj = this.obj;
		}

		// return JSON or nothing
		if (this.resp) {
			var res, isjson = typeof obj === 'object';
			if (isjson) {
				res = JSON.stringify(obj);
			} else {
				res = obj;
			}
			if (evt) {
				res = evt + ': ' + res;
			} else {
				if (isjson) {
					res = 'json: ' + res;
				} else {
					res = 'text: ' + res;
				}
			}
			
			share.log(this.id || share.ip(this.req), '<===', res);

			this.resp.end(res);
		} else {
			this.push(this.id, obj);	// no resp => push
		}
	});
};

IO.prototype.nil = function(evt) {
	if (this.resp) {
		var res = evt ? evt + ': ' : 'text: ';
		this.resp.end(res);
	}
};

IO.prototype.listen = function () {
	if (!this.req || !this.resp) return;

	var internalSub = pubsub.createSubscriber();
	var self = this;
	internalSub.subscribe(self.id);
	internalSub.subscribe('broadcast');
	internalSub.on('message', function(channel, message){
		var msg = JSON.parse(message);
		self.resp.write('event: ' + msg.evt + '\n');
		self.resp.write('data: ' + msg.data + '\n\n');
	});

	this.resp.writeHeader(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	this.resp.write("retry: 1000\n");	

	this.req.connection.addListener('close', function(){
		internalSub.unsubscribe(self.id);
		internalSub.unsubscribe('broadcast');
		internalSub = null;
	}, false);
};

// send msg to player[id] via push server
IO.prototype._push = function(id, channel, evt, msg) {
	if (typeof msg === 'object') {
		msg = JSON.stringify(msg);
	}

	share.log(id || share.ip(this.req), '<...', evt, ':', msg);
	msg = {evt:evt, data:msg};

	var s = this.shard('push', id);
	this.db[s.partition].publish(channel, JSON.stringify(msg));
};

IO.prototype.push = function(id, evt, msg) {
	this._push(id, id, evt, msg);
};

IO.prototype.broadcast = function(evt, msg) {
	this._push(this.id, 'broadcast', evt, msg);
};

////////////////////////////////////////////////////////////////////////////////////////
function IOCursor (io) {
	this.ret = {};
	this.obj = io.obj;
	this.db = io.db;
	this.id = io.id;
	this.resp = io.resp;
	this.errcb = io.errcb;
}
IOCursor.prototype = Object.create(IO.prototype);
IOCursor.prototype.constructor = IOCursor;

module.exports = IO;
