var Hapi = require('hapi');
var routes = require('./routes');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8090
});

server.route(routes);

server.start();
