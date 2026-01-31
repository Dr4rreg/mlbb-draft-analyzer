let step = 0;
let timeLeft = 50;
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

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.dataset.hero = hero.name;

    btn.innerHTML = `
      <div class="heroIcon">
        <img src="${hero.icon}">
        <div class="name">${hero.name}</div>
      </div>
    `;

    btn.onclick = () => selectHero(hero.name, btn);
    heroGrid.appendChild(btn);
  });

  startTimer();
};

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 50;
  document.getElementById("timer").innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function selectHero(name, btn) {
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: name, side: current.side });
    addDraftIcon(current.side, name, true);
  } else {
    picks.push({ hero: name, side: current.side });
    addDraftIcon(current.side, name, false);
  }

  btn.classList.add("locked");
  step++;

  if (step === draftOrder.length) {
    clearInterval(timerInterval);
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
    document.getElementById("analyzeBtn").disabled = false;
    return;
  }

  startTimer();
}

function handleTimeout() {
  const current = draftOrder[step];

  if (current.type === "pick") {
    const available = heroes.filter(h =>
      !picks.some(p => p.hero === h.name) &&
      !bans.some(b => b.hero === h.name)
    );
    if (available.length > 0) {
      const hero = available[Math.floor(Math.random() * available.length)];
      const btn = document.querySelector(`[data-hero="${hero.name}"]`);
      selectHero(hero.name, btn);
    }
  } else {
    step++;
    startTimer();
  }
}

function addDraftIcon(side, name, isBan) {
  const containerId =
    side === "Blue"
      ? (isBan ? "blueBans" : "bluePicks")
      : (isBan ? "redBans" : "redPicks");

  const hero = heroes.find(h => h.name === name);

  const div = document.createElement("div");
  div.className = `draftIcon ${isBan ? "banned" : ""}`;
  div.innerHTML = `
    <img src="${hero.icon}">
    <div class="name">${hero.name}</div>
  `;

  document.getElementById(containerId).appendChild(div);
}

function analyzeDraft() {
  const score = side =>
    picks.filter(p => p.side === side).reduce((s, p) => {
      const h = heroes.find(x => x.name === p.hero);
      return s + h.early + h.late + h.cc;
    }, 0);

  document.getElementById("result").innerHTML =
    `Blue: ${score("Blue")} | Red: ${score("Red")}`;
}
