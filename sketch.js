let cameraVideo = document.querySelector('#camera-feed');
let cameraReady = false;
let cameraRequestActive = false;
let directionRequestActive = false;
let directionEnabled = false;
let referenceHeading;
let currentHeading;
let storyHeading;
let activeScene = 0;

const startButton = document.querySelector('#start-camera');
const directionButton = document.querySelector('#enable-direction');
const statusText = document.querySelector('#status');
const storyCard = document.querySelector('#story-card');
const storyTitle = document.querySelector('#story-title');
const storyText = document.querySelector('#story-text');
const sceneNames = ['Welcome', 'Learning', 'Community', 'Garden'];
const stories = {
  welcome: {
    title: 'Welcome',
    text: 'The entrance makes belonging visible from the first moment: every learner is greeted, noticed, and invited in.'
  },
  garden: {
    title: 'Wellbeing Garden',
    text: 'The garden is a calm shared space for conversation, reflection, play, and connection with nature.'
  },
  learning: {
    title: 'Learning Together',
    text: 'These flexible learning studios support collaboration, creativity, and many different ways to learn.'
  },
  community: {
    title: 'Community Circle',
    text: 'The circle gives every person a place to listen, speak, make decisions, and feel part of the school.'
  },
  participation: {
    title: 'Everyone Takes Part',
    text: 'The colourful figures represent learners, families, and staff shaping school life together.'
  }
};

startButton.addEventListener('pointerdown', beginCameraRequest, { passive: false });
startButton.addEventListener('touchend', beginCameraRequest, { passive: false });
startButton.addEventListener('click', beginCameraRequest);
directionButton.addEventListener('click', beginDirectionRequest);

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
  canvas.elt.addEventListener('pointerdown', handleModelTap);
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
    directionButton.hidden = false;
    statusText.textContent = 'Enable direction, then turn your body to explore the school.';
  } catch (error) {
    startButton.disabled = false;
    startButton.textContent = 'Try camera again';
    statusText.textContent = error.name === 'NotAllowedError'
      ? 'Camera access was blocked. Allow Camera in browser settings, then try again.'
      : 'The camera could not start. Open this link directly in Safari or Chrome and try again.';
  }
}

function beginDirectionRequest(event) {
  event.preventDefault();

  if (directionRequestActive || directionEnabled) {
    return;
  }

  directionRequestActive = true;
  enableDirection().finally(() => {
    directionRequestActive = false;
  });
}

async function enableDirection() {
  directionButton.disabled = true;
  directionButton.textContent = 'Enabling direction…';
  statusText.textContent = 'Allow Motion & Orientation in the iPhone permission prompt.';

  try {
    if (typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Direction permission was not granted.');
      }
    }

    window.addEventListener('deviceorientation', updateDirection, true);
    directionEnabled = true;
    directionButton.hidden = true;
    statusText.textContent = 'Turn to explore, then tap a coloured part of the model to hear its story.';
  } catch (error) {
    directionButton.disabled = false;
    directionButton.textContent = 'Try direction again';
    statusText.textContent = 'Direction access is needed to explore. Allow Motion & Orientation, then try again.';
  }
}

function updateDirection(event) {
  const heading = Number.isFinite(event.webkitCompassHeading)
    ? event.webkitCompassHeading
    : Number.isFinite(event.alpha)
      ? (360 - event.alpha) % 360
      : null;

  if (heading === null) {
    return;
  }

  if (referenceHeading === undefined) {
    referenceHeading = heading;
  }

  currentHeading = heading;

  if (!storyCard.hidden && storyHeading !== undefined
    && headingDifference(currentHeading, storyHeading) > 12) {
    dismissStory();
  }

  const relativeHeading = (heading - referenceHeading + 360) % 360;
  const nextScene = Math.floor((relativeHeading + 45) / 90) % 4;

  if (nextScene !== activeScene) {
    activeScene = nextScene;
    dismissStory();
    statusText.textContent = sceneInstructions[activeScene];
  }
}

function headingDifference(firstHeading, secondHeading) {
  const difference = Math.abs(firstHeading - secondHeading) % 360;
  return difference > 180 ? 360 - difference : difference;
}

function handleModelTap(event) {
  if (!cameraReady || !directionEnabled) {
    return;
  }

  const horizontalPosition = event.clientX / window.innerWidth;
  let storyKey = 'welcome';

  if (activeScene === 0) {
    storyKey = horizontalPosition < 0.4 ? 'garden' : 'welcome';
  } else if (activeScene === 1) {
    storyKey = horizontalPosition > 0.7 ? 'participation' : 'learning';
  } else if (activeScene === 2) {
    storyKey = horizontalPosition < 0.28 || horizontalPosition > 0.72 ? 'participation' : 'community';
  } else {
    storyKey = horizontalPosition > 0.68 ? 'welcome' : 'garden';
  }

  presentStory(storyKey);
}

function presentStory(storyKey) {
  const story = stories[storyKey];
  storyTitle.textContent = story.title;
  storyText.textContent = story.text;
  storyCard.hidden = false;
  storyHeading = currentHeading;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const narration = new SpeechSynthesisUtterance(`${story.title}. ${story.text}`);
    narration.rate = 0.92;
    window.speechSynthesis.speak(narration);
  }
}

function dismissStory() {
  storyCard.hidden = true;
  storyHeading = undefined;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

const sceneInstructions = [
  'Welcome: face your starting direction.',
  'Learning: turn right to see shared learning spaces.',
  'Community: turn around to see the community circle.',
  'Garden: turn left to see the wellbeing garden.'
];

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
  translate(0, 22, 0);
  scale(0.88);
  rotateX(-0.12);
  noStroke();
  ambientLight(155);
  directionalLight(255, 220, 235, -0.5, -0.8, -1);

  drawCampusBase();

  if (activeScene === 0) {
    drawWelcomeScene();
  } else if (activeScene === 1) {
    drawLearningScene();
  } else if (activeScene === 2) {
    drawCommunityScene();
  } else {
    drawGardenScene();
  }
  pop();
}

function drawWelcomeScene() {
  drawWelcomeGate(0, 20);
  drawSharedGarden(-72, -28);
  drawPerson(-27, 8, color(255, 186, 55));
  drawPerson(28, 10, color(246, 135, 183));
}

function drawLearningScene() {
  drawLearningStudio(0, -8, 126, 74, 42, color(62, 131, 190));
  drawPerson(-45, 34, color(255, 186, 55));
  drawPerson(0, 34, color(246, 135, 183));
  drawPerson(45, 34, color(255, 186, 55));
}

function drawCommunityScene() {
  drawCommunityCircle(0, 5);
  drawPerson(-52, 0, color(246, 135, 183));
  drawPerson(52, 0, color(255, 186, 55));
  drawLearningStudio(0, -48, 100, 32, 22, color(156, 60, 98));
}

function drawGardenScene() {
  drawSharedGarden(0, 5);
  drawWelcomeGate(82, 44);
  drawPerson(-50, 24, color(255, 186, 55));
  drawPerson(48, -24, color(246, 135, 183));
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
  rect(12, 12, 245, 34, 8);
  fill(255);
  textSize(14);
  text(`School journey: ${sceneNames[activeScene]}`, 24, 34);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
