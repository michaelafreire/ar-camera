let cameraVideo;
let cameraReady = false;
let modelX = 0;
let modelY = 18;
let modelScale = 1;
let cameraRequestActive = false;

const startButton = document.querySelector('#start-camera');
const statusText = document.querySelector('#status');

startButton.addEventListener('pointerdown', beginCameraRequest, { passive: false });
startButton.addEventListener('click', beginCameraRequest);

function beginCameraRequest(event) {
  event.preventDefault();

  if (cameraRequestActive || cameraReady) {
    return;
  }

  cameraRequestActive = true;
  startCamera().finally(() => {
    cameraRequestActive = false;
  });
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, WEBGL);
}

function draw() {
  background(8, 16, 29);

  if (!cameraReady) {
    drawWelcome();
    return;
  }

  drawCamera();
  drawModel();
  drawLabel();
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    statusText.textContent = 'This browser cannot access a camera. Open this link in Safari or Chrome.';
    return;
  }

  startButton.disabled = true;
  startButton.textContent = 'Opening camera…';
  statusText.textContent = 'Allow camera access in the browser prompt.';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    cameraVideo = document.createElement('video');
    cameraVideo.autoplay = true;
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.srcObject = stream;
    await cameraVideo.play();

    cameraReady = true;
    startButton.hidden = true;
    statusText.textContent = 'Tap anywhere to move the model.';
  } catch (error) {
    startButton.disabled = false;
    startButton.textContent = 'Try camera again';
    statusText.textContent = error.name === 'NotAllowedError'
      ? 'Camera access was blocked. Allow Camera in browser settings, then try again.'
      : 'The camera could not start. Open this link directly in Safari or Chrome and try again.';
  }
}

function drawWelcome() {
  push();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(26);
  text('Camera model viewer', 0, -38);
  fill(190, 205, 230);
  textSize(15);
  text('Open the camera to place the model.', 0, 4);
  pop();
}

function drawCamera() {
  const videoWidth = cameraVideo.videoWidth || 16;
  const videoHeight = cameraVideo.videoHeight || 9;
  const videoRatio = videoWidth / videoHeight;
  const screenRatio = width / height;
  let renderWidth = width;
  let renderHeight = height;

  if (videoRatio > screenRatio) {
    renderWidth = height * videoRatio;
  } else {
    renderHeight = width / videoRatio;
  }

  push();
  translate(0, 0, -500);
  imageMode(CENTER);
  image(cameraVideo, 0, 0, renderWidth, renderHeight);
  pop();
}

function drawModel() {
  push();
  translate(modelX, modelY, 0);
  scale(modelScale);
  rotateY(frameCount * 0.012);
  noStroke();
  ambientLight(155);
  directionalLight(255, 220, 235, -0.5, -0.8, -1);

  fill(255, 80, 135);
  box(70, 52, 52);
  translate(0, -47, 0);
  fill(255, 210, 70);
  sphere(31);
  translate(-25, 58, 0);
  fill(95, 220, 255);
  box(16, 50, 16);
  translate(50, 0, 0);
  box(16, 50, 16);
  pop();
}

function drawLabel() {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);
  noStroke();
  fill(0, 120);
  rect(12, 12, 175, 34, 8);
  fill(255);
  textSize(14);
  text('Camera AR mode', 24, 34);
  pop();
}

function mousePressed() {
  if (cameraReady) {
    modelX = mouseX - width / 2;
    modelY = mouseY - height / 2;
  }
}

function touchStarted() {
  if (cameraReady && touches.length > 0) {
    modelX = touches[0].x - width / 2;
    modelY = touches[0].y - height / 2;
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
