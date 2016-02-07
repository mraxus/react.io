'use strict';

var http = require('http');
var WebSocketServer = require("ws").Server;
var express = require("express");

var app = express();
var port = process.env.PORT || 5000;

var idCounter = 0;
var clients = {};

var Types = {
  INIT: 'INIT',
  TICK: 'TICK',
  ENTER: 'ENTER',
  EXIT: 'EXIT'
};

function startup () {
  var server, wss;

  app.use(express.static(__dirname + '/public/'));

  server = http.createServer(app);
  server.listen(port);
  console.log("http server listening on %d", port);

  wss = new WebSocketServer({server: server});
  console.log("websocket server created");

  wss.on("connection", registerClient);
  setupTick();
}

function setupTick () {
  setInterval(function () {
    var content = {
      date: new Date(),
      clients: Object.keys(clients).length,
    };
    broadcast(Types.TICK, content);
  }, 5000);
}

function registerClient (ws) {
  var id = ++idCounter;
  console.log(`WebSocket ${id} connected`);
  send(ws, Types.INIT, {id: id});
  broadcast(Types.ENTER, {id: id});
  clients[id] = {
    id: id,
    ws: ws,
  };
  ws.on("close", () => unregisterClient(id));
}
function unregisterClient (id) {
  console.log(`WebSocket ${id} closed connection`);
  delete clients[id];
  broadcast(Types.EXIT, {id: id});
}

function broadcast(type, content) {
  Object.keys(clients).forEach(id => {
    send(clients[id].ws,type, content)
  })
}
function send (ws, type, content) {
  var json = JSON.stringify({type: type, content: content});
  ws.send(json, function () { })
}

startup();