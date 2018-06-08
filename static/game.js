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

socket.emit('new player');
setInterval(function() {
    const movement = {};
    currentKeys.forEach((key) => {
        const event = KeyToEvent[key];
        movement[event] = true;
    })
  socket.emit('movement', movement);
}, 1000 / 10);




var canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 1000;
var context = canvas.getContext('2d');
var img = document.querySelector("#player-image");
socket.on('state', function(players, bullets) {
  context.clearRect(0, 0, 1000, 1000);
  context.fillStyle = 'green';
  context.lineWidth = 10;
  context.rect(0, 0, 1000, 1000);
  context.stroke();
  for (var id in players) {
    var player = players[id];
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.save();
    context.translate(player.x, player.y);
    context.fillText(`(${parseInt(player.x)}, ${parseInt(player.y)})`, img.width/2, img.height/2)
    context.fillText('❤️'.repeat(player.health), -img.width/2, img.height/2)
    context.rotate(player.angle);
    context.drawImage(img, 0, 0, img.width, img.height, -player.width/2, -player.height/2, player.width, player.height);

    context.drawImage(img, -img.width/2, -img.height/2);
    context.restore();
    // context.fill();
  }
  for (var id in bullets) {
    var bullet = bullets[id];
    context.beginPath();
    context.arc(bullet.x, bullet.y, 2, 0, 2 * Math.PI);
    // context.drawImage(img, bullet.x, bullet.y);
    context.drawImage(img, 0, 0, img.width, img.height, bullet.x-bullet.width/2, bullet.y-bullet.height/2, bullet.width, bullet.height);
    context.fill();
  }
});


