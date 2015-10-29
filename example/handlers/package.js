var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

exports.expandPackage = function(io){
	io.hmget('role', ['packageUsed','packageLimit']).hget('package', 11000, function(usedAndLimit, itemCnt){
		var item = new Class.Item(11000, itemCnt);
		var packageUsed = usedAndLimit[0];
		var packageLimit = usedAndLimit[1];
		item.setPackageInfo(packageUsed,packageLimit);

		var cost = (Number(packageLimit) - 10) * 10 + 50;
		item.isEnough(cost, function(err,data){
			if(err){
				io.err(data);
			}else{
				item.addItem(-cost, function(err, data){
					if(err){
						io.err(data);
					}else{

						if(item.cnt == 0){
							io.hdel('package', 11000);
						}else{
							io.hincrby('package', 11000, -cost);
						}
						io.hincrby('role', 'packageUsed', data);

						io.hincrby('role', 'packageLimit', 1);
						
						io.end();
					}
				});
			}
		});
	});
};
