const fs = require('fs');

let content = fs.readFileSync('src/components/Receitas/RecipeList.tsx', 'utf8');

// 1. Import VariegatoQuickModal
if (!content.includes('VariegatoQuickModal')) {
  content = content.replace(
    "import { StyleSettingsModal } from '../Balanceamento/StyleSettingsModal';",
    "import { StyleSettingsModal } from '../Balanceamento/StyleSettingsModal';\nimport { VariegatoQuickModal } from './VariegatoQuickModal';"
  );
}

// 2. Add state editingVariegatoRecipe
if (!content.includes('editingVariegatoRecipe')) {
  content = content.replace(
    "const [nutritionalRecipe, setNutritionalRecipe] = useState<Recipe | null>(null);",
    "const [nutritionalRecipe, setNutritionalRecipe] = useState<Recipe | null>(null);\n  const [editingVariegatoRecipe, setEditingVariegatoRecipe] = useState<Recipe | null>(null);"
  );
}

// 3. Update metrics calculation with calda and variegatos
const oldMetricsBlockRegex = /\/\/ Pre-calculate technical metrics for each recipe[\s\S]*?map\.set\(recipe\.id, \{[\s\S]*?unbalanceReasons\s*\}\);\s*\}\s*return map;\s*\}, \[recipes, ingredientsMap, stylesRevision\]\);/;

const newMetricsBlock = `// Pre-calculate technical metrics for each recipe
  const metrics = useMemo(() => {
    const map = new Map<
      string,
      {
        pac: number;
        pod: number;
        fatPct: number;
        sugarsPct: number;
        costKg: number;
        totalWeight: number;
        caldaWeight: number;
        variegatoWeight: number;
        variegatoCost: number;
        variegatoCount: number;
        needsAdjustment: boolean;
        unbalanceReasons: string[];
      }
    >();

    for (const recipe of recipes) {
      let caldaWeight = 0;
      let caldaCost = 0;
      let variegatoWeight = 0;
      let variegatoCost = 0;

      for (const item of recipe.ingredients || []) {
        caldaWeight += item.grams;
        const ing = ingredientsMap.get(item.name.toLowerCase().trim());
        if (ing) {
          caldaCost += (item.grams / 1000) * (ing.costKg || 0);
        }
      }

      const validVariegatos = (recipe.variegatos || []).filter(v => v.name && v.grams > 0);
      for (const v of validVariegatos) {
        variegatoWeight += v.grams;
        const ing = ingredientsMap.get(v.name.toLowerCase().trim());
        const unitCost = v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0);
        variegatoCost += (v.grams / 1000) * unitCost;
      }

      const totalWeight = caldaWeight + variegatoWeight;
      const totalCost = caldaCost + variegatoCost;
      const costKg = totalWeight > 0 ? (totalCost / (totalWeight / 1000)) : 0;

      // Target style standard
      const targetStyleName = recipe.targetStyle || recipe.category || 'Gelatos de Leite';
      const currentStyle = stylesDataMap[targetStyleName] || stylesDataMap['Gelatos de Leite'];

      let pacVal = 0;
      let podVal = 0;
      let fatPct = 0;
      let sugarsPct = 0;
      let needsAdjustment = false;
      const unbalanceReasons: string[] = [];

      if (recipe.ingredients && recipe.ingredients.length > 0 && currentStyle) {
        const analysis = calculateBatchAnalysis(
          recipe.ingredients,
          recipe.variegatos || [],
          currentStyle,
          ingredientsMap
        );

        pacVal = Math.round(analysis.percentages.pac);
        podVal = Math.round(analysis.percentages.pod);
        fatPct = analysis.percentages.fat * 100;
        sugarsPct = analysis.percentages.sugars * 100;

        const isCriticalDeviation = (val: number, min: number, max: number, tol: number) =>
          val < (min - tol) || val > (max + tol);

        const criticalReasons: string[] = [];

        // 1. Risco crítico de arenosidade (Fórmula de Caviezel: SLNG excede teto seguro em > 0.8%)
        if (analysis.sandinessRisk.isAtRisk && analysis.sandinessRisk.excessPct > 0.008) {
          criticalReasons.push(
            \`Arenosidade: SLNG (\${(analysis.percentages.msnf * 100).toFixed(1)}%) excede o teto seguro de Caviezel (\${(analysis.sandinessRisk.maxSafeMsnf * 100).toFixed(1)}%)\`
          );
        }

        // 2. Desvios críticos de PAC ou POD (> 15 pontos da meta)
        if (isCriticalDeviation(analysis.percentages.pac, currentStyle.min.pac, currentStyle.max.pac, 15)) {
          criticalReasons.push(\`PAC fora de tolerância (\${Math.round(analysis.percentages.pac)} vs meta \${currentStyle.min.pac}-\${currentStyle.max.pac})\`);
        }
        if (isCriticalDeviation(analysis.percentages.pod, currentStyle.min.pod, currentStyle.max.pod, 15)) {
          criticalReasons.push(\`POD fora de tolerância (\${Math.round(analysis.percentages.pod)} vs meta \${currentStyle.min.pod}-\${currentStyle.max.pod})\`);
        }

        // 3. Desvios críticos de Gordura ou Açúcares (> 2.0% da meta)
        if (isCriticalDeviation(analysis.percentages.fat, currentStyle.min.fat, currentStyle.max.fat, 0.02)) {
          criticalReasons.push(\`Gordura (\${(analysis.percentages.fat * 100).toFixed(1)}% vs meta \${(currentStyle.min.fat * 100).toFixed(0)}-\${(currentStyle.max.fat * 100).toFixed(0)}%)\`);
        }
        if (isCriticalDeviation(analysis.percentages.sugars, currentStyle.min.sugars, currentStyle.max.sugars, 0.02)) {
          criticalReasons.push(\`Açúcares (\${(analysis.percentages.sugars * 100).toFixed(1)}% vs meta \${(currentStyle.min.sugars * 100).toFixed(0)}-\${(currentStyle.max.sugars * 100).toFixed(0)}%)\`);
        }

        needsAdjustment = criticalReasons.length > 0;
        unbalanceReasons.push(...criticalReasons);
      }

      map.set(recipe.id, {
        pac: pacVal,
        pod: podVal,
        fatPct,
        sugarsPct,
        costKg,
        totalWeight,
        caldaWeight,
        variegatoWeight,
        variegatoCost,
        variegatoCount: validVariegatos.length,
        needsAdjustment,
        unbalanceReasons
      });
    }

    return map;
  }, [recipes, ingredientsMap, stylesRevision]);`;

content = content.replace(oldMetricsBlockRegex, newMetricsBlock);

// 4. Update the card top actions to include Variegato button
const oldActionButtonsRegex = /\{\/\* Botões de Ações Rápidas: Tabela Nutricional, Copiar e Excluir no Canto Superior Direito \*\/\}[\s\S]*?<button\s*type="button"\s*onClick=\{\(\) => setNutritionalRecipe\(recipe\)\}/;

const newActionButtons = `{\/* Botões de Ações Rápidas: Mesclas, Tabela Nutricional, Copiar e Excluir no Canto Superior Direito *\/}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingVariegatoRecipe(recipe)}
                        className={\`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 border \${
                          recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0)
                            ? 'text-amber-300 bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/15 border-slate-700/80 hover:border-amber-500/30'
                        }\`}
                        title={
                          recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0)
                            ? \`Gerenciar mesclas de "\${recipe.name}" (\${recipe.variegatos.length} vinculada\${recipe.variegatos.length > 1 ? 's' : ''})\`
                            : \`Adicionar mescla / variegato a "\${recipe.name}"\`
                        }
                      >
                        <span className="text-xs">🍯</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNutritionalRecipe(recipe)}`;

content = content.replace(oldActionButtonsRegex, newActionButtons);

// 5. Update top badge for variegato to be clickable and informative
content = content.replace(
  `{recipe.variegatos && recipe.variegatos.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold whitespace-nowrap">
                          🍯 Variegato
                        </span>
                      )}`,
  `{recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVariegatoRecipe(recipe);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 font-bold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
                          title="Clique para gerenciar as mesclas desta receita"
                        >
                          <span>🍯</span>
                          <span>Mesclado</span>
                        </button>
                      )}`
);

// 6. Add Variegato prominent pill section under Title and update cockpit
const oldTitleAndCockpitRegex = /\{\/\* Recipe Title: Altura mínima para 2 linhas garantindo alinhamento uniforme do cockpit de dados \*\/\}[\s\S]*?\{\/\* Linha unificada: Insumos, Peso base e Custo\/kg \*\/\}[\s\S]*?\{\/\* Card Footer Actions: 3 botões perfeitamente equilibrados \*\//;

const newTitleAndCockpit = `{\/* Recipe Title: Altura mínima para 2 linhas garantindo alinhamento uniforme do cockpit de dados *\/}
                  <h3
                    className="font-bold text-base sm:text-lg text-white group-hover:text-amber-200 transition-colors leading-snug break-words min-h-[2.85rem] sm:min-h-[3.35rem] flex items-start"
                    title={recipe.name}
                  >
                    <span>{recipe.name}</span>
                  </h3>

                  {/* Pílulas em Destaque de Mesclas e Variegatos */}
                  {recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1" onClick={e => e.stopPropagation()}>
                      {recipe.variegatos.filter(v => v.name && v.grams > 0).map((v, i) => {
                        const ing = ingredientsMap.get(v.name.toLowerCase().trim());
                        const unitCost = v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0);
                        const itemCost = (v.grams * unitCost) / 1000;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditingVariegatoRecipe(recipe)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                            title={\`Mescla pós-calda: \${v.name} (\${v.grams}g) — Custo: R$ \${itemCost.toFixed(2).replace('.', ',')}\\nClique para gerenciar mesclas\`}
                          >
                            <span className="text-amber-400">🍯</span>
                            <span className="truncate max-w-[140px] sm:max-w-[170px]">{v.name}</span>
                            <span className="text-amber-400 font-mono text-[11px] font-extrabold bg-amber-500/20 px-1 py-0.5 rounded">
                              {v.grams}g
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Linha unificada: Insumos, Peso base e Custo/kg */}
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-400 font-mono font-medium pt-1">
                    <span
                      className="flex items-center gap-1.5"
                      title={m?.variegatoCount ? \`\${recipe.ingredients?.length ?? 0} insumos na calda base + \${m.variegatoCount} mescla(s) pós-congelamento\` : 'Quantidade de insumos na fórmula'}
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Insumos: <strong className="text-slate-200 font-bold">
                          {recipe.ingredients?.length ?? 0}
                          {m?.variegatoCount ? \` + \${m.variegatoCount}\` : ''}
                        </strong>
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1.5"
                      title={m?.variegatoWeight ? \`Peso total do lote pronto: \${Math.round(m.caldaWeight || 0)}g calda + \${Math.round(m.variegatoWeight)}g mescla\` : 'Peso base da calda'}
                    >
                      <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Peso: <strong className="text-slate-200 font-bold">{Math.round(totalWeight)} g</strong>
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25 text-amber-300 font-bold text-xs"
                      title={m?.variegatoWeight ? \`Custo consolidado por kg (calda + mesclas somadas)\` : 'Custo estimado por kg de insumos'}
                    >
                      <span>
                        {m?.costKg !== undefined && m.costKg > 0
                          ? \`R$ \${m.costKg.toFixed(2).replace('.', ',')}/kg\`
                          : 'R$ --/kg'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions: 3 botões perfeitamente equilibrados */`;

content = content.replace(oldTitleAndCockpitRegex, newTitleAndCockpit);

// 7. Render VariegatoQuickModal before the closing fragment
content = content.replace(
  `{/* Modal de Ajuste de Metas Físico-Químicas */}`,
  `{/* Modal Rápido de Gestão de Mesclas & Variegatos */}
      <VariegatoQuickModal
        recipe={editingVariegatoRecipe}
        availableIngredients={ingredients}
        isOpen={!!editingVariegatoRecipe}
        onClose={() => setEditingVariegatoRecipe(null)}
        onSaved={() => {
          onRefresh();
        }}
      />

      {/* Modal de Ajuste de Metas Físico-Químicas */}`
);

fs.writeFileSync('src/components/Receitas/RecipeList.tsx', content, 'utf8');
console.log('RecipeList.tsx atualizado com sucesso!');

