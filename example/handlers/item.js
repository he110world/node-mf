var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

exports.expandBag = function(io){
	io.hmget('role', ['bagUsed','bagSize']).hget('item', 11000, function(usedAndSize, itemCnt){
		var item = new Class.Item(11000, itemCnt);
		var bagUsed = usedAndSize[0]
		var bagSize = usedAndSize[1]
		item.setBagInfo(bagUsed,bagSize);

		var cost = (Number(bagSize) - 10) * 10 + 50;
		item.isEnough(cost, function(err,data){
			if(err){
				io.err(data);
			}else{
				item.addItem(-cost, function(err, data){
					if(err){
						io.err(data);
					}else{
						io.hincrby('item', 11000, -cost);
						io.hincrby('role', 'bagUsed', data);
						
						io.hincrby('role', 'bagSize', 1);
						
						io.end();
					}
				});
			}
		});

	});
};
