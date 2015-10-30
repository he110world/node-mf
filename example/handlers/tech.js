var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

(function initTechCost(){
	for(var key in sd.tech){
		var tech = sd.tech[key];
		if(typeof tech.Cost !== 'string'){
			continue;
		}

		var costs = tech.Cost.split('$');
		for(var i = 0; i < costs.length; i++){
			costs[i] = costs[i].split('~');
		}
		tech.Cost = costs;
	}
})();

exports.settle = function(io, id){
	io.hget('rtechs', id, function(rtech){
		if(rtech === undefined){
			io.err('no_this_tech');
			return;
		}

		var t = rtech.split('$');
		var dt = Date.now() - t[0]
		if(dt >= t[1]){
			io.hdel('rtechs', id);
			io.sadd('techs', id);
		}else{
			var newt = t[1]- dt;
			newt = Date.now() + '$' + newt;
			io.hset('rtechs', id, newt);
		}
		io.end();
	});
}

exports.settleall = function(io){
	io.hgetall('rtechs', function(rtechs){
		rtechs.forEach(function(key, i){
			var t = rtechs[key].split('$');
			var dt = Date.now() - t[0]
			if(dt >= t[1]){
				io.hdel('rtechs', key);
				io.sadd('techs', key);
			}else{
				var newt = t[1]- dt;
				newt = Date.now() + '$' + newt;
				io.hset('rtechs', key, newt);
			}
		});
		io.end();
	});
}

exports.research = function(io, id){
	var tech = sd.tech[id];
	if(tech == undefined){
		io.err('no_this_tech');
		return;
	}

	io.hexists('rtechs', id).sismember('techs', id, function(ismember1, ismember2){
		if(!ismember1 && !ismember2){
			var costs = tech.Cost;
			var itemIds = [];
			var itemCosts = [];
			for(var i = 0; i < costs.length; i++){
				itemIds.push(costs[i][0]);
				itemCosts.push(costs[i][1]);
			}

			io.hmget('role', ['packageUsed','packageLimit']).hmget('package', itemIds, function(limits, itemCnts){
				var packageUsed = limits[0];
				var packageLimit = limits[1];

				var isEnough = true;
				var packageUsedAdd = 0;
				var items = [];
				for(var i = 0; i < itemCnts.length; i++){
					var item = new Class.Item(itemIds[i], itemCnts[i]);
					item.setPackageInfo(packageUsed,packageLimit);
					items.push(item);

					item.isEnough(itemCosts[i], function(err,data){
						if(err){
							isEnough = false;
						}else{
							item.addItem(-itemCosts[i], function(err, data){
								if(err){
									isEnough = false;
								}else{
									packageUsedAdd += Number(data);
								}
							});
						}
					});
					if(!isEnough){
						break;
					}
				}

				if(isEnough){
					items.forEach(function(key, i){
						if(items[i].cnt == 0){
							io.hdel('package', items[i].id);
						}else{
							io.hset('package', items[i].id, items[i].cnt);
						}
					});
					io.hincrby('role', 'packageUsed', packageUsedAdd);

					io.hset('rtechs', id, Date.now() + "$" + tech.Time * 1000);
					io.end();
				}else{
					io.err('not_enough_item');
				}
			});
		}else{
			io.err('tech_exist');
		}
	});
};
