let step = 0;
let timer = 50;
let timerInterval;

// MPL-style pick/ban order
const draftOrder = [
  // Ban phase 1
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  // Pick phase 1
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },

  // Ban phase 2
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },

  // Pick phase 2
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" }
];

const picks = [];
const bans = [];

window.onload = () => {
  setupHeroGrid();
  updateTurnIndicator();
  startTimer();
};

function setupHeroGrid() {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    btn.appendChild(img);

    const name = document.createElement("div");
    name.className = "heroName";
    name.innerText = hero.name;
    btn.appendChild(name);

    btn.onclick = () => selectHero(hero.name, btn);

    heroGrid.appendChild(btn);
  });
}

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, true);
  } else {
    picks.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, false);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  resetTimer();
  if (step < draftOrder.length) {
    updateTurnIndicator();
  } else {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    clearInterval(timerInterval);
  }
}

function addToList(side, heroName, isBan) {
  const containerId = side === "Blue" ? "blueContainer" : "redContainer";
  const rowClass = isBan ? "banRow" : "pickRow";
  const rowSelector = isBan ? "banRow" : "pickRow";

  const container = document.getElementById(containerId);
  let row = container.querySelector(`.${rowClass}:last-child`);

  if (!row || row.children.length >= 6) { // 6 per row max
    row = document.createElement("div");
    row.className = rowClass;
    if (side === "Red") row.classList.add("reverse");
    container.appendChild(row);
  }

  const div = document.createElement("div");
  div.className = isBan ? "banIcon" : "pickIcon";

  const img = document.createElement("img");
  const heroObj = heroes.find(h => h.name === heroName);
  img.src = heroObj.icon;

  div.appendChild(img);
  row.appendChild(div);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText = `${current.side} ${current.type.toUpperCase()}`;
}

function startTimer() {
  document.getElementById("timer").innerText = timer;
  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;

    if (timer <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function resetTimer() {
  timer = 50;
}

function handleTimeout() {
  clearInterval(timerInterval);
  const current = draftOrder[step];
  if (!current) return;

  // Pick random hero if pick
  if (current.type === "pick") {
    const available = heroes.filter(h => !picks.some(p => p.hero === h.name) && !bans.some(b => b.hero === h.name));
    if (available.length > 0) {
      const randomHero = available[Math.floor(Math.random() * available.length)];
      const btn = Array.from(document.getElementsByClassName("heroBtn")).find(b => b.alt === randomHero.name);
      selectHero(randomHero.name, btn);
    }
  }

  // Ban skipped if timer ends
  if (current.type === "ban") {
    step++;
    updateTurnIndicator();
    resetTimer();
  }

  startTimer();
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

  let result = `Blue Score: ${blueScore} | Red Score: ${redScore}<br>`;
  if (blueScore > redScore) result += "Blue has the stronger draft";
  else if (redScore > blueScore) result += "Red has the stronger draft";
  else result += "Drafts are evenly matched";

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    const hero = heroes.find(h => h.name === name);
    if (hero) {
      const early = Number(hero.early) || 0;
      const late = Number(hero.late) || 0;
      const cc = Number(hero.cc) || 0;
      score += early + late + cc;
    }
  });
  return score;
}
