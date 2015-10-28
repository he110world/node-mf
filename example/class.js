//----------------------------------------------------
//Role
exports.Role = function (role) {
	if (typeof role === 'object') {
		this.uid = role.uid;
		this.nick = role.nick || '';
		//this.coin = role.coin || 0;
		//this.money = role.money || 0;
		this.exp = Number(role.exp) || 0;
		this.bagSize = Number(role.bagSize) || 10;
		this.bagUsed = Number(role.bagUsed) || 0;
	} else { // role = uid
		this.uid = role;
		this.nick = '';
		//this.coin = 0;
		//this.money = 0;
		this.exp = 0;
		this.bagSize = 10;
		this.bagUsed = 0;
	}

};


exports.Role.prototype.addCoin = function (add) {
	var self = this;
	self.coin += add;
};
//----------------------------------------------------

//----------------------------------------------------
//Item
exports.Item = function(item, curCnt){
	if (typeof item === 'object') {
		this.id = item.ID;
		this.limit = Number(item.Limit);
		this.cnt = Number(curCnt) || 0;
	} else {
		this.id = item;
		this.limit = 0;
		this.cnt = 0;
	}
};

exports.Item.prototype.add = function(add, bagUsed, bagSize, cb) {
	var self = this;
	console.log(self.id, "item:", self.cnt, "/", self.limit, "add:", add, "bag:", bagUsed, "/", bagSize);

	if(self.id == 11000 || self.id == 11001){

		if(self.limit - self.cnt >= add){
			self.cnt += Number(add);
			cb(false, 0);
		}else{
			self.cnt = self.limit;
			cb(false, 0);
		}
		return;
	}

	var used = Math.ceil(self.cnt / self.limit);
	var addUsed = Math.ceil((self.cnt + Number(add)) / self.limit) - used;

	if(Number(bagUsed) + Number(addUsed) <= bagSize){
		self.cnt += Number(add);
		cb(false, addUsed);
	}else{
		cb(true);
	}
};
//----------------------------------------------------