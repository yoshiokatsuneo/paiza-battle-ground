'use strict';

const socket = io();
const canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 1000;
const context = canvas.getContext('2d');
const img = document.querySelector("#player-image");


function gameStart(){
    socket.emit('game-start');
    $("#game-over").hide();
    $("#start-button").hide();
}
$("#start-button").on('click', gameStart);

const KeyToCommand = {
    'ArrowUp': 'forward',
    'ArrowDown': 'back',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
};
const movement = {};
$(document).keydown((event) => {
    const command = KeyToCommand[event.key];
    if(command){
        movement[command] = true;
        socket.emit('movement', movement);
    }
    if(event.key === ' '){
        socket.emit('shoot');
    }
});
$(document).keyup((event) => {
    const command = KeyToCommand[event.key];
    if(command){
        movement[command] = false;
        socket.emit('movement', movement);
    }
});

socket.on('state', function(players, bullets, walls) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 10;
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.stroke();

    Object.values(players).forEach((player) => {
        context.save();
        context.font = '10px Bold Arial';
        context.fillStyle = "gray";
        context.fillText('♥'.repeat(player.maxHealth), player.x, player.y + player.height + 10);
        context.fillStyle = "red";
        context.fillText('♥'.repeat(player.health), player.x, player.y + player.height + 10);
        context.translate(player.x + player.width/2, player.y + player.height/2);
        context.rotate(player.angle);
        context.drawImage(img, 0, 0, img.width, img.height, -player.width/2, -player.height/2, player.width, player.height);
        context.restore();
        
        if(player.id === socket.id){
            context.save();
            context.font = '30px Bold Arial';
            context.fillText('You', player.x, player.y - 20);
            context.fillText(player.point + ' point', 20, 40);
            context.restore();
        }
    });
    bullets.forEach((bullet) => {
        context.beginPath();
        context.arc(bullet.x, bullet.y, bullet.width/2, 0, 2 * Math.PI);
        context.stroke();
    });
    walls.forEach((wall) => {
        context.fillStyle = 'black';
        context.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
});

socket.on('dead', () => {
    $("#game-over").show();
    $("#start-button").show();
});

socket.on('connect', () => {
    gameStart();
});
