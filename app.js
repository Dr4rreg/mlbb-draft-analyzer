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

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side, heroObj: hero });
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

/* ================= META TIER VALUE ================= */
function metaTierValue(hero) {
  switch (hero.metaTier) {
    case "S": return 5;
    case "A": return 4;
    case "B": return 3;
    case "Situational": return 2;
    case "F": return 1;
    default: return 0;
  }
}

/* ================= OPTIMIZED LANE ASSIGNMENT ================= */
function maximizeScore(teamHeroes, type) {
  let bestScore = 0;

  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

  function backtrack(index, usedLanes, currentScore) {
    if (index === teamHeroes.length) {
      if (currentScore > bestScore) bestScore = currentScore;
      return;
    }

    const hero = teamHeroes[index];
    const score = type === "meta" ? metaTierValue(hero) : hero[type] || 0;

    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        backtrack(index + 1, usedLanes, currentScore + score);
        usedLanes.delete(lane);
      }
    }
    // Allow hero to take a lane already assigned if all heroes have at least one lane left
    if (!hero.lanes.some(l => !usedLanes.has(l))) {
      backtrack(index + 1, usedLanes, currentScore + score);
    }
  }

  backtrack(0, new Set(), 0);
  return bestScore;
}

/* ================= LANE COVERAGE ================= */
function checkLaneCoverage(teamHeroes) {
  if (teamHeroes.length !== 5) return false;
  let fulfilled = false;

  function backtrack(index, usedLanes) {
    if (fulfilled) return;
    if (index === teamHeroes.length) {
      if (usedLanes.size === 5) fulfilled = true;
      return;
    }

    const hero = teamHeroes[index];
    for (let lane of hero.lanes) {
      if (!usedLanes.has(lane)) {
        usedLanes.add(lane);
        backtrack(index + 1, usedLanes);
        usedLanes.delete(lane);
      }
    }
  }

  backtrack(0, new Set());
  return fulfilled;
}

/* ================= EARLY/MID AND LATE GAME ================= */
function calculateAverageScore(teamHeroes, type) {
  if (teamHeroes.length === 0) return 0;
  const total = teamHeroes.reduce((sum, hero) => sum + (hero[type] || 0), 0);
  return Math.min(total / teamHeroes.length, 5);
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.heroObj);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.heroObj);

  const results = [];

  ["Blue", "Red"].forEach(side => {
    const teamHeroes = side === "Blue" ? blueHeroes : redHeroes;

    const lanePoints = checkLaneCoverage(teamHeroes) ? 10 : 0;
    const metaPoints = maximizeScore(teamHeroes, "meta");
    const earlyPoints = calculateAverageScore(teamHeroes, "earlyMid");
    const latePoints = calculateAverageScore(teamHeroes, "late");

    const total = lanePoints + metaPoints + earlyPoints + latePoints;

    results.push({
      side,
      lanePoints,
      metaPoints,
      earlyPoints: earlyPoints.toFixed(1),
      latePoints: latePoints.toFixed(1),
      total: total.toFixed(1)
    });
  });

  document.getElementById("result").innerText =
    results.map(r =>
      `${r.side} Team:\n` +
      `Lane Coverage: ${r.lanePoints}\n` +
      `Meta Tier: ${r.metaPoints}\n` +
      `Early/Mid: ${r.earlyPoints}\n` +
      `Late: ${r.latePoints}\n` +
      `Total: ${r.total}\n`
    ).join("\n");
}
