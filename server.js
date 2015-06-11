var Hapi = require('hapi');
var routes = require('./routes');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8090
});

// server.pack.require({ lout: { endpoint: '/places' } }, function (err) {

//     if (err) {
//         throw err;
//     }
// });

// server.register({ register: require('lout') }, function(err) {
// });

server.route(routes);

server.start();
