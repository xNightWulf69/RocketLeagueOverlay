var app = require('express')();
var express1 = require('express');
var app1 = express1();
var path = require('path');
const fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http, {
   cors: {
      origin: "*"
   }
});

app.get('/', function(req, res){
   res.sendFile('BOSindex.html', { root: __dirname });
});

app1.use(express1.static('public'));

io.on('connection', socket => {
   console.log("Connected")
   socket.on('blueteamname', data => {
      socket.broadcast.emit('blueteamname', (data));
   });
   socket.on('orangeteamname', data => {
      socket.broadcast.emit('orangeteamname', (data));
   });
   socket.on('bw1', data => {
      socket.broadcast.emit('bw1', (data));
   });
   socket.on('bw2', data => {
      socket.broadcast.emit('bw2', (data));
   });
   socket.on('bw3', data => {
      socket.broadcast.emit('bw3', (data));
   });
   socket.on('bw4', data => {
      socket.broadcast.emit('bw4', (data));
   });
   socket.on('ow1', data => {
      socket.broadcast.emit('ow1', (data));
   });
   socket.on('ow2', data => {
      socket.broadcast.emit('ow2', (data));
   });
   socket.on('ow3', data => {
      socket.broadcast.emit('ow3', (data));
   });
   socket.on('ow4', data => {
      socket.broadcast.emit('ow4', (data));
   });
   socket.on('BestOfThree', data => {
      socket.broadcast.emit('BestOfThree', (data));
   });
   socket.on('BestOffive', data => {
      socket.broadcast.emit('BestOffive', (data));
   });
   socket.on('BestOfseven', data => {
      socket.broadcast.emit('BestOfseven', (data));
   });
   socket.on('BestOfnone', data => {
      socket.broadcast.emit('BestOfnone', (data));
   });
   socket.on('uselogo', data => {
      socket.broadcast.emit('uselogo', (data));
   });
   socket.on('orangeprimary', data => {
      socket.broadcast.emit('orangeprimary', (data));
   });
   socket.on('orangesecondary', data => {
      socket.broadcast.emit('orangesecondary', (data));
   });
   socket.on('blueprimary', data => {
      socket.broadcast.emit('blueprimary', (data));
   });
   socket.on('bluesecondary', data => {
      socket.broadcast.emit('bluesecondary', (data));
   });
   socket.on('reset', data => {
      socket.broadcast.emit('reset', (data));
   });
   socket.on('scoreboardColour', data => {
      socket.broadcast.emit('scoreboardColour', (data));
   });
   socket.on('upload-file', (file) => {
      // Save the file to the 'logos' folder
      fs.writeFileSync(`./resources/app/logos/${file.name}`, file.data);
    });
   socket.on('TournamentText', data => {
      var newdata = '|\xa0\xa0 ' + data + ' \xa0\xa0'
      fs.writeFileSync(`./resources/app/TournammentText.txt`, newdata);
   });
});

http.listen(3000, function(){
   console.log('listening on http://localhost:3000');
});