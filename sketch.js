let cameraVideo = document.querySelector('#camera-feed');
let cameraReady = false;
let modelX = 0;
let modelY = 18;
let modelScale = 1;
let cameraRequestActive = false;

const startButton = document.querySelector('#start-camera');
const statusText = document.querySelector('#status');

startButton.addEventListener('pointerdown', beginCameraRequest, { passive: false });
startButton.addEventListener('touchend', beginCameraRequest, { passive: false });
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
  const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.elt.addEventListener('pointerdown', moveModel);
}

function draw() {
  if (!cameraReady) {
    background(8, 16, 29);
    drawWelcome();
    return;
  }

  clear();
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

    cameraVideo.autoplay = true;
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.srcObject = stream;
    await cameraVideo.play();

    cameraReady = true;
    cameraVideo.classList.add('visible');
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

function drawModel() {
  push();
  translate(modelX, modelY + 20, 0);
  scale(modelScale * 0.82);
  rotateX(-0.12);
  rotateY(frameCount * 0.008);
  noStroke();
  ambientLight(155);
  directionalLight(255, 220, 235, -0.5, -0.8, -1);

  drawCampusBase();
  drawWelcomeGate(-92, 60);
  drawLearningStudio(-58, -40, 78, 52, 34, color(62, 131, 190));
  drawLearningStudio(66, -40, 76, 52, 34, color(156, 60, 98));
  drawSharedGarden(0, 15);
  drawCommunityCircle(0, 57);

  drawPerson(-94, 25, color(255, 186, 55));
  drawPerson(-40, -5, color(246, 135, 183));
  drawPerson(25, 12, color(255, 186, 55));
  drawPerson(88, 22, color(246, 135, 183));
  drawPerson(48, -67, color(255, 186, 55));
  pop();
}

function drawCampusBase() {
  push();
  fill(248, 245, 235);
  box(260, 10, 185);

  fill(221, 217, 202);
  translate(0, -7, 28);
  box(208, 2, 20);
  pop();
}

function drawWelcomeGate(x, z) {
  push();
  translate(x, -6, z);
  fill(205, 157, 96);

  push();
  translate(-22, -29, 0);
  cylinder(4, 54, 8, 1);
  pop();

  push();
  translate(22, -29, 0);
  cylinder(4, 54, 8, 1);
  pop();

  push();
  translate(0, -55, 0);
  box(56, 9, 8);
  pop();

  fill(255, 255, 250);
  translate(0, -55, -5);
  box(42, 18, 3);
  pop();
}

function drawLearningStudio(x, z, studioWidth, studioDepth, studioHeight, studioColor) {
  push();
  translate(x, -6 - studioHeight / 2, z);
  fill(studioColor);
  box(studioWidth, studioHeight, studioDepth);

  fill(246, 245, 235);
  translate(0, -studioHeight / 2 - 4, 0);
  box(studioWidth + 8, 8, studioDepth + 8);

  fill(255, 255, 255);
  translate(-studioWidth * 0.22, studioHeight * 0.12, -studioDepth / 2 - 1);
  box(19, 16, 3);
  translate(studioWidth * 0.44, 0, 0);
  box(19, 16, 3);
  pop();
}

function drawSharedGarden(x, z) {
  push();
  translate(x, -7, z);
  fill(72, 151, 98);
  box(85, 4, 60);

  drawTree(-28, -16, 13, color(129, 193, 83));
  drawTree(20, -10, 14, color(72, 151, 98));
  drawTree(-5, 18, 11, color(169, 207, 86));

  fill(238, 202, 83);
  translate(0, -5, 0);
  cylinder(14, 3, 20, 1);
  pop();
}

function drawTree(x, z, size, leafColor) {
  push();
  translate(x, -12, z);
  fill(140, 96, 55);
  cylinder(2.5, 15, 8, 1);
  translate(0, -12, 0);
  fill(leafColor);
  sphere(size, 10, 8);
  pop();
}

function drawCommunityCircle(x, z) {
  push();
  translate(x, -8, z);
  fill(250, 211, 92);
  cylinder(26, 4, 30, 1);

  for (let index = 0; index < 6; index += 1) {
    const angle = (TWO_PI / 6) * index;
    const seatX = cos(angle) * 36;
    const seatZ = sin(angle) * 36;
    push();
    translate(seatX, 0, seatZ);
    fill(index % 2 === 0 ? color(62, 131, 190) : color(156, 60, 98));
    box(15, 7, 11);
    pop();
  }
  pop();
}

function drawPerson(x, z, personColor) {
  push();
  translate(x, -8, z);
  fill(personColor);
  cylinder(3, 16, 8, 1);
  translate(0, -13, 0);
  sphere(5, 10, 8);
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
  moveModel();
}

function moveModel(event) {
  if (!cameraReady) {
    return;
  }

  const x = event?.clientX ?? mouseX;
  const y = event?.clientY ?? mouseY;
  modelX = x - width / 2;
  modelY = y - height / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
