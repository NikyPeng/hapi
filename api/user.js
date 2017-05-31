'use strict';
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({
	host : 'localhost',
	port : '3001'
});
