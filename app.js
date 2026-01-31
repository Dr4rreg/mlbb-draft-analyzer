let step = 0;
let timer = 50;
let interval = null;
let selectedRole = "All";

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

const picks = [];
const bans = [];

window.onload = () => {
  renderRoleFilters();
  renderHeroPool();
  updateTurn();
  startTimer();
};

function renderRoleFilters() {
  const container = document.getElementById("roleFilters");
  container.innerHTML = "";

  const roles = ["All", "Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"];
  roles.forEach(role => {
    const btn = document.createElement("button");
    btn.className = "role-btn";
    if (role === selectedRole) btn.classList.add("active");
    btn.innerText = role;
    btn.onclick = () => {
      selectedRole = role;
      document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderHeroPool();
    };
    container.appendChild(btn);
  });
}

function renderHeroPool() {
  const grid = document.getElementById("heroGrid");
  grid.innerHTML = "";

  heroes.forEach(hero => {
    // FILTER BY ROLE (dual-role safe)
    if (
      selectedRole !== "All" &&
      !hero.roles.map(r => r.toLowerCase()).includes(selectedRole.toLowerCase())
    ) return;

    const btn = document.createElement("button");
    btn.className = "heroBtn";
    if (picks.some(p => p.hero === hero.name) || bans.some(b => b.hero === hero.name)) {
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

function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    const available = heroes.filter(
      h => !picks.some(p => p.hero === h.name) && !bans.some(b => b.hero === h.name)
    );
    if (available.length) {
      // Check if multiple picks in this step
      const simultaneousPick = draftOrder.filter((d, idx) => idx >= step && d.type === "pick" && d.side === current.side);
      if (simultaneousPick.length > 1) {
        simultaneousPick.forEach(() => {
          forceSelect(available.splice(Math.floor(Math.random() * available.length),1)[0]);
        });
        return;
      } else {
        forceSelect(available[Math.floor(Math.random() * available.length)]);
        return;
      }
    }
  }

  // For bans, just skip if not selected
  step++;
  updateTurn();
  startTimer();
}

function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  clearInterval(interval);
  forceSelect(hero);
  btn.classList.add("locked");
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

  document.querySelectorAll(".heroBtn").forEach(b => {
    if (b.innerText === hero.name) b.classList.add("locked");
  });

  step++;
  updateTurn();
  startTimer();
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

function analyzeDraft() {
  document.getElementById("result").innerText = "Draft analysis coming in Phase 4 😉";
}
