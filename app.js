let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";

const picks = [];
const bans = [];

let simPickPhase = false;
let simPicksRemaining = 0;

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

  { type: "ban", side: "Red" },         // R4 ban
  { type: "ban", side: "Blue" },        // B4 ban
  { type: "ban", side: "Red" },         // R5 ban
  { type: "ban", side: "Blue" },        // B5 ban

  { type: "pick", side: "Red" },        // R4 pick
  { type: "pick", side: "Blue" },       // B4 pick
  { type: "pick", side: "Blue" },       // B5 pick
  { type: "pick", side: "Red" }         // R5 pick
];

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

    if (isHeroLocked(hero.name)) {
      btn.classList.add("locked");
    }

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
        simPicksRemaining = 2; // total picks in this phase
        startTimer(true);      // Reset timer at start of phase
      }

      const available = getAvailableHeroes();
      if (available.length > 0) {
        forceSelect(randomHero(available), false); // do not reset timer
        simPicksRemaining--;
      }

      if (simPicksRemaining === 0) {
        simPickPhase = false;
        simPicksRemaining = 0;
        step += 2; // skip both picks already done
        updateTurn();
        startTimer(true); // reset timer for next phase
      } else {
        startTimer(false); // continue countdown
      }

    } else {
      // Single pick
      const available = getAvailableHeroes();
      if (available.length > 0) {
        forceSelect(randomHero(available));
      }
    }
  } else {
    // Ban phase
    addSkippedBan(current.side);
    step++;
    updateTurn();
    startTimer(true);
  }
}

function isSimultaneousPick(stepIndex) {
  const cur = draftOrder[stepIndex];
  const next = draftOrder[stepIndex + 1];

  return (
    cur &&
    next &&
    cur.type === "pick" &&
    next.type === "pick" &&
    cur.side === next.side
  );
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
    step++;
    updateTurn();
    if (restartTimer) startTimer(true);
  } else {
    picks.push({ hero: hero.name, side: current.side, lane: playedLane });
    addIcon(current.side, hero.icon, false);

    if (!simPickPhase) step++;
    updateTurn();
    if (restartTimer && !simPickPhase) startTimer(true);
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
  div.className = isBan ? "banIcon" : "pickIcon";

  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  const id =
    side === "Blue"
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

/* ================= LANE COVERAGE ANALYTICS ================= */
function checkLaneCoverage(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assigned = new Set();

  for (let heroName of teamPicks) {
    const hero = heroes.find(h => h.name === heroName);
    if (!hero || !hero.lanes) continue;

    for (let lane of hero.lanes) {
      if (!assigned.has(lane)) {
        assigned.add(lane);
        break;
      }
    }
  }

  return assigned.size === lanes.length;
}

/* ================= METATIER SCORING ================= */
function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  let score = 0;

  const laneBestScore = {};
  const allLanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

  allLanes.forEach(lane => {
    let bestScoreForLane = 0;

    teamPicks.forEach(pick => {
      const hero = heroes.find(h => h.name === pick.hero);
      if (!hero || !hero.metaTier) return;

      if (!hero.lanes.includes(lane)) return;

      let heroScore = 0;
      switch (hero.metaTier) {
        case "S": heroScore = 10; break;
        case "A": heroScore = 8; break;
        case "B": heroScore = 6; break;
        case "Situational": heroScore = 4; break;
        case "F": heroScore = 2; break;
      }

      if (heroScore > bestScoreForLane) {
        bestScoreForLane = heroScore;
      }
    });

    if (bestScoreForLane > 0) laneBestScore[lane] = bestScoreForLane;
  });

  for (let l in laneBestScore) score += laneBestScore[l];

  return { score, laneBestScore };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const bluePicks = picks.filter(p => p.side === "Blue");
  const redPicks = picks.filter(p => p.side === "Red");

  const blueHeroes = bluePicks.map(p => p.hero);
  const redHeroes = redPicks.map(p => p.hero);

  let blueScore = 0;
  let redScore = 0;

  let missingBlueLanes = [];
  let missingRedLanes = [];

  // Lane coverage bonus
  if (checkLaneCoverage(blueHeroes)) blueScore += 10;
  else missingBlueLanes = getMissingLanes(bluePicks);

  if (checkLaneCoverage(redHeroes)) redScore += 10;
  else missingRedLanes = getMissingLanes(redPicks);

  // MetaTier scoring
  const blueResult = calculateMetaScore("Blue");
  const redResult = calculateMetaScore("Red");

  blueScore += blueResult.score;
  redScore += redResult.score;

  let output = `Blue Team Score: ${blueScore}`;
  if (missingBlueLanes.length > 0) {
    output += ` (Missing lanes: ${missingBlueLanes.join(", ")})`;
  }

  output += `\nRed Team Score: ${redScore}`;
  if (missingRedLanes.length > 0) {
    output += ` (Missing lanes: ${missingRedLanes.join(", ")})`;
  }

  document.getElementById("result").innerText = output;
}

/* Helper to get missing lanes */
function getMissingLanes(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assigned = new Set();

  for (let pick of teamPicks) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero || !hero.lanes) continue;

    for (let lane of hero.lanes) {
      if (!assigned.has(lane)) {
        assigned.add(lane);
        break;
      }
    }
  }

  return lanes.filter(l => !assigned.has(l));
}
