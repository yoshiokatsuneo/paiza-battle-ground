'use strict';

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

const FIELD_WIDTH = 1000, FIELD_HEIGHT = 1000;
class GameObject{
    constructor(obj){
        this.x = obj.x;
        this.y = obj.y;
        this.width = obj.width;
        this.height = obj.height;
        this.angle = obj.angle;
    }
    move(distance){
        this.x += distance * Math.cos(this.angle);
        this.y += distance * Math.sin(this.angle);
    }
    isOut(){
        return this.x < 0 || FIELD_WIDTH <= this.x
            || this.y < 0 || FIELD_HEIGHT <= this.y;
    }
    intersect(obj){
        /* console.log('intersect',
            this.x - this.width/2, obj.x + obj.width/2,
            this.x + this.width/2, obj.x - obj.width/2,
            this.y - this.height/2, obj.y + obj.height/2,
            this.y + this.height/2, obj.y - obj.height/2,
            ); */
        return (this.x - this.width/2 <= obj.x + obj.width/2) &&
            (this.x + this.width/2 >= obj.x - obj.width/2) &&
            (this.y - this.height/2 <= obj.y + obj.height/2) &&
            (this.y + this.height/2 >= obj.y - obj.height/2);
    }
    toJSON(){
        return {x: this.x, y: this.y, angle: this.angle};
    }
};
class Player extends GameObject{
    constructor(obj){
        super(obj);
        this.width = 80;
        this.height = 80;
        this.health = 10;
        this.bullets = [];
    }
    shoot(){
        if(this.bullets.length >= 3){
            return;
        }
        const bullet = new Bullet(this);
        this.bullets.push(bullet);
        bullets.push(bullet);
    }
    toJSON(){
        return Object.assign(super.toJSON(), {health: this.health});
    }
};
class Bullet extends GameObject{
    constructor(obj){
        super(obj);
        this.width = 30;
        this.height = 30;
        this.player = obj;
    }
    remove(){
        this.player.bullets.splice(this.player.bullets.indexOf(this), 1);
        bullets.splice(bullets.indexOf(this), 1);
    }
};
class BotPlayer extends Player{
    constructor(obj){
        super(obj);
        setInterval(() => {
            this.move(10);
            if(this.x < 0 || this.x >= FIELD_WIDTH){
                this.angle = Math.PI/2 - (this.angle - Math.PI/2);
            }
            if(this.y < 0 || this.y >= FIELD_WIDTH){
                this.angle = -this.angle;
            }
            if(Math.random()<0.1){
                this.shoot();
            }
        }, 100);
    }
}

var players = {};
var bullets = [];

players.bot1 = new BotPlayer({
        x: Math.random() * FIELD_WIDTH,
        y: Math.random() * FIELD_HEIGHT,
        angle: Math.random() * Math.PI,
});

io.on('connection', function(socket) {
    const player = new Player({
        x: Math.random() * FIELD_WIDTH,
        y: Math.random() * FIELD_HEIGHT,
        angle: 0,
    });
    players[socket.id] = player;

  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left) {
        player.angle -= 0.1;
    }
    if (data.up) {
        player.move(10);
    }
    if (data.right) {
        player.angle += 0.1;
    }
    if (data.down) {
        player.move(-10);
    }
  });
  socket.on('shoot', function(){
      console.log('shoot');
     var player = players[socket.id];
     player.shoot();
  });
  socket.on('disconnect', () => {
      delete players[socket.id];
  });
});
setInterval(function() {
  io.sockets.emit('state', players, bullets);
}, 100);

setInterval(function() {
    bullets.forEach((bullet) =>{
        // console.log('bullet:', JSON.stringify(bullet));
        bullet.move(20);
        Object.values(players).forEach((player) => {
           if(bullet.intersect(player)){
               console.log('hit!!');
               if(player !== bullet.player){
                   console.log('hit2!!');
                   player.health -= 1;
                   bullet.remove();
               }
           } 
        });
    });
    bullets.forEach((bullet) => {
        if(bullet.isOut()){
            bullet.remove();
        }
    });
}, 100);

