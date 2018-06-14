const socket = io();
const canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 1000;
// const context = canvas.getContext('2d');
const img = document.querySelector("#player-image");


// const canvas = document.getElementById('canvas');
// const img = document.querySelector("#player-image");
img.crossOrigin = "anonymous";

var renderer = new THREE.WebGLRenderer( { canvas: canvas } );

			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 100, 1, 0.1, 2000 );

			// var renderer = new THREE.WebGLRenderer();

			var geometry = new THREE.BoxGeometry( 30, 30, 30 );
			var bulletMaterial = new THREE.MeshBasicMaterial( { color: 0x808080 } );
			var wallMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
			var texture = new THREE.Texture( img );
    texture.needsUpdate = true;

      var material = new THREE.MeshBasicMaterial( {
        map:texture,
      } );

			var cube = new THREE.Mesh( geometry, material );
			scene.add( cube );
			var cube2 =  new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), material) ;
			scene.add(cube2);
			cube2.position.y = 3;

var floorGeometry = new THREE.BoxGeometry(1000, 0, 1000);
var floorMaterial = new THREE.MeshBasicMaterial({
    color : 0x00ff00,
});
var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.position.set(500, 0, 500);
scene.add(floorMesh);


			camera.position.z = 1000;
			camera.position.y = 200;
			camera.position.x = 20;
			
			cube.position.y = 2;

			var animate = function () {
				requestAnimationFrame( animate );

				cube.rotation.x += 0.1;
				cube.rotation.y += 0.1;

				renderer.render( scene, camera );
			};

			animate();






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

Meshes = [];

socket.on('state', function(players, bullets, walls) {
    Meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        scene.remove(mesh);
    });
    Object.values(players).forEach((player) => {
		const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), material);
		Meshes.push(playerMesh);
		scene.add(playerMesh);
		playerMesh.position.x = player.x;
		playerMesh.position.y = 10;
		playerMesh.position.z = player.y;
		playerMesh.rotation.y = player.angle;

        if(player.id === socket.id){
			camera.position.x = player.x; // - 300 * Math.cos(player.angle);
			camera.position.y = 200;
			camera.position.z = player.y; // - 300 * Math.sin(player.angle);
			camera.rotation.y = - player.angle - Math.PI/2;
			console.log('player.angle=', player.angle, camera.position.x, camera.position.z);
        }


    });
    bullets.forEach((bullet) => {
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), bulletMaterial);
		Meshes.push(mesh);
		scene.add(mesh);
		mesh.position.x = bullet.x;
		mesh.position.y = 10;
		mesh.position.z = bullet.y;
    });
    walls.forEach((wall) => {
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.width, 100, wall.height), wallMaterial);
		Meshes.push(mesh);
		scene.add(mesh);
		mesh.position.x = wall.x;
		mesh.position.y = 10;
		mesh.position.z = wall.y;
    });
});

socket.on('dead', () => {
    $("#game-over").show();
    $("#start-button").show();
});

socket.on('connect', () => {
    gameStart();
});

			