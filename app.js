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

/* ================= META TIER HELPER ================= */
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

/* ================= ASSIGN HEROES TO LANES (META) ================= */
function assignHeroesToLanesMaximize(teamPicks) {
  const assigned = {};
  const remainingLanes = new Set(["Exp", "Jungle", "Mid", "Roam", "Gold"]);
  const sorted = teamPicks
    .map(p => ({ ...p, tier: metaTierValue(p.hero) }))
    .sort((a, b) => b.tier - a.tier);

  for (let pick of sorted) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) continue;

    // Assign hero to first available lane
    let lane = hero.lanes.find(l => remainingLanes.has(l));
    if (!lane) {
      // All hero lanes taken, pick first possible lane anyway
      lane = hero.lanes[0];
    } else {
      remainingLanes.delete(lane);
    }

    assigned[lane] = hero;
  }
  return assigned;
}

/* ================= LANE COVERAGE (CORRECTED) ================= */
function checkLaneCoverage(heroNames) {
  const heroesList = heroNames.map(name => heroes.find(h => h.name === name));
  let covered = false;

  function backtrack(index, usedLanes) {
    if (covered) return;
    if (index === heroesList.length) {
      if (usedLanes.size === 5) covered = true;
      return;
    }
    const hero = heroesList[index];
    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        backtrack(index + 1, usedLanes);
        usedLanes.delete(lane);
      }
    }
  }

  backtrack(0, new Set());
  return covered;
}

/* ================= META TIER SCORING ================= */
function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side).map(p => p.hero);
  const assignment = assignHeroesToLanesMaximize(picks.filter(p => p.side === side));

  let score = 0;
  const counted = new Set();

  Object.values(assignment).forEach(hero => {
    if (!hero) return;
    if (!counted.has(hero.name)) {
      score += metaTierValue(hero.name) * 2; // Max 10 per hero
      counted.add(hero.name);
    }
  });

  return score;
}

/* ================= EARLY/MID & LATE GAME ================= */
function calculateEarlyLate(side) {
  const teamPicks = picks.filter(p => p.side === side).map(p => heroes.find(h => h.name === p.hero));
  if (!teamPicks.length) return { earlyMid: 0, late: 0 };

  let earlyMidSum = 0, lateSum = 0;
  teamPicks.forEach(h => {
    earlyMidSum += h.earlyMid || 0;
    lateSum += h.late || 0;
  });

  // Average points, capped at 5
  const earlyMid = Math.min(5, earlyMidSum / teamPicks.length);
  const late = Math.min(5, lateSum / teamPicks.length);

  return { earlyMid, late };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  // Lane coverage
  const blueLane = checkLaneCoverage(blueHeroes) ? 10 : 0;
  const redLane = checkLaneCoverage(redHeroes) ? 10 : 0;

  // Meta Tier
  const blueMeta = calculateMetaScore("Blue");
  const redMeta = calculateMetaScore("Red");

  // Early/Late
  const blueEarlyLate = calculateEarlyLate("Blue");
  const redEarlyLate = calculateEarlyLate("Red");

  const blueTotal = blueLane + blueMeta + blueEarlyLate.earlyMid + blueEarlyLate.late;
  const redTotal = redLane + redMeta + redEarlyLate.earlyMid + redEarlyLate.late;

  document.getElementById("result").innerText =
    `Blue Team:\n` +
    `  Lane Coverage: ${blueLane}\n` +
    `  Meta Tier: ${blueMeta}\n` +
    `  Early/Mid: ${blueEarlyLate.earlyMid.toFixed(1)}\n` +
    `  Late: ${blueEarlyLate.late.toFixed(1)}\n` +
    `  Total: ${blueTotal.toFixed(1)}\n\n` +

    `Red Team:\n` +
    `  Lane Coverage: ${redLane}\n` +
    `  Meta Tier: ${redMeta}\n` +
    `  Early/Mid: ${redEarlyLate.earlyMid.toFixed(1)}\n` +
    `  Late: ${redEarlyLate.late.toFixed(1)}\n` +
    `  Total: ${redTotal.toFixed(1)}`;
}
