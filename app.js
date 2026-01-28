let phase = "ban"; // "ban" or "pick"
let turn = 0;
let MAX_PICKS;
const BAN_LIMIT = 4;

const picks = []; // { hero, side }
const bans = [];  // { hero, side }

window.onload = function () {
  MAX_PICKS = Math.min(10, heroes.length); // total number of picks allowed (capped at 10)

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

/* ---------- MAIN HANDLER ---------- */
function selectHero(heroName, btn) {
  if (phase === "ban") {
    banHero(heroName, btn);
  } else {
    pickHero(heroName, btn);
  }
}

/* ---------- BAN LOGIC ---------- */
function banHero(heroName, btn) {
  if (bans.some(b => b.hero === heroName)) return;

  const side = getBanSide();
  bans.push({ hero: heroName, side });

  document.getElementById("banList").innerHTML +=
    `<li>${side} banned ${heroName}</li>`;

  btn.disabled = true;
  btn.classList.add("locked");

  turn++;

  if (bans.length >= BAN_LIMIT) {
    phase = "pick";
    turn = 0;
    document.getElementById("turnIndicator").innerText =
      "Ban phase complete. Pick phase begins!";
  } else {
    updateTurnIndicator();
  }
}

function getBanSide() {
  // Blue → Red → Red → Blue
  if (turn === 0 || turn === 3) return "Blue";
  return "Red";
}

/* ---------- PICK LOGIC ---------- */
function canPick(side) {
  const count = picks.filter(p => p.side === side).length;
  return count < 5;
}

function pickHero(heroName, btn) {
  const side = turn % 2 === 0 ? "Blue" : "Red";

  if (!canPick(side)) {
    alert(`${side} already has 5 heroes!`);
    return;
  }

  if (picks.some(p => p.hero === heroName)) return;

  picks.push({ hero: heroName, side });

  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  document.getElementById(listId).innerHTML += `<li>${heroName}</li>`;

  btn.disabled = true;
  btn.classList.add("locked");

  turn++;

  // Check if both teams have 5 picks
  const blueCount = picks.filter(p => p.side === "Blue").length;
  const redCount = picks.filter(p => p.side === "Red").length;

  if (blueCount === 5 && redCount === 5) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  } else {
    updateTurnIndicator();
  }
}

/* ---------- UI ---------- */
function updateTurnIndicator() {
  if (phase === "ban") {
    const side = getBanSide();
    document.getElementById("turnIndicator").innerText = `${side} Team – Ban a hero`;
  } else {
    const side = turn % 2 === 0 ? "Blue" : "Red";
    const sideCount = picks.filter(p => p.side === side).length;
    document.getElementById("turnIndicator").innerText =
      `${side} Team – Pick a hero (${sideCount}/5)`;
  }
}

/* ---------- ANALYZE ---------- */
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
