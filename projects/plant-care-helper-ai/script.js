const photoInput = document.getElementById('plant-photo');
const photoPreview = document.getElementById('photo-preview');
const askAIButton = document.getElementById('ask-ai');
const adviceBox = document.getElementById('ai-advice');

let photoLoaded = false;

photoInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if(!file) return;
  photoLoaded = true;
  const reader = new FileReader();
  reader.onload = () => {
    photoPreview.innerHTML = `<img src="${reader.result}" alt="Plant preview">`;
  };
  reader.readAsDataURL(file);
});

function getData(){
  return {
    plantType: document.getElementById('plant-type').value,
    location: document.getElementById('location').value,
    problem: document.getElementById('main-problem').value,
    notes: document.getElementById('notes').value.trim()
  };
}

function issueGuide(problem){
  const guides = {
    'Yellow leaves': {
      possible: 'The plant may be getting too much water, not enough light, or stress from an environment change.',
      fix: 'Check the soil before watering, trim the yellow leaves, and move the plant to brighter indirect light if possible.',
      week1: 'Let the soil dry a little if it is soggy and place the plant where it gets steady light.',
      week2: 'Check if new yellow leaves are slowing down. Remove only the leaves that are fully yellow.',
      week3: 'Look for greener new growth and a stronger upright shape.'
    },
    'Brown tips': {
      possible: 'Brown tips can happen from dry air, underwatering, salt buildup, or too much direct sun.',
      fix: 'Water more evenly, avoid harsh direct light, and trim the brown tips neatly if needed.',
      week1: 'Give the plant a steady watering routine and keep it away from harsh hot sun.',
      week2: 'Watch whether the brown edges stop spreading and whether the leaves stay softer.',
      week3: 'Look for leaves with fewer brown tips and healthier color.'
    },
    'Drooping or wilted': {
      possible: 'Drooping can happen when the plant is thirsty, overwatered, too hot, or stressed.',
      fix: 'Check the soil, water only if needed, and keep the plant in a stable spot.',
      week1: 'Check soil moisture and correct watering first. Keep the plant in calm, bright light.',
      week2: 'See if the stems are standing up more and if the leaves feel less limp.',
      week3: 'Look for a stronger shape and leaves that stay lifted all day.'
    },
    'Dry soil': {
      possible: 'The plant may not be getting enough water or the potting mix may be drying out too fast.',
      fix: 'Water deeply until water drains out, then check again only when the top layer dries.',
      week1: 'Give a full watering and check moisture every couple of days.',
      week2: 'See whether the leaves look less tired and the soil stays moist a little longer.',
      week3: 'Look for better color and leaves that no longer curl from dryness.'
    },
    'Soil too wet': {
      possible: 'The roots may be staying too wet, which can lead to root stress or rot.',
      fix: 'Pause watering, make sure the pot drains well, and let the top of the soil dry before the next watering.',
      week1: 'Stop watering for a bit and move the plant where airflow and light are better.',
      week2: 'Check if the soil feels less soggy and if the leaves stop getting worse.',
      week3: 'Look for steadier leaves and no new signs of rot or yellowing.'
    },
    'Spots on leaves': {
      possible: 'Leaf spots can come from water sitting on leaves, pests, or a disease problem.',
      fix: 'Remove the worst spotted leaves, keep the leaves dry, and separate the plant from others if needed.',
      week1: 'Clean up damaged leaves and avoid splashing water on the foliage.',
      week2: 'Check whether the spots are spreading or staying the same.',
      week3: 'Look for cleaner new leaves and fewer new spots.'
    },
    'No new growth': {
      possible: 'The plant may need more light, more feeding during the growing season, or more time.',
      fix: 'Give brighter light if appropriate and keep a steady watering routine.',
      week1: 'Improve the light and keep the care routine consistent.',
      week2: 'Watch the stem tips and centers of leaves for tiny new growth.',
      week3: 'Look for fresh leaves or a stronger overall shape.'
    },
    'I am not sure': {
      possible: 'The plant may be showing stress, but it needs a careful check of leaves, soil, light, and watering.',
      fix: 'Start with the basics: check soil moisture, light, leaf color, and drainage.',
      week1: 'Take notes and make only one small care change at a time.',
      week2: 'Compare your new photo with your old photo to see small changes.',
      week3: 'Keep the routine that seems to help the plant the most.'
    }
  };
  return guides[problem] || guides['I am not sure'];
}

function stageClasses(problem){
  const map = {
    'Yellow leaves': ['yellowing','recovering','healthy'],
    'Brown tips': ['brown-tips','recovering','healthy'],
    'Drooping or wilted': ['droopy','recovering','healthy'],
    'Dry soil': ['droopy','recovering','healthy'],
    'Soil too wet': ['yellowing','recovering','healthy'],
    'Spots on leaves': ['spotted','recovering','healthy'],
    'No new growth': ['small','recovering','healthy'],
    'I am not sure': ['small','recovering','healthy']
  };
  return map[problem] || ['small','recovering','healthy'];
}

function renderAdvice(data, guide){
  const noteLine = data.notes ? `<div class="report-item"><strong>Your note</strong>${data.notes}</div>` : '';
  const photoLine = photoLoaded
    ? `<div class="report-item"><strong>Photo check</strong>The AI helper used your uploaded plant picture as part of the plant check.</div>`
    : `<div class="report-item"><strong>Photo check</strong>You can still get advice, but adding a plant photo makes the helper more customized.</div>`;

  adviceBox.innerHTML = `
    <div class="report-item"><strong>Plant snapshot</strong>${data.plantType} · ${data.location} · Main problem: ${data.problem}</div>
    ${photoLine}
    ${noteLine}
    <div class="report-item"><strong>What may be happening</strong>${guide.possible}</div>
    <div class="report-item"><strong>How to fix it</strong>${guide.fix}</div>
    <div class="report-item"><strong>Best next step</strong>Make one change first, take another photo in a few days, and compare.</div>
  `;
}

function weekImageMarkup(stageClass, weekLabel){
  return `
    <div class="plant-illustration ${stageClass}">
      <div class="plant-scene-label">${weekLabel}</div>
      <div class="pot"></div>
      <div class="stem"></div>
      <div class="leaf leaf-left"></div>
      <div class="leaf leaf-right"></div>
      <div class="leaf leaf-top"></div>
      <div class="leaf leaf-extra"></div>
      <div class="soil-line"></div>
    </div>
  `;
}

function renderWeeks(problem, guide){
  const [s1,s2,s3] = stageClasses(problem);
  document.getElementById('week1-image').innerHTML = weekImageMarkup(s1,'AI Week 1');
  document.getElementById('week2-image').innerHTML = weekImageMarkup(s2,'AI Week 2');
  document.getElementById('week3-image').innerHTML = weekImageMarkup(s3,'AI Week 3');

  document.getElementById('week1-text').textContent = guide.week1;
  document.getElementById('week2-text').textContent = guide.week2;
  document.getElementById('week3-text').textContent = guide.week3;
}

askAIButton.addEventListener('click', () => {
  const data = getData();
  const guide = issueGuide(data.problem);
  renderAdvice(data, guide);
  renderWeeks(data.problem, guide);
});
