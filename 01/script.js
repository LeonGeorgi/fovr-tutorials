import * as THREE from 'https://cdn.skypack.dev/three@v0.133.1';

import {
  OrbitControls
} from 'https://cdn.skypack.dev/three@v0.133.1/examples/jsm/controls/OrbitControls.js';

// The three.js scene: the 3D world where you put objects
const scene = new THREE.Scene();
var params = {
  'CamX': 0.0,
  'CamY': 0.0,
  'CamZ': 5
};

var gui = new dat.GUI();
gui.add(params, 'CamX', -1, 1).onChange(value => camera.position.x = value);
gui.add(params, 'CamY', -1, 1).onChange(value => camera.position.y = value);
gui.add(params, 'CamZ', 0, 10).onChange(value => camera.position.z = value);

// The camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
  10000
);

// The renderer: something that draws 3D objects onto the canvas
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaaaaa, 1);
// Append the renderer canvas into <body>
document.body.appendChild(renderer.domElement);


// A cube we are going to animate
const cube = {
  // The geometry: the shape & size of the object
  geometry: new THREE.BoxGeometry(1, 1, 1),
  material: new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaa,
    metalness: 0,
  })
};
cube.mesh = new THREE.Mesh(cube.geometry, cube.material);
scene.add(cube.mesh);


// Let's make the scene a bit more interesting by building a small forest.
//
// Add a cone by referencing the cube.
const cone = {
  geometry: new THREE.ConeGeometry(1, 2, 32),
  material: new THREE.MeshPhysicalMaterial({
    color: 0x00ff00,
    metalness: 0,
  })
}
cone.mesh = new THREE.Mesh(cone.geometry, cone.material);
cone.mesh.position.set(0,2,0);
scene.add(cone.mesh);

const light = new THREE.AmbientLight(0xffffff, 1);
//scene.add(light);

const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.5);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 2, 0.8);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
// Update GUI if controls change the camera position
controls.addEventListener('change', () => {
  params.CamX = camera.position.x;
  params.CamY = camera.position.y;
  params.CamZ = camera.position.z;
  gui.updateDisplay();
});

// Add second cube to the right of the first one
const cube2 = {
  geometry: new THREE.BoxGeometry(1, 1, 1),
  material: new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaa,
    metalness: 0,
  })
}

cube2.mesh = new THREE.Mesh(cube2.geometry, cube2.material);
cube2.mesh.position.set(2, 0, 0);
scene.add(cube2.mesh);



camera.position.z = params.CamZ;

function render() {
  //camera.position.x = params.CamX;
  //camera.position.y = params.CamY;
  //camera.position.z = params.CamZ;

  // Render the scene and the camera
  renderer.render(scene, camera);

  // Rotate the cube every frame
  cube.mesh.rotation.x += 0.05;
  cube.mesh.rotation.y -= 0.05;

  controls.update();

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

render();