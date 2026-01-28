function analyzeDraft() {
  const bluePick = document.getElementById("bluePick");
  const redPick = document.getElementById("redPick");

  const blueHeroes = Array.from(bluePick.selectedOptions).map(o => o.value);
  const redHeroes = Array.from(redPick.selectedOptions).map(o => o.value);

  if (blueHeroes.length !== 5 || redHeroes.length !== 5) {
    alert("Please pick exactly 5 heroes per team!");
    return;
  }

  let blueScore = scoreTeam(blueHeroes);
  let redScore = scoreTeam(redHeroes);

  let result = `Blue Score: ${blueScore} | Red Score: ${redScore}<br>`;
  result += blueScore > redScore ? "Blue has better draft" : "Red has better draft";

  document.getElementById("result").innerHTML = result;
}

function scoreTeam(team) {
  let score = 0;
  team.forEach(name => {
    let hero = heroes.find(h => h.name === name);
    score += hero.early + hero.late + hero.cc;
  });
  return score;
}
