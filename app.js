let phase = "ban"; // "ban" or "pick"
let turn = 0;
let MAX_PICKS;
const BAN_LIMIT = 4;

const picks = []; // { hero, side }
const bans = [];  // { hero, side }

window.onload = function () {
  MAX_PICKS = Math.min(10, heroes.length);

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

function pickHero(heroName, btn) {
  if (picks.some(p => p.hero === heroName)) return;

  const side = turn % 2 === 0 ? "Blue" : "Red";
  picks.push({ hero: heroName, side });

  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  document.getElementById(listId).innerHTML += `<li>${heroName}</li>`;

  btn.disabled = true;
  btn.classList.add("locked");

  turn++;

  if (picks.length >= MAX_PICKS) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  } else {
    updateTurnIndicator();
  }
}

/* ---------- UI ---------- */

function updateTurnIndicator() {
  let text = "";

  if (phase === "ban") {
    text = `${getBanSide()} Team – Ban a hero`;
  } else {
    const side = turn % 2 === 0 ? "Blue" : "Red";
    text = `${side} Team – Pick a hero`;
  }

  document.getElementById("turnIndicator").innerText = text;
}
