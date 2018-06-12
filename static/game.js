
function gameStart(){
    socket.emit('game-start');
    $("#game-over").hide();
    $("#start-button").hide();
}

$("#start-button").on('click', gameStart);

var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

let currentKeys = [];
$(document).keydown((event) => {
    console.log('keydown', event.key, event);
    currentKeys.push(event.key);
    if(event.key === ' '){
        socket.emit('shoot');
    }
});
$(document).keyup((event) => {
    console.log('keyup', event.key, event);
    currentKeys = currentKeys.filter((key) => key !== event.key);
});

const KeyToEvent = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
}

gameStart();

setInterval(function() {
    const movement = {};
    currentKeys.forEach((key) => {
        const event = KeyToEvent[key];
        movement[event] = true;
    })
  socket.emit('movement', movement);
}, 1000 / 30);


var canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 1000;
var context = canvas.getContext('2d');
var img = document.querySelector("#player-image");
socket.on('state', function(players, bullets, walls) {
  context.clearRect(0, 0, canvas.width, canvas.height);

context.fillStyle = 'green';
  context.lineWidth = 10;
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
  context.stroke();
  
  for (var id in players) {
    var player = players[id];
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.stroke();
    context.save();
    context.translate(player.x + player.width/2, player.y + player.height/2);
    // context.fillText(`(${parseInt(player.x)}, ${parseInt(player.y)})`, img.width/2, img.height/2)
    context.rotate(player.angle);
    context.drawImage(img, 0, 0, img.width, img.height, -player.width/2, -player.height/2, player.width, player.height);

    // context.drawImage(img, -img.width/2, -img.height/2);
    context.restore();
    

    context.fillStyle = "gray";
    context.fillText('♥'.repeat(10), player.x, player.y + player.height);
    context.fillStyle = "red";
    context.fillText('♥'.repeat(player.health), player.x, player.y + player.height);

    context.beginPath();
    context.rect(player.x, player.y, player.width, player.height);
    context.stroke();


    if(id === socket.id){
        context.save();
        context.font = '30px Bold Arial';
        context.fillText('You!', player.x - 20, player.y - 20);
        context.fillText(player.point + ' point', 20, 40);
        context.restore();
    }


  }
  
  for (var id in bullets) {
    var bullet = bullets[id];
    context.beginPath();
    console.log('arc', id, bullet);
    context.arc(bullet.x, bullet.y, 4, 0, 2 * Math.PI);
    context.stroke();
    // context.drawImage(img, bullet.x, bullet.y);
    // context.drawImage(img, 0, 0, img.width, img.height, bullet.x-bullet.width/2, bullet.y-bullet.height/2, bullet.width, bullet.height);
  }
  for (var id in walls) {
    var wall = walls[id];
    context.fillStyle = 'black';
     context.fillRect(wall.x, wall.y, wall.width, wall.height);
  }
});

socket.on('dead', () => {
    alert('You are dead!');
    $("#game-over").show();
    $("#start-button").show();
});

