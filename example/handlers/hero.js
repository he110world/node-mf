var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

exports.recruit = function(io){
	//随机获取heroid
	var length = share.length(sd.hero);
	var heroId = 15000 + share.rand(0, length - 1);

	var hero = new Class.Hero(heroId);
	if(hero.id === undefined){
		io.err('recruit');
		return;
	}

	io.hget('role', 'heroLimit').scard('heros', function(limit, cnt){
		if(limit - cnt > 0){
			io.hincrby('index', 'hero', 1, function(index) {
				io.sadd('heros', index);
				io.hmset('hero.' + index, hero);
				io.end();
			});
		}else{
			io.err('hero_full');
		}
	});
};

exports.setNick = function(io, index, nick){
	io.sismember('heros', index, function(ismember){
		console.log('setNick:', index, 'ismember', ismember);
		if(ismember){
			io.hset('hero.' + index, 'nick', nick);
			io.end();
		}else{
			io.err('no_this_hero');
		}
	});

	
}

exports.expandHeroLimit = function(io){
	io.hmget('role', ['packageUsed','packageLimit','heroLimit']).hget('package', 11000, function(limits, money){
		var money = new Class.Item(11000, money);
		var packageUsed = limits[0];
		var packageLimit = limits[1];
		var heroLimit = limits[2];
		money.setPackageInfo(packageUsed,packageLimit);

		var cost = (Number(heroLimit) - 10) * 50 + 100;
		money.isEnough(cost, function(err,data){
			if(err){
				io.err(data);
			}else{
				money.addItem(-cost, function(err, data){
					if(err){
						io.err(data);
					}else{

						if(money.cnt == 0){
							io.hdel('package', 11000);
						}else{
							io.hincrby('package', 11000, -cost);
						}
						io.hincrby('role', 'packageUsed', data);

						io.hincrby('role', 'heroLimit', 1);
						io.end();
					}
				});
			}
		});
	});
}
