//----------------------------------------------------
//Role
exports.Role = function (role) {
	if (typeof role === 'object') {
		this.uid = role.uid;
		this.nick = role.nick || '';
		this.coin = role.coin || 0;
		this.money = role.money || 0;
		this.exp = role.exp || 0;
	} else { // role = uid
		this.uid = role;
		this.nick = '';
		this.coin = 0;
		this.money = 0;
		this.exp = 0;
	}

};


exports.Role.prototype.addCoin = function (add) {
	var self = this;
	self.coin += add;
};
//----------------------------------------------------