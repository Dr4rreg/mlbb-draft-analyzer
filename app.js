let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* ================= DRAFT ORDER ================= */
const draftOrder = [
  // Phase 1: Bans
  { type: "ban", side: "Blue" },  // B1 Ban
  { type: "ban", side: "Red" },   // R1 Ban
  { type: "ban", side: "Blue" },  // B2 Ban
  { type: "ban", side: "Red" },   // R2 Ban
  { type: "ban", side: "Blue" },  // B3 Ban
  { type: "ban", side: "Red" },   // R3 Ban

  // Phase 2: Picks
  { type: "pick", side: "Blue" },       // B1 Pick
  { type: "pick", side: "Red" },        // R1 Pick
  { type: "pick", side: "Red" },        // R2 Pick
  { type: "pick", side: "Blue" },       // B2 Pick
  { type: "pick", side: "Blue" },       // B3 Pick
  { type: "pick", side: "Red" },        // R3 Pick

  // Phase 3: Bans
  { type: "ban", side: "Red" },         // R4 Ban
  { type: "ban", side: "Blue" },        // B4 Ban
  { type: "ban", side: "Red" },         // R5 Ban
  { type: "ban", side: "Blue" },        // B5 Ban

  // Phase 4: Picks
  { type: "pick", side: "Red" },        // R4 Pick
  { type: "pick", side: "Blue" },       // B4 Pick
  { type: "pick", side: "Blue" },       // B5 Pick
  { type: "pick", side: "Red" }         // R5 Pick
];

/* Define phases (indexes of first action in each phase) */
const phases = [
  0, 6, 12, 16 // start index of each phase
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

  const phaseStart = getCurrentPhaseStart(step);

  // Reset timer if moving to new phase
  if (step === phaseStart) timer = 50;

  const available = getAvailableHeroes();

  if (current.type === "pick") {
    forceSelect(randomHero(available));
  } else {
    addSkippedBan(current.side);
    bans.push({ hero: "Skipped", side: current.side });
  }

  step++;
  updateTurn();
  startTimer(step === phaseStart); // reset only at new phase
}

/* Determine start index of current phase */
function getCurrentPhaseStart(index) {
  let start = phases[0];
  for (let i = phases.length - 1; i >= 0; i--) {
    if (index >= phases[i]) {
      start = phases[i];
      break;
    }
  }
  return start;
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
  renderHeroPool();
  startTimer(restartTimer);
}

/* ================= HELPERS ================= */
function getAvailableHeroes() {
  return heroes.filter(h => !isHeroLocked(h.name));
}

function isHeroLocked(name) {
  return picks.some(p => p.hero === name) || bans.some(b => p.hero === name);
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
  setTimeout(() => { div.style.opacity = 1; }, 50);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  div.style.opacity = 0;
  div.style.transition = "opacity 0.5s";

  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);

  setTimeout(() => { div.style.opacity = 1; }, 50);
}

/* ================= TURN ================= */
function updateTurn() {
  const bluePicks = picks.filter(p => p.side === "Blue").length;
  const redPicks = picks.filter(p => p.side === "Red").length;
  const blueBans = bans.filter(b => b.side === "Blue").length;
  const redBans = bans.filter(b => b.side === "Red").length;

  const draftComplete = bluePicks === 5 && redPicks === 5 && blueBans === 5 && redBans === 5;

  if (draftComplete) {
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

/* ================= ANALYSIS (FULL BREAKDOWN) ================= */
function analyzeDraft() {
  const sides = ["Blue", "Red"];
  const resultText = sides.map(side => {
    const teamPicks = picks.filter(p => p.side === side);
    const laneCoverage = checkLaneCoverage(teamPicks) ? 10 : 0;
    const meta = calculateMetaScore(side);
    const earlyLate = calculateEarlyLate(side);
    const total = laneCoverage + meta + earlyLate.earlyMid + earlyLate.late;

    return `${side} Team Score Breakdown:
Lane Coverage: ${laneCoverage}
MetaTier: ${meta}
Early/Mid: ${earlyLate.earlyMid.toFixed(1)}
Late: ${earlyLate.late.toFixed(1)}
Total: ${total.toFixed(1)}\n`;
  }).join("\n");

  document.getElementById("result").innerText = resultText;
}

/* ================= LANE ASSIGNMENT ================= */
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

    // Find first available lane from hero's possible lanes
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

/* ================= LANE COVERAGE ================= */
function checkLaneCoverage(teamPicks) {
  const assignment = assignHeroesToLanes(teamPicks);
  return Object.keys(assignment).length === 5;
}

/* ================= METATIER SCORING ================= */
function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const assignment = assignHeroesToLanes(teamPicks);

  let score = 0;
  Object.values(assignment).forEach(hero => {
    switch (hero.metaTier) {
      case "S": score += 10; break;
      case "A": score += 8; break;
      case "B": score += 6; break;
      case "Situational": score += 4; break;
      case "F": score += 2; break;
    }
  });

  return score;
}

/* ================= EARLY/MID AND LATE ================= */
function calculateEarlyLate(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const assignment = assignHeroesToLanes(teamPicks);

  let earlyMidScore = 0;
  let lateScore = 0;
  const heroesCount = Object.values(assignment).length;

  Object.values(assignment).forEach(hero => {
    earlyMidScore += hero.earlyMid || 0;
    lateScore += hero.late || 0;
  });

  // Cap at 5 points max
  const early = heroesCount ? Math.min(5, earlyMidScore / heroesCount) : 0;
  const late = heroesCount ? Math.min(5, lateScore / heroesCount) : 0;

  return { earlyMid: early, late: late };
}
