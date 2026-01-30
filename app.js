let step = 0;
let timerInterval = null;
let timeLeft = 50;

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

let availableHeroes = [...heroes];
let picks = [];

window.onload = () => {
  renderHeroPool();
  beginTurn();
};

/* HERO POOL */
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  availableHeroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon;

    const name = document.createElement("span");
    name.textContent = hero.name;

    btn.appendChild(img);
    btn.appendChild(name);
    btn.onclick = () => selectHero(hero);

    grid.appendChild(btn);
  });
}

/* TURN + TIMER */
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
  document.getElementById("timer").textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resolveTimeout();
    }
  }, 1000);
}

function resolveTimeout() {
  const turn = draftOrder[step];

  if (turn.type === "pick") {
    autoPick();
  } else {
    step++;
    beginTurn();
  }
}

/* PICK / BAN */
function selectHero(hero) {
  if (!availableHeroes.find(h => h.name === hero.name)) return;

  const turn = draftOrder[step];

  if (turn.type === "pick") {
    picks.push({ hero: hero.name, side: turn.side });
    addIcon(turn.side, hero.icon, false);
  } else {
    addIcon(turn.side, hero.icon, true);
  }

  availableHeroes = availableHeroes.filter(h => h.name !== hero.name);
  clearInterval(timerInterval);

  step++;
  renderHeroPool();
  beginTurn();
}

function autoPick() {
  if (!availableHeroes.length) return;
  selectHero(availableHeroes[Math.floor(Math.random() * availableHeroes.length)]);
}

/* UI HELPERS */
function addIcon(side, icon, isBan) {
  const img = document.createElement("img");
  img.src = icon;

  if (isBan) {
    document.getElementById(side === "Blue" ? "blueBans" : "redBans").appendChild(img);
  } else {
    document.getElementById(side === "Blue" ? "bluePicks" : "redPicks").appendChild(img);
  }
}

function updateTurnText() {
  const t = draftOrder[step];
  document.getElementById("turnIndicator").textContent =
    `${t.side} — ${t.type.toUpperCase()}`;
}

function endDraft() {
  document.getElementById("turnIndicator").textContent = "Draft Complete";
  document.getElementById("timer").textContent = "-";
  document.getElementById("analyzeBtn").disabled = false;
}

/* ANALYSIS */
function analyzeDraft() {
  document.getElementById("result").textContent = "Draft analysis placeholder";
}
