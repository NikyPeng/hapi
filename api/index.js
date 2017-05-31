'use strict';
const Hapi = require('hapi');
//import Boom from 'boom';

let server = new Hapi.Server();
let dbOptions = {
	url : 'mongodb://localhost:27017/test',
	settings : {
		poolSize : 10
	},
	decorate: true
};
server.connection({
	host : '127.0.0.1',
	port : '3001'
});
server.route({
		method : 'GET',
		path : '/',
		handler : (request,reply) => {
			return reply('Ok');
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
			return reply(request.params.id);
		}
	});
	
});
server.start(() => {
	console.log(`Server started at ${server.info.uri}`);
});
