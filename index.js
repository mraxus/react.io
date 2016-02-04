'use strict';

var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;
var clients = {};

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

wss.on("connection", function(ws) {
	console.log(Object.keys(ws._sender));
	console.log(ws._sender.firstFragment);
	var id = setInterval(function() {
		ws.send(JSON.stringify(new Date()), function() {  })
	}, 5000);

	console.log("websocket connection open!");

	ws.on("close", function() {
		console.log("websocket connection closed!");
		clearInterval(id)
	})
});