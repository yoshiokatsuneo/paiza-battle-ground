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
        // console.log('moving...start', distance, this.x, this.y);
        const oldX = this.x, oldY = this.y;
        
        this.x += distance * Math.cos(this.angle);
        this.y += distance * Math.sin(this.angle);
        
        let collision = false;
        if(this.x < 0 || this.x + this.width >= FIELD_WIDTH || this.y < 0 || this.y + this.height >= FIELD_HEIGHT){
            collision = true;
        }
        
        /*
        let onBoard = true;
        if(this.x < 0){this.x = 0; onBoard = false;}
        if(this.y < 0){this.y = 0; onBoard = false;}
        if(this.x >= FIELD_WIDTH ){this.x = FIELD_WIDTH -1; onBoard = false;}
        if(this.y >= FIELD_WIDTH ){this.y = FIELD_HEIGHT -1; onBoard = false;}
        */

        if(this.intersectWalls()){
            collision = true;
        }        

        if(collision){
            this.x = oldX; this.y = oldY;
        }
        // console.log('moving...end', distance, this.x, this.y);
        
        return !collision;
    }
    intersectWalls(){
        return walls.some((wall) => {
            if(this.intersect(wall)){
                console.log('Wall collision!', wall.x, wall.y, wall.width, wall.height, this.x, this.y, this.width, this.height);
                return true;
            }
        });
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
        return (this.x <= obj.x + obj.width) &&
            (this.x + this.width >= obj.x) &&
            (this.y <= obj.y + obj.height) &&
            (this.y + this.height >= obj.y);
    }
    toJSON(){
        return {x: this.x, y: this.y, width: this.width, height: this.height, angle: this.angle};
    }
};
class Player extends GameObject{
    constructor(obj){
        super(obj);
        this.id = obj.id;
        this.width = 80;
        this.height = 80;
        this.health = 10;
        this.bullets = [];
        this.point = 0;

        do{
            this.x = Math.random() * (FIELD_WIDTH - this.width);
            this.y = Math.random() * (FIELD_HEIGHT - this.height);
            this.angle = Math.random() * 2 * Math.PI;
        }while(this.intersectWalls());
    }
    shoot(){
        if(this.bullets.length >= 3){
            return;
        }
        const bullet = new Bullet({
            x: this.x + this.width/2,
            y: this.y + this.height/2,
            angle: this.angle,
            player: this,
        });
        this.bullets.push(bullet);
        bullets.push(bullet);
    }
    damage(){
        this.health -= 1;
        if(this.health === 0){
            this.remove();
        }
    }
    remove(){
        delete players[this.id];
        io.to(this.id).emit('dead');
    }
    toJSON(){
        return Object.assign(super.toJSON(), {health: this.health, id: this.id, point: this.point});
    }
};
class Bullet extends GameObject{
    constructor(obj){
        super(obj);
        this.width = 60;
        this.height = 60;
        this.player = obj.player;
    }
    remove(){
        this.player.bullets.splice(this.player.bullets.indexOf(this), 1);
        bullets.splice(bullets.indexOf(this), 1);
    }
};
class BotPlayer extends Player{
    constructor(obj){
        super(obj);
        this.timer = setInterval(() => {
            if(! this.move(10)){
                this.angle = Math.random() * Math.PI * 2;
            }
            /*
            if(this.x <= 0 || this.x >= FIELD_WIDTH-1){
                this.angle = Math.PI/2 - (this.angle - Math.PI/2);
            }
            if(this.y <= 0 || this.y >= FIELD_HEIGHT-1){
                this.angle = -this.angle;
            }
            */
            if(Math.random()<0.1){
                this.shoot();
            }
        }, 100);
    }
    remove(){
        super.remove();
        clearInterval(this.timer);
        setTimeout(() => {
            players[this.id] = new BotPlayer({id: this.id});
        }, 3000);
    }
}
class Wall extends GameObject{
    
}

var players = {};
var bullets = [];
var walls = [];

for(let i=0; i<3; i++){
    walls.push(new Wall({
            x: Math.random() * FIELD_WIDTH,
            y: Math.random() * FIELD_HEIGHT,
            width: 200,
            height: 50,
    }));
}

players.bot1 = new BotPlayer({
        id: 'bot1',
});

io.on('connection', function(socket) {
  socket.on('game-start', () => {
    let player;
    do{
        player = new Player({
            id: socket.id,
        });
    }while(player.intersectWalls());
    
    players[socket.id] = player;
  });
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
/*
setInterval(function() {
  io.sockets.emit('state', players, bullets);
}, 100);
*/

setInterval(function() {
    
    
    bullets.forEach((bullet) =>{
        // console.log('bullet:', JSON.stringify(bullet));
        if(! bullet.move(20)){
            bullet.remove();
            return;
        }
        Object.values(players).forEach((player) => {
           if(bullet.intersect(player)){
               // console.log('hit!!');
               if(player !== bullet.player){
                   console.log('hit2!!');
                   player.damage();
                   bullet.remove();
                   bullet.player.point += 1;
               }
           } 
        });
        
        Object.values(walls).forEach((wall) => {
           if(bullet.intersect(wall)){
               bullet.remove();
           }
        });
        
    });
    /*
    bullets.forEach((bullet) => {
        if(bullet.isOut()){
            bullet.remove();
        }
    });
    */

  io.sockets.emit('state', players, bullets, walls);
    
    
}, 100);

