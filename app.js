let step = 0;
let timerInterval = null;
let timeLeft = 50;

const picks = [];
const bans = [];

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

window.onload = () => {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;

    const name = document.createElement("div");
    name.className = "heroName";
    name.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(name);
    btn.onclick = () => userSelectHero(hero, btn);

    heroGrid.appendChild(btn);
  });

  startStep();
};

/* ================= TIMER ================= */

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 50;
  updateTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoResolveStep();
    }
  }, 1000);
}

function updateTimer() {
  document.getElementById("timer").innerText = `Time left: ${timeLeft}s`;
}

/* ================= STEP CONTROL ================= */

function startStep() {
  if (step >= draftOrder.length) {
    endDraft();
    return;
  }

  updateTurnIndicator();
  startTimer();
}

function advanceStep() {
  clearInterval(timerInterval);
  step++;
  startStep();
}

/* ================= USER ACTION ================= */

function userSelectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  resolveStep(hero, btn);
}

/* ================= AUTO RESOLVE ================= */

function autoResolveStep() {
  const current = draftOrder[step];

  if (current.type === "ban") {
    // Skip ban on timeout
    advanceStep();
    return;
  }

  // Auto-pick random available hero
  const availableBtns = [...document.querySelectorAll(".heroBtn")]
    .filter(b => !b.classList.contains("locked"));

  if (availableBtns.length === 0) {
    advanceStep();
    return;
  }

  const btn = availableBtns[Math.floor(Math.random() * availableBtns.length)];
  const heroName = btn.querySelector("img").alt;
  const hero = heroes.find(h => h.name === heroName);

  resolveStep(hero, btn);
}

/* ================= CORE RESOLUTION ================= */

function resolveStep(hero, btn) {
  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  advanceStep();
}

/* ================= UI HELPERS ================= */

function updateTurnIndicator() {
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()}`;
}

function addIcon(side, icon, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const li = document.createElement("li");

  const img = document.createElement("img");
  img.src = icon;

  li.appendChild(img);
  li.className = isBan ? "banIcon" : "pickIcon";

  document.getElementById(listId).appendChild(li);
}

function endDraft() {
  document.getElementById("timer").innerText = "";
  document.getElementById("turnIndicator").innerText = "Draft Complete";
  document.getElementById("analyzeBtn").disabled = false;
}

/* ================= ANALYSIS ================= */

function analyzeDraft() {
  const blue = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const red = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blue);
  const redScore = scoreTeam(red);

  document.getElementById("result").innerHTML =
    blueScore > redScore ? "Blue draft stronger" :
    redScore > blueScore ? "Red draft stronger" :
    "Even draft";
}

function scoreTeam(team) {
  return team.reduce((sum, name) => {
    const h = heroes.find(x => x.name === name);
    return sum + (Number(h?.early) || 0) + (Number(h?.late) || 0);
  }, 0);
}
