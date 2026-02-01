let step = 0;
let timer = 50;
let interval = null;
let sharedTimerActive = false;

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
  { type: "pick", side: "Red" }, // R1 + R2
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" }, // B2 + B3
  { type: "pick", side: "Red" },

  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },

  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" }, // B4 + B5
  { type: "pick", side: "Red" }
];

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer();
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
      autoResolve();
    }
  }, 1000);
}

/* ================= SIMULTANEOUS PICK ================= */

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

/* ================= AUTO RESOLVE ================= */

function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    forceSelect(randomHero(getAvailableHeroes()));
  } else {
    addSkippedBan(current.side);
    step++;
  }

  updateTurn();

  const stillSimul =
    sharedTimerActive &&
    isSimultaneousPick(step - 1);

  if (!stillSimul) {
    sharedTimerActive = false;
    startTimer(true);
  } else {
    startTimer(false);
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

  const playedLane = hero.lanes?.[0];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side, lane: playedLane });
    addIcon(current.side, hero.icon, false);
  }

  const simul = isSimultaneousPick(step);
  step++;

  if (simul && !sharedTimerActive) {
    sharedTimerActive = true;
    startTimer(false);
  } else if (!sharedTimerActive) {
    startTimer(true);
  }

  updateTurn();
  renderHeroPool();
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

    btn.innerHTML = `
      <img src="${hero.icon}">
      <div class="heroName">${hero.name}</div>
    `;

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
  return hero.lanes?.includes(selectedRole);
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
  div.innerHTML = `<img src="${icon}">`;

  const id =
    side === "Blue"
      ? isBan ? "blueBans" : "bluePicks"
      : isBan ? "redBans" : "redPicks";

  document.getElementById(id).appendChild(div);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  document.getElementById(side === "Blue" ? "blueBans" : "redBans")
    .appendChild(div);
}

/* ================= TURN ================= */

function updateTurn() {
  if (picks.length === 10 && bans.length === 10) {
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

/* ================= LANE ANALYTICS ================= */

const ALL_LANES = ["Exp", "Jungle", "Mid", "Roam", "Gold"];

function getMissingLanes(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const covered = new Set();

  teamPicks.forEach(p => {
    const hero = heroes.find(h => h.name === p.hero);
    hero?.lanes?.forEach(l => covered.add(l));
  });

  return ALL_LANES.filter(l => !covered.has(l));
}

/* ================= METATIER SCORING ================= */

function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const laneBest = {};
  let score = 0;

  teamPicks.forEach(p => {
    const hero = heroes.find(h => h.name === p.hero);
    if (!hero || !hero.metaTier) return;

    hero.lanes.forEach(lane => {
      const value =
        hero.metaTier === "S" ? 10 :
        hero.metaTier === "A" ? 8 :
        hero.metaTier === "B" ? 6 :
        hero.metaTier === "Situational" ? 4 : 2;

      laneBest[lane] = Math.max(laneBest[lane] || 0, value);
    });
  });

  Object.values(laneBest).forEach(v => score += v);
  return score;
}

/* ================= ANALYSIS ================= */

function analyzeDraft() {
  let blueScore = calculateMetaScore("Blue");
  let redScore = calculateMetaScore("Red");

  const blueMissing = getMissingLanes("Blue");
  const redMissing = getMissingLanes("Red");

  if (blueMissing.length === 0) blueScore += 10;
  if (redMissing.length === 0) redScore += 10;

  document.getElementById("result").innerText =
`Blue Team Score: ${blueScore}
Missing lanes: ${blueMissing.length ? blueMissing.join(", ") : "None"}

Red Team Score: ${redScore}
Missing lanes: ${redMissing.length ? redMissing.join(", ") : "None"}`;
}
