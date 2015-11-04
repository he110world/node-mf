var sd = require('./staticData.json');

exports.timeFormat = function(timeStr){
	var timeArr = timeStr.split('$');
	console.log(timeArr,timeArr.length);
	var time = {start:'', left:0};
	if(timeArr.length > 0){
		time.start = (timeArr[0] == '' || timeArr[0] === undefined) ? '' : Number(timeArr[0]);
	}

	if(timeArr.length > 1){
		time.left = (timeArr[1] == '' || timeArr[1] === undefined) ? 0 : Number(timeArr[1]);
	}

	return time;
};



