var share = require('../../lib/share')
var Class = require('../class');
var sd = require('../staticData.json');
var common = require('../common');

(function initWeighting(){
	var keys = Object.keys(sd.mission);
	var lw = 0;
	for(var i = 0; i < keys.length; i++){
		var key = keys[i];
		var mission = sd.mission[key];
		if(mission.rWeighting){
			break;
		}

		mission.rWeighting = Number(mission.Weighting) + lw;
		lw = mission.rWeighting

		//console.log("initWeighting", key, lw);
		sd.mission[key] = mission;
	}
})();

(function initCost(){
	for(var key in sd.mission){
		var mission = sd.mission[key];
		if(typeof mission.Cost !== 'string'){
			continue;
		}

		var costs = mission.Cost.split('$');
		for(var i = 0; i < costs.length; i++){
			costs[i] = costs[i].split('~');
		}
		mission.Cost = costs;
	}
})();

(function initRewardItem(){
	for(var key in sd.mission){
		var mission = sd.mission[key];
		if(typeof mission.RewardItem !== 'string'){
			continue;
		}

		var rews = mission.RewardItem.split('$');
		for(var i = 0; i < rews.length; i++){
			rews[i] = rews[i].split('~');
		}
		mission.RewardItem = rews;
	}
})();



exports.explore = function(io){
	io.hset('mission', 'explore', Date.now() + '$20000');
	io.end();
};


exports.settleExplore = function(io){
	io.hget('mission', 'explore', function(explore){
		if(!explore){
			io.hset('mission', 'explore', Date.now() + '$20000');
			io.end();
			return;
		}

		var time = common.timeFormat(explore);
		if(time.start){
			var dt = Date.now() - time.start;
			time.left -= dt;
		}
		time.start = Date.now();

		if(time.left <= 0){
			var mission = getRandomMission();
			io.hset('mission', 'explore', Date.now() + '$20000');
			io.hset('mission', 'cur', mission);
			io.end();
		}else{
			io.hset('mission', 'explore', time.start + '$' + time.left);
			io.end();
		}
		
	});
};

exports.finish = function(io, missionId){
	io.hget('mission', 'cur', function(curMission){
		if(curMission){
			var missionArr = curMission.split('$');
			if(missionArr.indexOf(missionId) != -1){
				var costs = sd.mission[missionId].Cost;
				var itemIds = [];
				var itemCosts = [];
				for(var i = 0; i < costs.length; i++){
					itemIds.push(costs[i][0]);
					itemCosts.push(costs[i][1]);
				}

				io.hmget('role', ['packageUsed','packageLimit']).hmget('package', itemIds, function(limits, itemCnts){
					var packageUsed = Number(limits[0]);
					var packageLimit = Number(limits[1]);

					var isEnough = true;
					var packageUsedAdd = 0;
					var items = [];
					for(var i = 0; i < itemCnts.length; i++){
						var item = new Class.Item(itemIds[i], itemCnts[i]);
						item.setPackageInfo(packageUsed + packageUsedAdd,packageLimit);
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
						var rewards = sd.mission[missionId].RewardItem;
						var rewardIds = [];
						var rewardNums = [];
						for(var i = 0; i < rewards.length; i++){
							rewardIds.push(rewards[i][0]);
							rewardNums.push(rewards[i][1]);
						}
						io.hmget('package', rewardIds, function(itemCnts){
							var canAdd = true;
							for(var i = 0; i < itemCnts.length; i++){
								var item = new Class.Item(rewardIds[i], itemCnts[i]);
								item.setPackageInfo(packageUsed + packageUsedAdd, packageLimit);
								items.push(item);

								item.addItem(rewardNums[i], function(err, data){
									if(err){
										canAdd = false;
									}else{
										packageUsedAdd += Number(data);
									}
								});
								if(!canAdd){
									break;
								}
							}

							if(canAdd){
								for(var i = 0; i < items.length; i++){
									if(items[i].cnt == 0){
										io.hdel('package', items[i].id);
									}else{
										io.hset('package', items[i].id, items[i].cnt);
									}
								}
								io.hincrby('role', 'packageUsed', packageUsedAdd);
								io.hincrby('role', 'exp', sd.mission[missionId].RewardExp);

								console.log(missionArr, missionId);
								var mission = '';

								for(var i = 0; i < missionArr.length; i++){
									if(missionArr[i] == missionId){
										delete(missionArr[i]);
										break;
									}
								}
								console.log(missionArr, missionId);
								for(var i = 0; i < missionArr.length; i++){
									mission += missionArr[i];
									if(i != missionArr.length - 1){
										mission += '$';
									}
								}
								console.log(missionArr, mission);
								io.hset('mission', 'cur', mission);
								io.end();
							}else{
								io.err('package_full');
							}
						});
					}else{
						io.err('not_enough_item');
					}
				});	
			}else{
				io.err('no_this_mission');
			}
		}else{
			io.err('no_this_mission');
		}
	});
};

function getRandomMission(){
	var keys = Object.keys(sd.mission);
	var maxWeight = sd.mission[keys[keys.length - 1]].rWeighting;

	var rand1 = share.rand(0, maxWeight);
	var rand2 = share.rand(0, maxWeight);
	var rand3 = share.rand(0, maxWeight);

	var key1 = 0;
	var key2 = 0;
	var key3 = 0;

	//console.log(maxWeight, rand1, rand2, rand3);

	for(var i = 0; i < keys.length; i++){
		var key = keys[i];
		var mission = sd.mission[key];
		if(key1 == 0 && mission.rWeighting - rand1 >= 0){
			key1 = key;
		}

		if(key2 == 0 && mission.rWeighting - rand2 >= 0){
			key2 = key;
		}

		if(key3 == 0 && mission.rWeighting - rand3 >= 0){
			key3 = key;
		}

		if(key1 != 0 && key2 != 0 && key3 != 0){
			break;
		}
	}

	return key1 + '$' + key2 + '$' + key3;
};


