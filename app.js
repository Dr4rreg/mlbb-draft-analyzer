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

/* ================= LANE ASSIGNMENT ================= */
function assignHeroesToLanes(teamPicks) {
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const laneAssignment = {};
  const remainingLanes = new Set(allLanes);

  // Simple first-available assignment (used for display only)
  teamPicks.forEach(pick => {
    const hero = heroes.find(h => h.name === pick.hero);
    const lane = hero.lanes.find(l => remainingLanes.has(l));
    if (lane) {
      laneAssignment[lane] = hero;
      remainingLanes.delete(lane);
    }
  });

  return laneAssignment;
}

/* ================= META TIER SCORING ================= */
function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const heroesList = teamPicks.map(p => heroes.find(h => h.name === p.hero));

  let maxScore = 0;

  function assignLane(index, usedLanes, currentScore) {
    if (index === heroesList.length) {
      maxScore = Math.max(maxScore, currentScore);
      return;
    }

    const hero = heroesList[index];
    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        assignLane(index + 1, usedLanes, currentScore + getMetaPoints(hero));
        usedLanes.delete(lane);
      }
    }
  }

  assignLane(0, new Set(), 0);
  return maxScore;
}

function getMetaPoints(hero) {
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
function checkLaneCoverage(side) {
  const teamPicks = picks.filter(p => p.side === side).map(p => heroes.find(h => h.name === p.hero));
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

  // Generate all combinations
  let fulfilled = false;

  function assignLane(index, usedLanes) {
    if (index === teamPicks.length) {
      if (usedLanes.size === 5) fulfilled = true;
      return;
    }

    const hero = teamPicks[index];
    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        assignLane(index + 1, usedLanes);
        usedLanes.delete(lane);
      }
    }
  }

  assignLane(0, new Set());
  return fulfilled ? 10 : 0;
}

/* ================= EARLY/MID AND LATE ================= */
function calculateEarlyLate(side) {
  const teamPicks = picks.filter(p => p.side === side).map(p => heroes.find(h => h.name === p.hero));

  if (teamPicks.length === 0) return { earlyMid: 0, late: 0 };

  let earlySum = 0;
  let lateSum = 0;

  teamPicks.forEach(hero => {
    earlySum += hero.earlyMid || 0;
    lateSum += hero.late || 0;
  });

  const count = teamPicks.length;
  // Max 5 points each
  return {
    earlyMid: Math.min(earlySum / count, 5),
    late: Math.min(lateSum / count, 5)
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const criteria = ["Lane Coverage", "MetaTier", "Early/Mid", "Late"];
  const results = {};

  ["Blue", "Red"].forEach(side => {
    const lanePoints = checkLaneCoverage(side);
    const metaPoints = calculateMetaScore(side);
    const earlyLate = calculateEarlyLate(side);

    const total = lanePoints + metaPoints + earlyLate.earlyMid + earlyLate.late;

    results[side] = {
      "Lane Coverage": lanePoints,
      "MetaTier": metaPoints,
      "Early/Mid": earlyLate.earlyMid,
      "Late": earlyLate.late,
      "Total": total
    };
  });

  // Display results
  document.getElementById("result").innerText =
    `Blue Team:\n` +
    `Lane Coverage: ${results["Blue"]["Lane Coverage"]}\n` +
    `MetaTier: ${results["Blue"]["MetaTier"]}\n` +
    `Early/Mid: ${results["Blue"]["Early/Mid"].toFixed(1)}\n` +
    `Late: ${results["Blue"]["Late"].toFixed(1)}\n` +
    `Total: ${results["Blue"]["Total"].toFixed(1)}\n\n` +
    `Red Team:\n` +
    `Lane Coverage: ${results["Red"]["Lane Coverage"]}\n` +
    `MetaTier: ${results["Red"]["MetaTier"]}\n` +
    `Early/Mid: ${results["Red"]["Early/Mid"].toFixed(1)}\n` +
    `Late: ${results["Red"]["Late"].toFixed(1)}\n` +
    `Total: ${results["Red"]["Total"].toFixed(1)}`;
}
