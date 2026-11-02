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
const areas = [
  {
    title: 'Greeting, Friendly Staff',
    text: 'Friendly staff welcome every student, learn their name, and help them feel safe from the moment they arrive.'
  },
  {
    title: 'Art, DT & Gardening',
    text: 'Creative making, design technology, and gardening give students practical ways to express ideas and build confidence.'
  },
  {
    title: 'Sports & Swimming Pool',
    text: 'Inclusive sports and swimming offer movement, teamwork, fun, and different ways to take part.'
  },
  {
    title: 'English with Supportive Teachers',
    text: 'A calm English classroom with kind teachers helps every student develop their voice, reading, and communication.'
  },
  {
    title: 'Food Stations',
    text: 'Several affordable food stations spread around the school give students quick, simple access to food.'
  },
  {
    title: 'Clean, Accessible Toilets',
    text: 'Clean and accessible toilets are placed throughout the school so everyone can use them comfortably and independently.'
  },
  {
    title: 'Support Hub',
    text: 'The support hub is a mindful, low-stimulation space with helpful staff, including support for autistic students.'
  },
  {
    title: 'Open Green Space',
    text: 'Open green space gives friends a place to hang out, relax, talk, and belong together.'
  }
];

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
    statusText.textContent = 'Turn to explore the eight areas, then tap the drawing to hear its story.';
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
  const nextScene = Math.floor((relativeHeading + 22.5) / 45) % areas.length;

  if (nextScene !== activeScene) {
    activeScene = nextScene;
    dismissStory();
    statusText.textContent = 'Tap the drawing when you are ready to hear about this area.';
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

  presentStory(activeScene);
}

function presentStory(areaIndex) {
  const area = areas[areaIndex];
  storyTitle.textContent = area.title;
  storyText.textContent = area.text;
  storyCard.hidden = false;
  storyHeading = currentHeading;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const narration = new SpeechSynthesisUtterance(`${area.title}. ${area.text}`);
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
  scale(0.82);
  rotateX(-0.12);
  noStroke();
  ambientLight(155);
  directionalLight(255, 220, 235, -0.5, -0.8, -1);

  drawCampusBase();

  drawAreaScene(activeScene);
  pop();
}

function drawAreaScene(areaIndex) {
  if (areaIndex === 0) {
    drawGreetingArea();
  } else if (areaIndex === 1) {
    drawArtGardenArea();
  } else if (areaIndex === 2) {
    drawSportsArea();
  } else if (areaIndex === 3) {
    drawEnglishArea();
  } else if (areaIndex === 4) {
    drawFoodArea();
  } else if (areaIndex === 5) {
    drawToiletsArea();
  } else if (areaIndex === 6) {
    drawSupportArea();
  } else {
    drawOpenGreenArea();
  }
}

function drawGreetingArea() {
  drawWelcomeGate(0, 118);
  drawReceptionDesk(-78, -48);
  drawPerson(-26, 98, color(246, 135, 183));
  drawPerson(30, 106, color(255, 186, 55));
}

function drawArtGardenArea() {
  drawLearningStudio(-28, -116, 122, 66, 42, color(94, 180, 158));
  drawArtTable(86, 54);
  drawSharedGarden(-92, 40);
  drawPerson(38, 82, color(255, 186, 55));
}

function drawSportsArea() {
  drawPool(0, -98);
  drawSportsCourt(82, 58);
  drawPerson(-52, 86, color(246, 135, 183));
  drawPerson(50, 72, color(255, 186, 55));
}

function drawEnglishArea() {
  drawLearningStudio(0, -100, 138, 72, 48, color(80, 137, 196));
  drawReadingNook(-104, 48);
  drawPerson(-24, 88, color(246, 135, 183));
  drawPerson(38, 76, color(255, 186, 55));
}

function drawFoodArea() {
  drawFoodStation(-94, -76, color(237, 166, 62));
  drawFoodStation(0, -16, color(214, 92, 109));
  drawFoodStation(94, 54, color(78, 157, 128));
  drawPerson(-42, 92, color(255, 186, 55));
  drawPerson(42, 98, color(246, 135, 183));
}

function drawToiletsArea() {
  drawToiletBlock(-92, -90, color(107, 175, 211));
  drawToiletBlock(0, -18, color(106, 178, 166));
  drawToiletBlock(92, 58, color(107, 175, 211));
  drawPerson(-40, 92, color(246, 135, 183));
}

function drawSupportArea() {
  drawQuietPod(0, -54);
  drawSupportGarden(-98, 44);
  drawPerson(-32, 92, color(246, 135, 183));
  drawPerson(36, 86, color(255, 186, 55));
}

function drawOpenGreenArea() {
  drawSharedGarden(0, -22);
  drawPicnicBench(-102, 62);
  drawPicnicBench(102, 46);
  drawPerson(-38, 94, color(246, 135, 183));
  drawPerson(38, 86, color(255, 186, 55));
}

function drawCampusBase() {
  push();
  fill(248, 245, 235);
  box(400, 10, 340);

  fill(221, 217, 202);
  translate(0, -7, 58);
  box(330, 2, 18);
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

function drawReadingNook(x, z) {
  push();
  translate(x, -8, z);
  fill(242, 225, 184);
  box(55, 6, 38);

  fill(159, 91, 53);
  translate(-17, -25, -8);
  box(10, 42, 8);
  translate(34, 0, 0);
  box(10, 42, 8);

  fill(245, 246, 239);
  translate(-17, -18, -7);
  box(9, 5, 12);
  translate(34, 0, 0);
  box(9, 5, 12);

  fill(231, 172, 65);
  translate(-8, -10, 8);
  box(22, 8, 16);
  pop();
}

function drawQuietPod(x, z) {
  push();
  translate(x, -25, z);
  fill(184, 115, 168);
  cylinder(24, 42, 20, 1);
  translate(0, -29, 0);
  fill(238, 210, 234);
  sphere(27, 20, 12);
  pop();
}

function drawPond(x, z) {
  push();
  translate(x, -8, z);
  fill(75, 174, 210);
  cylinder(30, 4, 30, 1);
  fill(129, 193, 83);
  translate(16, -5, 3);
  sphere(9, 12, 8);
  translate(-27, 0, -12);
  sphere(7, 12, 8);
  pop();
}

function drawReceptionDesk(x, z) {
  push();
  translate(x, -20, z);
  fill(202, 157, 97);
  box(62, 28, 20);
  fill(255, 244, 191);
  translate(0, -18, -3);
  box(54, 8, 4);
  pop();
}

function drawArtTable(x, z) {
  push();
  translate(x, -18, z);
  fill(228, 175, 78);
  box(52, 24, 36);
  fill(247, 106, 121);
  translate(-14, -16, 0);
  cylinder(7, 6, 12, 1);
  fill(76, 161, 188);
  translate(28, 0, 0);
  cylinder(7, 6, 12, 1);
  pop();
}

function drawPool(x, z) {
  push();
  translate(x, -8, z);
  fill(238, 245, 244);
  box(138, 8, 76);
  fill(70, 177, 213);
  translate(0, -6, 0);
  box(122, 3, 60);
  fill(255);
  translate(0, -4, 0);
  box(4, 2, 56);
  pop();
}

function drawSportsCourt(x, z) {
  push();
  translate(x, -8, z);
  fill(211, 92, 103);
  box(86, 5, 62);
  fill(255);
  translate(0, -4, 0);
  box(4, 2, 52);
  fill(250, 211, 92);
  translate(-21, -10, 0);
  sphere(9, 12, 8);
  pop();
}

function drawFoodStation(x, z, stationColor) {
  push();
  translate(x, -23, z);
  fill(stationColor);
  box(60, 34, 28);
  fill(255, 246, 218);
  translate(0, -22, 0);
  box(68, 10, 34);
  fill(123, 80, 48);
  translate(-15, -8, -17);
  box(9, 9, 4);
  translate(30, 0, 0);
  box(9, 9, 4);
  pop();
}

function drawToiletBlock(x, z, blockColor) {
  push();
  translate(x, -25, z);
  fill(blockColor);
  box(70, 42, 38);
  fill(250);
  translate(-18, 3, -21);
  box(20, 28, 3);
  translate(36, 0, 0);
  box(20, 28, 3);
  fill(245, 201, 84);
  translate(0, -29, -21);
  cylinder(6, 3, 16, 1);
  pop();
}

function drawSupportGarden(x, z) {
  push();
  translate(x, -8, z);
  fill(157, 202, 130);
  box(82, 5, 60);
  drawTree(-23, -12, 12, color(114, 177, 102));
  drawTree(24, 13, 10, color(151, 196, 104));
  fill(242, 200, 90);
  translate(0, -6, 0);
  cylinder(16, 4, 20, 1);
  pop();
}

function drawPicnicBench(x, z) {
  push();
  translate(x, -15, z);
  fill(180, 126, 72);
  box(58, 9, 18);
  translate(0, 12, -16);
  box(58, 8, 8);
  translate(0, 0, 32);
  box(58, 8, 8);
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
  text('School of Belonging: turn and tap', 24, 34);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
