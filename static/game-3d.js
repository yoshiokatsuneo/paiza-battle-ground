const socket = io();
const canvas = $('#canvas')[0];
canvas.width = 1000;
canvas.height = 1000;
const img = $("#player-image")[0];

var renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setClearColor('skyblue');
renderer.shadowMap.enabled = true;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 100, 1, 0.1, 2000 );
// camera.position.set(20, 400, 1000);

var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
var floorMaterial = new THREE.MeshLambertMaterial({color : 'lawngreen'});
var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.position.set(500, 0, 500);
floorMesh.receiveShadow = true;
floorMesh.rotation.x = - Math.PI / 2; 
scene.add(floorMesh);

var bulletMaterial = new THREE.MeshLambertMaterial( { color: 0x808080 } );
var wallMaterial = new THREE.MeshLambertMaterial( { color: 'firebrick' } );
var texture = new THREE.Texture( img );
texture.needsUpdate = true;
var playerMaterial = new THREE.MeshLambertMaterial({map: texture});
const textMaterial = new THREE.MeshBasicMaterial({ color: 0xf39800, side: THREE.DoubleSide });


/*			var cube2 =  new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), material) ;
			scene.add(cube2);
			cube2.position.y = 3;
*/

// light
light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-100, 300, -100);
light.castShadow = true;

    light.shadow.camera.left = -200000;
    light.shadow.camera.right = 200000;
    light.shadow.camera.top = 200000;
    light.shadow.camera.bottom = -200000;
    light.shadow.mapSize.width = 2048;     //追加
light.shadow.mapSize.height = 2048;   //追加
        shadowHelper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(shadowHelper);


// light.rotation.x = 1;
scene.add(light);
ambient = new THREE.AmbientLight(0x808080);
scene.add(ambient);




//			cube.position.y = 2;


    loader = new THREE.FontLoader();
    let font;
    loader.load('/static/helvetiker_bold.typeface.json', function(font_) {
        font = font_;
        /*
     const  text = new THREE.Mesh(
        new THREE.TextGeometry('dotinstall!', {
          font: font,
          // fontName: 'serif',
          size: 100,
          height: 1
        }),
        new THREE.MeshBasicMaterial({ color: 0xf39800, side: THREE.DoubleSide })
      );
      text.position.set(100, 300, 0);
      scene.add(text);
      */
    });

    

        

    // helper
    /*
    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper);
    const axisHelper = new THREE.AxisHelper(2000);
    scene.add(axisHelper);
    const lightHelper = new THREE.DirectionalLightHelper(light, 20);
    scene.add(lightHelper);
    */
    
function animate() {
	requestAnimationFrame( animate );
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
socket.on('state', (players, bullets, walls) => {
    Meshes = Meshes.filter((mesh) => {
        const id = mesh.gameObjectId;
        if(players[id]){
            if(mesh.gameObjectType === 'playerText'){
                players[id].textMesh = mesh;
            }else{
                players[id].mesh = mesh;
            }
        }else if(bullets[id]){
            bullets[id].mesh = mesh;
        }else if(walls[id]){
            walls[id].mesh = mesh;
        }else{
            scene.remove(mesh);
            mesh.geometry.dispose();
            return false;
        }
        return true;
    });
    Object.values(players).forEach((player) => {
        let mesh = player.mesh;
        if(!mesh){
    		mesh = new THREE.Mesh(new THREE.BoxGeometry(player.width, player.width, player.height), playerMaterial);
    		mesh.gameObjectId = player.id;
    		mesh.castShadow = true;
    		Meshes.push(mesh);
    		scene.add(mesh);
        }
        
        mesh.position.set(player.x + player.width/2, player.width/2, player.y + player.height/2);
		mesh.rotation.y = - player.angle;

        if(player.socketId === socket.id){
			camera.position.set(
			    player.x + player.width/2 - 150 * Math.cos(player.angle),
			    200,
                player.y + player.height/2 - 150 * Math.sin(player.angle)
            );
			// camera.rotation.z = 0.4;
			camera.rotation.y = - player.angle - Math.PI/2;
			// console.log('player.angle=', player.angle, camera.position.x, camera.position.z);

            /*
            context.save();
            context.font = '30px Bold Arial';
            // context.fillText('You', player.x, player.y - 20);
            context.fillText(player.point + ' point', 20, 40);
            context.restore();
            */
        }

        if(font){
            let mesh = player.textMesh;
            if(mesh && mesh.health !== player.health){
                scene.remove(mesh);
                mesh.geometry.dispose();
                Meshes.splice(Meshes.indexOf(mesh), 1);
                mesh = null;
            }
            if(!mesh){
                mesh = new THREE.Mesh(
                    new THREE.TextGeometry('*'.repeat(player.health),
                        {font: font, size: 10, height: 1}),
                        textMaterial,
                );
                mesh.gameObjectId = player.id;
                mesh.gameObjectType = 'playerText';
                mesh.health = player.health;
                Meshes.push(mesh);
                scene.add(mesh);
            }
            mesh.position.set(player.x + player.width/2, 100, player.y + player.height/2);
            mesh.rotation.y = - player.angle + Math.PI/2;
        }


    });
    Object.values(bullets).forEach((bullet) => {
        let mesh = bullet.mesh;
        if(!mesh){
            mesh = new THREE.Mesh(new THREE.BoxGeometry(bullet.width, bullet.width, bullet.height), bulletMaterial);
		    mesh.gameObjectId = bullet.id;
		    Meshes.push(mesh);
		    scene.add(mesh);
        }
        mesh.position.set(bullet.x + bullet.width/2, 50, bullet.y + bullet.height/2);
    });
    Object.values(walls).forEach((wall) => {
        let mesh = wall.mesh;
        if(!mesh){
    		mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.width, 100, wall.height), wallMaterial);
    		mesh.gameObjectId = wall.id;
    		mesh.castShadow = true;
    		mesh.receiveShadow = true;
    		Meshes.push(mesh);
    		scene.add(mesh);
        }
		mesh.position.x = wall.x + wall.width/2;
		mesh.position.y = 50;
		mesh.position.z = wall.y + wall.height/2;
    });
});

socket.on('dead', () => {
    $("#game-over").show();
    $("#start-button").show();
});

socket.on('connect', () => {
    gameStart();
});

			