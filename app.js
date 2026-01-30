let step = 0;
let timer = null;
let timeLeft = 50;

// MPL-style draft order
const draftOrder = [
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },

  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },

  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" }
];

const picks = [];
const bans = [];
const usedHeroes = new Set();

window.onload = () => {
  renderHeroPool();
  startTurn();
};

function renderHeroPool() {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.dataset.hero = hero.name;

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    img.className = "heroIcon";

    const name = document.createElement("div");
    name.className = "heroName";
    name.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(name);

    btn.onclick = () => handleHeroClick(hero.name, btn);

    heroGrid.appendChild(btn);
  });
}

function startTurn() {
  if (step >= draftOrder.length) {
    endDraft();
    return;
  }

  updateTurnIndicator();
  startTimer();
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 50;
  updateTimerDisplay();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  document.getElementById("timerDisplay").innerText = `Time left: ${timeLeft}s`;
}

function handleHeroClick(heroName, btn) {
  if (usedHeroes.has(heroName)) return;
  clearInterval(timer);

  applySelection(heroName);
  lockHero(btn);
}

function handleTimeout() {
  const current = draftOrder[step];

  if (current.type === "pick") {
    const available = heroes.filter(h => !usedHeroes.has(h.name));
    const randomHero = available[Math.floor(Math.random() * available.length)];
    applySelection(randomHero.name);
  } else {
    step++;
    startTurn();
  }
}

function applySelection(heroName) {
  const current = draftOrder[step];
  usedHeroes.add(heroName);

  if (current.type === "ban") {
    bans.push({ hero: heroName, side: current.side });
    addIconToDraft(heroName, current.side, true);
  } else {
    picks.push({ hero: heroName, side: current.side });
    addIconToDraft(heroName, current.side, false);
  }

  disableHeroButton(heroName);
  step++;
  startTurn();
}

function addIconToDraft(heroName, side, isBan) {
  const containerId =
    side === "Blue"
      ? isBan ? "blueBans" : "bluePicks"
      : isBan ? "redBans" : "redPicks";

  const img = document.createElement("img");
  img.src = heroes.find(h => h.name === heroName).icon;
  img.className = isBan ? "banIcon" : "pickIcon";

  document.getElementById(containerId).appendChild(img);
}

function disableHeroButton(heroName) {
  document.querySelectorAll(".heroBtn").forEach(btn => {
    if (btn.dataset.hero === heroName) {
      btn.disabled = true;
      btn.classList.add("locked");
    }
  });
}

function updateTurnIndicator() {
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()}`;
}

function endDraft() {
  clearInterval(timer);
  document.getElementById("turnIndicator").innerText = "Draft Complete!";
  document.getElementById("timerDisplay").innerText = "";
  document.getElementById("analyzeBtn").disabled = false;
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

  let result = `Blue: ${blueScore} | Red: ${redScore}<br>`;
  result += blueScore > redScore
    ? "Blue draft is stronger"
    : redScore > blueScore
    ? "Red draft is stronger"
    : "Drafts are evenly matched";

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    const hero = heroes.find(h => h.name === name);
    if (hero) {
      score += (Number(hero.early) || 0)
            + (Number(hero.late) || 0)
            + (Number(hero.cc) || 0);
    }
  });
  return score;
}
