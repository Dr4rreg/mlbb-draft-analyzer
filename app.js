const heroGrid = document.getElementById("heroGrid");
const blueBans = document.getElementById("blueBans");
const redBans = document.getElementById("redBans");
const bluePicks = document.getElementById("bluePicks");
const redPicks = document.getElementById("redPicks");
const turnIndicator = document.getElementById("turnIndicator");
const timerDisplay = document.getElementById("timer");

let timer = null;
let timeLeft = 50;

const draftOrder = [
  { type: "ban", side: "blue" },
  { type: "ban", side: "red" },
  { type: "ban", side: "blue" },
  { type: "ban", side: "red" },

  { type: "pick", side: "blue" },
  { type: "pick", side: "red" },
  { type: "pick", side: "red" },
  { type: "pick", side: "blue" },

  { type: "pick", side: "blue" },
  { type: "pick", side: "red" }
];

let step = 0;
let availableHeroes = [...heroes];

function startTimer() {
  clearInterval(timer);
  timeLeft = 50;
  timerDisplay.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoResolve();
    }
  }, 1000);
}

function autoResolve() {
  const current = draftOrder[step];
  if (!current) return;

  if (current.type === "pick") {
    const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
    lockHero(randomHero);
  }

  step++;
  nextTurn();
}

function nextTurn() {
  if (step >= draftOrder.length) {
    turnIndicator.textContent = "Draft Complete";
    timerDisplay.textContent = "-";
    clearInterval(timer);
    return;
  }

  const current = draftOrder[step];
  turnIndicator.textContent = `${current.side.toUpperCase()} ${current.type.toUpperCase()}`;
  startTimer();
}

function lockHero(hero) {
  const current = draftOrder[step];
  if (!current) return;

  const img = document.createElement("img");
  img.src = `icons/${hero}.png`;

  if (current.type === "ban") {
    current.side === "blue" ? blueBans.appendChild(img) : redBans.appendChild(img);
  } else {
    current.side === "blue" ? bluePicks.appendChild(img) : redPicks.appendChild(img);
  }

  availableHeroes = availableHeroes.filter(h => h !== hero);
  document.querySelector(`[data-hero="${hero}"]`)?.classList.add("locked");

  clearInterval(timer);
  step++;
  nextTurn();
}

heroes.forEach(hero => {
  const btn = document.createElement("div");
  btn.className = "heroBtn";
  btn.dataset.hero = hero;

  const img = document.createElement("img");
  img.src = `icons/${hero}.png`;

  const name = document.createElement("span");
  name.textContent = hero;

  btn.appendChild(img);
  btn.appendChild(name);

  btn.onclick = () => {
    if (btn.classList.contains("locked")) return;
    lockHero(hero);
  };

  heroGrid.appendChild(btn);
});

document.getElementById("analyzeBtn").onclick = () => {
  document.getElementById("result").textContent = "Draft analysis complete (placeholder)";
};

nextTurn();
