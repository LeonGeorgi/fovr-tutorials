import * as tasks from "./tasks.js";

// NOTE turn that to false to render the scene, true will run tests
const runTests = false;

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

// Make the camera further from the cube so we can see it better
camera.position.z = 5;

// Add lights
const hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.5);
scene.add(hemisphereLight);
const light = new THREE.DirectionalLight(0xffffff, 0.7);
light.position.set(0.4, 0.8, 0.5);
scene.add(light);

const filters =  ['Signal', 'Noise', 'Moving Average', 'Single Exponential', 'Double Exponential', 'One Euro'];

//HINT: You will need at least these params for this tutorial 
// Params
var params = {
  'Noise': 0.05,
  'Samples': 30,    // Moving Average Filter
  'SEAlpha': 0.03,  // Single Exponential Filter
  'DEAlpha': 0.04,  // Double Exponential Filter
  'DEBeta': 0.5,    // Double Exponential Filter
  'filter': filters[0]
};

// GUI
const gui = new dat.GUI();
gui.add(params, 'Noise', 0.0, 1.0);
gui.add(params, 'Samples', 1, 200);
gui.add(params, 'SEAlpha', 0.01, 1.0);
gui.add(params, 'DEAlpha', 0, 1);
gui.add(params, 'DEBeta', 0, 1);
gui.add(params, 'filter', filters)

// Update the mouse position when the mouse moves
const mouse = {x: 0, y: 0}
function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates,

  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

const raycaster = new THREE.Raycaster(); 

let mat = new THREE.MeshPhongMaterial({ color: "#0f0" });
let sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 32, 32), mat);
scene.add(sphereMesh);

function render() {
  raycaster.setFromCamera(mouse, camera);

  // Source
  let source = new THREE.Vector3();
  source.copy(raycaster.ray.direction);
  source.multiplyScalar(6);
  source.z = 0;

  // make some noise!
  let noise = new THREE.Vector3;
  noise.set((Math.random() * 2 - 1) * params.Noise, (Math.random() * 2 - 1) * params.Noise, 0);
  let measurement = new THREE.Vector3;
  measurement.copy(source);
  measurement.add(noise);

  let res;
  switch(params.filter) {
    case filters[0]:
      res = source;
      break;
    case filters[1]:
      res = measurement;
      break;
    case filters[2]:
      res = tasks.updateMovingAverage(measurement, params);
      break;
    case filters[3]:
      res = tasks.updateSingleExponential(measurement, params);
      break;
    case filters[4]:
      res = tasks.updateDoubleExponential(measurement, params);
      break;
    case filters[5]:
      res = tasks.updateOneEuro(measurement, params);
      break;
  }

  sphereMesh.position.copy(res);

  // Render the scene and the camera
  renderer.render(scene, camera);

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

if (!runTests) {
  render();
} else {
  console.info("Running tests");
  Object.values(tests).forEach(t => t());
}
