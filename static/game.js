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
document.addEventListener('keydown', function(event) {
    event.preventDefault();
    event.stopPropagation();
  var c = String.fromCharCode(event.keyCode);
  console.log('keydown', event.key, event.keyCode, c);
    switch(event.key){
        case ' ':
            socket.emit('shoot');
            break;
        case 'ArrowDown':
            movement.down = true;
            break;
        case 'ArrowUp':
            movement.up = true;
            break;
        case 'ArrowLeft':
            movement.left = true;
            break;
        case 'ArrowRight':
            movement.right = true;
            break;
    }
  if(c===' '){
      console.log('shoot');
      socket.emit('shoot');
      return 0;
  }

  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function(event) {
    event.preventDefault();
    event.stopPropagation();

      movement.left = false;
      movement.right = false;
      movement.up = false;
      movement.down = false;


  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});
socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);




var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');
var img = document.querySelector("#player-image");
socket.on('state', function(players, bullets) {
  context.clearRect(0, 0, 800, 600);
  context.fillStyle = 'green';
  for (var id in players) {
    var player = players[id];
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.drawImage(img, player.x, player.y);
    context.fill();
  }
  for (var id in bullets) {
    var bullet = bullets[id];
    context.beginPath();
    context.arc(bullet.x, bullet.y, 2, 0, 2 * Math.PI);
    // context.drawImage(img, bullet.x, bullet.y);
    context.drawImage(img, 0, 0, img.width, img.height, bullet.x, bullet.y, 30, 30);
    context.fill();
  }
});


