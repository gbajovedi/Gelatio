const fs = require('fs');

const recipes = JSON.parse(fs.readFileSync('src/data/recipes.json', 'utf8'));
const styles = JSON.parse(fs.readFileSync('src/data/styles.json', 'utf8'));
const ingredientsList = JSON.parse(fs.readFileSync('src/data/ingredients.json', 'utf8'));

const ingredientsMap = new Map();
ingredientsList.forEach(i => {
  ingredientsMap.set(i.name.toLowerCase().trim(), i);
  ingredientsMap.set(i.id.toLowerCase().trim(), i);
});

console.log("Total recipes:", recipes.length);

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
    } else {
      console.warn(`Ingrediente não encontrado: "${item.name}" na receita "${recipe.name}"`);
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

  return {
    metrics: {
      sugars: pctSugars,
      fat: pctFat,
      msnf: pctMsnf,
      otherSolids: pctOtherSolids,
      totalSolids: pctTotalSolids,
      water: pctWater,
      pod: relPod,
      pac: relPac,
      protein: pctProtein
    },
    validations,
    isBalanced
  };
}

const statsByStyle = {};
let totalApproved = 0;

for (const r of recipes) {
  const styleName = r.targetStyle || r.category;
  const style = styles[styleName];
  if (!style) {
    console.error(`Estilo não encontrado para receita "${r.name}": "${styleName}"`);
    continue;
  }
  const res = analyzeRecipe(r, style);
  if (res.isBalanced) totalApproved++;
  else {
    console.warn(`Receita REPROVADA: ${r.name} (${styleName})`);
    for (const [k, v] of Object.entries(res.validations)) {
      if (v.status !== 'Ok') console.warn(`  ${k}: val=${v.val}, min=${v.min}, max=${v.max} -> ${v.status}`);
    }
  }

  if (!statsByStyle[styleName]) statsByStyle[styleName] = [];
  statsByStyle[styleName].push({ id: r.id, name: r.name, metrics: res.metrics });
}

console.log(`\nTaxa de aprovação atual: ${totalApproved}/${recipes.length} (${(totalApproved/recipes.length*100).toFixed(1)}%)`);

console.log("\n========================================================");
console.log("AUDITORIA DETALHADA: INTERVALOS ATUAIS VS INTERVALOS REAIS");
console.log("========================================================");

for (const styleName of Object.keys(styles)) {
  const recs = statsByStyle[styleName] || [];
  const s = styles[styleName];
  console.log(`\n--------------------------------------------------------`);
  console.log(`ESTILO: [${styleName}] - ${recs.length} receitas associadas`);
  console.log(`--------------------------------------------------------`);
  if (recs.length === 0) {
    console.log("  (Nenhuma receita cadastrada neste estilo)");
    continue;
  }

  const fields = ['sugars', 'fat', 'msnf', 'otherSolids', 'totalSolids', 'water', 'pod', 'pac', 'protein'];
  
  for (const f of fields) {
    const vals = recs.map(r => r.metrics[f]);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const styleMin = s.min[f];
    const styleMax = s.max[f];

    const isPct = ['sugars', 'fat', 'msnf', 'otherSolids', 'totalSolids', 'water', 'protein'].includes(f);
    const fmt = v => isPct ? (v * 100).toFixed(2) + '%' : v.toFixed(1);

    const marginMin = isPct ? ((minVal - styleMin) * 100).toFixed(2) + '%' : (minVal - styleMin).toFixed(1);
    const marginMax = isPct ? ((styleMax - maxVal) * 100).toFixed(2) + '%' : (styleMax - maxVal).toFixed(1);

    console.log(`  ${f.padEnd(12)}: Estilo [${fmt(styleMin).padStart(7)} - ${fmt(styleMax).padStart(7)}] | Real [${fmt(minVal).padStart(7)} - ${fmt(maxVal).padStart(7)}] | Folga (min:+${marginMin}, max:+${marginMax})`);
  }
}
