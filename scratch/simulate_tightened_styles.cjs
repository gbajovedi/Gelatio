const fs = require('fs');

const recipes = JSON.parse(fs.readFileSync('src/data/recipes.json', 'utf8'));
const styles = JSON.parse(fs.readFileSync('src/data/styles.json', 'utf8'));
const ingredientsList = JSON.parse(fs.readFileSync('src/data/ingredients.json', 'utf8'));

const ingredientsMap = new Map();
ingredientsList.forEach(i => {
  ingredientsMap.set(i.name.toLowerCase().trim(), i);
  ingredientsMap.set(i.id.toLowerCase().trim(), i);
});

// Clone styles for simulation
const proposedStyles = JSON.parse(JSON.stringify(styles));

// 1. Gelatos Proteicos: tighten msnf.max to prevent arenosidade (Caviezel)
proposedStyles['Gelatos Proteicos'].max.msnf = 0.100; // was 0.125 (12.5% -> 10.0%)

// 2. Sorbets Cítricos / Frutas Ácidas: tighten pac.min to guarantee vitrine scoopability and sugars.max
proposedStyles['Sorbets Cítricos / Frutas Ácidas'].min.pac = 275; // was 265
proposedStyles['Sorbets Cítricos / Frutas Ácidas'].max.sugars = 0.295; // was 0.315 (31.5% -> 29.5%)

// 3. Gelatos Zero Açúcar: tighten sugars.max to protect Anvisa "Sem Adição de Açúcares" claim
proposedStyles['Gelatos Zero Açúcar'].max.sugars = 0.050; // was 0.070 (7.0% -> 5.0%)

// 4. Gelatos de Leite: tighten sugars.max slightly to master standard (Addolcire 17-20%)
proposedStyles['Gelatos de Leite'].max.sugars = 0.205; // was 0.210 (21.0% -> 20.5%)

function analyzeRecipe(recipe, style) {
  let totalCaldaGrams = 0;
  let totalSugars = 0;
  let totalFat = 0;
  let totalMsnf = 0;
  let totalOtherSolids = 0;
  let totalSolids = 0;
  let totalWater = 0;
  let totalPod = 0;
  let totalPac = 0;
  let totalProtein = 0;

  for (const item of (recipe.ingredients || [])) {
    if (!item.name || item.grams <= 0) continue;
    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
    const g = item.grams;
    totalCaldaGrams += g;

    if (ing) {
      totalSugars += g * ing.sugars;
      totalFat += g * ing.fat;
      totalMsnf += g * ing.msnf;
      totalOtherSolids += g * ing.otherSolids;
      totalSolids += g * ing.totalSolids;
      totalWater += g * ing.water;
      totalPod += g * ing.pod;
      totalPac += g * ing.pac;
      totalProtein += g * ing.protein;
    }
  }

  const pctSugars = totalCaldaGrams > 0 ? totalSugars / totalCaldaGrams : 0;
  const pctFat = totalCaldaGrams > 0 ? totalFat / totalCaldaGrams : 0;
  const pctMsnf = totalCaldaGrams > 0 ? totalMsnf / totalCaldaGrams : 0;
  const pctOtherSolids = totalCaldaGrams > 0 ? totalOtherSolids / totalCaldaGrams : 0;
  const pctTotalSolids = totalCaldaGrams > 0 ? totalSolids / totalCaldaGrams : 0;
  const pctWater = totalCaldaGrams > 0 ? totalWater / totalCaldaGrams : 0;
  const relPod = totalCaldaGrams > 0 ? (totalPod * 1000) / totalCaldaGrams : 0;
  const relPac = totalCaldaGrams > 0 ? (totalPac * 1000) / totalCaldaGrams : 0;
  const pctProtein = totalCaldaGrams > 0 ? totalProtein / totalCaldaGrams : 0;

  const validate = (val, min, max, isPercent = true) => {
    const factor = isPercent ? 10000 : 10;
    const v = Math.round(val * factor) / factor;
    const mi = Math.round(min * factor) / factor;
    const ma = Math.round(max * factor) / factor;

    let status = 'Ok';
    if (v < mi) status = 'Baixo';
    else if (v > ma) status = 'Alto';
    return { val, min, max, status };
  };

  const validations = {
    sugars: validate(pctSugars, style.min.sugars, style.max.sugars),
    fat: validate(pctFat, style.min.fat, style.max.fat),
    msnf: validate(pctMsnf, style.min.msnf, style.max.msnf),
    otherSolids: validate(pctOtherSolids, style.min.otherSolids, style.max.otherSolids),
    totalSolids: validate(pctTotalSolids, style.min.totalSolids, style.max.totalSolids),
    water: validate(pctWater, style.min.water, style.max.water),
    pod: validate(relPod, style.min.pod, style.max.pod, false),
    pac: validate(relPac, style.min.pac, style.max.pac, false),
    protein: (style.max.protein > 0 && style.name === 'Gelatos Proteicos')
      ? validate(pctProtein, style.min.protein, style.max.protein)
      : { val: pctProtein, min: 0, max: 0, status: 'Ok' }
  };

  const isBalanced = Object.values(validations).every(v => v.status === 'Ok');
  return { validations, isBalanced };
}

let approvedCurrent = 0;
let approvedProposed = 0;
const failures = [];

for (const r of recipes) {
  const styleName = r.targetStyle || r.category;
  const curStyle = styles[styleName];
  const propStyle = proposedStyles[styleName];

  const resCur = analyzeRecipe(r, curStyle);
  if (resCur.isBalanced) approvedCurrent++;

  const resProp = analyzeRecipe(r, propStyle);
  if (resProp.isBalanced) approvedProposed++;
  else {
    failures.push({ name: r.name, style: styleName, errors: resProp.validations });
  }
}

console.log(`\n======================================================`);
console.log(`RESULTADO DA SIMULAÇÃO COM PARÂMETROS RESTRITOS`);
console.log(`======================================================`);
console.log(`Taxa com parâmetros ATUAIS:   ${approvedCurrent} / ${recipes.length} (${(approvedCurrent/recipes.length*100).toFixed(1)}%)`);
console.log(`Taxa com parâmetros PROPOSTOS: ${approvedProposed} / ${recipes.length} (${(approvedProposed/recipes.length*100).toFixed(1)}%)`);

if (failures.length > 0) {
  console.log("\nFALHAS ENCONTRADAS:");
  for (const f of failures) {
    console.log(`- ${f.name} (${f.style}):`);
    for (const [k, v] of Object.entries(f.errors)) {
      if (v.status !== 'Ok') console.log(`    ${k}: val=${v.val}, min=${v.min}, max=${v.max} -> ${v.status}`);
    }
  }
} else {
  console.log("\nSUCESSO TOTAL! Todas as 148 receitas continuam 100% APROVADAS!");
}

