var fs = require('fs');
var redis = require('redis');
var IO = require('./io');
var auth = require('./auth');
var share = require('./share');
var pubsub  = require('node-internal-pubsub');
var internalPub = pubsub.createPublisher();

var config = {};
var handlers = {};
var dblist = [];
var sublist = [];

exports.info = function () {
	var info = {};
	for (var k in handlers) {
		info[k] = [];
		Object.keys(handlers[k]).forEach(function(cmd){
			info[k].push(cmd);
		});
	}
	return info;
};

exports.init = function (path, cfg) {
	// already inited?
	if (Object.keys(handlers).length > 0) return;

	if (typeof cfg === 'object') {
		config = cfg;
	}

	// init handlers
	try {
		getFiles(path).forEach(function(name){
			if (endsWith(name, '.js')) {
				handlers[getBasename(name)] = require(name);
			}
		});
	} catch (e) {
		console.log('Cannot load handlers from ' + path);
		console.log('Error:', e.message);
	}

	// init redis clients
	if (!config.redis) return;

	config.redis.forEach(function(addr){
		var host_port = addr.split(':');
		var host = host_port[0];
		var port = host_port[1];
		dblist.push(redis.createClient(port, host));

		// subscribe
		var redisSub = redis.createClient(port, host);
		redisSub.psubscribe('*');
		redisSub.on('pmessage', function(patern, channel, msg){
			internalPub.publish(channel, msg);
		});
		sublist.push(redisSub);
	});
};

exports.serve = function (req, resp){
	auth.verify(req, function(err, payload) {
		console.log('payload0',payload);
		if (err) {
			sendErr(req, resp, 401, 'token');
			return;
		}

		if (req.method === 'POST') {
			var body = '';
			req.on('data', function (data) {
				body += data;

				// reject >100k requests
				if (body.length > 1e5) {
					sendErr(req, resp, 413);
				}
			});
			req.on('end', function () {
				try {
					handle(req, resp, payload, body);
				} catch (e) {
					console.log(e.stack);
					sendErr(req, resp, 400);
				}
			}); 
		} else if (req.method === 'GET') {
			var args = req.url.split('?');
			handle(req, resp, payload, args[1]);
		}
	});
}

function sendErr (req, resp, code, msg) {
	share.log(share.ip(req), '<-x-', code, msg || '');

	resp.statusCode = code;
	resp.statusMessage = 'err: ' + msg;
	resp.end();
};

function handle (req, resp, payload, paramstr) {
	// parse args
	var params;
	if (typeof paramstr === 'string') {
	   	if (paramstr[0]==='[') {
			params = JSON.parse(paramstr);
		} else {
			params = paramstr.split(/[ ,]/);
		}
	} else {
		params = [];
	}
	var url = req.url.split(/[\/\?]/);
	var h, f;	// handler & function

	share.log(payload.id || share.ip(req), '===>', req.url.split('?')[0], params);

	if (!Array.isArray(params) || !(h=handlers[url[1]]) || !(f=h[url[2]])) {
		sendErr(req, resp, 400);
		return;
	}

	// call handler function	
	console.log('payload',payload);
	var io = new IO(dblist, payload.id, req, resp);
	f.apply(h, [io].concat(params));
};

function getFiles (dir, files_){
	files_ = files_ || [];
	var files = fs.readdirSync(dir);
	for (var i in files){
		var name = dir + '/' + files[i];
		if (fs.statSync(name).isDirectory()){
			getFiles(name, files_);
		} else {
			files_.push(name);
		}
	}
	return files_;
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function getBasename(str) {
	return str.split('/').pop().split('.').shift();
}
