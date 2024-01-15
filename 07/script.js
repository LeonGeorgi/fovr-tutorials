class BaseObject {
  constructor(id, behavior, mesh) {
    this.id = id;
    this.behavior = behavior;
    this.mesh = mesh;
  }

  update(deltaTime) {
    if (this.behavior) {
      this.behavior.update(this.mesh, deltaTime);
    }
  }
}

class Behavior {
  constructor(speed) {
    this.speed = speed;
  }
}

class SpinBehavior extends Behavior {
  constructor(speed) {
    super(speed);
  }

  update(mesh, deltaTime) {
    mesh.rotation.x += this.speed * deltaTime;
    mesh.rotation.y -= this.speed * deltaTime;
  }
}

class BounceBehavior extends Behavior {
  constructor(speed, amplitude) {
    super(speed);
    this.amplitude = amplitude;
    this.velocity = Math.sqrt(-8 * -9.81 * amplitude / 3);
  }

  update(mesh, deltaTime) {
    this.velocity = this.velocity - 9.81 * deltaTime;
    const s = mesh.position.y + this.velocity * deltaTime;
    if (s < -2) {
      this.velocity = -this.velocity;
    }
    mesh.position.y = s
    console.log(mesh.position.y)
  }
}

class Cube extends BaseObject {
  constructor(id, behavior, position) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    console.log(mesh.rotation.x);
    super(id, behavior, mesh);

    this.mesh.position.set(position.x, position.y, position.z);
  }
}

class Ball extends BaseObject {
  constructor(id, behavior, position) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    super(id, behavior, mesh);

    this.mesh.position.set(position.x, position.y, position.z);
  }
}


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

const cube = new Cube(2,
  new SpinBehavior(2),
  { x: 0, y: 0, z: 0 }
);

const ball = new Ball(
  1,
  new BounceBehavior(5, 2),
  { x: 2, y: 0, z: 0 }
);

scene.add(cube.mesh);
scene.add(ball.mesh);

let lastTime = Date.now();

function render() {
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  // Render the scene and the camera
  renderer.render(scene, camera);

  cube.update(deltaTime);
  ball.update(deltaTime);

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

render();