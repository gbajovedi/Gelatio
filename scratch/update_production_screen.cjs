const fs = require('fs');

let content = fs.readFileSync('src/components/Estoque/ProductionScreen.tsx', 'utf8');

// 1. Update calculateRecipeCostKg to include variegatos
const oldCalcRegex = /\/\/ Helper para calcular custo por kg da calda[\s\S]*?return totalGrams > 0 \? \(totalCost \/ totalGrams\) \* 1000 : 15\.0;\s*\};/;

const newCalc = `// Helper para calcular custo por kg da calda e mesclas pós-calda
  const calculateRecipeCostKg = (rec: Recipe): number => {
    if (!rec || !rec.ingredients || rec.ingredients.length === 0) return 15.0; // fallback padrão
    let totalCost = 0;
    let totalGrams = 0;
    for (const item of rec.ingredients) {
      const ing = ingredientsMap.get(item.name.toLowerCase().trim());
      const costKg = ing ? ing.costKg : 0;
      totalCost += (item.grams * costKg) / 1000;
      totalGrams += item.grams;
    }
    for (const v of rec.variegatos || []) {
      if (!v.name || v.grams <= 0) continue;
      const ing = ingredientsMap.get(v.name.toLowerCase().trim());
      const costKg = v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0);
      totalCost += (v.grams * costKg) / 1000;
      totalGrams += v.grams;
    }
    return totalGrams > 0 ? (totalCost / totalGrams) * 1000 : 15.0;
  };`;

content = content.replace(oldCalcRegex, newCalc);

// 2. Add variegato banner in recipe choice
const oldSelectBlock = `              <select
                value={selectedRecipeId}
                onChange={e => setSelectedRecipeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-amber-400 rounded-xl p-3 text-sm text-amber-300 font-bold focus:outline-none"
              >
                {sortedRecipes.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name} — ({r.category || 'Gelatos'})
                  </option>
                ))}
              </select>
            </div>`;

const newSelectBlock = `              <select
                value={selectedRecipeId}
                onChange={e => setSelectedRecipeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-amber-400 rounded-xl p-3 text-sm text-amber-300 font-bold focus:outline-none"
              >
                {sortedRecipes.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name} — ({r.category || 'Gelatos'})
                  </option>
                ))}
              </select>

              {currentRecipe?.variegatos && currentRecipe.variegatos.some(v => v.name && v.grams > 0) && (
                <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>🍯</span>
                    <span>Mescla Pós-Calda Vinculada ao Lote:</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentRecipe.variegatos.filter(v => v.name && v.grams > 0).map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        <span>{v.name}</span>
                        <span className="font-mono font-bold text-amber-400">({v.grams}g base)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>`;

content = content.replace(oldSelectBlock, newSelectBlock);

fs.writeFileSync('src/components/Estoque/ProductionScreen.tsx', content, 'utf8');
console.log('ProductionScreen.tsx atualizado com sucesso!');

