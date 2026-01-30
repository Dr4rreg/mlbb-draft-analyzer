let step = 0;
let picks = [];
let bans = [];
let timer = 50;
let timerInterval = null;

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

window.onload = () => {
  renderHeroGrid();
  updateTurnIndicator();
  startTimer();
};

function renderHeroGrid() {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.dataset.hero = hero.name;

    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    img.width = 40;
    img.height = 40;
    img.style.objectFit = "cover";
    btn.appendChild(img);

    const nameDiv = document.createElement("div");
    nameDiv.className = "heroName";
    nameDiv.innerText = hero.name;
    btn.appendChild(nameDiv);

    btn.onclick = () => selectHero(hero.name, btn);
    heroGrid.appendChild(btn);
  });
}

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked") || step >= draftOrder.length) return;

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
  nextTurn();
}

function addToList(side, heroName, isBan) {
  const listId = side === "Blue" ? (isBan ? "blueBans" : "bluePicks") : (isBan ? "redBans" : "redPicks");
  const container = document.getElementById(listId);
  
  const heroDiv = document.createElement("div");
  heroDiv.className = "listHero";
  
  const img = document.createElement("img");
  img.src = heroes.find(h => h.name === heroName).icon;
  img.width = 40;
  img.height = 40;
  img.style.objectFit = "cover";
  heroDiv.appendChild(img);

  container.appendChild(heroDiv);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

function startTimer() {
  clearInterval(timerInterval);
  timer = 50;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();

    if (timer <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  document.getElementById("timer").innerText = `Time left: ${timer}s`;
  updateTurnIndicator();
}

function handleTimeout() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];

  if (current.type === "pick") {
    const availableHeroes = heroes.filter(h => 
      !picks.some(p => p.hero === h.name) && !bans.some(b => b.hero === h.name)
    );
    if (availableHeroes.length > 0) {
      const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
      selectHero(randomHero.name, document.querySelector(`button[data-hero="${randomHero.name}"]`));
    } else {
      step++;
      nextTurn();
    }
  } else if (current.type === "ban") {
    // Skip ban
    step++;
    nextTurn();
  }
}

function nextTurn() {
  if (step < draftOrder.length) {
    startTimer();
  } else {
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("timer").innerText = "";
    document.getElementById("analyzeBtn").disabled = false;
  }
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
    if (hero) score += (Number(hero.early) || 0) + (Number(hero.late) || 0) + (Number(hero.cc) || 0);
  });
  return score;
}
