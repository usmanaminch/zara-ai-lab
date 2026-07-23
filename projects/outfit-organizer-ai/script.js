const closetInput = document.getElementById("closet-photo");
const closetPreview = document.getElementById("closet-preview");
let selectedColor = "pink";

closetInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    closetPreview.innerHTML = `<img src="${reader.result}" alt="Closet preview">`;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll(".swatches button").forEach(btn => {
  btn.addEventListener("click", () => selectedColor = btn.dataset.color || "pink");
});

const palettes = {
  pink: [["#f6b0d0","#fff1cc"],["#ffe08a","#fff2c7"],["#a9d8ff","#d6eefc"],["#d8b4ff","#f7d7ff"],["#ffbdd4","#cbe7ff"],["#bceba9","#fff2c7"],["#fff3e4","#ffc0cb"]],
  lavender: [["#d8b4ff","#fff1cc"],["#cdb8ff","#ffffff"],["#a9d8ff","#efe1ff"],["#f0c8ff","#fff2c7"],["#d8b4ff","#cbe7ff"],["#bceba9","#efe1ff"],["#fff3e4","#d8b4ff"]],
  green: [["#bceba9","#fff1cc"],["#d9f99d","#ffffff"],["#a9d8ff","#d9f99d"],["#c7f5c4","#fff2c7"],["#ffbdd4","#bceba9"],["#bceba9","#fff2c7"],["#fff3e4","#bceba9"]],
  yellow: [["#ffe08a","#ffffff"],["#ffef9c","#fff2c7"],["#a9d8ff","#ffe08a"],["#d8b4ff","#ffef9c"],["#ffbdd4","#ffe08a"],["#bceba9","#fff2c7"],["#fff3e4","#ffc0cb"]],
  blue: [["#a9d8ff","#ffffff"],["#bfe9ff","#fff2c7"],["#a9d8ff","#d6eefc"],["#d8b4ff","#cbe7ff"],["#ffbdd4","#a9d8ff"],["#bceba9","#d6eefc"],["#fff3e4","#a9d8ff"]],
  rainbow: [["#f6b0d0","#fff1cc"],["#ffe08a","#ffffff"],["#a9d8ff","#d6eefc"],["#d8b4ff","#f7d7ff"],["#ffbdd4","#cbe7ff"],["#bceba9","#fff2c7"],["#fff3e4","#ffc0cb"]]
};

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function makeDay(day, index, top, bottom){
  return `<div class="day">
    <strong>${day}</strong>
    <div class="flatlay">
      <div class="top" style="--top:${top}"></div>
      <div class="bottom" style="--bottom:${bottom}"></div>
      <div class="bag"></div>
      <div class="shoe"></div>
    </div>
  </div>`;
}

function generate(){
  const weather = document.getElementById("weather").value;
  const style = document.getElementById("style").value;
  const week = document.getElementById("week").value;
  const colors = palettes[selectedColor] || palettes.pink;

  document.getElementById("outfit-week").innerHTML =
    days.map((d,i) => makeDay(d, i, colors[i][0], colors[i][1])).join("");

  let backup = weather.includes("Hot") ? "Choose a backup outfit with breathable fabric and sandals." :
               weather.includes("Rainy") ? "Choose a backup outfit with shoes that can handle rain." :
               weather.includes("Cold") ? "Add one warm layer to each outfit." :
               "Keep one comfortable backup outfit ready.";

  document.getElementById("advice-list").innerHTML = `
    <div class="advice"><span>↔</span><div><strong>Mix & match more</strong><p>Your colors create lots of combinations for a ${week.toLowerCase()}.</p></div></div>
    <div class="advice"><span>⟳</span><div><strong>Smart repeats</strong><p>Repeat your favorite color, but change the bottom or accessory.</p></div></div>
    <div class="advice"><span>▣</span><div><strong>Backup outfit</strong><p>${backup}</p></div></div>
    <div class="advice"><span>◉</span><div><strong>Color balance</strong><p>${style} works best with 2 main colors and one accent.</p></div></div>
  `;
}
document.getElementById("generate-outfits").addEventListener("click", generate);
generate();
