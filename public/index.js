'use strict';

var host = location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(host);
var clientId;

var Types = {
  INIT: 'INIT',
  TICK: 'TICK',
  ENTER: 'ENTER',
  EXIT: 'EXIT'
};

ws.onmessage = function (event) {
  var data = JSON.parse(event.data);
  var content = data.content;

  switch (data.type) {
    case Types.INIT: handleInit(content); break;
    case Types.ENTER: handleEnter(content); break;
    case Types.TICK: handleTick(content); break;
    case Types.EXIT: handleExit(content); break;
  }
};

function handleInit (content) {
  var span = document.createElement('span');
  if (clientId) {
    console.warn('Init already called before...');
    return;
  }
  clientId = content.id;
  console.info('Init from server. id:', clientId);
  span.innerText = ' ' + clientId;
  document.querySelector('.header').appendChild(span);
  prependLog('Connected at ' + dateFormat(new Date()));
}
function handleEnter (content) {
  prependLog('New client entered: ' + content.id);
}
function handleTick (content) {
  var msg = dateFormat(new Date(content.date))
    + ': ' + content.clients + ' clients';

  prependLog(msg);
}
function handleExit (content) {
  prependLog('Client left: ' + content.id);
}

function dateFormat (date) {
  return date
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
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