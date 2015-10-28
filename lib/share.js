exports.verbose = true;

exports.log = function () {
	if (exports.verbose) {
		console.log.apply(null, arguments);
	}
};

exports.ip = function (req) {
	if (!req) {
		return 'unknown';
	}
	
	var ip = req.connection.remoteAddress;
	if (ip) {
		return ip.replace('::ffff:', '');
	} else {
		return 'unknown';
	}
};

exports.length = function (obj) {
	var type = typeof obj;
	if (type === 'object') {
		return Object.keys(obj).length;
	} else if (type === 'string') {
		return obj.length;
	} else {
		return 0;
	}
};

exports.rand = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + Number(min);	
};