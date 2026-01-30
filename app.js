let step = 0;
let timerInterval = null;
let timeLeft = 50;

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

let availableHeroes = [...heroes];
const picks = [];
const bans = [];

window.onload = () => {
  renderHeroPool();
  beginTurn();
};

/* =========================
   HERO POOL
========================= */
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  availableHeroes.forEach(hero => {
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

    btn.onclick = () => handleHeroClick(hero);
    grid.appendChild(btn);
  });
}

/* =========================
   TURN + TIMER
========================= */
function beginTurn() {
  if (step >= draftOrder.length) {
    endDraft();
    return;
  }

  updateTurnText();
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 50;
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resolveTimeout();
    }
  }, 1000);
}

function updateTimerUI() {
  document.getElementById("timer").textContent = timeLeft;
}

function resolveTimeout() {
  const current = draftOrder[step];

  if (current.type === "pick") {
    autoPick();
  } else {
    // ban skipped
    step++;
    beginTurn();
  }
}

/* =========================
   PICK / BAN HANDLING
========================= */
function handleHeroClick(hero) {
  if (!availableHeroes.find(h => h.name === hero.name)) return;
  applySelection(hero);
}

function autoPick() {
  if (availableHeroes.length === 0) return;
  const randomHero =
    availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
  applySelection(randomHero);
}

function applySelection(hero) {
  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  availableHeroes = availableHeroes.filter(h => h.name !== hero.name);
  clearInterval(timerInterval);

  step++;
  renderHeroPool();
  beginTurn();
}

/* =========================
   UI INSERTION
========================= */
function addIcon(side, icon, isBan) {
  const img = document.createElement("img");
  img.src = icon;

  if (isBan) {
    document.getElementById(side === "Blue" ? "blueBans" : "redBans")
      .appendChild(img);
  } else {
    document.getElementById(side === "Blue" ? "bluePicks" : "redPicks")
      .appendChild(img);
  }
}

function updateTurnText() {
  const current = draftOrder[step];
  document.getElementById(
    "turnIndicator"
  ).textContent = `${current.side} — ${current.type.toUpperCase()}`;
}

/* =========================
   DRAFT END + ANALYSIS
========================= */
function endDraft() {
  document.getElementById("turnIndicator").textContent = "Draft Complete";
  document.getElementById("timer").textContent = "-";
  document.getElementById("analyzeBtn").disabled = false;
}

function analyzeDraft() {
  const blue = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const red = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blue);
  const redScore = scoreTeam(red);

  let text = `Blue: ${blueScore} | Red: ${redScore}<br>`;
  text += blueScore > redScore
    ? "Blue has the stronger draft"
    : redScore > blueScore
    ? "Red has the stronger draft"
    : "Drafts are evenly matched";

  document.getElementById("result").innerHTML = text;
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
