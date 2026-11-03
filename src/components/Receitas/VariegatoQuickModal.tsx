import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Scale, DollarSign } from 'lucide-react';
import { Recipe, VariegatoItem, Ingredient } from '../../types/gelato';
import { db } from '../../db/database';

interface VariegatoQuickModalProps {
  recipe: Recipe | null;
  availableIngredients: Ingredient[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const VariegatoQuickModal: React.FC<VariegatoQuickModalProps> = ({
  recipe,
  availableIngredients,
  isOpen,
  onClose,
  onSaved
}) => {
  const [items, setItems] = useState<VariegatoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (recipe && isOpen) {
      const initial = recipe.variegatos && recipe.variegatos.length > 0
        ? JSON.parse(JSON.stringify(recipe.variegatos))
        : [];
      setItems(initial);
    }
  }, [recipe, isOpen]);

  if (!isOpen || !recipe) return null;

  // Insumos candidatos para autocomplete de mesclas
  const variegatoCandidates = availableIngredients.filter(i =>
    /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja|geleia|morango|frutas)/i.test(
      i.name
    )
  );

  const handleAdd = () => {
    setItems(prev => [...prev, { name: '', grams: 100, costKg: 0 }]);
  };

  const handleRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...items];
    const ing = availableIngredients.find(
      i => i.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    next[index] = {
      ...next[index],
      name,
      costKg: ing ? ing.costKg : next[index].costKg
    };
    setItems(next);
  };

  const handleChangeGrams = (index: number, grams: number) => {
    const next = [...items];
    next[index] = { ...next[index], grams: Math.max(0, grams) };
    setItems(next);
  };

  const handleChangeCost = (index: number, costKg: number) => {
    const next = [...items];
    next[index] = { ...next[index], costKg: Math.max(0, costKg) };
    setItems(next);
  };

  // Cálculo da Calda Base
  const caldaGrams = (recipe.ingredients || []).reduce((acc, i) => acc + (i.grams || 0), 0);
  let caldaCost = 0;
  for (const ingItem of recipe.ingredients || []) {
    const ing = availableIngredients.find(
      i => i.name.toLowerCase().trim() === ingItem.name.toLowerCase().trim()
    );
    if (ing) {
      caldaCost += (ingItem.grams / 1000) * (ing.costKg || 0);
    }
  }
  const caldaCostKg = caldaGrams > 0 ? (caldaCost / (caldaGrams / 1000)) : 0;

  // Cálculo das Mesclas
  let variegatoGrams = 0;
  let variegatoCost = 0;
  for (const v of items) {
    if (!v.name || v.grams <= 0) continue;
    variegatoGrams += v.grams;
    const ing = availableIngredients.find(
      i => i.name.toLowerCase().trim() === v.name.toLowerCase().trim()
    );
    const unitCost = v.costKg ?? (ing ? ing.costKg : 0);
    variegatoCost += (v.grams / 1000) * unitCost;
  }

  // Valores Consolidados Finais
  const finalWeightGrams = caldaGrams + variegatoGrams;
  const finalTotalCost = caldaCost + variegatoCost;
  const finalCostKg = finalWeightGrams > 0 ? (finalTotalCost / (finalWeightGrams / 1000)) : caldaCostKg;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filtrar apenas mesclas preenchidas
      const cleanVariegatos = items
        .filter(v => v.name.trim().length > 0 && v.grams > 0)
        .map(v => {
          const ing = availableIngredients.find(
            i => i.name.toLowerCase().trim() === v.name.toLowerCase().trim()
          );
          return {
            name: v.name.trim(),
            grams: v.grams,
            costKg: v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0)
          };
        });

      // Atualizar no IndexedDB
      await db.recipes.update(recipe.id, {
        variegatos: cleanVariegatos,
        updatedAt: new Date().toISOString()
      });

      onSaved();
      onClose();
    } catch (err) {
      alert('Erro ao salvar mesclas da receita: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍯</span>
              <h3 className="text-lg font-black text-white">
                Mesclas & Variegatos Pós-Calda
              </h3>
            </div>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              {recipe.name} <span className="text-slate-400 font-normal">({recipe.category || 'Gelato'})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Cockpit de Simulação de Custos e Pesos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">1. Calda Base:</span>
              <span className="text-sm font-bold text-slate-200 block">{Math.round(caldaGrams)} g</span>
              <span className="text-xs text-slate-400 block">R$ {caldaCostKg.toFixed(2).replace('.', ',')}/kg</span>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-700/60 sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] text-amber-300 block uppercase font-sans font-bold">2. Mesclas Adicionadas:</span>
              <span className="text-sm font-bold text-amber-300 block">+{Math.round(variegatoGrams)} g</span>
              <span className="text-xs text-amber-400 block">+R$ {variegatoCost.toFixed(2).replace('.', ',')}</span>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-700/60 sm:pl-3 pt-2 sm:pt-0 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              <span className="text-[10px] text-emerald-400 block uppercase font-sans font-black">3. Gelato Pronto Final:</span>
              <span className="text-base font-black text-white block">{Math.round(finalWeightGrams)} g</span>
              <span className="text-xs font-black text-emerald-300 block">R$ {finalCostKg.toFixed(2).replace('.', ',')}/kg</span>
            </div>
          </div>

          {/* Lista de Mesclas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Ingredientes Pós-Congelamento (Mesclas):
              </span>
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Mescla</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
                <p>Nenhuma mescla ou variegato vinculado a este gelato.</p>
                <p className="text-[11px] text-slate-500">
                  Clique no botão acima para adicionar (ex: <i>Variegato de Nutella</i>, <i>Brigadeiro</i>, <i>Pistache</i>).
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const ing = availableIngredients.find(
                    i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                  );
                  const costKg = item.costKg !== undefined && item.costKg > 0 ? item.costKg : (ing ? ing.costKg : 0);
                  const totalItemCost = (item.grams * costKg) / 1000;
                  const pctCalda = caldaGrams > 0 ? (item.grams / caldaGrams) * 100 : 0;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80 hover:border-slate-600 transition-colors"
                    >
                      {/* Nome do Variegato com Autocomplete */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          list="quick-variegatos-options"
                          placeholder="Nome do variegato (ex: Variegato de Nutella)..."
                          value={item.name}
                          onChange={e => handleChangeName(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Peso em gramas */}
                      <div className="w-full sm:w-28 flex items-center bg-slate-900 border border-slate-700 focus-within:border-amber-500 rounded-xl px-2.5 py-1.5 shadow-inner">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={item.grams || ''}
                          onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-sm text-right font-black font-mono text-amber-300 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400 pl-1.5 shrink-0">g</span>
                      </div>

                      {/* Preço Unitário R$/kg */}
                      <div className="w-full sm:w-28 flex items-center bg-slate-900 border border-slate-700 focus-within:border-amber-500 rounded-xl px-2.5 py-1.5 shadow-inner">
                        <span className="text-xs font-mono text-slate-400 pr-1">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={costKg || ''}
                          onChange={e => handleChangeCost(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-xs text-right font-bold font-mono text-emerald-400 focus:outline-none"
                          placeholder="0.00"
                          title="Custo da matéria-prima por kg"
                        />
                        <span className="text-[10px] font-mono text-slate-500 pl-1 shrink-0">/kg</span>
                      </div>

                      {/* Custo Calculado da Porção */}
                      <div className="w-full sm:w-24 text-right shrink-0 px-1">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          R$ {totalItemCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ~{pctCalda.toFixed(0)}% da calda
                        </span>
                      </div>

                      {/* Botão Remover */}
                      <div className="flex justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
                          title="Remover esta mescla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Mesclas Permanentemente'}</span>
          </button>
        </div>

        <datalist id="quick-variegatos-options">
          {variegatoCandidates.map(i => (
            <option key={i.id} value={i.name}>
              R$ {i.costKg.toFixed(2)}/kg
            </option>
          ))}
        </datalist>
      </div>
    </div>
  );
};
