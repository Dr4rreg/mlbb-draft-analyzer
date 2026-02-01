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

  { type: "pick", side: "Blue" },       // B1
  { type: "pick", side: "Red" },        // R1
  { type: "pick", side: "Red" },        // R2
  { type: "pick", side: "Blue" },       // B2
  { type: "pick", side: "Blue" },       // B3
  { type: "pick", side: "Red" },        // R3

  { type: "ban", side: "Red" },         // R4
  { type: "ban", side: "Blue" },        // B4
  { type: "ban", side: "Red" },         // R5
  { type: "ban", side: "Blue" },        // B5

  { type: "pick", side: "Red" },        // R4
  { type: "pick", side: "Blue" },       // B4
  { type: "pick", side: "Blue" },       // B5
  { type: "pick", side: "Red" }         // R5
];

/* Define pick phases */
const pickPhases = [
  [6],       // B1
  [7, 8],    // R1 + R2
  [9, 10],   // B2 + B3
  [11],      // R3
  [18],      // R4
  [19, 20],  // B4 + B5
  [21]       // R5
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
    const available = getAvailableHeroes();
    if (available.length > 0) {
      forceSelect(randomHero(available));
    } else {
      step++;
      updateTurn();
      startTimer(true);
    }
  } else {
    addSkippedBan(current.side);
    step++;
    updateTurn();
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

  /* Determine if timer should reset based on phase */
  const phase = getCurrentPhase(step);
  if (phase.resetOnStep === step) {
    startTimer(true);
  } else {
    startTimer(false);
  }

  renderHeroPool();
}

function getCurrentPhase(stepIndex) {
  for (let i = 0; i < pickPhases.length; i++) {
    const steps = pickPhases[i];
    const resetOnStep = steps[0]; // timer resets at start of phase
    if (steps.includes(stepIndex)) return { phase: i + 1, resetOnStep };
  }
  return { phase: null, resetOnStep: null };
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

  /* Fade-in effect */
  setTimeout(() => {
    div.style.opacity = 1;
  }, 10);
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

/* ================= LANE ASSIGNMENT ================= */
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

    const lane = hero.lanes.find(l => remainingLanes.has(l)) || hero.lanes[0];
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
  const assignment = assignHeroesToLanes(teamPicks.map(p => ({ hero: p })));
  return Object.keys(assignment).length === 5 ? 10 : 0;
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

  Object.values(assignment).forEach(hero => {
    earlyMidScore += hero.earlyMid || 0;
    lateScore += hero.late || 0;
  });

  const count = Object.values(assignment).length;
  return {
    earlyMid: count ? Math.min(5, earlyMidScore / count) : 0,
    late: count ? Math.min(5, lateScore / count) : 0
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const results = [];

  const blueLane = checkLaneCoverage(blueHeroes);
  const redLane = checkLaneCoverage(redHeroes);

  results.push(`Lane Coverage: Blue ${blueLane} / Red ${redLane}`);

  const blueMeta = calculateMetaScore("Blue");
  const redMeta = calculateMetaScore("Red");
  results.push(`MetaTier: Blue ${blueMeta} / Red ${redMeta}`);

  const blueEarlyLate = calculateEarlyLate("Blue");
  const redEarlyLate = calculateEarlyLate("Red");
  results.push(`Early/Mid: Blue ${blueEarlyLate.earlyMid.toFixed(1)} / Red ${redEarlyLate.earlyMid.toFixed(1)}`);
  results.push(`Late: Blue ${blueEarlyLate.late.toFixed(1)} / Red ${redEarlyLate.late.toFixed(1)}`);

  const blueTotal = blueLane + blueMeta + blueEarlyLate.earlyMid + blueEarlyLate.late;
  const redTotal = redLane + redMeta + redEarlyLate.earlyMid + redEarlyLate.late;
  results.push(`Total: Blue ${blueTotal} / Red ${redTotal}`);

  document.getElementById("result").innerText = results.join("\n");
}
