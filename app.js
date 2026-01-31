let step = 0;
let timerInterval;
let timeLeft = 50;

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
    btn.appendChild(img);

    // Hero name inside icon
    const span = document.createElement("span");
    span.className = "heroName";
    span.innerText = hero.name;
    btn.appendChild(span);

    btn.onclick = () => selectHero(hero.name, btn);

    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer(); // Start first turn timer
};

// =========================
// SELECT HERO
// =========================
function selectHero(heroName, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  // Stop timer for this turn
  clearInterval(timerInterval);

  if (current.type === "ban") {
    bans.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, true);
  } else {
    picks.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, false);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  updateTurnIndicator();

  if (step === draftOrder.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("timer").innerText = "-";
  } else {
    // Start timer for next pick/ban
    timeLeft = 50;
    startTimer();
  }
}

// =========================
// ADD HERO TO BANS/PICKS AREA
// =========================
function addToList(side, heroName, isBan) {
  const containerId = side === "Blue" ? "blueContainer" : "redContainer";
  const container = document.getElementById(containerId);

  const img = document.createElement("img");
  const hero = heroes.find(h => h.name === heroName);
  img.src = hero.icon;
  img.alt = heroName;
  img.className = "heroIcon";
  if (isBan) img.classList.add("banIcon");
  else img.classList.add("pickIcon");

  // Insert picks below bans
  if (isBan) {
    container.insertBefore(img, container.firstChild);
  } else {
    container.appendChild(img);
  }
}

// =========================
// TURN INDICATOR
// =========================
function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

// =========================
// TIMER LOGIC
// =========================
function startTimer() {
  document.getElementById("timer").innerText = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      // Auto pick a random hero if pick
      const current = draftOrder[step];
      if (current) {
        const availableHeroes = heroes.filter(h => {
          const locked = document.querySelector(`.heroBtn[disabled][alt="${h.name}"]`);
          return !locked;
        });

        if (availableHeroes.length > 0) {
          const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
          const btn = Array.from(document.getElementsByClassName("heroBtn"))
                           .find(b => b.alt === randomHero.name);
          selectHero(randomHero.name, btn);
        } else {
          // If no heroes available, skip
          step++;
          updateTurnIndicator();
          startTimer();
        }
      }
    }
  }, 1000);
}

// =========================
// DRAFT ANALYSIS
// =========================
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
