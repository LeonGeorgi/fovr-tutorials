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
    let s = mesh.position.y + this.velocity * deltaTime;
    if (s < -2) {
      s = -2;
      this.velocity = -this.velocity;
    }
    if (s > this.amplitude) {
      s = this.amplitude;
      this.velocity = 0;
    }
    mesh.position.y = s
  }
}

class CircleBehavior extends Behavior {
  constructor(speed, center, radius) {
    super(speed);
    this.center = center;
    this.radius = radius;
    this.angle = 0;
  }

  update(mesh, deltaTime) {
    this.angle += this.speed * deltaTime;
    mesh.position.x = this.center.x + this.radius * Math.cos(this.angle);
    mesh.position.y = this.center.y + this.radius * Math.sin(this.angle);
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

class Tetrahedron extends BaseObject {
  constructor(id, behavior, position) {
    const geometry = new THREE.TetrahedronGeometry(1);
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

const entities = [];

for (let i = 0; i < 50; i++) {
  // select random class
  const random = Math.random();
  let entityClass;
  if (random < 0.33) {
    entityClass = Cube
  } else if (random < 0.66) {
    entityClass = Ball
  } else {
    entityClass = Tetrahedron
  }
  // random position
  const x = Math.random() * 10 - 5;
  const y = Math.random() * 4 - 2;
  const z = Math.random() * 3 - 5;
  // random behavior
  let behaviorP = Math.random();
  if (entityClass === Ball && behaviorP < 0.33) {
    behaviorP = behaviorP * 2 + 0.33;
  }
  let behavior
  if (behaviorP < 0.33) {
    // random speed
    const speed = Math.random() * 10;
    behavior = new SpinBehavior(speed)
  } else if (behaviorP < 0.66) {
    // random speed
    const speed = Math.random() * 5;
    // random amplitude
    const amplitude = Math.random() * 5;
    behavior = new BounceBehavior(speed, amplitude)
  } else {
    // random speed
    const speed = Math.random() * 4;
    // random center
    const center = {
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
      z: Math.random() * 10 - 5,
    }
    // random radius
    const radius = Math.random() * 3;
    behavior = new CircleBehavior(speed, center, radius)
  }
  // create entity
  const entity = new entityClass(i, behavior, { x, y, z });
  entities.push(entity);
  scene.add(entity.mesh);
}

let lastTime = Date.now();

function render() {
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  // Render the scene and the camera
  renderer.render(scene, camera);

  for (const entity of entities) {
    entity.update(deltaTime);
  }

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

render();