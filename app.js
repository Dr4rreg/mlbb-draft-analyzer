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

window.onload = () => {
  renderHeroPool();
  updateTurn();
  startStepTimer(); // start timer for first step
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
    name.style.color = "white"; // HERO NAME COLOR

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

function startStepTimer() {
  clearInterval(interval);
  timer = 50; // reset timer at start of step
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
    const needed = isSimultaneousPick(step) ? 2 : 1;

    for (let i = 0; i < needed; i++) {
      const available = getAvailableHeroes();
      if (!available.length) break;
      forceSelect(randomHero(available), false); // false = don't restart timer inside
    }
  } else {
    addSkippedBan(current.side);
    step++;
  }

  nextStep();
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

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  step++;
  if (restartTimer) nextStep(); // only restart timer once per step
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

function nextStep() {
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

  startStepTimer(); // start timer for this step
}

/* ================= LANE COVERAGE ANALYTICS ================= */

function checkLaneCoverage(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const assigned = new Set();
  const missing = new Set(lanes);

  for (let heroName of teamPicks) {
    const hero = heroes.find(h => h.name === heroName);
    if (!hero || !hero.lanes) continue;

    for (let lane of hero.lanes) {
      if (!assigned.has(lane)) {
        assigned.add(lane);
        missing.delete(lane);
        break;
      }
    }
  }

  return { full: assigned.size === lanes.length, missing: Array.from(missing) };
}

/* ================= ANALYSIS ================= */

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = 0;
  let redScore = 0;

  const blueCoverage = checkLaneCoverage(blueHeroes);
  const redCoverage = checkLaneCoverage(redHeroes);

  if (blueCoverage.full) blueScore += 10;
  if (redCoverage.full) redScore += 10;

  let resultText = `Blue Team Score: ${blueScore}`;
  if (!blueCoverage.full) resultText += ` (Missing lanes: ${blueCoverage.missing.join(", ")})`;

  resultText += `\nRed Team Score: ${redScore}`;
  if (!redCoverage.full) resultText += ` (Missing lanes: ${redCoverage.missing.join(", ")})`;

  document.getElementById("result").innerText = resultText;
}
