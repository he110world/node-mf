var sd  =require('./staticData.json');
//----------------------------------------------------
//Role
exports.Role = function (role) {
	if (typeof role === 'object') {
		this.uid = role.uid;
		this.nick = role.nick || '';
		this.exp = Number(role.exp) || 0;
		this.bagSize = Number(role.bagSize) || 10;
		this.bagUsed = Number(role.bagUsed) || 0;
	} else { // role = uid
		this.uid = role;
		this.nick = '';
		this.exp = 0;
		this.bagSize = 10;
		this.bagUsed = 0;
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
	this.bagUsed = 0;
	this.bagSize = 0;
};

//更新背包信息
exports.Item.prototype.setBagInfo = function(bagUsed, bagSize){
	var self = this;
	self.bagUsed = Number(bagUsed);
	self.bagSize = Number(bagSize);
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

//增加道具（可减），同时计算背包使用状况
exports.Item.prototype.addItem = function(addNum, cb) {
	var self = this;
	if(self.id === undefined){
		cb(true, 'no_this_item');
	}

	console.log(self.id, "item:", self.cnt+'/'+ self.limit, "add:", addNum, "bag:", self.bagUsed+'/'+self.bagSize);

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

	if(self.bagUsed + Number(addUsed) <= self.bagSize){
		self.cnt += Number(addNum);
		cb(false, Number(addUsed));
	}else{
		cb(true, 'bag_limit');
	}
};
//----------------------------------------------------