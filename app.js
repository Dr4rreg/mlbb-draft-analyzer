let step = 0;
let timer = 50;
let interval = null;
let currentPhase = null;

let selectedRole = "All";

const picks = [];
const bans = [];

/* ================= DRAFT ORDER ================= */

const draftOrder = [
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  { type: "pick", side: "Blue", phase: "B1" },

  { type: "pick", side: "Red", phase: "R12" },
  { type: "pick", side: "Red", phase: "R12" },

  { type: "pick", side: "Blue", phase: "B23" },
  { type: "pick", side: "Blue", phase: "B23" },

  { type: "pick", side: "Red", phase: "R3" },
  { type: "pick", side: "Red", phase: "R4" },

  { type: "pick", side: "Blue", phase: "B45" },
  { type: "pick", side: "Blue", phase: "B45" },

  { type: "pick", side: "Red", phase: "R5" }
];

/* ================= INIT ================= */

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startPhaseTimer();
};

/* ================= TIMER ================= */

function startPhaseTimer() {
  clearInterval(interval);
  timer = 50;
  document.getElementById("timer").innerText = timer;

  interval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;

    if (timer <= 0) {
      clearInterval(interval);
      autoResolvePhase();
    }
  }, 1000);
}

/* ================= AUTO RESOLVE ================= */

function autoResolvePhase() {
  const phase = draftOrder[step]?.phase;
  if (!phase) return;

  while (draftOrder[step] && draftOrder[step].phase === phase) {
    const available = getAvailableHeroes();
    if (!available.length) break;
    forceSelect(randomHero(available), true);
  }
}

/* ================= HERO POOL ================= */

function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
    if (!matchesRoleFilter(hero)) return;

    const btn = document.createElement("button");
    btn.className = "heroBtn";

    if (isHeroLocked(hero.name)) btn.classList.add("locked");

    const img = document.createElement("img");
    img.src = hero.icon;

    const name = document.createElement("div");
    name.className = "heroName";
    name.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(name);
    btn.onclick = () => selectHero(hero);

    grid.appendChild(btn);
  });
}

/* ================= ROLE FILTER ================= */

function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  return hero.roles?.includes(selectedRole);
}

/* ================= SELECTION ================= */

function selectHero(hero) {
  if (isHeroLocked(hero.name)) return;
  forceSelect(hero, false);
}

function forceSelect(hero, isAuto) {
  const current = draftOrder[step];
  if (!current) return;

  const playedLane = hero.lanes[0];

  if (current.type === "pick") {
    picks.push({
      hero: hero.name,
      side: current.side,
      lane: playedLane
    });
    addIcon(current.side, hero.icon, false);
  }

  step++;
  updateTurn();
  renderHeroPool();

  const nextPhase = draftOrder[step]?.phase;
  if (nextPhase && nextPhase !== currentPhase) {
    currentPhase = nextPhase;
    startPhaseTimer();
  }
}

/* ================= HELPERS ================= */

function getAvailableHeroes() {
  return heroes.filter(h => !isHeroLocked(h.name));
}

function isHeroLocked(name) {
  return picks.some(p => p.hero === name);
}

function randomHero(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function addIcon(side, icon, isBan) {
  const div = document.createElement("div");
  div.className = isBan ? "banIcon" : "pickIcon";

  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  const id = side === "Blue" ? "bluePicks" : "redPicks";
  document.getElementById(id).appendChild(div);
}

/* ================= TURN ================= */

function updateTurn() {
  if (picks.length === 10) {
    clearInterval(interval);
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    return;
  }

  const c = draftOrder[step];
  if (c) {
    currentPhase = c.phase;
    document.getElementById("turnIndicator").innerText =
      `${c.side} — PICK`;
  }
}

/* ================= ANALYSIS ================= */

function analyzeDraft() {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

  function scoreTeam(side) {
    const teamPicks = picks.filter(p => p.side === side);
    const laneMap = {};
    let score = 0;

    teamPicks.forEach(p => {
      const hero = heroes.find(h => h.name === p.hero);
      if (!hero || !hero.metaTier) return;
      if (!hero.lanes.includes(p.lane)) return;

      const tierScore =
        hero.metaTier === "S" ? 10 :
        hero.metaTier === "A" ? 8 :
        hero.metaTier === "B" ? 6 :
        hero.metaTier === "Situational" ? 4 : 2;

      if (!laneMap[p.lane] || tierScore > laneMap[p.lane]) {
        laneMap[p.lane] = tierScore;
      }
    });

    lanes.forEach(l => {
      if (laneMap[l]) score += laneMap[l];
    });

    return { score, laneMap };
  }

  const blue = scoreTeam("Blue");
  const red = scoreTeam("Red");

  const blueMissing = lanes.filter(l => !blue.laneMap[l]);
  const redMissing = lanes.filter(l => !red.laneMap[l]);

  let result = `Blue Team Score: ${blue.score}\n`;
  if (blueMissing.length)
    result += `Missing lanes: ${blueMissing.join(", ")}\n`;

  result += `\nRed Team Score: ${red.score}\n`;
  if (redMissing.length)
    result += `Missing lanes: ${redMissing.join(", ")}`;

  document.getElementById("result").innerText = result;
}
