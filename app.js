/***********************
 * GLOBAL STATE
 ***********************/
let step = 0;
let timer = 50;
let interval = null;
let sharedTimerActive = false;

let selectedRole = "All";

const picks = [];
const bans = [];

/***********************
 * DRAFT ORDER (MPL)
 ***********************/
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

/***********************
 * INIT
 ***********************/
window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer(true);
};

/***********************
 * HERO POOL
 ***********************/
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

/***********************
 * ROLE FILTER
 ***********************/
function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  if (hero.role === selectedRole) return true;
  if (hero.roles && hero.roles.includes(selectedRole)) return true;
  return false;
}

/***********************
 * TIMER
 ***********************/
function startTimer(reset = true) {
  clearInterval(interval);

  if (reset) {
    timer = 50;
  }

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

/***********************
 * SIMULTANEOUS PICK LOGIC
 ***********************/
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

function leavingSimultaneousPick(prevStep) {
  return (
    !isSimultaneousPick(prevStep) &&
    !isSimultaneousPick(prevStep - 1)
  );
}

/***********************
 * AUTO RESOLVE
 ***********************/
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
  startTimer(true);
}

/***********************
 * SELECTION
 ***********************/
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

  const prevStep = step;
  step++;

  const enteringSimul = isSimultaneousPick(prevStep);
  const exitingSimul = leavingSimultaneousPick(prevStep);

  if (enteringSimul && !sharedTimerActive) {
    sharedTimerActive = true;
    startTimer(false);
  } else if (sharedTimerActive && !exitingSimul) {
    startTimer(false);
  } else {
    sharedTimerActive = false;
    startTimer(true);
  }

  updateTurn();
  renderHeroPool();
}

/***********************
 * HELPERS
 ***********************/
function getAvailableHeroes() {
  return heroes.filter(h => !isHeroLocked(h.name));
}

function isHeroLocked(name) {
  return (
    picks.some(p => p.hero === name) ||
    bans.some(b => b.hero === name)
  );
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

/***********************
 * TURN INDICATOR
 ***********************/
function updateTurn() {
  if (
    picks.filter(p => p.side === "Blue").length === 5 &&
    picks.filter(p => p.side === "Red").length === 5
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

/***********************
 * LANE COVERAGE + MISSING LANES
 ***********************/
function getMissingLanes(teamHeroes) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const covered = new Set();

  teamHeroes.forEach(heroName => {
    const hero = heroes.find(h => h.name === heroName);
    hero?.lanes?.forEach(l => covered.add(l));
  });

  return lanes.filter(l => !covered.has(l));
}

/***********************
 * META SCORING (FLEX-SAFE)
 ***********************/
function calculateMetaScore(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const laneBest = {};

  teamPicks.forEach(pick => {
    const hero = heroes.find(h => h.name === pick.hero);
    if (!hero) return;

    hero.lanes.forEach(lane => {
      const score =
        hero.metaTier === "S" ? 10 :
        hero.metaTier === "A" ? 8 :
        hero.metaTier === "B" ? 6 :
        hero.metaTier === "Situational" ? 4 : 2;

      if (!laneBest[lane] || laneBest[lane] < score) {
        laneBest[lane] = score;
      }
    });
  });

  return Object.values(laneBest).reduce((a, b) => a + b, 0);
}

/***********************
 * ANALYSIS
 ***********************/
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueMissing = getMissingLanes(blueHeroes);
  const redMissing = getMissingLanes(redHeroes);

  const blueScore = calculateMetaScore("Blue");
  const redScore = calculateMetaScore("Red");

  document.getElementById("result").innerText =
    `Blue Score: ${blueScore}\nMissing: ${blueMissing.join(", ") || "None"}\n\n` +
    `Red Score: ${redScore}\nMissing: ${redMissing.join(", ") || "None"}`;
}
