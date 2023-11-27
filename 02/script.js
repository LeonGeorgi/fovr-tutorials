// Variables for storing the window dimensions in real world (in metres)
import * as THREE from 'https://cdn.skypack.dev/three@v0.133.1';
import {
  FaceDetector,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";


let faceDetector;
let runningMode = "IMAGE";

// Initialize the object detector
const initializefaceDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU"
    },
    runningMode: runningMode
  });
  await enableCam()
};
initializefaceDetector().catch(console.error);

let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
var children = [];

async function enableCam() {
  if (!faceDetector) {
    alert("Face Detector is still loading. Please try again..");
    return;
  }

  // getUsermedia parameters
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  })
  .catch((err) => {
    console.error(err);
  });
}

const m1 = { s: 0.9, d: 0.1 }
const m2 = { s: 0.5, d: 0.22 }
const a = (m1.d - m2.d) * m1.s * m2.s / (m2.s - m1.s)
const b = m2.d - a / m2.s
const wiggleFactor = 0.3;

let lastVideoTime = -1;

function computeCoordinatesFromDetection(detection) {
  let centerX = detection.boundingBox.originX + detection.boundingBox.width / 2;
  let centerY = detection.boundingBox.originY + detection.boundingBox.height / 2;

  const trackerX = ((-centerX / video.offsetWidth) + 0.5) * 2 * wiggleFactor;
  const trackerY = ((-centerY / video.offsetHeight) + 0.5) * 2 * wiggleFactor;
  let boxFactor = detection.boundingBox.width / video.offsetWidth;
  const trackerZ = a / boxFactor + b;
  return new THREE.Vector3(trackerX, trackerY, trackerZ);
}

let movingAverageDetections = [];

function applyMovingAverage(positionVector, windowSize) {
  movingAverageDetections.push(positionVector);
  if (movingAverageDetections.length > windowSize) {
    movingAverageDetections.shift();
  }
  let averageVector = new THREE.Vector3(0, 0, 0);
  for (let detection of movingAverageDetections) {
    averageVector.add(detection);
  }
  averageVector.divideScalar(movingAverageDetections.length);
  return averageVector;
}

let lastSEPositionVector = null;
function applySingleExponentialSmoothing(positionVector, alpha) {
  if (lastSEPositionVector === null) {
    lastSEPositionVector = positionVector;
    return positionVector;
  }
  const smoothedPosition = lastSEPositionVector.clone();
  smoothedPosition.lerp(positionVector, alpha);
  lastSEPositionVector = smoothedPosition;
  return smoothedPosition;
}

let lastDEPositionVector = null;
let lastDEVelocityVector = null;
function applyDoubleExponentialSmoothing(positionVector, alpha, beta) {
  if (lastDEPositionVector === null) {
    lastDEPositionVector = positionVector;
    return positionVector;
  }
  if (lastDEVelocityVector === null) {
    lastDEVelocityVector = positionVector.clone().sub(lastDEPositionVector);
  }
  const smoothedPosition = lastDEPositionVector.clone().add(lastDEVelocityVector);
  smoothedPosition.lerp(positionVector, alpha);
  lastDEPositionVector = smoothedPosition;

  const smoothedVelocity = lastDEVelocityVector.clone();
  smoothedVelocity.lerp(smoothedPosition.clone().sub(lastDEPositionVector), beta);
  lastDEVelocityVector = smoothedVelocity;

  return smoothedPosition;
}

function updateCameraPosition(positionVector) {
  params.CameraX = positionVector.x;
  params.CameraY = positionVector.y;
  params.CameraZ = positionVector.z;
}

async function predictWebcam() {
  // if image mode is initialized, create a new classifier with video runningMode
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceDetector.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();

  // Detect faces using detectForVideo
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const detections = faceDetector.detectForVideo(video, startTimeMs)
      .detections;
    if (detections.length > 0) {
      const detection = detections[0];
      const detectorPosition = computeCoordinatesFromDetection(detection);
      const smoothedPosition = detectorPosition
      //const smoothedPosition = applyMovingAverage(detectorPosition, 10);
      //const smoothedPosition = applySingleExponentialSmoothing(detectorPosition, 0.5);
      //const smoothedPosition = applyDoubleExponentialSmoothing(detectorPosition, 0.1, 0.5);
      updateCameraPosition(smoothedPosition);
    }
    console.log(params.CameraZ)
    displayVideoDetections(detections);
  }

  // Call this function again to keep predicting when the browser is ready
  window.requestAnimationFrame(predictWebcam);
}


function displayVideoDetections(detections) {
  // Remove any highlighting from previous frame.

  for (let child of children) {
    liveView.removeChild(child);
  }
  children.splice(0);

  // Iterate through predictions and draw them to the live view
  for (let detection of detections) {
    const p = document.createElement("p");
    p.innerText =
      "Confidence: " +
      Math.round(parseFloat(detection.categories[0].score) * 100) +
      "% .";
    p.style =
      "left: " +
      (video.offsetWidth -
        detection.boundingBox.width -
        detection.boundingBox.originX) +
      "px;" +
      "top: " +
      (detection.boundingBox.originY - 30) +
      "px; " +
      "width: " +
      (detection.boundingBox.width - 10) +
      "px;";

    const highlighter = document.createElement("div");
    highlighter.setAttribute("class", "highlighter");
    highlighter.style =
      "left: " +
      (video.offsetWidth -
        detection.boundingBox.width -
        detection.boundingBox.originX) +
      "px;" +
      "top: " +
      detection.boundingBox.originY +
      "px;" +
      "width: " +
      (detection.boundingBox.width - 10) +
      "px;" +
      "height: " +
      detection.boundingBox.height +
      "px;";

    liveView.appendChild(highlighter);
    liveView.appendChild(p);

    // Store drawn objects in memory so they are queued to delete at next call
    children.push(highlighter);
    children.push(p);
    for (let keypoint of detection.keypoints) {
      const keypointEl = document.createElement("spam");
      keypointEl.className = "key-point";
      keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
      keypointEl.style.left = `${
        video.offsetWidth - keypoint.x * video.offsetWidth - 3
      }px`;
      liveView.appendChild(keypointEl);
      children.push(keypointEl);
    }
  }
}

var windowWidth, windowHeight;

// Event listener
window.addEventListener('resize', onWindowResize, false);

// The three.js scene: the 3D world where you put objects
const scene = new THREE.Scene();

// The default camera

// The renderer: something that draws 3D objects onto the canvas
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaaaaa, 1);
// Append the renderer canvas into <body>
document.body.appendChild(renderer.domElement);

// Add lights
const hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.5);
scene.add(hemisphereLight);
const light = new THREE.DirectionalLight(0xffffff, 0.7);
light.position.set(0.4, 0.8, 0.5);
scene.add(light);

// Add convergence helper plane
const convergenceMesh = new THREE.Group();
convergenceMesh.add(new THREE.Mesh(
  new THREE.PlaneGeometry(0.01, 0.01),
  new THREE.MeshPhongMaterial({ color: 0xff0000 }),
));
const convergenceLines = new THREE.Group();
convergenceLines.add(new THREE.Mesh(
  new THREE.PlaneGeometry(1, 0.0005),
  new THREE.MeshPhongMaterial({ color: 0xff0000 }),
));
convergenceLines.add(new THREE.Mesh(
  new THREE.PlaneGeometry(0.0005, 1),
  new THREE.MeshPhongMaterial({ color: 0xff0000 }),
));
convergenceMesh.add(convergenceLines);
const convergenceLines2 = convergenceLines.clone();
convergenceLines2.rotation.z = 0.785398; // 45 degrees in radian
convergenceMesh.add(convergenceLines2);
convergenceMesh.rotation.z = 0.785398; // 45 degrees in radian
convergenceMesh.visible = false;
scene.add(convergenceMesh);

// ===== START Task 2.2.1 =====================================================
var params = {
  'IPD': 0.006,
  'Convergence': 0.5, // Distance in front of camera
  'ConvergenceMesh': false, // Mesh helper to see convergence plane
  'Converge': false, // If false, convergence is effectively set at infinity
  'CameraX': 0.0,
  'CameraY': 0.0,
  'CameraZ': 0.5,
  'Stereo': false,
  'ToeIn': true,
  'OffAxis': false,
  'ScreenWidth': 0.52, // Screen physical width (metres). Measure your window!
};

const gui = new dat.GUI();
const stereoButton = gui.add(params, 'Stereo', true); // Keep this for later
gui.add(params, 'IPD', 0.0, 0.2);
gui.add(params, 'Convergence', 0.01, 10.0);
gui.add(params, 'ConvergenceMesh', false);
gui.add(params, 'Converge', false);
gui.add(params, 'CameraX', -1.0, 1.0);
gui.add(params, 'CameraY', -1.0, 1.0);
gui.add(params, 'CameraZ', 0.0, 5.0);
gui.add(params, 'ToeIn', true).onChange(function toggleB() {
  params.OffAxis = !params.ToeIn;
}).listen();
gui.add(params, 'OffAxis', false).onChange(function toggleA() {
  params.ToeIn = !params.OffAxis;
}).listen();
gui.add(params, 'ScreenWidth', 0.05, 0.80);

// ===== END Task 2.2.1 =======================================================

// ===== START Task 2.2.2.a ===================================================
// World "bounding box"
const worldBox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshPhongMaterial({ color: 0x909090, side: THREE.BackSide })
);
scene.add(worldBox);
// ===== END Task 2.2.2.a =====================================================

// ===== START Task 2.2.3.a ===================================================
// For rendering the different channel (colorMask) of each camera
const gl = renderer.getContext('webgl');

// Camera frustum aspect ratio
const ratio = window.innerWidth / window.innerHeight;

// Create the left and right cameras
// Comment/delete this for task 2.2.5 onwards
// const cameraL = new THREE.PerspectiveCamera(60, ratio, 0.01, 10);
// cameraL.position.set(params.CameraX, params.CameraY, params.CameraZ);
// const cameraR = new THREE.PerspectiveCamera(60, ratio, 0.01, 10);
// cameraR.position.set(params.CameraX, params.CameraY, params.CameraZ);
// ===== END Task 2.2.3.a =====================================================

// ===== START Task 2.2.5.a ===================================================
const camera = new THREE.PerspectiveCamera(
  60, // fov — Camera frustum vertical field of view
  ratio, // aspect — Camera frustum aspect ratio
  0.01, // near — Camera frustum near plane
  10 // far — Camera frustum far plane
);
// camera.position.z = 5;

// Create stereo cameras and attach them as children of our centre camera
const cameraL = camera.clone();
const cameraR = camera.clone();
cameraR.parent = camera;
cameraL.parent = camera;
// ===== END Task 2.2.5.a =====================================================

onWindowResize();

create3DWorld();

render();

// ===== START Task 2.2.2.b ===================================================

// Called only when the window is resized 
function onWindowResize() {
  // Calculate real-world window size (in metres)
  const screenAspect = window.screen.width / window.screen.height;
  const screenHeight = params.ScreenWidth / screenAspect;

  // Window size in real-world scale (metres)
  windowWidth = (window.innerWidth / window.screen.width) * params.ScreenWidth;
  windowHeight = (window.innerHeight / window.screen.height) * screenHeight;
  // Rescale our world to match the window

  worldBox.scale.set(windowWidth, windowHeight, windowWidth * 2);
  worldBox.position.set(0, 0, -windowWidth);

  // Adjust the camera aspect ratio to match the window aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Resize the renderer buffers

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== END Task 2.2.2.b =====================================================

// ===== START Task 2.2.2.d / Appendix 2.A1 ===================================

// Replace this with your own scene or use Appendix 2.A1
function create3DWorld() {
  const cube = {
    // The geometry: the shape & size of the object
    geometry: new THREE.BoxGeometry(0.05, 0.05, 0.05),
    material: new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      metalness: 0,
    })
  };
  cube.mesh = new THREE.Mesh(cube.geometry, cube.material);
  scene.add(cube.mesh);

  const screenAspect = window.screen.width / window.screen.height;
  const screenHeight = params.ScreenWidth / screenAspect;
  windowWidth = (window.innerWidth / window.screen.width) * params.ScreenWidth;
  windowHeight = (window.innerHeight / window.screen.height) * screenHeight;

  const pA = new THREE.Vector3(-windowWidth / 2, -windowHeight / 2, 0);
  const pB = new THREE.Vector3(windowWidth / 2, -windowHeight / 2, 0);
  const pC = new THREE.Vector3(-windowWidth / 2, windowHeight / 2, 0);

  // Render red dots at the corners of the screen
  const dotGeometry = new THREE.SphereGeometry(0.01, 32, 32);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const dotA = new THREE.Mesh(dotGeometry, dotMaterial);
  dotA.position.set(pA.x, pA.y, pA.z);
  scene.add(dotA);
  const dotB = new THREE.Mesh(dotGeometry, dotMaterial);
  dotB.position.set(pB.x, pB.y, pB.z);
  scene.add(dotB);
  const dotC = new THREE.Mesh(dotGeometry, dotMaterial);
  dotC.position.set(pC.x, pC.y, pC.z);
  scene.add(dotC);
}

// ===== END Task 2.2.2.d / Appendix 2.A1 =====================================

// ===== START Task 2.2.7 =====================================================
// Note in the example in Figure 7, left and bottom are negative. Top and right are positive. Use the
// function below to construct the off-axis projection matrix. Try to invoke it with correct parameters in the next task.
function makeFrustum(M, left, right, bottom, top, znear, zfar) {
  console.log(M, left, right, bottom, top, znear, zfar)
  const X = 2 * znear / (right - left);
  const Y = 2 * znear / (top - bottom);
  const A = (right + left) / (right - left);
  const B = (top + bottom) / (top - bottom);
  const C = -(zfar + znear) / (zfar - znear);
  const D = -2 * zfar * znear / (zfar - znear);
  console.log(X, Y, A, B, C, D)

  /*M.set(
    X, 0, A, 0,
    0, Y, B, 0,
    0, 0, C, D,
    0, 0, -1, 0
  ); /**/
}

// ===== END Task 2.2.7 =======================================================

// ===== START Task 2.2.8 / Appendix 2.A2 =====================================

// Code from https://github.com/Oblong/generalized-perspective-projection/blob/master/gen-perspective.pdf 
// However, because we know our projection screen is centred at 0,0,0 and aligned with the x-axis, we can simplify our calculations 
function cameraSetProjectionMatrix(camera, offset, halfW, halfH) {
  /*const near = camera.near;
  const far = camera.far;

  var eyePos = new THREE.Vector3(0, 0, 0);
  camera.getWorldPosition(eyePos);

  // left and bottom are negative, top and right are positive

  // Shift the screen by an offset to control convergence

  // makeFrustum expects the top, bottom, left and right to be of the near plane of our frustum, not our projection screen. So scale the values by ‘nearOverDis‘
  const nearOverDist = near / eyePos.z;

  left *= nearOverDist;
  right *= nearOverDist;
  top *= nearOverDist;
  bottom *= nearOverDist;

  // These are all equivalent

  makeFrustum(camera.projectionMatrix, left, right, bottom, top, near, far);*/
}

// ===== END Task 2.2.8 / Appendix 2.A2 =======================================

function render() {

  // ===== START Task 2.2.2.c =================================================
  camera.position.set(params.CameraX, params.CameraY, params.CameraZ);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  // ===== END Task 2.2.2.c ===================================================

  // ===== START Task 2.2.4 ===================================================
  // Update distance between left and right cameras

  // Comment/delete this for task 2.2.5 onwards
  // const halfIPD = params.IPD * 0.5;
  // cameraL.position.set(params.CameraX - halfIPD, params.CameraY, params.CameraZ);
  // cameraR.position.set(params.CameraX + halfIPD, params.CameraY, params.CameraZ);
  // ===== END Task 2.2.4 =====================================================

  // ===== START Task 2.2.5.b =================================================
  // Calculate new FOV given camera distance to window
  const stereoCameraFOV = 180 / Math.PI * 2 * Math.atan(0.5 * windowHeight / params.Convergence);
  camera.fov = stereoCameraFOV;
  camera.updateProjectionMatrix();

  // Note, this copies the FOV and the orientation and position
  cameraL.copy(camera);
  cameraR.copy(camera);

  // Update distance between left and right cameras
  const halfIPD = params.IPD * 0.5;
  cameraL.position.set(-halfIPD, 0, 0);
  cameraR.position.set(halfIPD, 0, 0);
  cameraL.updateMatrixWorld();
  cameraR.updateMatrixWorld();
  // ===== END Task 2.2.5.b ===================================================

  // ===== START Task 2.2.6 ===================================================
  const convergencePoint = new THREE.Vector3(0, 0, params.CameraZ - params.Convergence);
  if (params.Converge) {
    if (params.ToeIn) {
      cameraL.lookAt(convergencePoint);
      cameraR.lookAt(convergencePoint);
    }
    if (params.OffAxis) {

      const M = new THREE.Matrix4();

      //identity matrix
      M.set(
        1, 0, -params.CameraX, -(params.CameraZ - 1) * params.CameraX,
        0, 1, -params.CameraY, -(params.CameraZ - 1) * params.CameraY,
        0, 0, 0.5 / params.CameraZ, 0,
        0, 0, 0, 1
      )
      cameraL.projectionMatrix.multiply(M);
      cameraR.projectionMatrix.multiply(M);


    }
  }
  cameraL.updateMatrixWorld();
  cameraR.updateMatrixWorld();
  // ===== END Task 2.2.6 =====================================================

  // ===== START Task 2.2.9 ===================================================
  // ...
  // ===== END Task 2.2.9 =====================================================

  if (typeof params !== 'undefined' && params.Stereo) {

    // ===== START Task 2.2.3.b ===============================================
    gl.colorMask(true, false, false, false);
    renderer.render(scene, cameraL);
    gl.colorMask(false, true, true, false);
    renderer.render(scene, cameraR);
    // ===== END Task 2.2.3.b =================================================

  } else {
    if (typeof gl !== 'undefined')
      gl.colorMask(true, true, true, false);
    if (typeof camera !== 'undefined')
      renderer.render(scene, camera);
  }

  // Hide / show convergence helper plane
  if (typeof params !== 'undefined' &&
    typeof convergencePoint !== 'undefined' &&
    params.ConvergenceMesh
  ) {
    convergenceMesh.visible = true;
    convergenceMesh.position.set(convergencePoint.x, convergencePoint.y, convergencePoint.z);
  } else {
    convergenceMesh.visible = false;
  }

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}
