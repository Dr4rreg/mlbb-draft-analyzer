let step = 0;
let timerValue = 50;
let timerInterval = null;

// MPL-style pick/ban order
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

    const span = document.createElement("div");
    span.className = "heroName";
    span.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(span);

    btn.onclick = () => selectHero(hero.name, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
  startTimer();
};

function startTimer() {
  timerValue = 50;
  document.getElementById("timer").innerText = `${timerValue}s`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerValue--;
    document.getElementById("timer").innerText = `${timerValue}s`;
    if (timerValue <= 0) {
      autoSelectHero();
      nextStep();
    }
  }, 1000);
}

function nextStep() {
  step++;
  if (step >= draftOrder.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    clearInterval(timerInterval);
    return;
  }
  updateTurnIndicator();
  startTimer();
}

function autoSelectHero() {
  const current = draftOrder[step];
  if (current.type === "ban") return; // Skip ban if no action
  const availableHeroes = heroes.filter(h => {
    const used = [...picks, ...bans].map(p => p.hero);
    return !used.includes(h.name);
  });
  if (availableHeroes.length > 0) {
    const randHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
    const heroBtn = Array.from(document.getElementsByClassName("heroBtn")).find(b => b.querySelector(".heroName").innerText === randHero.name);
    selectHero(randHero.name, heroBtn);
  }
}

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked") || step >= draftOrder.length) return;

  const current = draftOrder[step];
  const isBan = current.type === "ban";

  if (isBan) bans.push({ hero: heroName, side: current.side });
  else picks.push({ hero: heroName, side: current.side });

  btn.classList.add("locked");
  btn.disabled = true;

  addToList(current.side, heroName, isBan);

  nextStep();
}

function addToList(side, heroName, isBan) {
  const listId = side === "Blue" ? (isBan ? "blueBans" : "bluePicks") : (isBan ? "redBans" : "redPicks");
  const mirrorId = side === "Blue" ? (isBan ? "blueBansMirror" : "bluePicksMirror") : (isBan ? "redBansMirror" : "redPicksMirror");

  const container = document.getElementById(listId);
  const mirrorContainer = document.getElementById(mirrorId);

  const heroDiv = document.createElement("div");
  heroDiv.className = "listHero";

  const img = document.createElement("img");
  img.src = heroes.find(h => h.name === heroName).icon;
  heroDiv.appendChild(img);

  container.appendChild(heroDiv);
  mirrorContainer.appendChild(heroDiv.cloneNode(true));
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
    if (hero) score += Number(hero.early || 0) + Number(hero.late || 0) + Number(hero.cc || 0);
  });
  return score;
}
