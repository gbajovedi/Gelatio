const fs = require('fs');

let code = fs.readFileSync('src/components/Receitas/RecipeList.tsx', 'utf8');

// 1. Pass onRecipeUpdated and availableIngredients to RecipeViewerModal
code = code.replace(
  `<RecipeViewerModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onOpenInCalculator={onSelectRecipe}
      />`,
  `<RecipeViewerModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onOpenInCalculator={onSelectRecipe}
        onRecipeUpdated={onRefresh}
        availableIngredients={ingredients}
      />`
);

// 2. Keep viewingRecipe synchronized when recipes update
if (!code.includes('Sync viewingRecipe with updated recipe')) {
  code = code.replace(
    'const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);',
    `const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Sincronizar viewingRecipe quando as mesclas forem salvas ou recarregadas
  useEffect(() => {
    if (viewingRecipe) {
      const fresh = recipes.find(r => r.id === viewingRecipe.id);
      if (fresh) {
        setViewingRecipe(fresh);
      }
    }
  }, [recipes]);`
  );
}

// 3. Update the top badge to show [ 🍯 Variegato ✏️ ] or [ + 🍯 Mescla ]
const oldBadgeRegex = /\{recipe\.variegatos && recipe\.variegatos\.some\(v => v\.name && v\.grams > 0\) && \([\s\S]*?<\/button>\s*\)\}/;

const newBadge = `{recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVariegatoRecipe(recipe);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                          title={\`Clique para gerenciar mesclas desta receita (\${recipe.variegatos.length} cadastrada\${recipe.variegatos.length > 1 ? 's' : ''})\`}
                        >
                          <span>🍯 Variegato</span>
                          <span className="text-[10px] text-amber-400/80">✏️</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVariegatoRecipe(recipe);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-amber-500/15 text-slate-400 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/30 font-semibold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer"
                          title="Adicionar mescla ou variegato permanente a esta receita"
                        >
                          <span>+ 🍯 Mescla</span>
                        </button>
                      )}`;

code = code.replace(oldBadgeRegex, newBadge);

fs.writeFileSync('src/components/Receitas/RecipeList.tsx', code, 'utf8');
console.log('RecipeList.tsx updated successfully with synced viewer and interactive badges!');

