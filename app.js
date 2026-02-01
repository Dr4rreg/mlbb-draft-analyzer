/***********************
 * GLOBAL STATE
 ***********************/
let step = 0;
let timer = 50;
let interval = null;
let currentBlock = null;

let selectedRole = "All";

const picks = [];
const bans = [];

/***********************
 * DRAFT ORDER
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
 * TIMER
 ***********************/
function startTimer(reset) {
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

/***********************
 * PICK BLOCK LOGIC (KEY FIX)
 ***********************/
function getPickBlock(stepIndex) {
  const cur = draftOrder[stepIndex];
  const next = draftOrder[stepIndex + 1];

  if (
    cur?.type === "pick" &&
    next?.type === "pick" &&
    cur.side === next.side
  ) {
    return `${cur.side}-DOUBLE`;
  }

  if (cur?.type === "pick") {
    return `${cur.side}-SINGLE`;
  }

  return "OTHER";
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

  const prevBlock = currentBlock;
  step++;
  currentBlock = getPickBlock(step);

  const resetTimer = prevBlock !== currentBlock;
  startTimer(resetTimer);

  updateTurn();
  renderHeroPool();
}

/***********************
 * AUTO RESOLVE
 ***********************/
function autoResolve() {
  const cur = draftOrder[step];
  if (!cur) return;

  if (cur.type === "pick") {
    forceSelect(randomHero(getAvailableHeroes()));
  } else {
    addSkippedBan(cur.side);
    step++;
    currentBlock = getPickBlock(step);
    startTimer(true);
    updateTurn();
  }
}

/***********************
 * HERO POOL
 ***********************/
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    if (isHeroLocked(hero.name)) btn.classList.add("locked");

    const img = document.createElement("img");
    img.src = hero.icon;

    const name = document.createElement("div");
    name.className = "heroName";
    name.innerText = hero.name;

    btn.append(img, name);
    btn.onclick = () => selectHero(hero, btn);
    grid.appendChild(btn);
  });
}

/***********************
 * HELPERS
 ***********************/
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
  document.getElementById(side === "Blue" ? "blueBans" : "redBans").appendChild(div);
}

/***********************
 * TURN
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
