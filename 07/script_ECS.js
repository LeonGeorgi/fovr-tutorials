import {
  World,
  System,
  Component,
  TagComponent,
  Types
} from "https://ecsyjs.github.io/ecsy/build/ecsy.module.js";
import {
  AirResistance,
  Bounce,
  FallThrough,
  Gravity,
  Mesh,
  Position,
  PositionRange, Pulse,
  Speed,
  Spin
} from './components.mjs';
import {
  FallThroughSystem,
  GravitySystem,
  MovementSystem,
  RenderSystem,
  SpinSystem,
  BounceSystem, AirResistanceSystem, PulseSystem
} from './systems.mjs';


// The three.js scene: the 3D world where you put objects
const scene = new THREE.Scene();

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

// Add lights
const hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.5);
scene.add(hemisphereLight);

// Make the camera further from the cube, so we can see it better
camera.position.z = 5;


const world = new World();
world.registerComponent(Position);
world.registerComponent(Speed);
world.registerComponent(Gravity);
world.registerComponent(Mesh);
world.registerComponent(Spin);
world.registerComponent(PositionRange);
world.registerComponent(Bounce);
world.registerComponent(FallThrough);
world.registerComponent(AirResistance);
world.registerComponent(Pulse);
// Create a new entity

const entity = world.createEntity();
// Add components to the entity
entity.addComponent(Position, { x: -1, y: 0, z: -10 });
entity.addComponent(Speed, { x: 5, y: 2, z: 3 });
// entity.addComponent(Gravity);
entity.addComponent(Spin, { x: 0.5, y: 1, z: 1.5 });
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({
  color: 0x00b453,
  metalness: 0,
}));
entity.addComponent(Mesh, { value: mesh });
entity.addComponent(PositionRange, { minX: -8, maxX: 8, minY: -5, maxY: 5, minZ: -15, maxZ: -5 });
entity.addComponent(Bounce);

const entity2 = world.createEntity();
entity2.addComponent(Position, { x: 1, y: 0, z: -10 });
entity2.addComponent(Speed, { x: -0.1, y: 15, z: 0.3 });
entity2.addComponent(Gravity);
entity2.addComponent(Spin, { x: 0.5, y: 1, z: 1.5 });
const mesh2 = new THREE.Mesh(new THREE.TetrahedronGeometry(1), new THREE.MeshPhysicalMaterial({
  color: 0x1f9aff,
  metalness: 0,
}));
entity2.addComponent(Mesh, { value: mesh2 });
entity2.addComponent(PositionRange,
  { minX: -10, maxX: 10, minY: -10, maxY: 10, minZ: -10, maxZ: 10 });
entity2.addComponent(FallThrough);
entity2.addComponent(AirResistance, { value: 0.5 });
entity2.addComponent(Pulse, { min: 0.5, max: 1.5, speed: 1.5 });

scene.add(mesh);
scene.add(mesh2);

world.registerSystem(GravitySystem);
world.registerSystem(MovementSystem);
world.registerSystem(RenderSystem);
world.registerSystem(SpinSystem);
world.registerSystem(FallThroughSystem);
world.registerSystem(BounceSystem);
world.registerSystem(AirResistanceSystem);
world.registerSystem(PulseSystem);
world.execute(0, 0);

let lastTime = Date.now();
renderer.render(scene, camera);

function render() {
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (deltaTime > 0) {
    // Render the scene and the camera
    world.execute(deltaTime, currentTime);

    renderer.render(scene, camera);
  }

  requestAnimationFrame(render);
}

render();