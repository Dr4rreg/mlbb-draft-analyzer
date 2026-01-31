const heroes = [
  { name: "Miya", roles: ["Marksman", "Tank"], lanes: ["Gold"], icon: "icons/Miya.png" },
  { name: "Balmond", roles: ["Fighter", "Mage"], lanes: ["Jungle"], icon: "icons/Balmond.png" },
  /* Add all other heroes here as previously provided */
];

let step = 0;
let timer = 50;
let interval = null;

let selectedRole = "All";
const picks = [];
const bans = [];

const draftOrder = [
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" }, 
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" }, 
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" }, 
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" }, 
  { type: "pick", side: "Red" }, { type: "pick", side: "Blue" }, 
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" }, 
  { type: "ban", side: "Red" }, { type: "ban", side: "Blue" }, 
  { type: "ban", side: "Red" }, { type: "ban", side: "Blue" }, 
  { type: "pick", side: "Red" }, { type: "pick", side: "Blue" }, 
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" }
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

function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  return hero.roles && hero.roles.includes(selectedRole);
}

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(interval);
  timer = 50;
  document.getElementById("timer").innerText = timer;

  interval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;
    if (timer <= 0) { clearInterval(interval); autoResolve(); }
  }, 1000);
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

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  step++;
  updateTurn();
  startTimer();
  renderHeroPool();
}

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

  const id = side === "Blue" ? isBan ? "blueBans" : "bluePicks" : isBan ? "redBans" : "redPicks";
  document.getElementById(id).appendChild(div);
}

function addSkippedBan(side) {
  const div = document.createElement("div");
  div.className = "banIcon skipped";
  const id = side === "Blue" ? "blueBans" : "redBans";
  document.getElementById(id).appendChild(div);
}

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

/* ================== LANE COVERAGE ================== */
function checkLaneCoverage(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assigned = new Set();

  for (let heroName of teamPicks) {
    const hero = heroes.find(h => h.name === heroName);
    if (!hero || !hero.lanes) continue;
    for (let lane of hero.lanes) {
      if (!assigned.has(lane)) { assigned.add(lane); break; }
    }
  }

  const missing = lanes.filter(l => !assigned.has(l));
  return { fullCoverage: missing.length === 0, missingLanes: missing };
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = 0, redScore = 0;

  const blueCoverage = checkLaneCoverage(blueHeroes);
  const redCoverage = checkLaneCoverage(redHeroes);

  if (blueCoverage.fullCoverage) blueScore += 10;
  if (redCoverage.fullCoverage) redScore += 10;

  let resultText = `Blue Team Score: ${blueScore}`;
  if (!blueCoverage.fullCoverage) {
    resultText += ` (Missing: <span class="missingLane">${blueCoverage.missingLanes.join(", ")}</span>)`;
  }

  resultText += `<br>Red Team Score: ${redScore}`;
  if (!redCoverage.fullCoverage) {
    resultText += ` (Missing: <span class="missingLane">${redCoverage.missingLanes.join(", ")}</span>)`;
  }

  document.getElementById("result").innerHTML = resultText;
}
