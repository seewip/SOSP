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