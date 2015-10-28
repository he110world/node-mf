var fs = require('fs');
var url = require('url');
var path = require('path');
var mime = require('mime');
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
var staticCache = {};

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

exports.init = function (server_dir, cfg) {
	// already inited?
	if (Object.keys(handlers).length > 0) return;

	if (typeof cfg === 'object') {
		config = cfg;
	}

	// init handlers
	try {
		cfg.handler_dir = path.join(server_dir, cfg.handler_dir, '/');
		getFiles(cfg.handler_dir).forEach(function(name){
			if (endsWith(name, '.js')) {
				handlers[getBasename(name)] = require(name);
			}
		});
		if (typeof cfg.static_url === 'string') {
			cfg.static_url = new RegExp(cfg.static_url);
			cfg.static_dir = path.join(server_dir, cfg.static_dir, '/');
		}
	} catch (e) {
		console.log('Cannot load handlers from ' + cfg.handler_dir);
		console.log('Error:', e.stack);
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
			// static content?
			if (config.static_url && config.static_url.test(req.url)) {
				serveStatic(req, resp);
				return;
			}
			var args = req.url.split('?');
			handle(req, resp, payload, args[1]);
		}
	});
}

function serveStatic (req, resp) {
	// get file name
	var pathname = url.parse(req.url).pathname;
	var filename = path.join(config.static_dir, pathname.replace(config.static_url, ''));
	console.log(filename);
	fs.stat(filename, function(err, stat) {
		if(err) {
			resp.writeHead(404, {"Content-Type": "text/plain"});
			resp.write("404 Not Found\n");
			resp.end();
			return;
		}

		if (stat.isDirectory()) {
			filename = path.join(filename, 'index.html');
		}

		var cache = staticCache[filename];
		if (cache && cache.mtime.getTime()==stat.mtime.getTime()) {
			resp.writeHead(200, cache.head);
			resp.write(cache.file, "binary");
			resp.end();		
			return;
		}

		fs.readFile(filename, "binary", function(err, file) {
			if(err) {        
				resp.writeHead(500, {"Content-Type": "text/plain"});
				resp.write(err + "\n");
				resp.end();
				return;
			}

			// store cache
			var cache = {};
			cache.mtime = stat.mtime;
			cache.file = file;
			cache.head = {"Content-Type": mime.lookup(filename)};
			staticCache[filename] = cache;

			resp.writeHead(200, cache.head);
			resp.write(file, "binary");
			resp.end();
		});
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
