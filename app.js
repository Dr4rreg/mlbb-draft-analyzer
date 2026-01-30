let step = 0;
let timer = null;
let timeLeft = 50;

// MPL-style pick / ban order
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
let availableHeroes = [...heroes];

window.onload = () => {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.dataset.hero = hero.name;

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;

    const name = document.createElement("span");
    name.textContent = hero.name;

    btn.appendChild(img);
    btn.appendChild(name);

    btn.onclick = () => selectHero(hero, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer();
};

function startTimer() {
  clearInterval(timer);
  timeLeft = 50;
  document.getElementById("timer").textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoResolve();
    }
  }, 1000);
}

function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    const randomHero =
      availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
    forceSelect(randomHero);
  } else {
    step++;
    nextTurn();
  }
}

function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  forceSelect(hero);
}

function forceSelect(hero) {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addToDraft(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addToDraft(current.side, hero.icon, false);
  }

  availableHeroes = availableHeroes.filter(h => h.name !== hero.name);

  const btn = document.querySelector(`[data-hero="${hero.name}"]`);
  if (btn) {
    btn.classList.add("locked");
    btn.disabled = true;
  }

  clearInterval(timer);
  step++;
  nextTurn();
}

function addToDraft(side, iconPath, isBan) {
  const img = document.createElement("img");
  img.src = iconPath;

  if (isBan) {
    document.getElementById(
      side === "Blue" ? "blueBans" : "redBans"
    ).appendChild(img);
  } else {
    document.getElementById(
      side === "Blue" ? "bluePicks" : "redPicks"
    ).appendChild(img);
  }
}

function nextTurn() {
  if (step >= draftOrder.length) {
    document.getElementById("turnIndicator").textContent = "Draft Complete";
    document.getElementById("timer").textContent = "-";
    document.getElementById("analyzeBtn").disabled = false;
    return;
  }

  updateTurnIndicator();
  startTimer();
}

function updateTurnIndicator() {
  const current = draftOrder[step];
  document.getElementById(
    "turnIndicator"
  ).textContent = `${current.side} — ${current.type.toUpperCase()}`;
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

  let result = `Blue: ${blueScore} | Red: ${redScore}<br>`;
  result +=
    blueScore > redScore
      ? "Blue has the stronger draft"
      : redScore > blueScore
      ? "Red has the stronger draft"
      : "Drafts are evenly matched";

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    const hero = heroes.find(h => h.name === name);
    if (hero) {
      score += Number(hero.early) + Number(hero.late) + Number(hero.cc);
    }
  });
  return score;
}
