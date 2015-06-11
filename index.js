var Hapi = require('hapi');
var async = require('async');

var config = require("./config.js");

var GooglePlaces = require('googleplaces');
var googlePlaces = new GooglePlaces(config.apiKey, config.outputFormat);

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8090
});

// Add the route
server.route({
    method: 'GET',
    path: '/places',
    handler: getGooglePlaces
});

function getGooglePlaces(request, reply) {

    parameters = {
    	location: [request.query.latitude, request.query.longitude],
    	types: request.query.keyword
    };

    googlePlaces.placeSearch(parameters, function(error, places_response) {

        if (error) {
            throw error;
        }

        var places = places_response.results;
        console.log(JSON.stringify(places, null, 2));

        var arr = new Array();

        async.each(places, function(place, callback) {

            var location = {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng
            };

            var splits = place.vicinity.split(', ');
            var city = splits[splits.length - 1];

            var data = {
                name: place.name,
                icon: place.icon,
                location: location,
                address: {
                    city: city
                }
            };
            arr.push(data);
        });

        reply(arr);
    });
}

// Start the server
server.start();
