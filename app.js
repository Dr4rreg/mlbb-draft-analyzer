let draftStep = 0;
let picksInStep = 0;

const draftSequence = [
  { type: "ban", side: "Blue", count: 1 },   // B1 Ban
  { type: "ban", side: "Red", count: 1 },    // R1 Ban
  { type: "ban", side: "Blue", count: 1 },   // B2 Ban
  { type: "ban", side: "Red", count: 1 },    // R2 Ban
  { type: "ban", side: "Blue", count: 1 },   // B3 Ban
  { type: "ban", side: "Red", count: 1 },    // R3 Ban
  { type: "pick", side: "Blue", count: 1 },  // B1 Pick
  { type: "pick", side: "Red", count: 2 },   // R1 + R2 Pick
  { type: "pick", side: "Blue", count: 2 },  // B2 + B3 Pick
  { type: "pick", side: "Red", count: 1 },   // R3 Pick
  { type: "ban", side: "Red", count: 1 },    // R4 Ban
  { type: "ban", side: "Blue", count: 1 },   // B4 Ban
  { type: "ban", side: "Red", count: 1 },    // R5 Ban
  { type: "ban", side: "Blue", count: 1 },   // B5 Ban
  { type: "pick", side: "Red", count: 1 },   // R4 Pick
  { type: "pick", side: "Blue", count: 2 },  // B4 + B5 Pick
  { type: "pick", side: "Red", count: 1 }    // R5 Pick
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

  // prevent duplicate selection
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

  picksInStep++;

  // move to next draft step if current step completed
  if (picksInStep >= currentStep.count) {
    draftStep++;
    picksInStep = 0;
  }

  updateTurnIndicator();

  // check if draft complete
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
    const sideCount = picks.filter(p => p.side === currentStep.side).length;
    const maxCount = currentStep.count;
    document.getElementById("turnIndicator").innerText =
      `${currentStep.side} Team – Pick a hero (${sideCount % maxCount + 1}/${maxCount})`;
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
