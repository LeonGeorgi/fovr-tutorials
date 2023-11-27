// FoVR Tutorial Week 6 - Audio
// Demonstrates stereo panning & haas-effect

// Source code for tone.js: https://github.com/Tonejs/Tone.js
// Documentation: https://tonejs.github.io/docs/14.7.58/

var methodOptions = {
  'ILD': 'pan',
  'ITD': 'haas'
};
var sampleSounds = {
  'A': "https://tonejs.github.io/audio/berklee/guitar_pick_1.mp3",
  'B': "https://tonejs.github.io/audio/drum-samples/Bongos/tom1.mp3",
  'C': "https://tonejs.github.io/audio/berklee/Train.mp3",
  'D': "https://tonejs.github.io/audio/berklee/ambient_rain.mp3"
}
var params = {
  'showAnalyzer': true,
  'showSpatialAudioScene': false,
  'process audio': true,        // Sometimes we need some type of user interaction for beeing allowed to start audio processing. Might depend on the browser.
  'volume': 0.9,
  'loop': false,
  'sound': sampleSounds['A'],
  'method': methodOptions.ILD,
  'stereoPosition': 0.5,        // [0..1] left <-> right
  'maxHaasDelay': 20,           // In milleseconds
  'depth': 0.1,                 // [0..1] near <-> far
}

var player;
var inputNode;
var stereoNode;
var mainVolumeNode;

var leftVolumeNode;
var rightVolumeNode;
var leftDelayNode;
var rightDelayNode;

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
  prepareDepth();
}

function prepareStereoPan() {
  //     inputNode
  //         |
  //     splitNode
  //     0 /    \ 1
  // leftNode  rightNote
  //     0 \    / 1
  //      mergeNode
  //         |
  //     stereoNode

  const splitNode = new Tone.Split();
  const mergeNode = new Tone.Merge();  // Merges single channels (i.e. mono to stereo)
  inputNode.connect(splitNode);

  splitNode.connect(leftVolumeNode, 0);
  splitNode.connect(rightVolumeNode, 1);

  leftVolumeNode.connect(mergeNode, 0, 0);
  rightVolumeNode.connect(mergeNode, 0, 1);

  mergeNode.connect(stereoNode);
  onStereoPositionPan(params.stereoPosition, leftVolumeNode, rightVolumeNode);
}

// Shift the volume more to the direction where it should come from
function onStereoPositionPan(stereoPosition) {
  var leftGain = Math.min((1.0 - stereoPosition) * 2.0, 1.0);
  var rightGain = Math.min(stereoPosition * 2.0, 1.0);
  leftVolumeNode.volume.rampTo(Tone.gainToDb(leftGain), 0.0);
  rightVolumeNode.volume.rampTo(Tone.gainToDb(rightGain), 0.0);
}

// ===== START Task 6.2.1.b ===================================================

function updateStereoAudio() {
  const leftDistance = audioSource.position.distanceTo(leftear.position);
  const rightDistance = audioSource.position.distanceTo(rightear.position);
  console.log(leftDistance, rightDistance, leftDistance - rightDistance);
  // ear distance is given in decimeters
  var tDelay = ((leftDistance - rightDistance) / 10.0) / 343.0;
  console.log(tDelay);

}

// ===== END Task 6.2.1.b =====================================================


// ===== START Task 6.2.2 =====================================================

// You will need:
// var delayNode = new new Tone.Delay(0.0);  // DelayLength: [0..1] noDelay <-> maximumDelay, standart maximumDelay is 1 second
// delayNode.delayTime.rampTo(length, time);  // Same as Tone.Volume

function prepareHaasEffect() {
  var mergeNode = new Tone.Merge();  // Merges single channels (i.e. mono to stereo)

  // Setting to left channel (first channel '0' to first channel '0')
  inputNode.connect(mergeNode, 0, 0);

  // Setting to right channel (first channel '0' to second channel '1')
  inputNode.connect(mergeNode, 0, 1);

  // Send the merged (stereo) signal
  mergeNode.connect(stereoNode);
  onStereoPositionHaas(params.stereoPosition);
}

function onStereoPositionHaas(stereoPosition) {
  // ...
}

// ===== END Task 6.2.2 =======================================================


// ===== START Task 6.2.3 =====================================================

// You will need / can use:
// var reverbNode = new Tone.Reverb();
// reverbNode.decay = decayLength;  // 'length' of the reverb
// reverbNode.wet = strength;  // effect-strength, [0..1] 0% <-> 100%

var reverbNode;

function prepareDepth() {

  // Sending both to the output to remain some dry direct sound
  stereoNode.connect(mainVolumeNode);

  onDepth(params.depth);
}

// Many things are possible here
function onDepth(depth) {
  // ...
}

// ===== END Task 6.2.3 =======================================================


// ############################################################################
// You do not need to change anything below this line
// ############################################################################

// On-screen menu for changing parameters.
// See https://github.com/dataarts/dat.gui
const gui = new dat.GUI({ width: 300 });
gui.add(params, 'showAnalyzer', false);
gui.add(params, 'showSpatialAudioScene', false)
.onChange(toggleSpatialAudioSceneVisibility);
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
  switch (params.method) {
    case methodOptions.ILD:
      onStereoPositionPan(params.stereoPosition);
      break;
    case methodOptions.ITD:
      onStereoPositionHaas(params.stereoPosition);
      break;
  }
});
gui.add(params, 'maxHaasDelay', 0.0, 1000.0).onChange(() => {
  if (params.method == methodOptions.ITD) {
    setupMethod();
    onStereoPositionHaas(params.stereoPosition);
  }
});
gui.add(params, 'depth', 0.0, 1.0).onChange(() => {
  onDepth(params.depth);
});

function setupMethod() {
  if (inputNode)
    inputNode.disconnect();
  if (stereoNode)
    stereoNode.disconnect();
  if (reverbNode)
    reverbNode.disconnect();
  setup();

  switch (params.method) {
    case methodOptions.ILD:
      prepareStereoPan();
      break;
    case methodOptions.ITD:
      prepareHaasEffect();
      break;
  }
  prepareSpectrumAnalyzer();
}

var analyzerNode;

function prepareSpectrumAnalyzer() {
  analyzerNode = new Tone.FFT(2048);
  mainVolumeNode.connect(analyzerNode);
}

var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
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
var width = window.innerWidth;
var height = window.innerHeight;
var k = width / height;
var s = 5;
const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaaaaa, 1);
document.body.appendChild(renderer.domElement);

// Add a light
var light = new THREE.PointLight(0xFFFFFF);
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

var sourceR = 0.5;
audioSource = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: false }));
audioSource.position.y += 2.5;

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

    var spectrum = analyzerNode.getValue();

    ctx.beginPath();
    spectrum.forEach((val, i) => {
      ctx.lineTo(i, 300 + Tone.dbToGain(val) * -10000);
    });
    ctx.stroke();

  }

  // Render the scene and the camera
  renderer.render(scene, camera);

  // Visualize audio
  var sum = 0.5;
  var spectrum = analyzerNode.getValue();
  spectrum.forEach((val, i) => {
    sum += Tone.dbToGain(val);
  });
  //console.log(sum);
  sourceR = sum;

  audioSource.scale.x = sourceR;
  audioSource.scale.y = sourceR;

  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);
}

// Movement speed - please calibrate these values if needed
var xSpeed = 0.1;
var ySpeed = 0.1;

document.addEventListener("keydown", onDocumentKeyDown, false);

function onDocumentKeyDown(event) {
  var keyCode = event.which;
  if (keyCode == 87) {
    head.position.y += ySpeed; // W
  } else if (keyCode == 83) {
    head.position.y -= ySpeed; // S
  } else if (keyCode == 65) {
    head.position.x -= xSpeed; // A
  } else if (keyCode == 68) {
    head.position.x += xSpeed; // D
  } else if (keyCode == 32) {
    head.position.set(0, 0, 0);
  }
  update_ears();
  updateStereoAudio();
};
