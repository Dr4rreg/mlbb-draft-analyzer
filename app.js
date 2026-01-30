let step = 0;
let timerValue = 50;
let timerInterval = null;

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

    const span = document.createElement("span");
    span.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(span);
    btn.onclick = () => selectHero(hero.name, btn);

    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer();
};

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

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
  resetTimer();
  updateTurnIndicator();

  if (step === draftOrder.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    clearInterval(timerInterval);
  }
}

function addToList(side, heroName, isBan) {
  let containerId = "";
  if (side === "Blue") {
    containerId = isBan ? "blueBans" : "bluePicks";
    appendHero(containerId, heroName, false);
  } else {
    containerId = isBan ? "redBans" : "redPicks";
    appendHero(containerId, heroName, true);
  }
}

function appendHero(containerId, heroName, mirror = false) {
  const container = document.getElementById(containerId);
  const hero = heroes.find(h => h.name === heroName);
  if (!hero) return;

  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;

  if (mirror) {
    container.insertBefore(img, container.firstChild);
  } else {
    container.appendChild(img);
  }
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
      score += Number(hero.early) + Number(hero.late) + Number(hero.cc);
    }
  });
  return score;
}

/* TIMER LOGIC */
function startTimer() {
  timerValue = 50;
  document.getElementById("timer").innerText = timerValue;

  timerInterval = setInterval(() => {
    timerValue--;
    document.getElementById("timer").innerText = timerValue;

    if (timerValue <= 0) {
      autoPickBan();
      resetTimer();
    }
  }, 1000);
}

function resetTimer() {
  timerValue = 50;
  document.getElementById("timer").innerText = timerValue;
}

function autoPickBan() {
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];
  const availableHeroes = heroes.filter(h => !document.querySelector(`.heroBtn[alt="${h.name}"]`).classList.contains("locked"));
  if (!availableHeroes.length) return;

  const hero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
  const btn = Array.from(document.querySelectorAll(".heroBtn")).find(b => b.alt === hero.name);

  if (btn) selectHero(hero.name, btn);
}
