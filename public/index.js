'use strict';

var host = location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(host);
var clientId;
var msgId;

var Types = {
  INIT: 'INIT',
  TICK: 'TICK',
  ENTER: 'ENTER',
  CHAT: 'CHAT',
  EXIT: 'EXIT',
};

function handleConnectionClosed () {
  setStatusMessage('Connection closed for unknown reason');
}
function handleConnectionError () {
  setStatusMessage('Connection error...');
}
function handleIncomingMessage (event) {
  var data = JSON.parse(event.data);
  var content = data.content;

  switch (data.type) {
    case Types.INIT: handleInit(content); break;
    case Types.ENTER: handleEnter(content); break;
    case Types.TICK: handleTick(content); break;
    case Types.CHAT: handleChat(content); break;
    case Types.EXIT: handleExit(content); break;
    default: console.error('Can\'t handle ' + data.type);
  }
}
function handleInit (content) {
  var span = document.createElement('span');
  if (clientId) {
    console.warn('Init already called before...');
    return;
  }
  clientId = content.id;
  msgId = clientId * 1024 * 124;
  console.info('Init from server. id:', clientId, 'generating msgId:', msgId);
  span.innerText = ' ' + clientId;
  document.querySelector('.you-id').innerHTML = clientId;
  prependLog('Connected at ' + dateFormat(new Date()));
}
function handleEnter (content) {
  prependLog('New client entered: ' + content.id);
}
function handleTick (content) {
  var time = dateFormat(new Date(content.date));
  var count = content.clients;
  var msg = count + ' online. (' + time + ')';

  if (count === 1) { msg = 'Only you online. (' + time + ')'; }

  setStatusMessage(msg);
}
function handleChat (content) {
  var msg = `Message from ${content.id}: ${content.message}`;

  prependLog(msg);
}
function handleExit (content) {
  prependLog('Client left: ' + content.id);
}

function handleSendMessage () {
  var msg = document.getElementById("message").value;
  sendMessage(msg);
  document.getElementById("message").value = ''
}

function sendMessage (msg) {
  if (ws.readyState != WebSocket.OPEN) throw new Error('Not connected');

  ws.send(JSON.stringify({
    type: Types.CHAT,
    content: {
      id: clientId,
      messageId: ++msgId,
      message: msg,
    },
  }));
}
function prependLog (msg) {
  var li = document.createElement('li');
  var logList = document.querySelector('.log');

  li.innerHTML = msg;
  if (!logList.childNodes.length) {
    logList.appendChild(li);
  } else {
    logList.insertBefore(li, logList.childNodes[0])
  }
}
function setStatusMessage (msg) {
  var statusSpan = document.querySelector('#status');
  statusSpan.innerHTML = msg
}

function startup() {
  ws.onclose = handleConnectionClosed;
  ws.onerror = handleConnectionError;
  ws.onmessage = handleIncomingMessage;
}

startup();

function dateFormat (date) {
  return date
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}