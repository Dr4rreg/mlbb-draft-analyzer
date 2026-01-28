const heroes = [
  { name: "Ling", early: 2, late: 5, cc: 2 },
  { name: "Balmond", early: 4, late: 3, cc: 3 },
  { name: "Valentina", early: 4, late: 4, cc: 4 },
  { name: "Nana", early: 3, late: 3, cc: 5 },
  { name: "Lesley", early: 2, late: 4, cc: 2 }
];

window.onload = function() {
  const bluePick = document.getElementById("bluePick");
  const redPick = document.getElementById("redPick");
  heroes.forEach(h => {
    const optionA = document.createElement("option");
    optionA.text = h.name;
    optionA.value = h.name;
    bluePick.add(optionA);

    const optionB = document.createElement("option");
    optionB.text = h.name;
    optionB.value = h.name;
    redPick.add(optionB);
  });
};
