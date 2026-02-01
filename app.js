let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

/* ================= MPL ORDER PHASES ================= */
const draftOrder = [
  { type: "ban", side: "Blue" },      // B1 Ban
  { type: "ban", side: "Red" },       // R1 Ban
  { type: "ban", side: "Blue" },      // B2 Ban
  { type: "ban", side: "Red" },       // R2 Ban
  { type: "ban", side: "Blue" },      // B3 Ban
  { type: "ban", side: "Red" },       // R3 Ban
  { type: "pick", side: "Blue" },     // B1 Pick
  { type: "pick", side: "Red" },      // R1+R2 Pick Phase Start
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },     // B2+B3 Pick Phase Start
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },      // R3 Pick
  { type: "ban", side: "Red" },       // R4 Ban
  { type: "ban", side: "Blue" },      // B4 Ban
  { type: "ban", side: "Red" },       // R5 Ban
  { type: "ban", side: "Blue" },      // B5 Ban
  { type: "pick", side: "Red" },      // R4 Pick
  { type: "pick", side: "Blue" },     // B4+B5 Pick
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" }       // R5 Pick
];

/* ================= PHASE LOGIC ================= */
const phases = [
  { start: 0, end: 5 },   // Ban Phase 1
  { start: 6, end: 6 },   // B1 Pick
  { start: 7, end: 8 },   // R1+R2 Pick
  { start: 9, end: 10 },  // B2+B3 Pick
  { start: 11, end: 11 }, // R3 Pick
  { start: 12, end: 15 }, // Ban Phase 2
  { start: 16, end: 16 }, // R4 Pick
  { start: 17, end: 18 }, // B4+B5 Pick
  { start: 19, end: 19 }  // R5 Pick
];

/* ================= INITIALIZATION ================= */
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

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  if (hero.role && hero.role === selectedRole) return true;
  if (hero.roles && hero.roles.includes(selectedRole)) return true;
  return false;
}

function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

/* ================= TIMER ================= */
function startTimer(reset = false) {
  clearInterval(interval);

  // Reset timer if this step is start of a phase
  if (reset || isPhaseStart(step)) timer = 50;

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

function isPhaseStart(index) {
  return phases.some(p => p.start === index);
}

/* ================= AUTO RESOLVE ================= */
function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  const available = getAvailableHeroes();

  if (current.type === "pick") {
    if (available.length > 0) forceSelect(randomHero(available));
  } else {
    // Ban automatically
    if (available.length > 0) addSkippedBan(current.side);
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

function forceSelect(hero) {
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

  // Timer: reset if next step is phase start
  startTimer(isPhaseStart(step));
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

/* ================= ICON ADDITION ================= */
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
  setTimeout(() => div.style.opacity = 1, 10);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  div.style.opacity = 0;
  div.style.transition = "opacity 0.5s";

  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);

  setTimeout(() => div.style.opacity = 1, 10);
}

/* ================= TURN ================= */
function updateTurn() {
  const bluePicks = picks.filter(p => p.side === "Blue").length;
  const redPicks = picks.filter(p => p.side === "Red").length;
  const blueBans = bans.filter(b => b.side === "Blue").length;
  const redBans = bans.filter(b => b.side === "Red").length;

  if (bluePicks === 5 && redPicks === 5 && blueBans === 5 && redBans === 5) {
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
  const sortedPicks = teamPicks
    .map(p => ({ ...p, tierValue: metaTierValue(p.hero) }))
    .sort((a, b) => b.tierValue - a.tierValue);

  for (let pick of sortedPicks) {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) continue;

    // Assign hero to first available lane
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

/* ================= DRAFT ANALYSIS ================= */
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue");
  const redHeroes = picks.filter(p => p.side === "Red");

  const results = ["Blue Team", "Red Team"].map((teamName, i) => {
    const side = i === 0 ? "Blue" : "Red";
    const teamPicks = side === "Blue" ? blueHeroes : redHeroes;
    const assignment = assignHeroesToLanes(teamPicks);

    const laneScore = Object.keys(assignment).length === 5 ? 10 : 0;

    let metaScore = 0;
    let earlyMidTotal = 0;
    let lateTotal = 0;

    Object.values(assignment).forEach(hero => {
      metaScore += metaTierPoints(hero.metaTier);
      earlyMidTotal += hero.earlyMid || 0;
      lateTotal += hero.late || 0;
    });

    const count = Object.values(assignment).length || 1;
    const earlyMid = Math.min(5, earlyMidTotal / count);
    const late = Math.min(5, lateTotal / count);

    const total = laneScore + metaScore + earlyMid + late;

    return {
      team: teamName,
      laneScore,
      metaScore,
      earlyMid: earlyMid.toFixed(1),
      late: late.toFixed(1),
      total: total.toFixed(1)
    };
  });

  document.getElementById("result").innerText =
    `${results[0].team}:\n` +
    `Lane Coverage: ${results[0].laneScore}\nMetaTier: ${results[0].metaScore}\nEarly/Mid: ${results[0].earlyMid}\nLate: ${results[0].late}\nTotal: ${results[0].total}\n\n` +
    `${results[1].team}:\n` +
    `Lane Coverage: ${results[1].laneScore}\nMetaTier: ${results[1].metaScore}\nEarly/Mid: ${results[1].earlyMid}\nLate: ${results[1].late}\nTotal: ${results[1].total}`;
}

function metaTierPoints(tier) {
  switch (tier) {
    case "S": return 10;
    case "A": return 8;
    case "B": return 6;
    case "Situational": return 4;
    case "F": return 2;
    default: return 0;
  }
}
