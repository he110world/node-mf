var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

exports.build = function(io, id){
	io.sismember('buildings', id, function(ismember){
		if(!ismember){
			var building = new Class.Building(id);
			io.sadd('buildings', id);
			io.hmset('building.' + id, building);
			io.end();
		}else{
			io.err('building_exist');
		}
	});
};
