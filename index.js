"use strict";
/* global __dirname */

var express = require("express");
var bodyParser = require("body-parser");
var helmet = require("helmet");
var path = require('path');

var port = (process.env.PORT || 10000);
var app = express();

app.use("/", express.static(path.join(__dirname, "public")));

app.use(bodyParser.json()); //use default json enconding/decoding
app.use(helmet()); //improve security

app.listen(port);
console.log("SOSP is running on port " + port);


// $http
//     .get(BASE_URL + "/content/search/author", {
//         params: {
//             query: "authlast(Einstein) and authfirst(Albert) and affil(Princeton)",
//             apikey: apikey
//         }
//     })
//     .then(function(response) {
//         $scope.data = JSON.stringify(response.data, null, 2);
//     }, function(response) {
//         $scope.data = JSON.stringify(response.data, null, 2);
//         console.log("Error: ");
//         console.log(response);
//     });

var apikey = "f454eaac956f48b3c6a89d9bb814f9e4";

    console.log("INFO: New GET request to /proxy/education/");
    var http = require('http');

    var options = {
        host: 'api.elsevier.com',
        path: '/content/search/author?'+"query=authlast%28Einstein%29+and+authfirst%28Albert%29+and+affil%28Princeton%29&"+"apikey="+apikey,
    };

    var request = http.request(options, (response) => {
        var input = '';

        response.on('data', function(chunk) {
            input += chunk;
        });

        response.on('end', function() {
            console.log("INFO: Proxy request to /proxy/education/ completed successfully");
            console.log(JSON.stringify(input, null, 2));
        });
    });

    request.on('error', function(e) {
        console.log("WARNING: New GET request to /proxy/education/ - failed to access the proxied website, sending 503...");
        //res.sendStatus(503);
    });

    request.end();