var jwt = require('jsonwebtoken');
var config = {};
var skipinfo = {};

exports.skip = function(method, url) {
	var validMethods = new RegExp(method);
	['GET','POST','PUT','DELETE'].forEach(function(method){
		if (validMethods.test(method)) {
			skipinfo[method] = skipinfo[method] || [];
			skipinfo[method].push(new RegExp(url));
		}
	});
};

function sign (payload) {
	return jwt.sign(payload, config.appkey);
};

exports.init = function(cfg) {
	if (typeof cfg === 'object') {
		config = cfg;
	}
	var s = config.skip_list;
	if (s) {
		for (var i=0; i<s.length; i+=2) {
			exports.skip(s[i], s[i+1]);
		}
	}
};

exports.login = function(uid) {
	var payload = {id:uid};
	return {token:sign(payload)};
};

exports.verify = function(req, cb) {
	var s = skipinfo[req.method];
	var skip = false;
	if (s) {
		for (var i=0; i<s.length; i++) {
			if (s[i].test(req.url)) {
				skip = true;
				break;
			}
		}
	}

	if (skip) {
		cb(null, {});
	} else {
		jwt.verify(req.headers.token, config.appkey, function (err, payload) {
			if (err) {
				cb(err);
			} else {
				cb(null, payload);
			}
		});
	}
};
