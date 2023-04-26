const { app, BrowserWindow } = require('electron');
const server = require('./server');
const relay = require('./SOS Relay/ws-relay');
const { exec } = require('child_process');

let win;

app.on('ready', function() {
  win = new BrowserWindow({
    width: 765,
    height: 1130,
    icon: "./icon.png"
  });
  win.loadURL('http://localhost:3000'); // Load the URL in the window
});