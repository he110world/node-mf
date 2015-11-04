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

exports.produce = function(io, buildingId, formulaId){
	//console.log(sd.building[buildingId].Formula);
	var buildingSD = sd.building[buildingId];
	if(buildingSD === undefined){
		io.err('no_this_building');
		return;
	}

	if( buildingSD.Formula.indexOf(formulaId) == -1){
		io.err('no_this_formula');
		return;
	}

	var tech = sd.formula[formulaId].ReqTech;
	io.sismember('techs', tech).sismember('buildings', buildingId, function(ismember1, ismember2){
		if(!ismember2){
			io.err('building_not_exist');
			return;
		}

		if(tech != 0 && !ismember1){
			io.err('tech_not_ready');
			return;
		}

		var formulaSD = sd.formula[formulaId];
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
					building.produce(formulaId, function(err, data){
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

							io.hmset('building.' + buildingId, building);
							io.hset('building.' + buildingId + '.column', data.id, data.time);
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

exports.addWorker = function(io, buildingId, heroIndex){
	io.hgetall('hero.' + heroIndex).hgetall('building.' + buildingId, function(heroDB, buildingDB){
		if(!heroDB){
			io.err('no_this_hero');
			return;
		}

		if(!buildingDB){
			io.err('no_this_building');
			return;
		}

		var building = new Class.Building(buildingDB);
		building.addWorker(heroIndex, function(err, data){
			if(err){
				io.err(data);
			}else{
				io.hgetall('building.' + buildingId + '.column', function(columnDB){
					console.log('column', columnDB);
					if(columnDB){
						Object.keys(columnDB).forEach(function(key, i){
							building.settle(key, columnDB[key], function(err,data){
								columnDB[key] = data.time;
							});
						});
						io.hmset('building.' + buildingId + '.column', columnDB);
					}
					io.hmset('building.' + buildingId, building);
					io.hset('hero.' + heroIndex, 'work', building.id);
					io.end();
				});
			}
		});
	});
};

exports.removeWorker = function(io, buildingId, heroIndex){
	io.hgetall('building.' + buildingId, function(buildingDB){
		if(!buildingDB){
			io.err('no_this_building');
			return;
		}

		var building = new Class.Building(buildingDB);
		building.removeWorker(heroIndex, function(err, data){
			if(err){
				io.err(data);
			}else{
				io.hgetall('building.' + buildingId + '.column', function(columnDB){
					console.log('column', columnDB);
					if(columnDB){
						Object.keys(columnDB).forEach(function(key, i){
							building.settle(key, columnDB[key], function(err,data){
								columnDB[key] = data.time;
							});
						});
						io.hmset('building.' + buildingId + '.column', columnDB);
					}

					io.hmset('building.' + buildingId, building);
					io.hset('hero.' + heroIndex, 'work', 0);
					
					io.end();
				});
			}
		});
	});
};

exports.settle = function(io, buildingId, columnId){
	io.hgetall('building.' + buildingId).hget('building.' + buildingId + '.column', columnId, function(buildingDB, timeStr){
		if(!buildingDB){
			io.err('no_this_building');
			return;
		}

		if(!timeStr){
			io.err('no_this_column');
			return;
		}

		var building = new Class.Building(buildingDB);
		//var column = new Class.Column(building, columnDB);
		building.settle(columnId, timeStr, function(err, data){
			if(err){
				io.err(data);
			}else{
				if(data.time.indexOf('$0') != -1){//完成
					var formulaId = data.id.split('$')[0];

					var items = sd.formula[formulaId].Item.split('$');
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
							for(var i = 0; i < itemCs.length; i++){
								io.hset("package", itemCs[i].id, itemCs[i].cnt);
							}
							io.hincrby('role', 'packageUsed', addPackageUsed);

							--building.columnUsed;
							io.hmset('building.' + buildingId, building);
							io.hdel('building.' + buildingId + '.column', columnId);
							io.end();
						}else{
							io.err('package_limit');
						}
					});
				}else{//未完成，更新数据
					io.hmset('building.' + buildingId, building);
					io.hmset('building.' + buildingId + '.column', columnId, timeStr);
					io.end();
				}
			}
		});

	});
};

exports.expandColumn = function(io, buildingId){
	io.hmget('building.' + buildingId, ['columnLimit', 'columnExpandLimit']).hmget('role', ['packageUsed','packageLimit','heroLimit']).hget('package', 11000, function(columnLimits, limits, money){
		if(!columnLimits[0] || !columnLimits[1]){
			io.err('no_this_building');
			return;
		}


		console.log(columnLimits[1], columnLimits[0], columnLimits[1] - columnLimits[0]);
		if(columnLimits[1] - columnLimits[0] <= 0){
			io.err('column_expandLimit');
			return;
		}

		var money = new Class.Item(11000, money);
		var packageUsed = limits[0];
		var packageLimit = limits[1];
		var heroLimit = limits[2];
		money.setPackageInfo(packageUsed,packageLimit);

		var cost = 100;
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
};



