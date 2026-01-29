let step = 0;

// MPL-style draft order
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
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    // Hero icon
    const img = document.createElement("img");
    img.src = hero.icon;
    img.alt = hero.name;
    img.width = 60;
    img.height = 60;
    img.style.objectFit = "cover";

    // Hero name (ONLY for hero pool)
    const label = document.createElement("div");
    label.className = "heroName";
    label.innerText = hero.name;

    btn.appendChild(img);
    btn.appendChild(label);

    btn.onclick = () => selectHero(hero, btn);
    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function selectHero(hero, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: hero.name, side: current.side });
    addIconToList(current.side, hero.icon, true);
  } else {
    picks.push({ hero: hero.name, side: current.side });
    addIconToList(current.side, hero.icon, false);
  }

  btn.classList.add("locked");
  btn.disabled = true;

  step++;
  updateTurnIndicator();

  if (step === draftOrder.length) {
    document.getElementById("analyzeBtn").disabled = false;
    document.getElementById("turnIndicator").innerText = "Draft Complete!";
  }
}

function addIconToList(side, iconPath, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const li = document.createElement("li");

  const img = document.createElement("img");
  img.src = iconPath;
  img.width = 40;
  img.height = 40;
  img.style.objectFit = "cover";
  img.style.opacity = isBan ? "0.5" : "1";

  li.appendChild(img);
  document.getElementById(listId).appendChild(li);
}

function updateTurnIndicator() {
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];
  document.getElementById("turnIndicator").innerText =
    `${current.side} Team — ${current.type.toUpperCase()}`;
}

function analyzeDraft() {
  const blueHeroes = picks.filter(p => p.side === "Blue").map(p => p.hero);
  const redHeroes = picks.filter(p => p.side === "Red").map(p => p.hero);

  const blueScore = scoreTeam(blueHeroes);
  const redScore = scoreTeam(redHeroes);

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
    if (!hero) return;

    score +=
      (Number(hero.early) || 0) +
      (Number(hero.late) || 0) +
      (Number(hero.cc) || 0);
  });

  return score;
}
