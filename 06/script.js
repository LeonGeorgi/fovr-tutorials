// FoVR Tutorial Week 6 - Audio
// Demonstrates stereo panning & haas-effect

// Source code for tone.js: https://github.com/Tonejs/Tone.js
// Documentation: https://tonejs.github.io/docs/14.7.58/

const methodOptions = {
  'ILD': 'pan',
  'ITD': 'haas',
  'Both': 'both'
};

const controlMode = {
  'GUI': 'gui',
  'WASD': 'wasd'
};

const sampleSounds = {
  'A': "https://tonejs.github.io/audio/berklee/guitar_pick_1.mp3",
  'B': "https://tonejs.github.io/audio/drum-samples/Bongos/tom1.mp3",
  'C': "https://tonejs.github.io/audio/berklee/Train.mp3",
  'D': "https://tonejs.github.io/audio/berklee/ambient_rain.mp3"
};
const params = {
  'showAnalyzer': true,
  'showSpatialAudioScene': true,
  'controlMode': controlMode.GUI,
  'process audio': true,        // Sometimes we need some type of user interaction for beeing allowed to start audio processing. Might depend on the browser.
  'volume': 1,
  'loop': true,
  'sound': sampleSounds['A'],
  'method': methodOptions.ILD,
  'stereoPosition': 0.5,        // [0..1] left <-> right
  'headAbsorptionFactor': 0.5,  // [0..1] 0: no absorption, 1: full absorption
  'earDistance': 0.2,           // In milliseconds
  'depth': 0.1,                 // [0..1] near <-> far
  'reverbEnabled': false,
  'reverbDecay': 1,            // [0..1000] milliseconds
  'reverbWet': 0.0              // [0..1] dry <-> wet
};

let player;
let inputNode;
let stereoNode;
let mainVolumeNode;

let leftVolumeNode;
let rightVolumeNode;
let leftDelayNode;
let rightDelayNode;

let reverbNode;

function setup() {
  Tone.start();

  player = new Tone.Player({
    'url': params.sound,
    'loop': params.loop,
    'autostart': true
  });
  inputNode = new Tone.Mono();  // Forcing to have it mono (if it was a stereo signal before)
  player.connect(inputNode);

  leftVolumeNode = new Tone.Volume();
  rightVolumeNode = new Tone.Volume();

  leftDelayNode = new Tone.Delay(0.0);
  rightDelayNode = new Tone.Delay(0.0);

  stereoNode = new Tone.Volume();  // Just using a volumeNode here for having a pass-through of our stereo signal
  mainVolumeNode = new Tone.Volume(Tone.gainToDb(params.volume)).toDestination();

  reverbNode = new Tone.Reverb();

}

function connectNodes() {
  //          inputNode
  //              |
  //           splitNode
  //             /  \
  // leftVolumeNode rightVolumeNode
  //            |    |
  // leftDelayNode  rightDelayNode
  //             \  /
  //           mergeNode
  //              |
  //          stereoNode
  //              |
  //          reverbNode
  //              |
  //        mainVolumeNode

  const splitNode = new Tone.Split();
  const mergeNode = new Tone.Merge();  // Merges single channels (i.e. mono to stereo)
  inputNode.connect(splitNode);

  if (params.method === methodOptions.ILD) {
    splitNode.connect(leftVolumeNode, 0);
    splitNode.connect(rightVolumeNode, 1);

    leftVolumeNode.connect(mergeNode, 0, 0);
    rightVolumeNode.connect(mergeNode, 0, 1);
  } else if (params.method === methodOptions.ITD) {
    splitNode.connect(leftDelayNode, 0);
    splitNode.connect(rightDelayNode, 1);

    leftDelayNode.connect(mergeNode, 0, 0);
    rightDelayNode.connect(mergeNode, 0, 1);
  } else if (params.method === methodOptions.Both) {
    splitNode.connect(leftVolumeNode, 0);
    splitNode.connect(rightVolumeNode, 1);

    leftVolumeNode.connect(leftDelayNode);
    rightVolumeNode.connect(rightDelayNode);

    leftDelayNode.connect(mergeNode, 0, 0);
    rightDelayNode.connect(mergeNode, 0, 1);
  }

  mergeNode.connect(stereoNode);

  if (params.reverbEnabled) {
    stereoNode.connect(reverbNode);
    reverbNode.connect(mainVolumeNode);
  } else {
    stereoNode.connect(mainVolumeNode);
  }
}

function applyVolume(leftVector, rightVector) {

  const rlSum = rightVector.clone().add(leftVector);
  const rlDiff = rightVector.clone().sub(leftVector);
  const headFactor = rlSum.dot(rlDiff) / rlSum.length() / 2.0;
  const leftDistance = leftVector.length();
  const rightDistance = rightVector.length();
  let volumeLeft = 2.5 ** 2 / leftDistance ** 2;
  let volumeRight = 2.5 ** 2 / rightDistance ** 2;

  if (headFactor < 0) {
    volumeLeft = volumeLeft * (1 + headFactor * params.headAbsorptionFactor);
  } else {
    volumeRight = volumeRight * (1 - headFactor * params.headAbsorptionFactor);
  }

  console.log("volume left: " + volumeLeft + ", volume right: " + volumeRight);

  leftVolumeNode.volume.rampTo(Tone.gainToDb(volumeLeft), 0.0);
  rightVolumeNode.volume.rampTo(Tone.gainToDb(volumeRight), 0.0);
}

function updateSoundBasedOn3DModel() {
  const l = leftear.position.clone().sub(audioSource.position);
  const r = rightear.position.clone().sub(audioSource.position);
  applyVolume(l, r)

  const leftDistance = l.length();
  const rightDistance = r.length();
  applyTimeDelay(leftDistance, rightDistance);
}

function applyTimeDelay(leftDistance, rightDistance) {
  const earDistanceFactor = params.earDistance / 2.0;
  const adjustedLeftDistance = leftDistance * earDistanceFactor;
  const adjustedRightDistance = rightDistance * earDistanceFactor;
  const deltaInMeters = (adjustedLeftDistance - adjustedRightDistance);

  const timeDelay = deltaInMeters / 343.0;

  const delayLeft = timeDelay > 0 ? timeDelay : 0.0;
  const delayRight = timeDelay < 0 ? -timeDelay : 0.0;

  console.log("delay left: " + delayLeft + ", delay right: " + delayRight);

  leftDelayNode.delayTime.rampTo(delayLeft, 0.0);
  rightDelayNode.delayTime.rampTo(delayRight, 0.0);
}


// Many things are possible here
function updateReverb(decay, wet) {
  console.log("decay: " + decay + " wet: " + wet);
  reverbNode.decay = decay;
  reverbNode.wet = wet;
}


// ############################################################################
// You do not need to change anything below this line
// ############################################################################

// On-screen menu for changing parameters.
// See https://github.com/dataarts/dat.gui
const gui = new dat.GUI({ width: 300 });
gui.add(params, 'showAnalyzer', false);
gui.add(params, 'showSpatialAudioScene', false)
.onChange(toggleSpatialAudioSceneVisibility);
gui.add(params, 'controlMode', controlMode).onChange(() => {
  applySoundModifications()
});
gui.add(params, 'process audio').onChange(() => {
  if (params['process audio']) {
    setupMethod();
  } else {
    if (inputNode)
      inputNode.disconnect();
    if (stereoNode)
      stereoNode.disconnect();
    if (reverbNode)
      reverbNode.disconnect();
  }
});
gui.add(params, 'volume', 0.0, 1.0).onChange(() => {
  mainVolumeNode.volume.rampTo(Tone.gainToDb(params.volume));
});
gui.add(params, 'loop').onChange(() => {
  player.loop = params.loop;
  if (params.loop) {
    player.start();
    console.log("sound started to play")
  }
});
gui.add(params, 'sound', sampleSounds).onChange(() => {
  setupMethod();
});
gui.add(params, 'method', methodOptions).onChange(() => {
  setupMethod();
});
gui.add(params, 'stereoPosition', 0.0, 1.0).onChange(() => {
  if (params.controlMode === controlMode.GUI) {
    applySoundModifications();
  }
});
gui.add(params, 'earDistance', 0.0, 0.5).onChange(() => {
  if (params.method === methodOptions.ITD) {
    applySoundModifications();
  }
});
gui.add(params, 'headAbsorptionFactor', 0.0, 1.0).onChange(() => {
    applySoundModifications();
});
gui.add(params, 'reverbEnabled').onChange(() => {
  setupMethod();
});
gui.add(params, 'reverbDecay', 0.0, 10.0).onChange(() => {
  updateReverb(params.reverbDecay, params.reverbWet);
});
gui.add(params, 'reverbWet', 0.0, 1.0).onChange(() => {
  updateReverb(params.reverbDecay, params.reverbWet);
});

const leftEarGUI = new THREE.Vector2(-1, 0);
const rightEarGUI = new THREE.Vector2(1, 0);

function updateSoundBasedOnGUI() {
  const source = new THREE.Vector2(
    10 * -Math.cos(params.stereoPosition * Math.PI),
    10 * Math.sin(params.stereoPosition * Math.PI)
  );
  const r = rightEarGUI.clone().sub(source);
  const l = leftEarGUI.clone().sub(source);
  applyVolume(l, r)

  const leftDistance = l.length();
  const rightDistance = r.length();
  applyTimeDelay(leftDistance, rightDistance);
}

function applySoundModifications() {
  if (params.controlMode === controlMode.GUI) {
    updateSoundBasedOnGUI();
  } else if (params.controlMode === controlMode.WASD) {
    updateSoundBasedOn3DModel();
  }
  updateReverb(params.reverbDecay, params.reverbWet);
}

function setupMethod() {
  if (inputNode)
    inputNode.disconnect();
  if (stereoNode)
    stereoNode.disconnect();
  if (reverbNode)
    reverbNode.disconnect();
  setup();
  connectNodes();
  applySoundModifications();
  prepareSpectrumAnalyzer();
}

let analyzerNode;

function prepareSpectrumAnalyzer() {
  analyzerNode = new Tone.FFT(2048);
  mainVolumeNode.connect(analyzerNode);
}

const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
ctx.strokeStyle = '#000000';
ctx.lineWidth = 1;

// Run if ToneJs has been loaded
Tone.loaded().then(() => {
  if (params['process audio']) {
    setupMethod();
  }

  prepareSpectrumAnalyzer();
  render();
});

// For the speaker and the player
const scene = new THREE.Scene();

// The camera
const width = window.innerWidth;
const height = window.innerHeight;
const k = width / height;
const s = 15;
const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaaaaa, 1);
document.body.appendChild(renderer.domElement);

// Add a light
const light = new THREE.PointLight(0xFFFFFF);
light.position.set(0, 5, 5);
scene.add(light);

// The mesh: the geometry and material combined, and something we can directly add into the scene
head = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xcccccc, side: THREE.DoubleSide, wireframe: false }));

leftear = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide, wireframe: false }));

rightear = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide, wireframe: false }));

nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 0.2, 32),
  new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide, wireframe: false }));

let sourceR = 0.5;
audioSource = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: false }));
audioSource.position.y += 10;

update_ears();

function update_ears() {
  nose.position.x = head.position.x;
  nose.position.y = head.position.y + 1;

  leftear.position.y = head.position.y;
  leftear.position.x = head.position.x - 1;

  rightear.position.y = head.position.y;
  rightear.position.x = head.position.x + 1;
}

function toggleSpatialAudioSceneVisibility() {
  head.visible = params.showSpatialAudioScene;
  leftear.visible = params.showSpatialAudioScene;
  rightear.visible = params.showSpatialAudioScene;
  nose.visible = params.showSpatialAudioScene;
  audioSource.visible = params.showSpatialAudioScene;
}

// Add the sphere into the scene
scene.add(head);
scene.add(leftear);
scene.add(rightear);
scene.add(nose);
scene.add(audioSource);

toggleSpatialAudioSceneVisibility();

camera.position.z = 5;

function render() {

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (params.showAnalyzer) {

    const spectrum = analyzerNode.getValue();

    ctx.beginPath();
    for (const val of spectrum) {
      const i = spectrum.indexOf(val);
      ctx.lineTo(i, 300 + Tone.dbToGain(val) * -10000);
    }
    ctx.stroke();

  }

  // Render the scene and the camera
  renderer.render(scene, camera);

  // Visualize audio
  let sum = 0.5;
  for (const val of analyzerNode.getValue()) {
    sum += Tone.dbToGain(val);
  }
  sourceR = sum;

  audioSource.scale.x = sourceR;
  audioSource.scale.y = sourceR;

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

// Movement speed - please calibrate these values if needed
const xSpeed = 0.25;
const ySpeed = 0.25;

document.addEventListener("keydown", onDocumentKeyDown, false);

function onDocumentKeyDown(event) {
  if (params.controlMode !== controlMode.WASD) {
    return;
  }
  const keyCode = event.which;
  if (keyCode === 87) {
    head.position.y += ySpeed; // W
  } else if (keyCode === 83) {
    head.position.y -= ySpeed; // S
  } else if (keyCode === 65) {
    head.position.x -= xSpeed; // A
  } else if (keyCode === 68) {
    head.position.x += xSpeed; // D
  } else if (keyCode === 32) {
    head.position.set(0, 0, 0);
  }
  update_ears();
  updateSoundBasedOn3DModel();
}
