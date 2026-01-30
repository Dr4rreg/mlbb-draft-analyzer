let step = 0;

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

let timerInterval = null;
let timerValue = 50;

window.onload = () => {
  renderHeroPool();
  updateTurnIndicator();
  startTimer();
};

function renderHeroPool() {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    // Hero icon
    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    img.className = "heroIcon";

    // Hero name (only in pool)
    const nameDiv = document.createElement("div");
    nameDiv.className = "heroName";
    nameDiv.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(nameDiv);

    btn.onclick = () => selectHero(hero.name, btn);

    heroGrid.appendChild(btn);
  });
}

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
  updateTurnIndicator();
  resetTimer();

  if (step === draftOrder.length) {
    clearInterval(timerInterval);
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function addToList(side, heroName, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const li = document.createElement("li");

  // Hero icon only, no name
  const img = document.createElement("img");
  const hero = heroes.find(h => h.name === heroName);
  img.src = hero.icon;
  img.className = "pickedIcon";

  li.appendChild(img);
  li.title = `${isBan ? "BAN" : "PICK"}: ${heroName}`; // hover tooltip
  document.getElementById(listId).appendChild(li);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;
  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()} Phase`;
}

function startTimer() {
  timerValue = 50;
  document.getElementById("timerDisplay")?.remove();

  const timerDiv = document.createElement("div");
  timerDiv.id = "timerDisplay";
  timerDiv.style.textAlign = "center";
  timerDiv.style.fontWeight = "bold";
  timerDiv.style.margin = "5px 0";
  timerDiv.innerText = `Time Left: ${timerValue}s`;
  document.getElementById("heroGrid").insertAdjacentElement("beforebegin", timerDiv);

  timerInterval = setInterval(() => {
    timerValue--;
    timerDiv.innerText = `Time Left: ${timerValue}s`;

    if (timerValue <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  startTimer();
}

function handleTimeout() {
  const current = draftOrder[step];
  const availableHeroes = heroes.filter(h => !picks.find(p => p.hero === h.name) && !bans.find(b => b.hero === h.name));

  if (availableHeroes.length === 0) return;

  if (current.type === "pick") {
    // Random pick
    const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
    const btns = Array.from(document.getElementsByClassName("heroBtn"));
    const btn = btns.find(b => b.innerText.includes(randomHero.name));
    if (btn) selectHero(randomHero.name, btn);
  } else {
    // Ban phase: skip if timeout
    step++;
    updateTurnIndicator();
    resetTimer();
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
    if (hero) {
      const early = Number(hero.early) || 0;
      const late = Number(hero.late) || 0;
      const cc = Number(hero.cc) || 0;
      score += early + late + cc;
    }
  });
  return score;
}
