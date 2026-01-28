let turn = 0;
const MAX_PICKS = Math.min(10, heroes.length);
// 0 = Blue, 1 = Red, 2 = Red, 3 = Blue... simple for now
const picks = [];

window.onload = function() {
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
  // Check if hero already picked
  if (picks.some(p => p.hero === heroName)) return;

  const currentSide = turn % 2 === 0 ? "Blue" : "Red";
  picks.push({ hero: heroName, side: currentSide });

  // Update UI
  const pickList = currentSide === "Blue" ? "bluePicks" : "redPicks";
  document.getElementById(pickList).innerHTML += `<li>${heroName}</li>`;

  // Lock the hero button
  btnElement.classList.add("locked");
  btnElement.disabled = true;

  turn++;

  // Check if draft complete
  if (picks.length >== MAX_PICKS) {
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
  // Split heroes by side
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = scoreTeam(blueHeroes);
  let redScore = scoreTeam(redHeroes);

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
    score += hero.early + hero.late + hero.cc;
  });
  return score;
}

