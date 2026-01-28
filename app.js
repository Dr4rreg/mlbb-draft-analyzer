let turn = 0;
const picks = [];
const bans = [];

const TOTAL_PICKS = 10;
const TOTAL_BANS = 10;

/*
Simple alternating order for now:
Even turn = Blue
Odd turn = Red
(Your MPL order already works elsewhere — this keeps clicks functional)
*/

window.onload = function () {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";
    btn.innerText = hero.name;

    btn.onclick = () => handleHeroClick(hero.name, btn);

    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function handleHeroClick(heroName, btn) {
  if (btn.classList.contains("locked")) return;

  const side = turn % 2 === 0 ? "Blue" : "Red";

  // Decide ban first, then pick
  if (bans.length < TOTAL_BANS) {
    bans.push({ hero: heroName, side });
    addToList(side, heroName, true);
  } else if (picks.length < TOTAL_PICKS) {
    picks.push({ hero: heroName, side });
    addToList(side, heroName, false);
  } else {
    return;
  }

  btn.classList.add("locked");
  btn.disabled = true;

  turn++;

  if (picks.length === TOTAL_PICKS) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  } else {
    updateTurnIndicator();
  }
}

function addToList(side, heroName, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const li = document.createElement("li");
  li.innerText = (isBan ? "BAN: " : "PICK: ") + heroName;
  document.getElementById(listId).appendChild(li);
}

function updateTurnIndicator() {
  const side = turn % 2 === 0 ? "Blue" : "Red";
  const phase = bans.length < TOTAL_BANS ? "Ban Phase" : "Pick Phase";
  document.getElementById("turnIndicator").innerText =
    `${phase} — ${side} Team's Turn`;
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  let blueScore = scoreTeam(blueHeroes);
  let redScore = scoreTeam(redHeroes);

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
      score += hero.early + hero.mid + hero.late;
    }
  });
  return score;
}
