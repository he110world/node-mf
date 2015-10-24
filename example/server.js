var http = require('http');
var path = require('path');
var auth = require('../lib/auth');
var handler = require('../lib/handler');
var config = require('./config.json');

(function initServer () {
	// get server port
	var port = parseInt(process.argv[2]);
	if (isNaN(port)) {
		console.log('Usage: node server.js <port>');
		process.exit(0);
	}

	// init auth & handler
	auth.init(config.auth);
	handler.init(path.relative('../lib', './handlers'), config.handler);

	// create server
	http.createServer(handler.serve).listen(port, function(){
		console.log("Game server started. Listening on port", port);
	});
})();
