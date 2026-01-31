/* ======================
   GLOBAL STATE
====================== */
let step = 0;
let timer = 50;
let interval = null;
let selectedRole = "All";

const picks = [];
const bans = [];

/* ======================
   DRAFT ORDER (MPL)
====================== */
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

/* ======================
   INIT
====================== */
window.onload = () => {
  renderHeroPool();
  updateTurn();
  startTimer();
};

/* ======================
   ROLE FILTER (UX POLISH)
====================== */
function setRoleFilter(role) {
  selectedRole = role;

  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.role === role);
  });

  renderHeroPool();
}

/* ======================
   HERO POOL
====================== */
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
    // ✅ ROLE FILTER (DUAL ROLE SUPPORT)
    if (
      selectedRole !== "All" &&
      !hero.roles.includes(selectedRole)
    ) return;

    const btn = document.createElement("button");
    btn.className = "heroBtn";

    if (
      picks.some(p => p.hero === hero.name) ||
      bans.some(b => b.hero === hero.name)
    ) {
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

/* ======================
   TIMER
====================== */
function startTimer() {
  clearInterval(interval);
  timer = 50;
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

/* ======================
   AUTO RESOLVE
====================== */
function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    const available = heroes.filter(h =>
      !picks.some(p => p.hero === h.name) &&
      !bans.some(b => b.hero === h.name)
    );

    if (available.length) {
      forceSelect(available[Math.floor(Math.random() * available.length)]);
    }
  }

  // ❗ Ban timeout = skipped
  step++;
  updateTurn();
  startTimer();
}

/* ======================
   HERO SELECTION
====================== */
function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;

  clearInterval(interval);
  forceSelect(hero);
  btn.classList.add("locked");
}

/* ======================
   APPLY PICK / BAN
====================== */
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

/* ======================
   ICON PLACEMENT
====================== */
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

/* ======================
   TURN INDICATOR
====================== */
function updateTurn() {
  if (step >= draftOrder.length) {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    clearInterval(interval);
    return;
  }

  const c = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${c.side} Team — ${c.type.toUpperCase()}`;
}

/* ======================
   ANALYSIS PLACEHOLDER
====================== */
function analyzeDraft() {
  document.getElementById("result").innerText =
    "Draft analysis coming in Phase 4 😉";
}
