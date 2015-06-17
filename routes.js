var async = require('async');

var config = require("./config.js");

var GooglePlaces = require('googleplaces');
var googlePlaces = new GooglePlaces(config.apiKey, config.outputFormat);

var GoogleLocations = require('google-locations');
var locations = new GoogleLocations(config.apiKey);

module.exports = [
    {
        method: 'GET',
        path: '/places',
        config: {
            handler: getGooglePlaces
        }
    },
    {
        method: 'POST',
        path: '/message',
        config: {
            handler: sendMessage
        }
    }
];

function sendMessage(request, reply) {

    /*async.auto({
        get_data: function(callback){
            console.log('in get_data');
            // async code to get some data
            callback(null, 'data', 'converted to array');
        },
        make_folder: function(callback){
            console.log('in make_folder');
            // async code to create a directory to store a file in
            // this is run at the same time as getting the data
            callback(null, 'folder');
        },
        write_file: ['get_data', 'make_folder', function(callback, results){
            console.log('in write_file', JSON.stringify(results));
            // once there is some data and the directory exists,
            // write the data to a file in the directory
            callback(null, 'filename');
        }],
        email_link: ['write_file', function(callback, results){
            console.log('in email_link', JSON.stringify(results));
            // once the file is written let's email a link to it...
            // results.write_file contains the filename returned by write_file.
            callback(null, {'file':results.write_file, 'email':'user@example.com'});
        }]
    }, function(err, results) {
        console.log('err = ', err);
        console.log('results = ', results);
        reply(results);
    });*/

    async.auto({

        getPlaceDetails: function(callback, placeId) {
            console.log('Inside getPlaceDetails method...');
            locations.details({placeid: request.payload.place_id}, function(err, response) {
                if (err) {
                    return callback(err);
                }
                var data = JSON.stringify(response, null, 2);
                console.log("Place details:\n", data);
                callback(null, response);
            });
        },
        cachePlaceDetails: ['getPlaceDetails', function (callback, results) {
            console.log('Inside cachePlaceDetails method...');
            callback(null);
        }], 
        storePlaceDetails: ['getPlaceDetails', function (callback, results) {
            console.log('Inside storePlaceDetails method...');
            callback(null, 'company_id');
        }],
        publishMessage: ['storePlaceDetails', function (callback, results) {
            console.log('Inside publishMessage method...');
            callback(null, 'published');
        }]
    }, function(err, results) {

        console.log('err = ', err);
        console.log('results = ', results);

        reply(results);
    });

    // Look in akosha DB if company exists with the place_id.

    // Call place details by place id api.

    // Store data in couchbase.

    // Create mapping in the akosha DB.

    // Push message to the pubnub channel.
}

function getGooglePlaces(request, reply) {

    var currentLatitude = request.query.latitude;
    var currentLongitude = request.query.longitude;

    parameters = {
    	location: [request.query.latitude, request.query.longitude],
    	types: request.query.type
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

            var diff = distance(currentLatitude, currentLongitude, 
                location.latitude, location.longitude, 'K');

            var splits = place.vicinity.split(', ');
            var city = splits[splits.length - 1];

            var data = {
                place_id: place.place_id,
                name: place.name,
                icon: place.icon,
                location: location,
                distance: {
                    "unit": "km",
                    "value": diff.toFixed(2)
                },
                address: {
                    city: city
                }
            };
            arr.push(data);
        });

        reply(arr);
    });
}

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) products   :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles (default)                         :::
//:::                  'K' is kilometers                                      :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at http://www.geodatasource.com                          :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: http://www.geodatasource.com                        :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2015            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var radlon1 = Math.PI * lon1/180;
    var radlon2 = Math.PI * lon2/180;
    var theta = lon1-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist;
} 
