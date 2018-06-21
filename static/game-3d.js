const socket = io();
const canvas2d = $('#canvas-2d')[0];
const context = canvas2d.getContext('2d');
const canvas3d = $('#canvas-3d')[0];
const playerImage = $("#player-image")[0];

const renderer = new THREE.WebGLRenderer({canvas: canvas3d});
renderer.setClearColor('skyblue');
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, 1, 0.1, 2000 );

// Floor
const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const floorMaterial = new THREE.MeshLambertMaterial({color : 'lawngreen'});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.position.set(500, 0, 500);
floorMesh.receiveShadow = true;
floorMesh.rotation.x = - Math.PI / 2; 
scene.add(floorMesh);

camera.position.set(1000, 300, 1000);
camera.lookAt(floorMesh.position);

// Materials
const bulletMaterial = new THREE.MeshLambertMaterial( { color: 0x808080 } );
const wallMaterial = new THREE.MeshLambertMaterial( { color: 'firebrick' } );
const playerTexture = new THREE.Texture(playerImage);
playerTexture.needsUpdate = true;
const playerMaterial = new THREE.MeshLambertMaterial({map: playerTexture});
const textMaterial = new THREE.MeshBasicMaterial({ color: 0xf39800, side: THREE.DoubleSide });
const nicknameMaterial = new THREE.MeshBasicMaterial({ color: 'black', side: THREE.DoubleSide });

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-100, 300, -100);
light.castShadow = true;
light.shadow.camera.left = -2000;
light.shadow.camera.right = 2000;
light.shadow.camera.top = 2000;
light.shadow.camera.bottom = -2000;
light.shadow.camera.far = 2000;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
scene.add(light);
const ambient = new THREE.AmbientLight(0x808080);
scene.add(ambient);

const loader = new THREE.FontLoader();
let font;
loader.load('/static/helvetiker_bold.typeface.json', function(font_) {
    font = font_;
});
        

// Helpers
// scene.add(new THREE.CameraHelper(light.shadow.camera));
// scene.add(new THREE.GridHelper(200, 50));
// scene.add(new THREE.AxisHelper(2000));
// scene.add(new THREE.DirectionalLightHelper(light, 20));

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate();

function gameStart(){
    const nickname = $("#nickname").val();
    socket.emit('game-start', {nickname: nickname});
    $("#start-screen").hide();
}
$("#start-button").on('click', gameStart);

let movement = {};
$(document).on('keydown keyup', (event) => {
    const KeyToCommand = {
        'ArrowUp': 'forward',
        'ArrowDown': 'back',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
    };
    const command = KeyToCommand[event.key];
    if(command){
        if(event.type === 'keydown'){
            movement[command] = true;
        }else{ /* keyup */
            movement[command] = false;
        }
        socket.emit('movement', movement);
    }
    if(event.key === ' ' && event.type === 'keydown'){
        socket.emit('shoot');
    }
});

const touches = {};
$('#canvas-2d').on('touchstart', (event)=>{
    socket.emit('shoot');
    movement.forward = true;
    socket.emit('movement', movement);
    Array.from(event.changedTouches).forEach((touch) => {
        touches[touch.identifier] = {pageX: touch.pageX, pageY: touch.pageY};
    });
    event.preventDefault();
});
$('#canvas-2d').on('touchmove', (event)=>{
    movement.right = false;
    movement.left = false;
    Array.from(event.touches).forEach((touch) => {
        const startTouch = touches[touch.identifier];
        movement.right |= touch.pageX - startTouch.pageX > 30;
        movement.left |= touch.pageX - startTouch.pageX < -30;
    });
    socket.emit('movement', movement);
    event.preventDefault();
});
$('#canvas-2d').on('touchend', (event)=>{
    Array.from(event.changedTouches).forEach((touch) => {
        delete touches[touch.identifier];
    });
    if(Object.keys(touches).length === 0){
        movement = {};
        socket.emit('movement', movement);
    }
    event.preventDefault();
});

const Meshes = [];
socket.on('state', (players, bullets, walls) => {
    Object.values(Meshes).forEach((mesh) => {mesh.used = false;});
    
    // Players
    Object.values(players).forEach((player) => {
        let playerMesh = Meshes[player.id];
        if(!playerMesh){
            console.log('create player mesh');
            playerMesh = new THREE.Group();
    		playerMesh.castShadow = true;
    		Meshes[player.id] = playerMesh;
    		scene.add(playerMesh);
        }
        playerMesh.used = true;
        playerMesh.position.set(player.x + player.width/2, player.width/2, player.y + player.height/2);
		playerMesh.rotation.y = - player.angle;
        
        if(!playerMesh.getObjectByName('body')){
            console.log('create body mesh');
    		mesh = new THREE.Mesh(new THREE.BoxGeometry(player.width, player.width, player.height), playerMaterial);
    		mesh.castShadow = true;
    		mesh.name = 'body';
    		playerMesh.add(mesh);
        }

        if(font){
            if(!playerMesh.getObjectByName('nickname')){
                console.log('create nickname mesh');
                mesh = new THREE.Mesh(
                    new THREE.TextGeometry(player.nickname,
                        {font: font, size: 10, height: 1}),
                        nicknameMaterial,
                );
                mesh.name = 'nickname';
                playerMesh.add(mesh);

                mesh.position.set(0, 70, 0);
                mesh.rotation.y = Math.PI/2;
            }
            {
                let mesh = playerMesh.getObjectByName('health');

                if(mesh && mesh.health !== player.health){
                    playerMesh.remove(mesh);
                    mesh.geometry.dispose();
                    mesh = null;
                }
                if(!mesh){
                    console.log('create health mesh');
                    mesh = new THREE.Mesh(
                        new THREE.TextGeometry('*'.repeat(player.health),
                            {font: font, size: 10, height: 1}),
                            textMaterial,
                    );
                    mesh.name = 'health';
                    mesh.health = player.health;
                    playerMesh.add(mesh);
                }
                mesh.position.set(0, 50, 0);
                mesh.rotation.y = Math.PI/2;
            }
        }
        
        
        if(player.socketId === socket.id){
            // Your player
			camera.position.set(
			    player.x + player.width/2 - 150 * Math.cos(player.angle),
			    200,
                player.y + player.height/2 - 150 * Math.sin(player.angle)
            );
			camera.rotation.set(0, - player.angle - Math.PI/2, 0);
			
			// Write to 2D canvas
            context.clearRect(0, 0, canvas2d.width, canvas2d.height);
            context.font = '30px Bold Arial';
            context.fillText(player.point + ' point', 20, 40);
        }
    });
    
    // Bullets
    Object.values(bullets).forEach((bullet) => {
        let mesh = Meshes[bullet.id];
        if(!mesh){
            mesh = new THREE.Mesh(new THREE.BoxGeometry(bullet.width, bullet.width, bullet.height), bulletMaterial);
		    mesh.castShadow = true;
    		Meshes[bullet.id] = mesh;
		    // Meshes.push(mesh);
		    scene.add(mesh);
        }
        mesh.used = true;
        mesh.position.set(bullet.x + bullet.width/2, 80, bullet.y + bullet.height/2);
    });
    
    // Walls
    Object.values(walls).forEach((wall) => {
        let mesh = Meshes[wall.id];
        if(!mesh){
    		mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.width, 100, wall.height), wallMaterial);
    		mesh.castShadow = true;
    		Meshes.push(mesh);
    		Meshes[wall.id] = mesh;
    		scene.add(mesh);
        }
        mesh.used = true;
        mesh.position.set(wall.x + wall.width/2, 50, wall.y + wall.height/2);
    });
    
    // Clear unused Meshes
    Object.keys(Meshes).forEach((key) => {
        const mesh = Meshes[key];
        if(!mesh.used){
            console.log('removing mesh', key);
            scene.remove(mesh);
            mesh.traverse((mesh2) => {
                if(mesh2.geometry){
                    mesh2.geometry.dispose();
                }
            });
            delete Meshes[key];
        }
    });
});

socket.on('dead', () => {
    $("#start-screen").show();
});
