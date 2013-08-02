
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , websocketserver = require('ws').Server

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var httpserver = http.createServer(app)
var connections=[];
var wss = new websocketserver({server:httpserver})

wss.on("connection",function(ws){
  connections.push(ws);
  console.log(connections.length)
  ws.on("message",function(data){
    for(var i=0;i<connections.length;i++){
      if(ws !== connections[i]){
      connections[i].send(data);
      }
    }


  });

  ws.on("close",function(){
    var index=connections.indexOf(ws);
    if(index !== -1 ){    
      connections.splice(index,1);
    console.log("close");
    console.log(connections.length);
    }
});


})
httpserver.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
