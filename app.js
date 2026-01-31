let step = 0;
let timer = 50;
let interval = null;

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
  { type: "pick", side: "Red" }, // Simultaneous picks R1 + R2
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
  renderHeroPool();
  updateTurn();
  startTimer();
};

// =========================
// RENDER HERO POOL
// =========================
function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
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

    btn.onclick = () => selectHero(hero, btn);

    grid.appendChild(btn);
  });
}

// =========================
// START TIMER
// =========================
function startTimer() {
  clearInterval(interval); // ensure no overlapping timers
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
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    // Determine how many simultaneous picks for this side
    let count = 1;
    if (
      draftOrder[step + 1] &&
      draftOrder[step + 1].type === "pick" &&
      draftOrder[step + 1].side === current.side
    ) {
      count = 2; // auto-pick 2 heroes simultaneously
    }

    for (let i = 0; i < count; i++) {
      const pickStep = draftOrder[step];
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
    // Skip ban if no hero selected
    step++;
  }

  updateTurn();

  // Restart timer if draft not complete
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
}

// =========================
// FORCE SELECT (ADD HERO TO DRAFT)
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

  // LOCK hero in hero pool
  const btn = document.querySelector(`.heroBtn[data-hero='${hero.name}']`);
  if (btn) {
    btn.classList.add("locked");
    btn.disabled = true;
  }

  if (incrementStep) step++;
  updateTurn();
}

// =========================
// ADD ICON TO DRAFT UI
// =========================
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
// ANALYZE DRAFT BUTTON
// =========================
function analyzeDraft() {
  document.getElementById("result").innerText = "Draft analysis coming in Phase 4 😉";
}
