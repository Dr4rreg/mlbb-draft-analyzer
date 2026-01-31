let step = 0;
let timer = 50;
let interval = null;
let currentRoleFilter = "All"; // Default role filter

/* MPL DRAFT ORDER */
const draftOrder = [
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Red" }, // Simultaneous picks
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

const picks = [];
const bans = [];

window.onload = () => {
  setupRoleFilter();   // Initialize role filter buttons
  renderHeroPool();    // Render hero pool based on filter
  updateTurn();
  startTimer();
};

// =========================
// SETUP ROLE FILTER BUTTONS
// =========================
function setupRoleFilter() {
  const buttons = document.querySelectorAll(".roleBtn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Update current filter
      currentRoleFilter = btn.dataset.role;

      // Update active button styling
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Re-render hero pool with new filter
      renderHeroPool();
    });
  });
}

// =========================
// RENDER HERO POOL
// =========================
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes
    .filter(hero => currentRoleFilter === "All" || hero.role === currentRoleFilter)
    .forEach(hero => {
      const btn = document.createElement("button");
      btn.className = "heroBtn";
      btn.dataset.hero = hero.name;

      const img = document.createElement("img");
      img.src = hero.icon;
      btn.appendChild(img);

      const name = document.createElement("div");
      name.className = "heroName";
      name.innerText = hero.name;
      name.style.pointerEvents = "none";
      btn.appendChild(name);

      // Disable if already picked/banned
      if (picks.some(p => p.hero === hero.name) || bans.some(b => b.hero === hero.name)) {
        btn.classList.add("locked");
        btn.disabled = true;
      }

      btn.onclick = () => selectHero(hero, btn);
      grid.appendChild(btn);
    });
}

// =========================
// START TIMER
// =========================
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

// =========================
// AUTO-RESOLVE IF TIME RUNS OUT
// =========================
function autoResolve() {
  if (isDraftComplete()) return;

  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    // Handle simultaneous picks
    let simultaneousCount = 1;
    while (
      draftOrder[step + simultaneousCount] &&
      draftOrder[step + simultaneousCount].type === "pick" &&
      draftOrder[step + simultaneousCount].side === current.side
    ) {
      simultaneousCount++;
    }

    for (let i = 0; i < simultaneousCount; i++) {
      const available = heroes.filter(h =>
        !picks.some(p => p.hero === h.name) &&
        !bans.some(b => b.hero === h.name)
      );
      if (available.length) {
        forceSelect(available[Math.floor(Math.random() * available.length)], false);
      }
      step++;
    }

  } else if (current.type === "ban") {
    // Skip ban but keep empty slot
    addIcon(current.side, null, true);
    step++;
  }

  updateTurn();
  if (!isDraftComplete()) startTimer();
}

// =========================
// HERO SELECTION
// =========================
function selectHero(hero, btn) {
  if (btn.disabled) return;

  clearInterval(interval);
  forceSelect(hero);

  btn.classList.add("locked");
  btn.disabled = true;

  if (!isDraftComplete()) {
    updateTurn();
    startTimer();
  } else {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
  }
}

// =========================
// FORCE SELECT
// =========================
function forceSelect(hero, incrementStep = true) {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIcon(current.side, hero.icon, false);
  }

  // Lock hero in hero pool
  const btn = document.querySelector(`.heroBtn[data-hero='${hero.name}']`);
  if (btn) {
    btn.classList.add("locked");
    btn.disabled = true;
  }

  if (incrementStep) step++;
}

// =========================
// ADD ICON TO DRAFT UI
// =========================
function addIcon(side, icon, isBan) {
  let containerId = side === "Blue"
    ? isBan ? "blueBans" : "bluePicks"
    : isBan ? "redBans" : "redPicks";
  const container = document.getElementById(containerId);

  if (!icon && isBan) {
    // Add empty placeholder for skipped ban
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "banIcon skipped";
    container.appendChild(emptyDiv);
    return;
  }

  const div = document.createElement("div");
  div.className = isBan ? "banIcon" : "pickIcon";

  const img = document.createElement("img");
  img.src = icon;
  div.appendChild(img);

  container.appendChild(div);
}

// =========================
// UPDATE TURN INDICATOR
// =========================
function updateTurn() {
  if (isDraftComplete()) {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    clearInterval(interval);
    return;
  }

  const c = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${c.side} Team — ${c.type.toUpperCase()}`;
}

// =========================
// CHECK DRAFT COMPLETION
// =========================
function isDraftComplete() {
  const blueBans = bans.filter(b => b.side === "Blue").length;
  const redBans = bans.filter(b => b.side === "Red").length;
  const bluePicks = picks.filter(p => p.side === "Blue").length;
  const redPicks = picks.filter(p => p.side === "Red").length;

  return blueBans >= 5 && redBans >= 5 && bluePicks >= 5 && redPicks >= 5;
}

// =========================
// ANALYZE DRAFT
// =========================
function analyzeDraft() {
  document.getElementById("result").innerText = "Draft analysis coming in Phase 4 😉";
}
