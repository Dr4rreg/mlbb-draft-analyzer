let draftStep = 0;

const draftSequence = [
  { type: "ban", side: "Blue" }, // B1
  { type: "ban", side: "Red" },  // R1
  { type: "ban", side: "Blue" }, // B2
  { type: "ban", side: "Red" },  // R2
  { type: "ban", side: "Blue" }, // B3
  { type: "ban", side: "Red" },  // R3
  { type: "pick", side: "Blue" }, // B1 Pick
  { type: "pick", side: "Red" },  // R1 Pick
  { type: "pick", side: "Red" },  // R2 Pick
  { type: "pick", side: "Blue" }, // B2 Pick
  { type: "pick", side: "Blue" }, // B3 Pick
  { type: "pick", side: "Red" },  // R3 Pick
  { type: "ban", side: "Red" },   // R4 Ban
  { type: "ban", side: "Blue" },  // B4 Ban
  { type: "ban", side: "Red" },   // R5 Ban
  { type: "ban", side: "Blue" },  // B5 Ban
  { type: "pick", side: "Red" },  // R4 Pick
  { type: "pick", side: "Blue" }, // B4 Pick
  { type: "pick", side: "Blue" }, // B5 Pick
  { type: "pick", side: "Red" }   // R5 Pick
];

const picks = [];
const bans = [];

window.onload = function () {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.innerText = h.name;
    btn.onclick = () => selectHero(h.name, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function selectHero(heroName, btn) {
  if (draftStep >= draftSequence.length) return;

  const currentStep = draftSequence[draftStep];

  // Prevent duplicate selection
  if (bans.some(b => b.hero === heroName) || picks.some(p => p.hero === heroName)) return;

  if (currentStep.type === "ban") {
    bans.push({ hero: heroName, side: currentStep.side });
    document.getElementById("banList").innerHTML +=
      `<li>${currentStep.side} banned ${heroName}</li>`;
  } else {
    picks.push({ hero: heroName, side: currentStep.side });
    const listId = currentStep.side === "Blue" ? "bluePicks" : "redPicks";
    document.getElementById(listId).innerHTML += `<li>${heroName}</li>`;
  }

  btn.disabled = true;
  btn.classList.add("locked");

  draftStep++; // move to next step

  updateTurnIndicator();

  if (draftStep >= draftSequence.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function updateTurnIndicator() {
  if (draftStep >= draftSequence.length) return;

  const currentStep = draftSequence[draftStep];
  if (currentStep.type === "ban") {
    document.getElementById("turnIndicator").innerText =
      `${currentStep.side} Team – Ban a hero`;
  } else {
    document.getElementById("turnIndicator").innerText =
      `${currentStep.side} Team – Pick a hero`;
  }
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

  let result = `Blue Score: ${blueScore} | Red Score: ${redScore}<br>`;

  if (blueScore > redScore) {
    result += "Blue has better draft";
  } else if (redScore > blueScore) {
    result += "Red has better draft";
  } else {
    result += "Both drafts are evenly matched";
  }

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    const hero = heroes.find(h => h.name === name);
    if (hero) score += hero.early + hero.late + hero.cc;
  });
  return score;
}
