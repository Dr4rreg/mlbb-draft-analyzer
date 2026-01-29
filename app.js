let step = 0;
let timerInterval;
let timeLeft = 50; // 50 seconds per pick/ban

// MPL-style pick/ban order
const draftOrder = [
  // Ban phase 1
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },

  // Pick phase 1
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" },

  // Ban phase 2
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" },

  // Pick phase 2
  { type: "pick", side: "Red" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" },
  { type: "pick", side: "Red" }
];

const picks = [];
const bans = [];

window.onload = () => {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    // Hero icon
    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    img.width = 60;
    img.height = 60;
    img.style.objectFit = "cover";

    // Hero name in hero pool
    const label = document.createElement("div");
    label.className = "heroName";
    label.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(label);

    btn.onclick = () => selectHero(hero, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer(); // start countdown
};

// ------------------ TIMER ------------------
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 50;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerDiv = document.getElementById("timer");
  timerDiv.innerText = `Time left: ${timeLeft}s`;
}

// Handle timeout for bans/picks
function handleTimeout() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];

  if (current.type === "ban") {
    // Skip ban if no hero selected
    step++;
  } else {
    // Pick a random available hero if pick time expires
    const available = heroes.filter(h => {
      return !document.querySelector(`.heroBtn.locked img[alt='${h.name}']`);
    });
    if (available.length > 0) {
      const randomHero = available[Math.floor(Math.random() * available.length)];
      const btn = [...document.querySelectorAll(".heroBtn")].find(
        b => b.querySelector("img").alt === randomHero.name
      );
      selectHero(randomHero, btn);
      return;
    }
    step++;
  }

  if (step < draftOrder.length) startTimer();
  else document.getElementById("timer").innerText = "Draft Complete!";
}

// ------------------ HERO SELECTION ------------------
function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIconToList(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIconToList(current.side, hero.icon, false);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  updateTurnIndicator();

  if (step === draftOrder.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("timer").innerText = "";
    clearInterval(timerInterval);
  } else {
    startTimer(); // restart countdown for next step
  }
}

// ------------------ ADD HERO ICONS TO LIST ------------------
function addIconToList(side, iconSrc, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const li = document.createElement("li");
  const img = document.createElement("img");
  img.src = iconSrc;
  img.width = 40;
  img.height = 40;
  img.style.objectFit = "cover";
  li.appendChild(img);
  li.title = isBan ? "Banned" : "Picked";
  li.className = isBan ? "banIcon" : "pickIcon";
  document.getElementById(listId).appendChild(li);
}

// ------------------ TURN INDICATOR ------------------
function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

// ------------------ DRAFT ANALYSIS ------------------
function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

  let result = `Blue Score: ${blueScore} | Red Score: ${redScore}<br>`;

  if (blueScore > redScore) result += "Blue has the stronger draft";
  else if (redScore > blueScore) result += "Red has the stronger draft";
  else result += "Drafts are evenly matched";

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    const hero = heroes.find(h => h.name === name);
    if (hero) {
      const early = Number(hero.early) || 0;
      const late = Number(hero.late) || 0;
      const cc = Number(hero.cc) || 0;
      score += early + late + cc;
    }
  });
  return score;
}
