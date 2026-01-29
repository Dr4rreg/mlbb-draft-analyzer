// ========================
// GLOBAL STATE
// ========================
let currentStep = 0;

// MPL-style simplified sequence (no timers yet)
const draftSequence = [
  { side: "blue", type: "ban" },
  { side: "red", type: "ban" },
  { side: "blue", type: "ban" },
  { side: "red", type: "ban" },

  { side: "blue", type: "pick" },
  { side: "red", type: "pick" },
  { side: "red", type: "pick" },
  { side: "blue", type: "pick" },

  { side: "blue", type: "pick" },
  { side: "red", type: "pick" },
  { side: "red", type: "pick" },
  { side: "blue", type: "pick" }
];

// ========================
// INITIAL RENDER
// ========================
const heroGrid = document.getElementById("heroGrid");

heroes.forEach((hero, index) => {
  const btn = document.createElement("button");
  btn.className = "heroBtn";
  btn.dataset.index = index;

  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;
  img.style.width = "40px";
  img.style.height = "40px";
  img.style.display = "block";
  img.style.margin = "0 auto";

  btn.appendChild(img);

  btn.onclick = () => handleHeroClick(hero, btn);

  heroGrid.appendChild(btn);
});

updateTurnIndicator();

// ========================
// CLICK HANDLER
// ========================
function handleHeroClick(hero, btn) {
  if (btn.classList.contains("locked")) return;
  if (currentStep >= draftSequence.length) return;

  const step = draftSequence[currentStep];

  addToList(step.side, hero, step.type === "ban");
  btn.classList.add("locked");

  currentStep++;
  updateTurnIndicator();
  checkDraftComplete();
}

// ========================
// ADD PICK / BAN
// ========================
function addToList(side, hero, isBan) {
  const listId =
    side === "blue" ? "bluePicks" : "redPicks";

  const list = document.getElementById(listId);

  const li = document.createElement("li");

  const img = document.createElement("img");
  img.src = hero.icon;
  img.alt = hero.name;
  img.style.width = "32px";
  img.style.height = "32px";
  img.style.verticalAlign = "middle";

  li.appendChild(img);
  list.appendChild(li);
}

// ========================
// TURN INDICATOR
// ========================
function updateTurnIndicator() {
  const indicator = document.getElementById("turnIndicator");

  if (currentStep >= draftSequence.length) {
    indicator.textContent = "Draft completed";
    return;
  }

  const step = draftSequence[currentStep];
  indicator.textContent =
    `${step.side.toUpperCase()} ${step.type.toUpperCase()}`;
}

// ========================
// ANALYZE BUTTON ENABLE
// ========================
function checkDraftComplete() {
  const totalPicks =
    document.getElementById("bluePicks").children.length +
    document.getElementById("redPicks").children.length;

  if (totalPicks === 10) {
    document.getElementById("analyzeBtn").disabled = false;
  }
}

// ========================
// DRAFT ANALYSIS
// ========================
function analyzeDraft() {
  let blueScore = 0;
  let redScore = 0;

  const blueList = document.getElementById("bluePicks").children;
  const redList = document.getElementById("redPicks").children;

  for (let li of blueList) {
    const hero = heroes.find(
      h => h.icon === li.querySelector("img").src.split("/").slice(-2).join("/")
    );
    if (hero) {
      blueScore += hero.early + hero.late + hero.cc;
    }
  }

  for (let li of redList) {
    const hero = heroes.find(
      h => h.icon === li.querySelector("img").src.split("/").slice(-2).join("/")
    );
    if (hero) {
      redScore += hero.early + hero.late + hero.cc;
    }
  }

  let result = "Draw";

  if (blueScore > redScore) result = "Blue Team Draft Advantage";
  if (redScore > blueScore) result = "Red Team Draft Advantage";

  document.getElementById("result").textContent =
    `Blue: ${blueScore} | Red: ${redScore} → ${result}`;
}
