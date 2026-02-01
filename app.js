let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";

const picks = [];
const bans = [];

/* ================= DRAFT ORDER ================= */

const draftOrder = [
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  { type: "pick", side: "Blue", phase: "B1" },

  { type: "pick", side: "Red", phase: "R12" },
  { type: "pick", side: "Red", phase: "R12" },

  { type: "pick", side: "Blue", phase: "B23" },
  { type: "pick", side: "Blue", phase: "B23" },

  { type: "pick", side: "Red", phase: "R3" },
  { type: "pick", side: "Red", phase: "R4" },

  { type: "pick", side: "Blue", phase: "B45" },
  { type: "pick", side: "Blue", phase: "B45" },

  { type: "pick", side: "Red", phase: "R5" }
];

let currentPhase = null;

/* ================= INIT ================= */

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer(true);
};

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
      autoResolvePhase();
    }
  }, 1000);
}

/* ================= AUTO RESOLVE ================= */

function autoResolvePhase() {
  const phase = draftOrder[step]?.phase;
  if (!phase) return;

  while (draftOrder[step] && draftOrder[step].phase === phase) {
    const available = getAvailableHeroes();
    if (!available.length) break;
    forceSelect(randomHero(available), false);
  }
}

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
    btn.onclick = () => selectHero(hero);

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
  return hero.roles?.includes(selectedRole);
}

/* ================= SELECTION ================= */

function selectHero(hero) {
  if (isHeroLocked(hero.name)) return;
  forceSelect(hero, true);
}

function forceSelect(hero, allowTimerReset) {
  const current = draftOrder[step];
  if (!current) return;

  const playedLane = hero.lanes[0];

  if (current.type === "pick") {
    picks.push({
      hero: hero.name,
      side: current.side,
      lane: playedLane
    });
    addIcon(current.side, hero.icon, false);
  }

  const prevPhase = current.phase;
  step++;

  updateTurn();
  renderHeroPool();

  const nextPhase = draftOrder[step]?.phase;
  if (nextPhase && nextPhase !== prevPhase) {
    startTimer(true);
  }
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

/* ================= TURN ================= */

function updateTurn() {
  if (picks.length === 10) {
    clearInterval(interval);
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    return;
  }

  const c = draftOrder[step];
  if (c) {
    document.getElementById("turnIndicator").innerText =
      `${c.side} Team — PICK`;
  }
}

/* ================= LANE COVERAGE ================= */

function getMissingLanes(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const covered = new Set();

  teamPicks.forEach(heroName => {
    const hero = heroes.find(h => h.name === heroName);
    if (!hero) return;
    hero.lanes.forEach(l => covered.add(l));
  });

  return lanes.filter(l => !covered.has(l));
}

/* ================= METATIER SCORING ================= */

function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

  let score = 0;

  lanes.forEach(lane => {
    let best = 0;

    teamPicks.forEach(pick => {
      const hero = heroes.find(h => h.name === pick.hero);
      if (!hero || !hero.metaTier) return;
      if (!hero.lanes.includes(lane)) return;

      const tierScore =
        hero.metaTier === "S" ? 10 :
        hero.metaTier === "A" ? 8 :
        hero.metaTier === "B" ? 6 :
        hero.metaTier === "Situational" ? 4 : 2;

      if (tierScore > best) best = tierScore;
    });

    score += best;
  });

  return score;
}

/* ================= ANALYSIS ================= */

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = calculateMetaScore("Blue");
  let redScore = calculateMetaScore("Red");

  const blueMissing = getMissingLanes(blueHeroes);
  const redMissing = getMissingLanes(redHeroes);

  if (blueMissing.length === 0) blueScore += 10;
  if (redMissing.length === 0) redScore += 10;

  let result = `Blue Team Score: ${blueScore}`;
  if (blueMissing.length)
    result += `\nMissing lanes: ${blueMissing.join(", ")}`;

  result += `\n\nRed Team Score: ${redScore}`;
  if (redMissing.length)
    result += `\nMissing lanes: ${redMissing.join(", ")}`;

  document.getElementById("result").innerText = result;
}
