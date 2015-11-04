var sd  =require('./staticData.json');
var common = require('./common');
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

		this.work = Number(hero.work);
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
		this.work = 0;
	}
};

//----------------------------------------------------

//----------------------------------------------------
//Building
exports.Building = function(building){
	if (typeof building === 'object') {
		this.id = Number(building.id);
		this.columnLimit = Number(building.columnLimit);
		this.columnExpandLimit = Number(building.columnExpandLimit);
		this.columnUsed = Number(building.columnUsed);
		this.columnIndex = Number(building.columnIndex);
		this.workers = building.workers;
		this.workerLimit = Number(building.workerLimit);
	} else { //new building
		var buildingSD = sd.building[building];
		if(buildingSD === undefined){
			return;
		}

		this.id = Number(building);
		var tmp = buildingSD.Column.split('$');
		this.columnLimit = Number(tmp[0]);
		this.columnExpandLimit = Number(tmp[1]);
		this.columnUsed = 0;
		this.columnIndex = 0;
		this.workers = '';
		this.workerLimit = 1;
	}
};

exports.Building.prototype.addWorker = function(heroIndex, cb) {
	var self = this;
	if(self.workers == '' || self.workers == undefined){
		self.workers = heroIndex;
		cb(false);
	}else{
		cb(true, 'worker_limit');
	}
}

exports.Building.prototype.removeWorker = function(heroIndex, cb) {
	var self = this;

	if(self.workers == '' || self.workers == undefined){
		self.workers = ''
		cb(false);
	}else{
		var workerArr = self.workers.split('$')
		if(workerArr.indexOf(heroIndex) != -1){
			self.workers = '';
			for(var i = 0; i < workerArr.length; i++){
				if(workerArr[i] != heroIndex){
					self.workers += workerArr[i];
					if(i != workerArr.length - 1){
						self.workers += '$';
					}
				}
			}
			cb(false);
		}else{
			cb(true, 'no_this_worker');
		}
		
	}
}

exports.Building.prototype.produce = function(formulaId, cb) {
	var self = this;
	var formulaSD = sd.formula[formulaId];
	if(formulaSD == undefined){
		cb(true, 'no_this_formula');
		return;
	}
	if(self.columnUsed - self.columnLimit < 0){
		var leftTime = Number(formulaSD.Time * 1000);
		self.settle(formulaId + '$' + self.columnIndex, '$' + leftTime, function(err, data){
			++self.columnUsed;
			++self.columnIndex;
			cb(err, data);
		});
	}else{
		cb(true, 'column_full');
	}
};

exports.Building.prototype.settle = function(id, timeStr, cb){
	var self = this;
	var time = common.timeFormat(timeStr);
	//console.log('settle', timeStr, time);

	if(time.start){
		var dt = Date.now() - time.start;
		time.left -= dt;
	}

	if(time.left <= 0){
		time.left = 0;
		//--self.columnUsed;
	}

	if(self.workers){
		time.start = Date.now();
	}else{
		time.start = '';
	}
	var settle = {id:id, time:time.start + '$' + time.left}
	cb(false, settle);
};





