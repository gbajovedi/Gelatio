const fs = require('fs');

const recipes = JSON.parse(fs.readFileSync('src/data/recipes.json', 'utf8'));
const ingredientsList = JSON.parse(fs.readFileSync('src/data/ingredients.json', 'utf8'));
const styles = JSON.parse(fs.readFileSync('src/data/styles.json', 'utf8'));

const ingMap = new Map();
ingredientsList.forEach(i => ingMap.set(i.name.toLowerCase().trim(), i));

const fior = recipes.find(r => r.id === 'rec_1');
console.log('Receita Base:', fior.name);

// Calda base
let caldaWeight = 0;
let caldaCost = 0;
for (const item of fior.ingredients) {
  caldaWeight += item.grams;
  const ing = ingMap.get(item.name.toLowerCase().trim());
  if (ing) {
    caldaCost += (item.grams / 1000) * ing.costKg;
  }
}
console.log(`Calda Base: ${caldaWeight}g | Custo: R$ ${caldaCost.toFixed(2)} | Custo/kg: R$ ${(caldaCost/(caldaWeight/1000)).toFixed(2)}/kg`);

// Adicionando Variegato de Nutella (150g)
const nutellaIng = ingMap.get('nutella') || ingMap.get('variegato de nutella');
console.log('Insumo Nutella:', nutellaIng ? `${nutellaIng.name} - R$ ${nutellaIng.costKg}/kg` : 'Não encontrado');

const variegatos = [
  { name: nutellaIng ? nutellaIng.name : 'Nutella', grams: 150, costKg: nutellaIng ? nutellaIng.costKg : 65 }
];

let varWeight = 0;
let varCost = 0;
for (const v of variegatos) {
  varWeight += v.grams;
  const unitCost = v.costKg || (ingMap.get(v.name.toLowerCase().trim())?.costKg ?? 0);
  varCost += (v.grams / 1000) * unitCost;
}
console.log(`Mescla: ${variegatos[0].name} (${varWeight}g) | Custo: R$ ${varCost.toFixed(2)}`);

const totalWeight = caldaWeight + varWeight;
const totalCost = caldaCost + varCost;
const finalCostKg = (totalCost / (totalWeight / 1000));

console.log(`\n--- RESULTADO CONSOLIDADO ---`);
console.log(`Peso Total: ${totalWeight}g`);
console.log(`Custo Total do Lote: R$ ${totalCost.toFixed(2)}`);
console.log(`Custo/kg Consolidado: R$ ${finalCostKg.toFixed(2)}/kg`);

