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
}