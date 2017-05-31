'use strict';

const Hapi = require('hapi');
const Path = require('path');
const Bcrypt = require('bcrypt'); //genSaltSync、genSalt、hashSync、hash、compareSync、compare、getRounds
const Basic = require('hapi-auth-basic');
console.log(process.getuid());
process.stdout.write('pc\n');
// Create a server with a host and port
const server = new Hapi.Server({
	cache : [{								//设置客户端缓存，a low-level interface that allows you set/get key-value pairs. It is initialized with one of the available adapters: (Memory, Redis, mongoDB, Memcached, or Riak).
		name : 'mongoCache',
		engine : require('catbox-mongodb'),
		host : '127.0.0.1',
		partition : 'cache'
	},{
		name : 'redisCache',
		engine : require('catbox-redis'),
		host : '127.0.0.1',
		partition : 'cache'
	}]
});

const users = {
	john : {
		username : 'john',
		password : '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',//secret
		name : 'John Doe',
		id : '2133d32a'
	}
};
let dbOptions = {
	url : 'mongodb://localhost:27017/test',
	settings : {
		poolSize : 10
	},
	decorate: true
};
server.connection({
	host : "127.0.0.1",
	port : "27017"
});
for(let i = 1;i < 11 ;i++){
	var s = new Date().getTime();
	//let salt = Bcrypt.genSaltSync(i);
	//let hash = Bcrypt.hashSync('gebilaowang',salt);
	Bcrypt.genSalt(i,function(err,salt){
		if(err){
			throw err;
		}
		Bcrypt.hash('gebilaowang',salt,function(err,hash){
			if(err){
				throw err;
			}
			var e = new Date().getTime();
			var j = e - s;
			console.log(i + ':('+ j + 'ms)    ' + hash);
		});
	})
	//let e = new Date().getTime();
	//let j = e - s;
	//console.log(i + ':('+ j +'ms)\n'+salt +'\n'+hash);
}
const validate = function(req,username,password,callback){
	const user = users[username];
	if(!user){
		return callback(null,false);
	}
	Bcrypt.compare(password,user.password,(err,isValid) =>{
		callback(err,isValid,{ id : user.id,name : user.name });
	});
};
const add = (a,b,next) => {
	return next(null,Number(a),Number(b));
}
const sumCache = server.cache({
	cache : 'mongoCache',
	expiresIn : 20*1000,
	segment : 'customSegment',
	generateFunc : (id,next) => {
		add(id.a,id.b,next);
	},
	generateTimeout : 100
});


server.route({
	method : 'GET',
	path : '/add/{a}/{b}',
	handler : (req,res) => {
		const id = req.params.a + ':' + req.params.b;
		sumCache.get({id : id,a : req.params.a,b : req.params.b},(err,result) => {
			if(err){
				return res(err);
			}
			res(result);
		});
	}
});
// Add the route
server.route({
	method : 'GET',
	path : '/hello/{username?}',   //?表示username不是必须的,没有?表示username是必须的，否则404
	handler : function(req,res){
		return res('Hello '+ encodeURIComponent(req.params.username) + '!');
	}
});
server.route({
	method : 'GET',
	path : '/hello/{username*2}',   //不能直接使用/hello/{username}/{password}多参数路由，实现多参数route的方式是*n或者*(表示无限)
	handler : function(req,res){
		let names = req.params.username.split('/'),firstName = names[0],secondName = names[1];
		return res('Hello '+ encodeURIComponent(firstName+' '+secondName) + '!');
	}
});
server.route({
	method : 'GET',
	path : '/welcome/{name*}',
	handler : function(req,res){
		var names = req.params.name.split('/'),str='';
		names.forEach((v)=>{
			str = str + v + ' ';
		})
		return res('Welcome '+str);
	}
});
server.route({
	method : 'GET',
	path : '/api/username',
	handler : function(req,res){
		return res([
			{username : 'pc',age : 27,sex : 'male'},
			{username : '科比',age : 40,sex : 'male'},
			{username : '麦迪',age : 38,sex : 'male'},
			{username : '邓肯',age : 40,sex : 'male'},
			{username : 'ph',age : 25,sex : 'female'},
			{username : '詹姆斯',age : 31,sex : 'male'},
		])
	}
});
server.register({
	register: require('hapi-mongodb'),
	options: dbOptions
},(err) => {
	if(err){
		throw err;
	};
	server.route({
		method : 'GET',
		path : '/user/{id}',
		handler : (request,reply) => {
			let db = request.mongo.db,
				ObjectId = request.mongo.ObjectID;
			db.collection('user').insertMany([{id:5,name:'邓肯',age:41,sex:'male',hobbies:['篮球','美女','投资']},{id:6,name:'奥尼尔',age:50,sex:'male',hobbies:['篮球','美女','投资']},{id:7,name:'艾弗森',age:41,sex:'male',hobbies:['篮球','美女','投资']},{id:8,name:'库里',age:28,sex:'male',hobbies:['篮球','卖萌','投资']}],{ordered:true},(err,res)=>{
				if(err){
					console.log('err : ',err);
					return;
				}
				console.log('res : ',res);
				reply(res);
			});
			/*	
			db.collection('user').find({id:parseInt(request.params.id)}).toArray((err,res) => {
				if(err){
					return reply(err);
				};
				return reply(res);
			});
			*/
		}
	});
	
});
server.register(require('vision'),(err) => {
	if(err){
		throw err;
	};
	server.views({
		engines : {
			html : require('handlebars')
		},
		relativeTo : __dirname,
		path : 'templ'
	});
	server.route({
		method : 'GET',
		path : '/',
		handler : function(req,res){
			res.view('index');
		},
		config:{
			cache:{
				expiresIn: 30 * 1000,
            		privacy: 'private'
			}
		}
	});
	server.route({
		method : 'GET',
		path : '/culture',
		handler : function(req,res){
			res.view('culture');
		}
	});
	server.route({
		method : 'GET',
		path : '/about',
		handler : function(req,res){
			res.view('about');
		}
	});
	server.route({
		method : 'GET',
		path : '/join',
		handler : function(req,res){
			res.view('join');
		}
	});
	server.route({
		method : 'GET',
		path : '/contact',
		handler : (req,res) => {
			res.view('contact');
		}
	})
});

server.register(require('inert'),(err) => {
	if(err){
		throw err
	}
	server.route({
		method : 'GET',
		path : '/index',
		handler : function(req,res){
			res.file('./templ/index.html');
		}
	})
	server.route({
		method : 'GET',
		path : '/hapi/{name?}',
		handler : (req,res) => {
			const response = res({ be : 'hapi' });
			console.log(response.ttl.toString());
			if(req.params.name){
				response.ttl(req.params.name);
			}
		},
		config : {
			cache : {
				expiresIn : 30*1000,
				privacy : 'private'
			}
		}
	})
});
server.register(Basic,(err) => {
	if(err){
		throw err;
	}
	server.auth.strategy('simple','basic',{ validateFunc : validate });
	server.route({
		method : 'GET',
		path : '/auth',
		config : {
			auth : 'simple',
			handler : (req,res) => {
				res('hello,'+req.auth.credentials.name);
			}
		}
	})
});

//缓存cache

// Start the server
server.start((err) => {
	if(err){
		throw err;
	}
	console.log('Server running at:',server.info.uri);
})
