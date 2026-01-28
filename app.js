let draftStep = 0;
const picks = [];
const bans = [];

const draftSequence = [
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" },
  { type: "ban", side: "Blue" }, { type: "ban", side: "Red" },
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" },
  { type: "pick", side: "Red" }, { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" },
  { type: "ban", side: "Red" }, { type: "ban", side: "Blue" },
  { type: "ban", side: "Red" }, { type: "ban", side: "Blue" },
  { type: "pick", side: "Red" }, { type: "pick", side: "Blue" },
  { type: "pick", side: "Blue" }, { type: "pick", side: "Red" }
];

window.onload = function () {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.innerHTML = `
      <img src="${h.icon}" alt="${h.name}" class="heroIcon"><br>
      ${h.name}<br>
      <span class="roleTag">${h.role}</span>
    `;
    btn.onclick = () => selectHero(h.name, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function selectHero(heroName, btn) {
  if (draftStep >= draftSequence.length) return;

  const step = draftSequence[draftStep];

  if (picks.some(p => p.hero === heroName) || bans.some(b => b.hero === heroName)) return;

  if (step.type === "ban") {
    bans.push({ hero: heroName, side: step.side });
    const li = document.createElement("li");
    li.innerText = `${step.side} banned ${heroName}`;
    document.getElementById("banList").appendChild(li);
  } else {
    picks.push({ hero: heroName, side: step.side });
    const listId = step.side === "Blue" ? "bluePicks" : "redPicks";
    const li = document.createElement("li");
    li.innerText = heroName;
    document.getElementById(listId).appendChild(li);
  }

  btn.disabled = true;
  btn.classList.add("locked");

  draftStep++;
  updateTurnIndicator();

  if (draftStep >= draftSequence.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function updateTurnIndicator() {
  if (draftStep >= draftSequence.length) return;

  const step = draftSequence[draftStep];
  if (step.type === "ban") {
    document.getElementById("turnIndicator").innerText = `${step.side} Team – Ban a hero`;
  } else {
    document.getElementById("turnIndicator").innerText = `${step.side} Team – Pick a hero`;
  }
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = scoreTeam(blueHeroes);
  let redScore = scoreTeam(redHeroes);

  let result = `Blue Score: ${blueScore} | Red Score: ${redScore}<br>`;
  if (blueScore > redScore) result += "Blue has better draft";
  else if (redScore > blueScore) result += "Red has better draft";
  else result += "Both drafts are evenly matched";

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
