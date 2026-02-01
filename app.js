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

/* ================= LANE ASSIGNMENT WITH FLEX ================= */
function assignHeroesToLanesMaximize(heroNames) {
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const heroesList = heroNames.map(name => heroes.find(h => h.name === name));

  let maxPoints = 0;
  let bestAssignment = {};

  function backtrack(index, laneAssignment, pointsSoFar) {
    if (index === heroesList.length) {
      if (pointsSoFar > maxPoints) {
        maxPoints = pointsSoFar;
        bestAssignment = { ...laneAssignment };
      }
      return;
    }

    const hero = heroesList[index];
    const heroPoints = metaTierValue(hero.name);
    for (let lane of hero.lanes) {
      if (!laneAssignment[lane]) {
        laneAssignment[lane] = hero;
        backtrack(index + 1, laneAssignment, pointsSoFar + heroPoints);
        laneAssignment[lane] = null;
      }
    }
    // If hero cannot go to a free lane, still count them in points if they have flex lanes
    if (!hero.lanes.some(l => !laneAssignment[l])) {
      backtrack(index + 1, laneAssignment, pointsSoFar + heroPoints);
    }
  }

  backtrack(0, {}, 0);
  return bestAssignment;
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
function checkLaneCoverage(heroNames) {
  const assignment = assignHeroesToLanesMaximize(heroNames);
  return Object.keys(assignment).length === 5;
}

/* ================= EARLY/MID AND LATE ================= */
function calculateEarlyLate(heroNames) {
  const heroesList = heroNames.map(name => heroes.find(h => h.name === name));
  let earlySum = 0, lateSum = 0;
  heroesList.forEach(hero => {
    earlySum += hero.earlyMid || 0;
    lateSum += hero.late || 0;
  });
  const count = heroesList.length || 1;
  return {
    earlyMid: Math.min(5, earlySum / count),
    late: Math.min(5, lateSum / count)
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueLanePoints = checkLaneCoverage(blueHeroes) ? 10 : 0;
  const redLanePoints = checkLaneCoverage(redHeroes) ? 10 : 0;

  let blueMeta = 0;
  let redMeta = 0;

  assignHeroesToLanesMaximize(blueHeroes);
  assignHeroesToLanesMaximize(redHeroes);

  blueMeta = blueHeroes.reduce((sum, name) => sum + metaTierValue(name), 0);
  redMeta = redHeroes.reduce((sum, name) => sum + metaTierValue(name), 0);

  const blueEarlyLate = calculateEarlyLate(blueHeroes);
  const redEarlyLate = calculateEarlyLate(redHeroes);

  const blueTotal = blueLanePoints + blueMeta + blueEarlyLate.earlyMid + blueEarlyLate.late;
  const redTotal = redLanePoints + redMeta + redEarlyLate.earlyMid + redEarlyLate.late;

  document.getElementById("result").innerText =
    `BLUE TEAM\n` +
    `Lane Coverage: ${blueLanePoints}\n` +
    `MetaTier: ${blueMeta}\n` +
    `Early/Mid: ${blueEarlyLate.earlyMid.toFixed(1)}\n` +
    `Late: ${blueEarlyLate.late.toFixed(1)}\n` +
    `Total: ${blueTotal.toFixed(1)}\n\n` +
    `RED TEAM\n` +
    `Lane Coverage: ${redLanePoints}\n` +
    `MetaTier: ${redMeta}\n` +
    `Early/Mid: ${redEarlyLate.earlyMid.toFixed(1)}\n` +
    `Late: ${redEarlyLate.late.toFixed(1)}\n` +
    `Total: ${redTotal.toFixed(1)}`;
}
