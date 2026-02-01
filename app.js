/* =========================
   GLOBAL STATE
========================= */

let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* =========================
   MPL DRAFT ORDER
========================= */

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

/* =========================
   INIT
========================= */

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer();
};

/* =========================
   HERO POOL
========================= */

function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
    if (!matchesRoleFilter(hero)) return;

    const btn = document.createElement("button");
    btn.className = "heroBtn";

    if (isHeroLocked(hero.name)) btn.classList.add("locked");

    btn.innerHTML = `
      <img src="${hero.icon}">
      <div class="heroName">${hero.name}</div>
    `;

    btn.onclick = () => selectHero(hero, btn);
    grid.appendChild(btn);
  });
}

/* =========================
   ROLE FILTER
========================= */

function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  return hero.roles?.includes(selectedRole);
}

/* =========================
   TIMER
========================= */

function startTimer(reset = true) {
  clearInterval(interval);
  if (reset) timer = 50;

  document.getElementById("timer").innerText = timer;

  interval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;

    if (timer <= 0) {
      clearInterval(interval);
      autoResolve();
    }
  }, 1000);
}

/* =========================
   AUTO RESOLVE
========================= */

function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    const available = getAvailableHeroes();
    if (available.length) forceSelect(randomHero(available));
  } else {
    addSkippedBan(current.side);
    step++;
    updateTurn();
    startTimer();
  }
}

/* =========================
   SELECTION
========================= */

function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  clearInterval(interval);
  forceSelect(hero);
}

function forceSelect(hero) {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  step++;
  updateTurn();
  startTimer();
  renderHeroPool();
}

/* =========================
   HELPERS
========================= */

function getAvailableHeroes() {
  return heroes.filter(h => !isHeroLocked(h.name));
}

function isHeroLocked(name) {
  return picks.some(p => p.hero === name) || bans.some(b => b.hero === name);
}

function randomHero(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function addIcon(side, icon, isBan) {
  const div = document.createElement("div");
  div.className = isBan ? "banIcon" : "pickIcon";
  div.innerHTML = `<img src="${icon}">`;

  const id =
    side === "Blue"
      ? isBan ? "blueBans" : "bluePicks"
      : isBan ? "redBans" : "redPicks";

  document.getElementById(id).appendChild(div);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  document.getElementById(side === "Blue" ? "blueBans" : "redBans").appendChild(div);
}

/* =========================
   TURN DISPLAY
========================= */

function updateTurn() {
  const c = draftOrder[step];
  if (!c) {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    clearInterval(interval);
    return;
  }

  document.getElementById("turnIndicator").innerText =
    `${c.side} — ${c.type.toUpperCase()}`;
}

/* =========================
   SCORING ENGINE
========================= */

const ALL_LANES = ["Exp", "Gold", "Mid", "Jungle", "Roam"];

function metaTierValue(tier) {
  switch (tier) {
    case "S": return 10;
    case "A": return 8;
    case "B": return 6;
    case "Situational": return 4;
    default: return 2;
  }
}

/* ---------- Lane Coverage ---------- */

function hasFullLaneCoverage(teamHeroes) {
  const heroObjs = teamHeroes.map(h =>
    heroes.find(x => x.name === h)
  );

  function dfs(i, used) {
    if (i === heroObjs.length) return true;
    for (const lane of heroObjs[i].lanes) {
      if (!used.has(lane)) {
        used.add(lane);
        if (dfs(i + 1, used)) return true;
        used.delete(lane);
      }
    }
    return false;
  }

  return dfs(0, new Set());
}

/* ---------- Lane Assignment ---------- */

function assignHeroes(teamHeroes) {
  const heroObjs = teamHeroes
    .map(h => heroes.find(x => x.name === h))
    .sort((a, b) => metaTierValue(b.metaTier) - metaTierValue(a.metaTier));

  const used = new Set();
  const assigned = [];

  for (const hero of heroObjs) {
    const lane = hero.lanes.find(l => !used.has(l));
    if (lane) {
      used.add(lane);
      assigned.push(hero);
    }
  }
  return assigned;
}

/* ---------- Scoring ---------- */

function scoreMeta(assigned) {
  return assigned.reduce((s, h) => s + metaTierValue(h.metaTier), 0);
}

function scoreAverage(assigned, key) {
  if (!assigned.length) return 0;
  const sum = assigned.reduce((s, h) => s + (h[key] || 0), 0);
  return Math.min(5, sum / 5);
}

/* =========================
   ANALYSIS
========================= */

function analyzeDraft() {
  const blue = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const red = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueAssigned = assignHeroes(blue);
  const redAssigned = assignHeroes(red);

  const blueLane = hasFullLaneCoverage(blue) ? 10 : 0;
  const redLane = hasFullLaneCoverage(red) ? 10 : 0;

  const blueMeta = scoreMeta(blueAssigned);
  const redMeta = scoreMeta(redAssigned);

  const blueEarly = scoreAverage(blueAssigned, "earlyMid");
  const redEarly = scoreAverage(redAssigned, "earlyMid");

  const blueLate = scoreAverage(blueAssigned, "late");
  const redLate = scoreAverage(redAssigned, "late");

  const blueTotal = blueLane + blueMeta + blueEarly + blueLate;
  const redTotal = redLane + redMeta + redEarly + redLate;

  document.getElementById("result").innerText =
`BLUE TEAM
Lane Coverage: ${blueLane}
Meta Tier: ${blueMeta}
Early/Mid: ${blueEarly}
Late: ${blueLate}
TOTAL: ${blueTotal}

RED TEAM
Lane Coverage: ${redLane}
Meta Tier: ${redMeta}
Early/Mid: ${redEarly}
Late: ${redLate}
TOTAL: ${redTotal}`;
}
