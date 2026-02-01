let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* MPL ORDER */
const draftOrder = [
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  { type: "pick", side: "Blue" },  // B1
  { type: "pick", side: "Red" },   // R1
  { type: "pick", side: "Red" },   // R2
  { type: "pick", side: "Blue" },  // B2
  { type: "pick", side: "Blue" },  // B3
  { type: "pick", side: "Red" },   // R3

  { type: "ban", side: "Red" },    // R4
  { type: "ban", side: "Blue" },   // B4
  { type: "ban", side: "Red" },    // R5
  { type: "ban", side: "Blue" },   // B5

  { type: "pick", side: "Red" },   // R4
  { type: "pick", side: "Blue" },  // B4
  { type: "pick", side: "Blue" },  // B5
  { type: "pick", side: "Red" }    // R5
];

let simPickPhase = false;
let simPicksRemaining = 0;

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer();
};

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

    btn.onclick = () => selectHero(hero, btn);
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
  if (hero.role && hero.role === selectedRole) return true;
  if (hero.roles && hero.roles.includes(selectedRole)) return true;
  return false;
}

/* ================= TIMER ================= */
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

/* ================= AUTO RESOLVE ================= */
function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    if (isSimultaneousPick(step)) {
      if (!simPickPhase) {
        simPickPhase = true;
        simPicksRemaining = 2; // total picks in this phase
      }

      const available = getAvailableHeroes();
      if (available.length > 0) {
        forceSelect(randomHero(available), false);
        simPicksRemaining--;
      }

      if (simPicksRemaining > 0) {
        startTimer(false); // continue remaining time
      } else {
        simPickPhase = false;
        simPicksRemaining = 0;
        step++;
        updateTurn();
        startTimer(true); // new phase, reset timer
      }

    } else {
      const available = getAvailableHeroes();
      if (available.length > 0) forceSelect(randomHero(available));
    }

  } else {
    // Ban phase skipped
    addSkippedBan(current.side);
    step++;
    updateTurn();
    startTimer(true);
  }
}

function isSimultaneousPick(stepIndex) {
  const cur = draftOrder[stepIndex];
  const next = draftOrder[stepIndex + 1];

  return cur && next &&
         cur.type === "pick" && next.type === "pick" &&
         cur.side === next.side;
}

/* ================= SELECTION ================= */
function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  clearInterval(interval);
  forceSelect(hero);
}

function forceSelect(hero, restartTimer = true) {
  const current = draftOrder[step];
  if (!current) return;

  const playedLane = hero.lanes[0];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side, lane: playedLane });
    addIcon(current.side, hero.icon, false);
  }

  if (!simPickPhase || simPicksRemaining === 0) step++;
  updateTurn();
  if (restartTimer && !simPickPhase) startTimer(true);
  renderHeroPool();
}

/* ================= HELPERS ================= */
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

  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  const id =
    side === "Blue"
      ? isBan ? "blueBans" : "bluePicks"
      : isBan ? "redBans" : "redPicks";

  document.getElementById(id).appendChild(div);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";

  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);
}

/* ================= TURN ================= */
function updateTurn() {
  if (
    picks.filter(p => p.side === "Blue").length === 5 &&
    picks.filter(p => p.side === "Red").length === 5 &&
    bans.filter(b => b.side === "Blue").length === 5 &&
    bans.filter(b => b.side === "Red").length === 5
  ) {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    clearInterval(interval);
    return;
  }

  const c = draftOrder[step];
  if (c) document.getElementById("turnIndicator").innerText =
      `${c.side} Team — ${c.type.toUpperCase()}`;
}

/* ================= LANE COVERAGE ================= */
function checkLaneCoverage(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assigned = new Set();

  // Simple greedy slot: assign heroes to available lanes
  const usedHeroes = new Set();

  lanes.forEach(lane => {
    let bestHero = null;
    let bestMeta = -1;

    teamPicks.forEach(heroName => {
      if (usedHeroes.has(heroName)) return;
      const hero = heroes.find(h => h.name === heroName);
      if (!hero || !hero.lanes.includes(lane)) return;

      let metaScore = metaTierValue(hero.metaTier);
      if (metaScore > bestMeta) {
        bestMeta = metaScore;
        bestHero = heroName;
      }
    });

    if (bestHero) {
      assigned.add(lane);
      usedHeroes.add(bestHero);
    }
  });

  return assigned.size === lanes.length;
}

/* ================= METATIER & NEW CRITERIA ================= */
function metaTierValue(tier) {
  switch(tier) {
    case "S": return 10;
    case "A": return 8;
    case "B": return 6;
    case "Situational": return 4;
    case "F": return 2;
    default: return 0;
  }
}

function calculateScores(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  let laneCoveragePoints = checkLaneCoverage(teamPicks.map(p => p.hero)) ? 10 : 0;

  // Initialize per-lane hero selection
  const usedHeroes = new Set();
  const laneBestHero = {};

  lanes.forEach(lane => {
    let bestHero = null;
    let bestMeta = -1;

    teamPicks.forEach(pick => {
      if (usedHeroes.has(pick.hero)) return;
      const hero = heroes.find(h => h.name === pick.hero);
      if (!hero || !hero.lanes.includes(lane)) return;

      const m = metaTierValue(hero.metaTier);
      if (m > bestMeta) {
        bestMeta = m;
        bestHero = pick.hero;
      }
    });

    if (bestHero) {
      laneBestHero[lane] = bestHero;
      usedHeroes.add(bestHero);
    }
  });

  // Sum MetaTier points
  let metaScore = 0;
  for (let lane in laneBestHero) {
    const hero = heroes.find(h => h.name === laneBestHero[lane]);
    metaScore += metaTierValue(hero.metaTier);
  }

  // Early/Mid and Late game points
  let earlyMidSum = 0;
  let lateSum = 0;

  for (let lane in laneBestHero) {
    const hero = heroes.find(h => h.name === laneBestHero[lane]);
    earlyMidSum += hero.earlyMid || 0;
    lateSum += hero.late || 0;
  }

  const earlyMidPoints = (earlyMidSum / 5).toFixed(1); // average over 5 heroes
  const latePoints = (lateSum / 5).toFixed(1);

  return {
    laneCoveragePoints,
    metaScore,
    earlyMidPoints,
    latePoints,
    total: laneCoveragePoints + metaScore + parseFloat(earlyMidPoints) + parseFloat(latePoints)
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueScores = calculateScores("Blue");
  const redScores = calculateScores("Red");

  document.getElementById("result").innerText =
    `Blue Team:\nLane Coverage: ${blueScores.laneCoveragePoints}\nMetaTier: ${blueScores.metaScore}\nEarly/Mid: ${blueScores.earlyMidPoints}\nLate: ${blueScores.latePoints}\nTotal: ${blueScores.total}\n\n` +
    `Red Team:\nLane Coverage: ${redScores.laneCoveragePoints}\nMetaTier: ${redScores.metaScore}\nEarly/Mid: ${redScores.earlyMidPoints}\nLate: ${redScores.latePoints}\nTotal: ${redScores.total}`;
}
