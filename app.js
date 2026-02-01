let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* ================= DRAFT ORDER (BANS + PICKS PHASES) ================= */
const draftOrder = [
  { type: "ban", side: "Blue" }, // B1 Ban
  { type: "ban", side: "Red" },  // R1 Ban
  { type: "ban", side: "Blue" }, // B2 Ban
  { type: "ban", side: "Red" },  // R2 Ban
  { type: "ban", side: "Blue" }, // B3 Ban
  { type: "ban", side: "Red" },  // R3 Ban

  { type: "pick", side: "Blue" },       // B1 Pick
  { type: "pick", side: "Red" },        // R1 Pick
  { type: "pick", side: "Red" },        // R2 Pick
  { type: "pick", side: "Blue" },       // B2 Pick
  { type: "pick", side: "Blue" },       // B3 Pick
  { type: "pick", side: "Red" },        // R3 Pick

  { type: "ban", side: "Red" },         // R4 Ban
  { type: "ban", side: "Blue" },        // B4 Ban
  { type: "ban", side: "Red" },         // R5 Ban
  { type: "ban", side: "Blue" },        // B5 Ban

  { type: "pick", side: "Red" },        // R4 Pick
  { type: "pick", side: "Blue" },       // B4 Pick
  { type: "pick", side: "Blue" },       // B5 Pick
  { type: "pick", side: "Red" }         // R5 Pick
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

  const available = getAvailableHeroes();
  if (available.length === 0) {
    step++;
    updateTurn();
    startTimer(true);
    return;
  }

  if (current.type === "pick") {
    if (isSimultaneousPick(step)) {
      if (!simPickPhase) {
        simPickPhase = true;
        simPicksRemaining = 2;
      }
      forceSelect(randomHero(available), false);
      simPicksRemaining--;
      if (simPicksRemaining > 0) startTimer(false);
      else {
        simPickPhase = false;
        simPicksRemaining = 0;
        step++;
        updateTurn();
        startTimer(true);
      }
    } else {
      forceSelect(randomHero(available));
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

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
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

  const id = side === "Blue" ? (isBan ? "blueBans" : "bluePicks") : (isBan ? "redBans" : "redPicks");
  document.getElementById(id).appendChild(div);

  // Fade-in
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

/* ================= FLEX-AWARE META TIER ================= */
function assignOptimalMetaLane(teamPicks) {
  // Generate all possible lane assignments for flex heroes and pick the one
  // that maximizes total MetaTier points
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assignments = [];

  function backtrack(index, usedLanes, currentAssign) {
    if (index === teamPicks.length) {
      assignments.push({ ...currentAssign });
      return;
    }
    const hero = heroes.find(h => h.name === teamPicks[index].hero);
    if (!hero) return;

    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        currentAssign[hero.name] = lane;
        backtrack(index + 1, usedLanes, currentAssign);
        usedLanes.delete(lane);
      }
    }
    // If no lanes available, assign anyway to first lane
    if (!hero.lanes.some(l => !usedLanes.has(l))) {
      currentAssign[hero.name] = hero.lanes[0];
      backtrack(index + 1, usedLanes, currentAssign);
    }
  }

  backtrack(0, new Set(), {});

  // Pick assignment that maximizes total MetaTier
  let maxPoints = -1;
  let bestAssign = null;
  for (let assign of assignments) {
    let points = 0;
    for (let heroName in assign) points += metaTierValue(heroName);
    if (points > maxPoints) {
      maxPoints = points;
      bestAssign = assign;
    }
  }
  return bestAssign || {};
}

/* ================= LANE COVERAGE ================= */
function checkLaneCoverage(teamPicks) {
  const assignment = assignOptimalMetaLane(teamPicks);
  const lanesUsed = new Set(Object.values(assignment));
  return lanesUsed.size === 5 ? 10 : 0;
}

/* ================= EARLY/MID & LATE ================= */
function calculateEarlyLate(teamPicks) {
  const assignment = assignOptimalMetaLane(teamPicks);
  const earlyValues = [];
  const lateValues = [];

  for (let heroName in assignment) {
    const hero = heroes.find(h => h.name === heroName);
    if (!hero) continue;
    if (hero.earlyMid !== undefined) earlyValues.push(hero.earlyMid);
    if (hero.late !== undefined) lateValues.push(hero.late);
  }

  const earlyAvg = earlyValues.length ? Math.min(5, earlyValues.reduce((a,b)=>a+b,0)/earlyValues.length) : 0;
  const lateAvg = lateValues.length ? Math.min(5, lateValues.reduce((a,b)=>a+b,0)/lateValues.length) : 0;

  return { earlyMid: earlyAvg, late: lateAvg };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueTeam = picks.filter(p => p.side === "Blue");
  const redTeam = picks.filter(p => p.side === "Red");

  const blueLanePoints = checkLaneCoverage(blueTeam);
  const redLanePoints = checkLaneCoverage(redTeam);

  // Flex-aware MetaTier
  const blueAssign = assignOptimalMetaLane(blueTeam);
  const redAssign = assignOptimalMetaLane(redTeam);

  let blueMeta = 0;
  for (let hero in blueAssign) blueMeta += metaTierValue(hero);
  let redMeta = 0;
  for (let hero in redAssign) redMeta += metaTierValue(hero);

  const blueEL = calculateEarlyLate(blueTeam);
  const redEL = calculateEarlyLate(redTeam);

  const blueTotal = blueLanePoints + blueMeta + blueEL.earlyMid + blueEL.late;
  const redTotal = redLanePoints + redMeta + redEL.earlyMid + redEL.late;

  document.getElementById("result").innerText =
    `Blue Team:\n  Lane Coverage: ${blueLanePoints}\n  MetaTier: ${blueMeta}\n  Early/Mid: ${blueEL.earlyMid.toFixed(1)}\n  Late: ${blueEL.late.toFixed(1)}\n  Total: ${blueTotal.toFixed(1)}\n\n` +
    `Red Team:\n  Lane Coverage: ${redLanePoints}\n  MetaTier: ${redMeta}\n  Early/Mid: ${redEL.earlyMid.toFixed(1)}\n  Late: ${redEL.late.toFixed(1)}\n  Total: ${redTotal.toFixed(1)}`;
}
