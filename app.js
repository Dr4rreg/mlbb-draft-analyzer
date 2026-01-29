let step = 0;

// MPL-style pick/ban order
const draftOrder = [
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

const picks = [];
const bans = [];

window.onload = () => {
  const heroGrid = document.getElementById("heroGrid");
  heroGrid.innerHTML = "";

  heroes.forEach(hero => {
    const btn = document.createElement("button");
    btn.className = "heroBtn";

    const img = document.createElement("img");
    img.src = hero.icon || "icons/placeholder.png";
    img.alt = hero.name;
    img.width = 60;
    img.height = 60;
    img.style.objectFit = "cover";

    const label = document.createElement("div");
    label.innerText = hero.name;
    label.style.fontSize = "10px";
    label.style.marginTop = "2px";

    btn.appendChild(img);
    btn.appendChild(label);

    btn.onclick = () => selectHero(hero.name, btn);

    heroGrid.appendChild(btn);
  });

  updateTurnIndicator();
};

function selectHero(heroName, btn) {
  if (btn.classList.contains("locked")) return;
  if (step >= draftOrder.length) return;

  const current = draftOrder[step];

  if (current.type === "ban") {
    bans.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, true);
  } else {
    picks.push({ hero: heroName, side: current.side });
    addToList(current.side, heroName, false);
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

function addToList(side, heroName, isBan) {
  const listId = side === "Blue" ? "bluePicks" : "redPicks";
  const ul = document.getElementById(listId);

  const hero = heroes.find(h => h.name === heroName);
  if (!hero) return;

  const li = document.createElement("li");
  li.className = isBan ? "banItem" : "pickItem";

  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;
  img.title = hero.name;
  img.width = 48;
  img.height = 48;

  li.appendChild(img);
  ul.appendChild(li);
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
    if (hero) {
      const early = Number(hero.early) || 0;
      const late = Number(hero.late) || 0;
      const cc = Number(hero.cc) || 0;
      score += early + late + cc;
    }
  });
  return score;
}
