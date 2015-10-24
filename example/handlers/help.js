var IO = require('../../lib/io');
var handler = require('../../lib/handler');

exports.io = function (io) {
	io.end(Object.keys(IO.prototype));
};

exports.handler = function (io) {
	io.end(handler.info());
};