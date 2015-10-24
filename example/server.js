var http = require('http');
var path = require('path');
var auth = require('../lib/auth');
var handler = require('../lib/handler');
var config = require('./config.json');

auth.skip('POST', '/user/.*');
auth.skip('POST', '/help/.*');
auth.skip('GET', '/help/.*');
auth.skip('POST', '/event/.*');
auth.skip('POST', '/test/.*');

(function initServer () {
	var port = parseInt(process.argv[2]);
	if (isNaN(port)) {
		console.log('Usage: node server.js <port>');
		process.exit(0);
	}
	auth.init(config);
	handler.init(path.relative('../lib', './handlers'), config);

	http.createServer(handler.serve).listen(port, function(){
		console.log("Game server started. Listening on port", port);
	});
})();
