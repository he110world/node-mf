var db = require('redis').createClient();
var IO = require('./io');
var io = new IO([db], 1, console.log, console.log);
io.hset('htest.sub','a',50);
io.hset('htest.sub','b',60);
io.get('a').get('b').hget('htest.sub', 'a').hget('htest.sub','b',function(){console.log(io.obj)});
io.hset('htest->val','a',40).hget('htest->val','a',function(){console.log(arguments, io.obj)});
