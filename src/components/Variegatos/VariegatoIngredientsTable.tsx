import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../types/gelato';
import { VariegatoItemRow } from '../../types/variegato';
import { isHydrocolloidIngredient, isSucroseIngredient, getIngredientBrix } from '../../core/variegatoCalculator';
import { Plus, Trash2, Sliders, ChevronDown, ChevronUp, Search, Layers, Sparkles } from 'lucide-react';

interface VariegatoIngredientsTableProps {
  items: VariegatoItemRow[];
  onItemsChange: (items: VariegatoItemRow[]) => void;
  ingredients: Ingredient[];
  ingredientsMap: Map<string, Ingredient>;
  finalWeightGrams: number;
}

export const VariegatoIngredientsTable: React.FC<VariegatoIngredientsTableProps> = ({
  items,
  onItemsChange,
  ingredients,
  ingredientsMap,
  finalWeightGrams
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);

  // Categorização tecnológica para variegatos
  const getVariegatoCategoryPill = (name: string, ing?: Ingredient) => {
    const n = name.toLowerCase();
    const c = (ing?.category || '').toLowerCase();

    if (isHydrocolloidIngredient(name, ing?.category)) {
      return { label: 'Hidrocolóide', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    }
    if (n.includes('ácido') || n.includes('acido') || n.includes('limão') || n.includes('limao')) {
      return { label: 'Ácido / Ajuste', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' };
    }
    if (isSucroseIngredient(name)) {
      return { label: 'Sacarose', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    }
    if (n.includes('glicose') || n.includes('glucose') || n.includes('dextrose') || n.includes('invertido')) {
      return { label: 'Anti-Cristaliz.', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    }
    if (c.includes('fruta') || n.includes('polpa') || n.includes('morango') || n.includes('fruta')) {
      return { label: 'Fruta / Polpa', color: 'bg-red-500/15 text-red-300 border-red-500/30' };
    }
    if (c.includes('pasta') || c.includes('chocolate') || (ing && ing.fat > 0.15)) {
      return { label: 'Gordura / Pasta', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    }
    if (c.includes('laticínio') || n.includes('leite') || n.includes('creme')) {
      return { label: 'Lácteo', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
    }
    return { label: 'Insumo Base', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
  };

  // Alterar gramatura de uma linha
  const handleGramsChange = (index: number, val: number) => {
    const next = [...items];
    const safeVal = Math.max(0, Math.round(val * 10) / 10);
    next[index] = { ...next[index], grams: safeVal };
    onItemsChange(next);
  };

  // Ajuste rápido +/- 5g
  const handleStepGrams = (index: number, delta: number) => {
    const current = items[index]?.grams || 0;
    handleGramsChange(index, current + delta);
  };

  // Remover linha
  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onItemsChange(next);
  };

  // Alterar parâmetros avançados
  const handleAdvancedParamChange = (index: number, field: 'customBrix' | 'customPac', val: number) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    onItemsChange(next);
  };

  // Adicionar insumo do catálogo
  const handleAddIngredient = (ingName: string) => {
    const alreadyExists = items.some(i => i.name.toLowerCase() === ingName.toLowerCase());
    if (alreadyExists) {
      alert('Este ingrediente já está na tabela de formulação.');
      return;
    }
    const ing = ingredientsMap.get(ingName.toLowerCase().trim());
    const isPectin = isHydrocolloidIngredient(ingName, ing?.category);
    const initialGrams = isPectin ? 5 : 100;

    onItemsChange([...items, { name: ingName, grams: initialGrams }]);
    setSearchQuery('');
    setIsAddMenuOpen(false);
  };

  // Filtragem de ingredientes para adição
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) {
      return ingredients.slice(0, 15);
    }
    const q = searchQuery.toLowerCase().trim();
    return ingredients.filter(i => i.name.toLowerCase().includes(q)).slice(0, 20);
  }, [ingredients, searchQuery]);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/70">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Insumos da Mescla</h3>
          <span className="text-xs font-medium text-slate-400">({items.length} itens)</span>
        </div>

        {/* Adicionar Insumo Button & Search */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Adicionar Insumo</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 animate-in fade-in duration-150">
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar insumo no catálogo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredCatalog.map(ing => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleAddIngredient(ing.name)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center justify-between transition-colors"
                  >
                    <span className="truncate">{ing.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">{ing.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 pl-1">Ingrediente</th>
              <th className="pb-2.5 px-2">Função Tecnológica</th>
              <th className="pb-2.5 px-2 text-center">Peso Inicial</th>
              <th className="pb-2.5 px-2 text-center">% Formulação</th>
              <th className="pb-2.5 px-2 text-right">Custo R$</th>
              <th className="pb-2.5 pr-1 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item, index) => {
              const ing = ingredientsMap.get(item.name.toLowerCase().trim());
              const cat = getVariegatoCategoryPill(item.name, ing);
              const cost = ing ? (item.grams * ing.costKg) / 1000 : 0;
              const pctFinal = finalWeightGrams > 0 ? (item.grams / finalWeightGrams) * 100 : 0;
              const isExpanded = expandedIndex === index;
              const currentBrix = getIngredientBrix(item, ing);
              const currentPac = item.customPac !== undefined ? item.customPac : (ing?.pac ?? 1.0);

              return (
                <React.Fragment key={index}>
                  <tr className="hover:bg-slate-800/40 transition-colors group">
                    {/* Name */}
                    <td className="py-2.5 pl-1 font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="p-0.5 rounded text-slate-500 hover:text-amber-400"
                          title="Ajustar parâmetros avançados (Brix próprio, PAC)"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Category Pill */}
                    <td className="py-2.5 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>

                    {/* Weight Controls */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStepGrams(index, -5)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs active:scale-95"
                          title="-5 gramas"
                        >
                          -5
                        </button>

                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.grams}
                          onChange={e => handleGramsChange(index, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                        />

                        <button
                          type="button"
                          onClick={() => handleStepGrams(index, 5)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs active:scale-95"
                          title="+5 gramas"
                        >
                          +5
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">g</span>
                      </div>
                    </td>

                    {/* % in final formulation */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300 font-semibold">
                      {pctFinal.toFixed(1)}%
                    </td>

                    {/* Cost */}
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-400 font-bold">
                      R$ {cost.toFixed(2)}
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 pr-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover insumo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Advanced Parameters Row (Collapsible) */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80">
                      <td colSpan={6} className="py-2 px-4 border-b border-slate-800">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <Sliders className="w-3 h-3" /> Parâmetros Avançados do Insumo:
                          </span>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px]">Brix Próprio:</label>
                            <input
                              type="number"
                              step="0.5"
                              value={currentBrix}
                              onChange={e => handleAdvancedParamChange(index, 'customBrix', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-amber-300"
                            />
                            <span className="text-[10px] text-slate-500">°Bx</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px]">Fator PAC:</label>
                            <input
                              type="number"
                              step="0.05"
                              value={currentPac}
                              onChange={e => handleAdvancedParamChange(index, 'customPac', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-cyan-300"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
