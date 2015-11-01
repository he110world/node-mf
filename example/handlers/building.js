var share = require('../../lib/share')
var Class = require('../class');
var sd  =require('../staticData.json');

(function initFormula(){
	for(var key in sd.building){
		var building = sd.building[key];
		if(typeof building.Formula !== 'string'){
			continue;
		}
		var formulas = building.Formula.split('$');
		building.Formula = formulas;
	}
})();

(function initFormulaCost(){
	for(var key in sd.formula){
		var formula = sd.formula[key];
		if(typeof formula.Cost !== 'string'){
			continue;
		}

		var costs = formula.Cost.split('$');
		for(var i = 0; i < costs.length; i++){
			costs[i] = costs[i].split('~');
		}
		formula.Cost = costs;
	}
})();


exports.build = function(io, id){
	io.sismember('buildings', id, function(ismember){
		if(!ismember){
			var building = new Class.Building(id);
			io.sadd('buildings', id);
			io.hmset('building.' + id, building);
			io.end();
		}else{
			io.err('building_exist');
		}
	});
};

exports.produce = function(io, buildingId, formula){
	if(!sd.building.Formula.containsKey(formula)){
		io.err('no_this_formula');
		return;
	}

	var tech = sd.formula.ReqTech;
	io.sismember('techs', tech).sismember('buildings', buildingId, function(ismember1, ismember2){
		if(ismember2){
			io.err('building_not_exist');
			return;
		}

		if(tech != 0 && !ismember1){
			io.err('tech_not_ready');
			return;
		}

		var formulaSD = sd.formula[formula];
		if(formulaSD == undefined){
			io.err('no_this_formula');
			return;
		}

		var costs = formulaSD.Cost;
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
				io.hgetall('building.' + buildingId, function(buildingDB){
					var building = new Class.Building(buildingDB);
					building.produce(formula, function(err, data){
						if(err){
							io.err(data);
						}else{
							items.forEach(function(key, i){
								if(items[i].cnt == 0){
									io.hdel('package', items[i].id);
								}else{
									io.hset('package', items[i].id, items[i].cnt);
								}
							});
							io.hincrby('role', 'packageUsed', packageUsedAdd);

							io.hmset('building.' + buildingId, buildingDB);
							io.hmset('building.' + buildingId + '.column.' + data.index, data);
							io.end();
						}
					});
				});
			}else{
				io.err('not_enough_item');
			}
		});		
	});
};

exports.settle = function(io, buildingId, columnIndex){
	io.hgetall('building.' + buildingId).hgetall('building.' + buildingId + '.column.' + columnIndex, function(buildingDB,columnDB){
		if(!buildingDB){
			io.err('no_this_building');
			return;
		}

		if(!columnDB){
			io.err('no_this_column');
			return;
		}

		var building = new Class.Building(buildingDB);
		var column = new Class.Column(building, columnDB);
		building.settle(column, function(err,data){
			if(err){
				io.err(data);
			}else{
				if(column.leftTime <= 0){//完成
					var items = sd.formula[column.formula].Item.split('$');
					var itemIds = [];
					var itemNums = [];
					for(var i = 0; i < items.length; i++){
						items[i] = items[i].split('~');
						itemIds.push(Number(items[i][0]));
						itemNums.push(Number(items[i][1]));
					}

					io.hmget('package', itemIds).hmget('role', ['packageUsed','packageLimit'], function(itemCnts, usedAndLimit){

						var success = true;
						var addPackageUsed = 0;
						var itemCs = [];
						for(var i = 0; i < itemCnts.length; i++){
							var item = new Class.Item(itemIds[i], itemCnts[i]);
							itemCs.push(item);
							item.setPackageInfo(usedAndLimit[0], usedAndLimit[1]);
							item.addItem(itemNums[i], function(err, data){
								if(err){
									success = false;
								}else{
									addPackageUsed += Number(data);
								}
							});
							if(!success){
								break;
							}
						}

						if(success){
							itemCs.forEach(function(key, i){
								io.hset("package", itemCs[i].id, itemCs[i].cnt);
								io.hincrby('role', 'packageUsed', addPackageUsed);
							});
							io.hmset('building.' + buildingId, building);
							io.del('building.' + buildingId + '.column.' + column.index);
							io.end();
						}else{
							io.err('package_limit');
						}
					});
				}else{//未完成，更新数据
					io.hmset('building.' + buildingId, building);
					io.hmset('building.' + buildingId + '.column.' + column.index, column);
					io.end();
				}
			}
		});

	});
};

exports.expandColumn = function(io, buildingId){
	io.hmget('building.' + buildingId, ['columnLimit', 'columnExpandLimit']).hmget('role', ['packageUsed','packageLimit','heroLimit']).hget('package', 11000, function(columnLimits, limits, money){
		if(columnLimits[0] === undefined || columnLimits[1] === undefined){
			io.err('no_this_building');
			return;
		}

		if(columnLimits[1] - columnLimits[0] <= 0){
			io.err('column_expandLimit');
			return;
		}

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

						io.hincrby('building.' + buildingId, 'columnLimit', 1);
						io.end();
					}
				});
			}
		});
	});
}



