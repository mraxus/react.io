'use strict';

var http = require('http');
var WebSocketServer = require('ws').Server;
var express = require('express');

var app = express();
var port = process.env.PORT || 5000;

var idCounter = 0;
var clients = {};

var Types = {
  INIT: 'INIT',
  TICK: 'TICK',
  ENTER: 'ENTER',
  CHAT: 'CHAT',
  EXIT: 'EXIT',
};

function startup () {
  var server, wss;

  app.use(express.static(__dirname + '/public/'));

  server = http.createServer(app);
  server.listen(port);
  console.log('http server listening on %d', port);

  wss = new WebSocketServer({server: server});
  console.log('websocket server created');

  wss.on('connection', registerClient);
  setupTick();
}

function setupTick () {
  setInterval(function () {
    var content = {
      date: new Date(),
      clients: Object.keys(clients).length,
    };
    broadcast(Types.TICK, content);
  }, 1000);
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
  ws.on('close', () => unregisterClient(id));
  ws.on('message', (event, flags) => handleIncomingMessage(id, event, flags));
  ws.on('error', (e) => handleError(id, e));
}
function unregisterClient (id) {
  console.log(`WebSocket ${id} closed connection`);
  delete clients[id];
  broadcast(Types.EXIT, {id: id});
}
function handleError (id, e) {
  console.error(`Got error from ${id} with error ${e.message}`);
  console.error(e);
}
function handleIncomingMessage (id, event, flags) {
  if (flags.binary) {
    return console.error('Backend received binary data but cant handle it');
  }

  var data = JSON.parse(event);
  var content = data.content;

  switch (data.type) {
    case Types.CHAT: handleChat(id, content); break;
    default: console.error('Can\'t handle ' + data.type);
  }
}
function handleChat (id, content) {
  if (content.id !== id) {
    console.log('Bad impersonation');
    return send(clients[id].ws, Types.CHAT, {
      id: 'god',
      message: 'Stop trying to impersonate user ' + content.id,
      messageId: 1,
    });
  }
  var msgId = content.messageId;
  var msg = content.message;
  console.log(`Message from ${id} (msgId ${msgId}): ${msg}`);
  broadcast(Types.CHAT, content);
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

setTimeout(() => broadcast(Types.CHAT, {
  id: 'god',
  messageId: 1,
  message: 'You all work for me now!'
}), 17000);