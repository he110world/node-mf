share = require('../../lib/share')
Class = require('../class');

exports.setNick = function(io, nick){
	io.hset('role', 'nick', nick);
	io.end();
};