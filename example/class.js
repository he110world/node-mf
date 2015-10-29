var sd  =require('./staticData.json');
//----------------------------------------------------
//Role
exports.Role = function (role) {
	if (typeof role === 'object') {
		this.uid = role.uid;
		this.nick = role.nick || '';
		this.exp = Number(role.exp) || 0;
		this.packageLimit = Number(role.packageLimit) || 10;
		this.packageUsed = Number(role.packageUsed) || 0;
		this.heroLimit = Number(role.heroLimit) || 10;
	} else { // role = uid
		this.uid = role;
		this.nick = '';
		this.exp = 0;
		this.packageLimit = 10;
		this.packageUsed = 0;
		this.heroLimit = Number(role.heroLimit) || 10;
	}

};
//----------------------------------------------------


//----------------------------------------------------
//Item
exports.Item = function(id, cnt){
	var item = sd.item[id];

	this.id = item === undefined ? undefined : id;
	this.limit = item === undefined ? 0 : item.Limit;
	this.cnt = Number(cnt) || 0;
	this.packageUsed = 0;
	this.packageLimit = 0;
};

//更新道具所在背包信息
exports.Item.prototype.setPackageInfo = function(packageUsed, packageLimit){
	var self = this;
	self.packageUsed = Number(packageUsed);
	self.packageLimit = Number(packageLimit);
}


//道具是否足够
exports.Item.prototype.isEnough = function(needNum, cb){
	var self = this;
	if(self.id === undefined){
		cb(true, 'no_this_item');
	}

	if(self.cnt - needNum < 0){
		cb(true, 'not_enough_item');
	}else{
		cb(false);
	}
}

//增加道具（可减），同时计算所在背包使用状况
exports.Item.prototype.addItem = function(addNum, cb) {
	var self = this;
	if(self.id === undefined){
		cb(true, 'no_this_item');
	}

	console.log(self.id, "item:", self.cnt+'/'+ self.limit, "add:", addNum, "package:", self.packageUsed+'/'+self.packageLimit);

	//money & coin
	if(self.id == 11000 || self.id == 11001){

		if(self.limit - self.cnt >= addNum){
			self.cnt += Number(addNum);
			cb(false, 0);
		}else{
			self.cnt = self.limit;
			cb(false, 0);
		}
		return;
	}

	var used = Math.ceil(self.cnt / self.limit);
	var addUsed = Math.ceil((self.cnt + Number(addNum)) / self.limit) - used;

	if(self.packageUsed + Number(addUsed) <= self.packageLimit){
		self.cnt += Number(addNum);
		cb(false, Number(addUsed));
	}else{
		cb(true, 'package_limit');
	}
};
//----------------------------------------------------

//----------------------------------------------------
//Hero
exports.Hero = function(hero){
	if (typeof role === 'object') { 
		this.id = Number(hero.id);
		this.name = hero.name;
		this.nick = hero.nick;
		this.quality = Number(hero.quality);
		this.type = Number(hero.type);
		this.level = Number(hero.level);
		this.exp = Number(hero.exp);
		this.curJob = hero.curJob;
		this.pastJob = hero.pastJob;

		this.strength = Number(hero.strength);
		this.maxStrength = Number(hero.maxStrength);
		this.agile = Number(hero.agile);
		this.maxAgile = Number(hero.maxAgile);
		this.endurance = Number(hero.endurance);
		this.maxEndurance = Number(hero.maxEndurance);
		this.intelligence = Number(hero.intelligence);
		this.maxIntelligence = Number(hero.maxIntelligence);
		this.spirit = Number(hero.spirit);
		this.maxSpirit = Number(hero.maxSpirit);

		this.lucky = Number(hero.lucky);

		this.jobSkill = Number(hero.jobSkill);
		this.heroSkill = Number(hero.heroSkill);

		this.weapon = Number(hero.weapon);
		this.helmet = Number(hero.helmet);
		this.armor = Number(hero.armor);
		this.amulet = Number(hero.amulet);
	}else{//new hero
		var heroSD = sd.hero[hero];
		if(heroSD === undefined){
			return;
		}

		this.id = Number(hero);
		this.name = heroSD.Name;
		this.nick = '';
		this.quality = Number(heroSD.Quality);
		this.type = Number(heroSD.Type);
		this.level = 1;
		this.exp = 0;
		this.curJob = Number(heroSD.CurrentJob);
		this.pastJob = heroSD.PastJob == 0 ? '': heroSD.PastJob;

		var tmp = heroSD.Strength.split('$');
		this.strength = Number(tmp[0]);
		this.maxStrength = Number(tmp[1]);
		
		tmp = heroSD.Agile.split('$');
		this.agile = Number(tmp[0]);
		this.maxAgile = Number(tmp[1]);

		tmp = heroSD.Endurance.split('$');
		this.endurance = Number(tmp[0]);
		this.maxEndurance = Number(tmp[1]);

		tmp = heroSD.Intelligence.split('$');
		this.intelligence = Number(tmp[0]);
		this.maxIntelligence = Number(tmp[1]);

		tmp = heroSD.Spirit.split('$');
		this.spirit = Number(tmp[0]);
		this.maxSpirit = Number(tmp[1]);

		this.lucky = Number(heroSD.Lucky);

		this.jobSkill = Number(heroSD.JobSkill);
		this.heroSkill = Number(heroSD.HeroSkill);

		this.weapon = Number(heroSD.Weapon);
		this.helmet = Number(heroSD.Helmet);
		this.armor = Number(heroSD.Armor);
		this.amulet = Number(heroSD.Amulet);
	}
};

//----------------------------------------------------
