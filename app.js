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

/* ================= INIT ================= */
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

/* ================= FILTER ================= */
function setRoleFilter(role) {
  selectedRole = role;
  renderHeroPool();
}

function matchesRoleFilter(hero) {
  if (selectedRole === "All") return true;
  return hero.roles?.includes(selectedRole);
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
  startTimer(true);
  renderHeroPool();
}

/* ================= HELPERS ================= */
function isHeroLocked(name) {
  return picks.some(p => p.hero === name) || bans.some(b => b.hero === name);
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
      `${c.side} — ${c.type.toUpperCase()}`;
  }
}

/* ================= META TIER ================= */
function metaTierValue(tier) {
  return { S: 5, A: 4, B: 3, Situational: 2, F: 1 }[tier] || 0;
}

/* ================= GLOBAL LANE ASSIGNMENT ================= */
function assignHeroesToLanes(teamPicks) {
  const lanes = ["Exp", "Jungle", "Mid", "Roam", "Gold"];
  const remaining = new Set(lanes);
  const assignment = {};

  const sorted = teamPicks
    .map(p => ({
      hero: heroes.find(h => h.name === p.hero),
      tier: metaTierValue(heroes.find(h => h.name === p.hero)?.metaTier)
    }))
    .sort((a, b) => b.tier - a.tier);

  for (let { hero } of sorted) {
    if (!hero) continue;
    const lane = hero.lanes.find(l => remaining.has(l));
    if (lane) {
      assignment[lane] = hero;
      remaining.delete(lane);
    }
  }

  return assignment;
}

/* ================= SCORING ================= */
function scoreTeam(side) {
  const teamPicks = picks.filter(p => p.side === side);
  const assignment = assignHeroesToLanes(teamPicks);

  const laneCoverage = Object.keys(assignment).length === 5 ? 10 : 0;

  let metaScore = 0;
  let earlyMidSum = 0;
  let lateSum = 0;

  Object.values(assignment).forEach(hero => {
    metaScore += metaTierValue(hero.metaTier) * 2;
    earlyMidSum += hero.earlyMid || 0;
    lateSum += hero.late || 0;
  });

  const count = Object.keys(assignment).length || 1;

  const earlyMid = Math.min(5, earlyMidSum / count);
  const late = Math.min(5, lateSum / count);

  return {
    laneCoverage,
    metaScore,
    earlyMid,
    late,
    total: laneCoverage + metaScore + earlyMid + late
  };
}

/* ================= ANALYSIS ================= */
function analyzeDraft() {
  const blue = scoreTeam("Blue");
  const red = scoreTeam("Red");

  document.getElementById("result").innerText = `
BLUE TEAM
Lane Coverage: ${blue.laneCoverage}
Meta Tier: ${blue.metaScore}
Early/Mid: ${blue.earlyMid.toFixed(1)}
Late: ${blue.late.toFixed(1)}
TOTAL: ${blue.total.toFixed(1)}

RED TEAM
Lane Coverage: ${red.laneCoverage}
Meta Tier: ${red.metaScore}
Early/Mid: ${red.earlyMid.toFixed(1)}
Late: ${red.late.toFixed(1)}
TOTAL: ${red.total.toFixed(1)}
`;
}
