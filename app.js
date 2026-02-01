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
  if (!reset && simPickPhase) return; // Continue countdown during simultaneous picks

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
        simPicksRemaining = 2;
      }
      const available = getAvailableHeroes();
      if (available.length > 0) {
        forceSelect(randomHero(available), false);
        simPicksRemaining--;
      }

      if (simPicksRemaining > 0) {
        // Do not reset timer yet
        startTimer(false);
      } else {
        simPickPhase = false;
        simPicksRemaining = 0;
        step++;
        updateTurn();
        startTimer(true);
      }
    } else {
      const available = getAvailableHeroes();
      if (available.length > 0) forceSelect(randomHero(available));
    }

  } else {
    addSkippedBan(current.side);
    step++;
    updateTurn();
    startTimer(true);
  }
}

function isSimultaneousPick(stepIndex) {
  const cur = draftOrder[stepIndex];
  const next = draftOrder[stepIndex + 1];
  return cur && next && cur.type === "pick" && next.type === "pick" && cur.side === next.side;
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

  const id = side === "Blue"
    ? isBan ? "blueBans" : "bluePicks"
    : isBan ? "redBans" : "redPicks";

  document.getElementById(id).appendChild(div);

  // Trigger fade-in
  setTimeout(() => div.classList.add("show"), 10);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);
  setTimeout(() => div.classList.add("show"), 10);
}

/* ================= TURN ================= */
function updateTurn() {
  const bluePicksCount = picks.filter(p => p.side === "Blue").length;
  const redPicksCount = picks.filter(p => p.side === "Red").length;
  const blueBansCount = bans.filter(b => b.side === "Blue").length;
  const redBansCount = bans.filter(b => b.side === "Red").length;

  if (
    bluePicksCount === 5 &&
    redPicksCount === 5 &&
    blueBansCount === 5 &&
    redBansCount === 5
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

  // Sort heroes by MetaTier descending
  const sortedPicks = [...teamPicks]
    .map(p => ({ ...p, tierValue: metaTierValue(p.hero) }))
    .sort((a, b) => b.tierValue - a.tierValue);

  for (let pick of sortedPicks) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) continue;

    // Assign first available lane from hero's possible lanes
    const lane = hero.lanes.find(l => remainingLanes.has(l));
    if (lane) {
      laneAssignment[hero.name] = { hero, lane };
      remainingLanes.delete(lane);
    } else {
      // Assign anyway to highest-priority lane (will get MetaTier points)
      laneAssignment[hero.name] = { hero, lane: hero.lanes[0] };
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

/* ================= LANE COVERAGE ================= */
function checkLaneCoverage(teamPicks) {
  const assignment = assignHeroesToLanes(teamPicks);
  const lanesUsed = new Set(Object.values(assignment).map(a => a.lane));
  return lanesUsed.size === 5 ? 10 : 0;
}

/* ================= EARLY/MID & LATE GAME ================= */
function calculateEarlyLate(teamPicks) {
  const assignment = assignHeroesToLanes(teamPicks);
  const earlyValues = [];
  const lateValues = [];

  Object.values(assignment).forEach(({ hero }) => {
    if (hero.earlyMid !== undefined) earlyValues.push(hero.earlyMid);
    if (hero.late !== undefined) lateValues.push(hero.late);
  });

  const earlyAvg = earlyValues.length ? Math.min(5, earlyValues.reduce((a,b)=>a+b,0)/earlyValues.length) : 0;
  const lateAvg = lateValues.length ? Math.min(5, lateValues.reduce((a,b)=>a+b,0)/lateValues.length) : 0;

  return { earlyMid: earlyAvg, late: lateAvg };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueTeam = picks.filter(p => p.side === "Blue");
  const redTeam = picks.filter(p => p.side === "Red");

  // Lane coverage
  const blueLanePoints = checkLaneCoverage(blueTeam);
  const redLanePoints = checkLaneCoverage(redTeam);

  // MetaTier points
  const blueMeta = blueTeam.reduce((sum, p) => sum + metaTierValue(p.hero), 0);
  const redMeta = redTeam.reduce((sum, p) => sum + metaTierValue(p.hero), 0);

  // Early/Mid & Late
  const blueEL = calculateEarlyLate(blueTeam);
  const redEL = calculateEarlyLate(redTeam);

  const blueTotal = blueLanePoints + blueMeta + blueEL.earlyMid + blueEL.late;
  const redTotal = redLanePoints + redMeta + redEL.earlyMid + redEL.late;

  document.getElementById("result").innerText =
    `Blue Team:\n  Lane Coverage: ${blueLanePoints}\n  MetaTier: ${blueMeta}\n  Early/Mid: ${blueEL.earlyMid.toFixed(1)}\n  Late: ${blueEL.late.toFixed(1)}\n  Total: ${blueTotal.toFixed(1)}\n\n` +
    `Red Team:\n  Lane Coverage: ${redLanePoints}\n  MetaTier: ${redMeta}\n  Early/Mid: ${redEL.earlyMid.toFixed(1)}\n  Late: ${redEL.late.toFixed(1)}\n  Total: ${redTotal.toFixed(1)}`;
}
