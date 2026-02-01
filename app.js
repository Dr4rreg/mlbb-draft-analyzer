let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* ================= PHASES ================= */
// Each phase is a set of steps that share a single timer
const phases = [
  [0],           // B1 Ban
  [1],           // R1 Ban
  [2],           // B2 Ban
  [3],           // R2 Ban
  [4],           // B3 Ban
  [5],           // R3 Ban
  [6],           // B1 Pick
  [7, 8],        // R1 + R2 Pick
  [9, 10],       // B2 + B3 Pick
  [11],          // R3 Pick
  [12],          // R4 Ban
  [13],          // B4 Ban
  [14],          // R5 Ban
  [15],          // B5 Ban
  [16],          // R4 Pick
  [17, 18],      // B4 + B5 Pick
  [19]           // R5 Pick
];

/* ================= HEROES & DRAFT ================= */
window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer(true);
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
function startTimer(reset = false) {
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
  const currentPhase = getCurrentPhase();
  if (!currentPhase || currentPhase.length === 0) return;

  currentPhase.forEach(i => {
    if (step !== i) return;
    const current = draftOrder[step];
    if (!current) return;

    if (current.type === "pick") {
      const available = getAvailableHeroes();
      if (available.length > 0) forceSelect(randomHero(available), false);
    } else {
      addSkippedBan(current.side);
      step++;
      updateTurn();
    }
  });

  // Move to next phase if all steps in this phase are completed
  if (step >= Math.max(...currentPhase) + 1) {
    startTimer(true);
  } else {
    startTimer(false);
  }
}

/* ================= PHASE HELPERS ================= */
function getCurrentPhase() {
  return phases.find(p => p.includes(step));
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

  step++;
  updateTurn();

  if (restartTimer) {
    const phase = getCurrentPhase();
    if (phase && phase.includes(step)) {
      startTimer(false); // continue countdown in same phase
    } else {
      startTimer(true); // reset for next phase
    }
  }

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
  div.className = (isBan ? "banIcon" : "pickIcon") + " fadeIn";
  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  const id = side === "Blue"
    ? isBan ? "blueBans" : "bluePicks"
    : isBan ? "redBans" : "redPicks";

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
  if (c) {
    document.getElementById("turnIndicator").innerText =
      `${c.side} Team — ${c.type.toUpperCase()}`;
  }
}

/* ================= CSS FADE-IN ================= */
const style = document.createElement('style');
style.innerHTML = `
  .fadeIn { 
    animation: fadeIn 0.5s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);

/* ================= DRAFT ANALYSIS ================= */
function analyzeDraft() {
  const resultEl = document.getElementById("result");
  const blueHeroes = picks.filter(p => p.side === "Blue");
  const redHeroes = picks.filter(p => p.side === "Red");

  // Lane coverage
  const blueLanePoints = checkLaneCoveragePoints(blueHeroes);
  const redLanePoints = checkLaneCoveragePoints(redHeroes);

  // MetaTier points
  const blueMeta = calculateMetaScore("Blue");
  const redMeta = calculateMetaScore("Red");

  // Early/Mid & Late
  const blueEL = calculateEarlyLate("Blue");
  const redEL = calculateEarlyLate("Red");

  const blueTotal = blueLanePoints + blueMeta + blueEL.earlyMid + blueEL.late;
  const redTotal = redLanePoints + redMeta + redEL.earlyMid + redEL.late;

  resultEl.innerText =
    `BLUE TEAM:\n` +
    `Lane Coverage: ${blueLanePoints}\n` +
    `MetaTier: ${blueMeta}\n` +
    `Early/Mid: ${blueEL.earlyMid.toFixed(1)}\n` +
    `Late: ${blueEL.late.toFixed(1)}\n` +
    `TOTAL: ${blueTotal.toFixed(1)}\n\n` +
    `RED TEAM:\n` +
    `Lane Coverage: ${redLanePoints}\n` +
    `MetaTier: ${redMeta}\n` +
    `Early/Mid: ${redEL.earlyMid.toFixed(1)}\n` +
    `Late: ${redEL.late.toFixed(1)}\n` +
    `TOTAL: ${redTotal.toFixed(1)}`;
}

/* ================= LANE COVERAGE & META ================= */
function checkLaneCoveragePoints(teamPicks) {
  const assignment = assignHeroesToLanes(teamPicks);
  return Object.keys(assignment).length === 5 ? 10 : 0;
}

function assignHeroesToLanes(teamPicks) {
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const laneAssignment = {};
  const remainingLanes = new Set(allLanes);

  // Sort heroes by MetaTier descending
  const sortedPicks = teamPicks
    .map(p => ({ ...p, tierValue: metaTierValue(p.hero) }))
    .sort((a, b) => b.tierValue - a.tierValue);

  for (let pick of sortedPicks) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) continue;

    // Assign first available lane
    const lane = hero.lanes.find(l => remainingLanes.has(l));
    if (lane) {
      laneAssignment[lane] = hero;
      remainingLanes.delete(lane);
    }
  }

  return laneAssignment;
}

function metaTierValue(heroName) {
  const hero = heroes.find(h => h.name === heroName);
  if (!hero) return 0;
  switch (hero.metaTier) {
    case "S": return 10;
    case "A": return 8;
    case "B": return 6;
    case "Situational": return 4;
    case "F": return 2;
    default: return 0;
  }
}

function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const assignment = assignHeroesToLanes(teamPicks);

  let score = 0;
  Object.values(assignment).forEach(hero => {
    score += metaTierValue(hero.name);
  });
  return score;
}

function calculateEarlyLate(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const assignment = assignHeroesToLanes(teamPicks);

  let earlySum = 0;
  let lateSum = 0;

  Object.values(assignment).forEach(hero => {
    earlySum += hero.earlyMid || 0;
    lateSum += hero.late || 0;
  });

  const count = Object.values(assignment).length || 1;
  return {
    earlyMid: Math.min(5, earlySum / count),
    late: Math.min(5, lateSum / count)
  };
}

/* ================= SKIPPED BAN ================= */
function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped fadeIn";
  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);
}
