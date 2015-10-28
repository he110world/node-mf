var web = require('../../lib/web');
var sd  =require('../staticData.json');

exports.helloserver = function (io) {
	io.end('Hello Client!');	// text: Hello Client!
};

exports.hellojson = function (io) {
	io.end({json:true});		// json: {"json":true}
};

exports.helloerror = function (io) {
	io.err('Don\'t panic!');
};

exports.push = function(io, id, evt, str) {
	io.push(id, evt, str);
	io.end();
};

exports.broadcast = function(io, evt, str) {
	io.broadcast(evt, str);
	io.end();
};

exports.pushjson = function(io, id, evt, obj) {
	io.push(id, evt, obj);
	io.end();
};

exports.broadcastjson = function(io, evt, obj) {
	io.broadcast(evt, obj);
	io.end();
};

exports.addCoin = function(io, add){
	io.hincrby('role', 'coin', add, function(coin){
		//io.hset('role', 'coin', coin);
		io.end();
	});
};
exports.addMoney = function(io, add){
	io.hincrby('role', 'money', add, function(coin){
		//io.hset('role', 'coin', coin);
		io.end();
	});
};
exports.addExp = function(io, add){
	io.hincrby('role', 'exp', add, function(coin){
		//io.hset('role', 'coin', coin);
		io.end();
	});
};

exports.addRandom = function(io, add){
	io.hincrby('role', 'exp', add, function(coin){
		//io.hset('role', 'coin', coin);
		io.end();
	});
};

exports.html = function(io, title) {
	var main = web.main(title);
	var navbar = main.navbar();
//	navbar.dropdown('drop').dropitem('nav drop').href('http://www.baidu.com');
	navbar.nav('google').href('http://www.google.com').active();
	navbar.nav('google').href('http://www.google.com');

	main.row().h1('This is h1');
	var r2 = main.row();
	r2.h3('This is h3');
	r2.h4('This is h4');
	main.row().br().cols(1,2,3,4,2,function(c1,c2,c3,c4,c5){
		c1.text('fuck');
		c2.text('you');
		c3.button('all', 'info').click(function(){
			$('#the_warning').addClass('hidden');
		});
		c4.button('shit', 'danger').click(function(){
			$('#the_warning').removeClass('hidden');
		});
		c5.text('!');
	});
	main.row().well().text('shit');
	var row2 = main.row();
	row2.col(2).text(999);
	row2.col(2).textinput('test', 'hello');


	var drop = main.row().dropdown('drop');
	drop.dropitem('google').href('http://www.google.com').active();
	drop.dropdivider();
	drop.dropitem('baidu').href('http://www.baidu.com');
	drop.br();

	main.row().cols(2,2,function(c1,c2){
		c1.textinput('left', 'some text');
		c2.searchinput('', 'some text', 'right');
	});

	var tabs = main.row().tabs('tab1', 'tab2', 'tab3', function(tab1, tab2, tab3){
		tab1.href('http://www.baidu.com');
		tab2.click(function(){
			$('#the_tab3').addClass('hidden');
		});
		tab3.id('the_tab3');
	}).stack();

	main.warning('fuck').id('the_warning');

	main.panel('fuck', 'you');

	var result = main.compile();
	io.html(result);
};
