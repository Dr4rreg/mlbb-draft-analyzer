let step = 0;
let timer = 50;
let interval = null;
let phaseIndex = 0;

let selectedRole = "All";
const picks = [];
const bans = [];

/* ================= DRAFT ORDER ================= */
const draftOrder = [
  { type: "ban", side: "Blue" },  // B1 Ban
  { type: "ban", side: "Red" },   // R1 Ban
  { type: "ban", side: "Blue" },  // B2 Ban
  { type: "ban", side: "Red" },   // R2 Ban
  { type: "ban", side: "Blue" },  // B3 Ban
  { type: "ban", side: "Red" },   // R3 Ban

  { type: "pick", side: "Blue" }, // B1 Pick
  { type: "pick", side: "Red" },  // R1 Pick
  { type: "pick", side: "Red" },  // R2 Pick
  { type: "pick", side: "Blue" }, // B2 Pick
  { type: "pick", side: "Blue" }, // B3 Pick
  { type: "pick", side: "Red" },  // R3 Pick

  { type: "ban", side: "Red" },   // R4 Ban
  { type: "ban", side: "Blue" },  // B4 Ban
  { type: "ban", side: "Red" },   // R5 Ban
  { type: "ban", side: "Blue" },  // B5 Ban

  { type: "pick", side: "Red" },  // R4 Pick
  { type: "pick", side: "Blue" }, // B4 Pick
  { type: "pick", side: "Blue" }, // B5 Pick
  { type: "pick", side: "Red" }   // R5 Pick
];

/* ================= PHASES ================= */
// Each phase is a contiguous set of steps that share a single timer
const phases = [
  [0], [1], [2], [3], [4], [5],       // Bans
  [6],                                // B1 Pick
  [7, 8],                             // R1+R2 Pick
  [9, 10],                            // B2+B3 Pick
  [11],                               // R3 Pick
  [12], [13], [14], [15],             // Bans
  [16],                               // R4 Pick
  [17, 18],                            // B4+B5 Pick
  [19]                                // R5 Pick
];

/* ================= ON LOAD ================= */
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
      autoResolvePhase();
    }
  }, 1000);
}

function currentPhase() {
  return phases[phaseIndex] || [];
}

function isLastStepInPhase() {
  const phase = currentPhase();
  return step >= Math.max(...phase);
}

/* ================= AUTO-RESOLVE ================= */
function autoResolvePhase() {
  const phase = currentPhase();
  for (let i = step; i <= Math.max(...phase); i++) {
    const current = draftOrder[i];
    if (!current) continue;

    if (current.type === "pick") {
      const available = getAvailableHeroes();
      if (available.length > 0) forceSelect(randomHero(available), false);
    } else {
      addSkippedBan(current.side);
      step++;
      updateTurn();
    }
  }

  // Move to next phase
  phaseIndex++;
  if (phaseIndex < phases.length) {
    step = Math.min(...phases[phaseIndex]);
    startTimer(true);
  }
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

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side, lane: hero.lanes[0] });
    addIcon(current.side, hero.icon, false);
  }

  step++;

  if (isLastStepInPhase()) {
    phaseIndex++;
    if (phaseIndex < phases.length && restartTimer) startTimer(true);
  } else {
    if (restartTimer) startTimer(false);
  }

  updateTurn();
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
  div.style.opacity = 0;
  div.style.transition = "opacity 0.5s";
  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  const id = side === "Blue"
    ? isBan ? "blueBans" : "bluePicks"
    : isBan ? "redBans" : "redPicks";

  document.getElementById(id).appendChild(div);

  // Fade in
  requestAnimationFrame(() => {
    div.style.opacity = 1;
  });
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
  if (c) {
    document.getElementById("turnIndicator").innerText =
      `${c.side} Team — ${c.type.toUpperCase()}`;
  }
}

/* ================= SCORING ================= */
function assignHeroesToLanes(teamPicks) {
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const laneAssignment = {};
  const remainingLanes = new Set(allLanes);

  const sortedPicks = teamPicks
    .map(p => ({ ...p, tierValue: metaTierValue(p.hero) }))
    .sort((a, b) => b.tierValue - a.tierValue);

  for (let pick of sortedPicks) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) continue;

    // Assign to first available lane hero can go to
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
    case "S": return 5;
    case "A": return 4;
    case "B": return 3;
    case "Situational": return 2;
    case "F": return 1;
    default: return 0;
  }
}

function calculateLaneCoverage(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const lanesList = teamPicks.map(p => heroes.find(h => h.name === p.hero).lanes);

  // Check if any combination of lanes fills all 5 lanes
  function fillLanes(assigned = {}, index = 0) {
    if (index >= lanesList.length) {
      return Object.keys(assigned).length === 5;
    }
    for (let l of lanesList[index]) {
      if (!assigned[l]) {
        assigned[l] = true;
        if (fillLanes({ ...assigned }, index + 1)) return true;
      }
    }
    return false;
  }

  return fillLanes() ? 10 : 0;
}

function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  let score = 0;

  teamPicks.forEach(pick => {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) return;

    score += metaTierValue(hero.name);
  });

  return score;
}

function calculateEarlyLate(side) {
  const teamPicks = picks.filter(p => p.side === side);
  let early = 0, late = 0;

  teamPicks.forEach(pick => {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) return;

    early += hero.earlyMid || 0;
    late += hero.late || 0;
  });

  const count = teamPicks.length || 1;
  return {
    earlyMid: Math.min(early / count, 5),
    late: Math.min(late / count, 5)
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueLane = calculateLaneCoverage("Blue");
  const redLane = calculateLaneCoverage("Red");

  const blueMeta = calculateMetaScore("Blue");
  const redMeta = calculateMetaScore("Red");

  const blueEarlyLate = calculateEarlyLate("Blue");
  const redEarlyLate = calculateEarlyLate("Red");

  const blueTotal = blueLane + blueMeta + blueEarlyLate.earlyMid + blueEarlyLate.late;
  const redTotal = redLane + redMeta + redEarlyLate.earlyMid + redEarlyLate.late;

  document.getElementById("result").innerText =
    `Blue Team:\n  Lane Coverage: ${blueLane}\n  MetaTier: ${blueMeta}\n  Early/Mid: ${blueEarlyLate.earlyMid.toFixed(1)}\n  Late: ${blueEarlyLate.late.toFixed(1)}\n  Total: ${blueTotal}\n\n` +
    `Red Team:\n  Lane Coverage: ${redLane}\n  MetaTier: ${redMeta}\n  Early/Mid: ${redEarlyLate.earlyMid.toFixed(1)}\n  Late: ${redEarlyLate.late.toFixed(1)}\n  Total: ${redTotal}`;
}
