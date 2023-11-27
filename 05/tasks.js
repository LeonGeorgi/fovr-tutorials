// if you need variables outside the functions, define them above

/**
 @param measurement THREE.Vector3
 @param params Object containing all parameter values visible in the GUI
 */

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

export function updateMovingAverage(measurement, params) {
  // print measurement
  const smoothing = applyMovingAverage(measurement, params.Samples);
  console.log(measurement, smoothing);
  return smoothing;
}

export function updateSingleExponential(measurement, params) {
  const smoothing = applySingleExponentialSmoothing(measurement, params.SEAlpha);
  console.log(measurement, smoothing);
  return smoothing;
}

export function updateDoubleExponential(measurement, params) {
  const smoothing = applyDoubleExponentialSmoothing(measurement, params.DEAlpha, params.DEBeta);
  console.log(measurement, smoothing);
  return smoothing;
}


// optional task
let prevT = 0;
let dX = null;
function alpha(dCutoff, rate) {
  const tau = 1 / (2 * Math.PI * dCutoff);
  const te = 1 / rate;
  return 1 / (1 + tau / te);
}

// low pass filter class
export class LowPassFilter {
  constructor() {
    this.prev = null;
  }

  update(measurement, alpha) {
    if (this.prev === null) {
      this.prev = measurement.clone();
      return measurement;
    }
    const smoothed = this.prev.clone().lerp(measurement, alpha);
    this.prev = smoothed.clone();
    return smoothed;
  }
}

const xFilter = new LowPassFilter();
const dxFilter = new LowPassFilter();

function computeRate() {
  const currT = performance.now();
  const dt = (currT - prevT) / 1000;
  prevT = currT;
  return dt;
}

export function updateOneEuro(measurement, params) {
  let alpha1 = 0;
  let rate = 60;

  const dCutoff = 1.0;
  if (prevT === 0) {
    prevT = performance.now();
    dX = new THREE.Vector3(0, 0, 0);
  } else {
    const dt = computeRate();
    rate = 1 / dt;
    alpha1 = alpha(dCutoff, rate);
    dX = measurement.clone().sub(xFilter.prev);
  }
  const edx = dxFilter.update(dX, alpha1);
  // console.log(alpha);

  const minCutoff = 1.0;
  const cutoff = minCutoff + params.DEBeta * edx.length();
  return xFilter.update(measurement, alpha(cutoff, rate));

}