let turn = 0;
let MAX_PICKS;
const picks = []; // stores { hero, side }

window.onload = function () {
  // Ensure heroes is loaded
  MAX_PICKS = Math.min(10, heroes.length);

  const heroGrid = document.getElementById("heroGrid");

  heroes.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.innerText = h.name;
    btn.onclick = () => pickHero(h.name, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function pickHero(heroName, btnElement) {
  // Prevent duplicate picks
  if (picks.some(p => p.hero === heroName)) return;

  const currentSide = turn % 2 === 0 ? "Blue" : "Red";
  picks.push({ hero: heroName, side: currentSide });

  // Update UI list
  const pickListId = currentSide === "Blue" ? "bluePicks" : "redPicks";
  document.getElementById(pickListId).innerHTML += `<li>${heroName}</li>`;

  // Lock hero button
  btnElement.disabled = true;
  btnElement.classList.add("locked");

  turn++;

  // Check if draft is complete
  if (picks.length >= MAX_PICKS) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  } else {
    updateTurnIndicator();
  }
}

function updateTurnIndicator() {
  const side = turn % 2 === 0 ? "Blue" : "Red";
  document.getElementById("turnIndicator").innerText = `${side} Team's Turn`;
}

function analyzeDraft() {
  const blueHeroes = picks
    .filter(p => p.side === "Blue")
    .map(p => p.hero);

  const redHeroes = picks
    .filter(p => p.side === "Red")
    .map(p => p.hero);

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
    if (hero) {
      score += hero.early + hero.late + hero.cc;
    }
  });

  return score;
}
