let step = 0;
let timer = 50;
let timerInterval = null;

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
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    btn.appendChild(img);

    const label = document.createElement("span");
    label.innerText = hero.name;
    btn.appendChild(label);

    btn.onclick = () => selectHero(hero, btn);

    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer();
};

function selectHero(hero, btn) {
  if (btn.classList.contains("locked") || step >= draftOrder.length) return;

  const current = draftOrder[step];
  if (current.type === "ban") {
    bans.push({ hero, side: current.side });
    addToBanList(current.side, hero);
  } else {
    picks.push({ hero, side: current.side });
    addToPickList(current.side, hero);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  updateTurnIndicator();
  resetTimer();

  if (step === draftOrder.length) {
    clearInterval(timerInterval);
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function addToBanList(side, hero) {
  const container = side === "Blue" ? "blueBans" : "redBans";
  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;
  img.className = "banIcon";
  document.getElementById(container).appendChild(img);
}

function addToPickList(side, hero) {
  const container = side === "Blue" ? "bluePicks" : "redPicks";
  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;
  img.className = "pickIcon";
  document.getElementById(container).appendChild(img);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (step >= draftOrder.length) return;

    timer--;
    document.getElementById("timer").innerText = `${timer}s`;

    if (timer <= 0) {
      const current = draftOrder[step];
      if (current.type === "pick") {
        const available = heroes.filter(h => !picks.concat(bans).some(p => p.hero.name === h.name));
        const randomHero = available[Math.floor(Math.random() * available.length)];
        const btn = Array.from(document.getElementsByClassName("heroBtn"))
                         .find(b => b.alt === randomHero.name);
        selectHero(randomHero, btn);
      }
      step++;
      resetTimer();
      updateTurnIndicator();
    }
  }, 1000);
}

function resetTimer() {
  timer = 50;
  document.getElementById("timer").innerText = `${timer}s`;
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
  team.forEach(hero => {
    score += Number(hero.early || 0) + Number(hero.late || 0) + Number(hero.cc || 0);
  });
  return score;
}
