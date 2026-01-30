let step = 0;
let timerValue = 50;
let timerInterval;

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
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    btn.appendChild(img);

    const name = document.createElement("span");
    name.innerText = hero.name;
    btn.appendChild(name);

    btn.onclick = () => selectHero(hero.name, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer();
};

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked") || step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: heroName, side: current.side });
    addToBanList(current.side, heroName);
  } else {
    picks.push({ hero: heroName, side: current.side });
    addToPickList(current.side, heroName);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  updateTurnIndicator();
  resetTimer();

  if (step >= draftOrder.length) {
    stopTimer();
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function addToBanList(side, heroName) {
  const container = side === "Blue" ? document.getElementById("blueBans") : document.getElementById("redBans");
  const img = document.createElement("img");
  const hero = heroes.find(h => h.name === heroName);
  img.src = hero.icon;
  img.alt = heroName;
  container.appendChild(img);
}

function addToPickList(side, heroName) {
  const container = side === "Blue" ? document.getElementById("bluePicks") : document.getElementById("redPicks");
  const img = document.createElement("img");
  const hero = heroes.find(h => h.name === heroName);
  img.src = hero.icon;
  img.alt = heroName;
  container.appendChild(img);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

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

// Timer Logic
function startTimer() {
  document.getElementById("timer").innerText = `${timerValue}s`;
  timerInterval = setInterval(() => {
    timerValue--;
    document.getElementById("timer").innerText = `${timerValue}s`;

    if (timerValue <= 0) {
      autoSelectHero();
      resetTimer();
    }
  }, 1000);
}

function resetTimer() {
  timerValue = 50;
}

function stopTimer() {
  clearInterval(timerInterval);
}

function autoSelectHero() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  const availableHeroes = heroes.filter(h => !picks.some(p => p.hero === h.name) && !bans.some(b => b.hero === h.name));
  if (availableHeroes.length === 0) return;
  const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];

  const heroButtons = document.querySelectorAll(".heroBtn");
  heroButtons.forEach(btn => {
    if (!btn.classList.contains("locked") && btn.querySelector("span").innerText === randomHero.name) {
      btn.click();
    }
  });
}
