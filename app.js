const marker = document.querySelector('#school-marker');
const loader = document.querySelector('#loader');
const status = document.querySelector('#status');
const storyCard = document.querySelector('#story-card');
const storyTitle = document.querySelector('#story-title');
const storyText = document.querySelector('#story-text');
const markerHelp = document.querySelector('#marker-help');

const areas = {
  greeting: { title: 'Greeting, Friendly Staff', text: 'Friendly staff welcome every student, learn their name, and help them feel safe from the moment they arrive.' },
  art: { title: 'Art, DT & Gardening', text: 'Creative making, design technology, and gardening give students practical ways to express ideas and build confidence.' },
  sports: { title: 'Sports & Swimming Pool', text: 'Inclusive sports and swimming offer movement, teamwork, fun, and different ways to take part.' },
  english: { title: 'English with Supportive Teachers', text: 'A calm English classroom with kind teachers helps every student develop their voice, reading, and communication.' },
  food: { title: 'Food Stations', text: 'Several affordable food stations spread around the school give students quick, simple access to food.' },
  toilets: { title: 'Clean, Accessible Toilets', text: 'Clean and accessible toilets are placed throughout the school so everyone can use them comfortably and independently.' },
  support: { title: 'Support Hub', text: 'The support hub is a mindful, low-stimulation space with helpful staff, including support for autistic students.' },
  green: { title: 'Open Green Space', text: 'Open green space gives friends a place to hang out, relax, talk, and belong together.' }
};

let selectedDistance;
let markerVisible = false;

marker.addEventListener('markerFound', () => {
  markerVisible = true;
  loader.hidden = true;
  markerHelp.hidden = true;
  status.textContent = 'Walk closer or farther from the marker, then tap an area.';
});

marker.addEventListener('markerLost', () => {
  markerVisible = false;
  dismissStory();
  status.textContent = 'Marker lost. Point the camera back at it.';
});

document.querySelectorAll('.area').forEach((element) => {
  element.addEventListener('click', () => presentStory(element.dataset.area));
});

function presentStory(areaKey) {
  if (!markerVisible) return;
  const area = areas[areaKey];
  storyTitle.textContent = area.title;
  storyText.textContent = area.text;
  storyCard.hidden = false;
  selectedDistance = marker.object3D.position.length();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const narration = new SpeechSynthesisUtterance(`${area.title}. ${area.text}`);
    narration.rate = 0.92;
    window.speechSynthesis.speak(narration);
  }
}

function dismissStory() {
  storyCard.hidden = true;
  selectedDistance = undefined;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

setInterval(() => {
  if (!markerVisible || storyCard.hidden || selectedDistance === undefined) return;
  const distance = marker.object3D.position.length();
  if (Math.abs(distance - selectedDistance) > 0.12) dismissStory();
}, 180);
