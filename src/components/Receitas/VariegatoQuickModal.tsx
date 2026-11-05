import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Scale, DollarSign } from 'lucide-react';
import { Recipe, VariegatoItem, Ingredient } from '../../types/gelato';
import { db } from '../../db/database';
import { resolveVariegatoDensity } from '../../core/calculator';
import { useModalDismiss } from '../../core/useModalDismiss';

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

  // Mapa hash memoizado O(1) de insumos disponíveis por nome minúsculo
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of availableIngredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [availableIngredients]);

  // Insumos candidatos para autocomplete de mesclas
  const variegatoCandidates = useMemo(() => {
    return availableIngredients.filter(i =>
      /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja|geleia|morango|frutas)/i.test(
        i.name
      )
    );
  }, [availableIngredients]);

  if (!isOpen || !recipe) return null;

  // Acessibilidade e fechamento seguro do modal (ESC e trava de scroll)
  useModalDismiss(isOpen, onClose);

  const handleAdd = () => {
    setItems(prev => [...prev, { name: '', grams: 100, costKg: 0 }]);
  };

  const handleRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...items];
    const ing = ingredientsMap.get(name.toLowerCase().trim());
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

  const handleToggleMixer = (index: number) => {
    const next = [...items];
    const ing = ingredientsMap.get((next[index].name || '').toLowerCase().trim());
    const resolved = resolveVariegatoDensity(next[index], ing);
    const isCurrentlyMixer = resolved.method === 'mixer';
    next[index] = {
      ...next[index],
      processMethod: isCurrentlyMixer ? 'direct' : 'mixer',
      overrun: isCurrentlyMixer ? 0 : 20,
      density: undefined
    };
    setItems(next);
  };

  // Cálculo da Calda Base com Map O(1)
  const { caldaGrams, caldaCost, caldaCostKg } = useMemo(() => {
    let grams = 0;
    let cost = 0;
    for (const ingItem of recipe.ingredients || []) {
      grams += ingItem.grams || 0;
      const ing = ingredientsMap.get(ingItem.name.toLowerCase().trim());
      if (ing) {
        cost += (ingItem.grams / 1000) * (ing.costKg || 0);
      }
    }
    const costKg = grams > 0 ? (cost / (grams / 1000)) : 0;
    return { caldaGrams: grams, caldaCost: cost, caldaCostKg: costKg };
  }, [recipe.ingredients, ingredientsMap]);

  // Cálculo das Mesclas e Totais com Map O(1)
  const { variegatoGrams, variegatoCost, finalWeightGrams, finalTotalCost, finalCostKg } = useMemo(() => {
    let vGrams = 0;
    let vCost = 0;
    for (const v of items) {
      if (!v.name || v.grams <= 0) continue;
      vGrams += v.grams;
      const ing = ingredientsMap.get(v.name.toLowerCase().trim());
      const unitCost = v.costKg ?? (ing ? ing.costKg : 0);
      vCost += (v.grams / 1000) * unitCost;
    }
    const finalWeight = caldaGrams + vGrams;
    const finalCost = caldaCost + vCost;
    const fCostKg = finalWeight > 0 ? (finalCost / (finalWeight / 1000)) : caldaCostKg;
    return {
      variegatoGrams: vGrams,
      variegatoCost: vCost,
      finalWeightGrams: finalWeight,
      finalTotalCost: finalCost,
      finalCostKg: fCostKg
    };
  }, [items, caldaGrams, caldaCost, caldaCostKg, ingredientsMap]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filtrar apenas mesclas preenchidas usando lookup O(1)
      const cleanVariegatos = items
        .filter(v => v.name.trim().length > 0 && v.grams > 0)
        .map(v => {
          const ing = ingredientsMap.get(v.name.toLowerCase().trim());
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl relative space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col cursor-default pb-safe"
      >
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
                  const ing = ingredientsMap.get((item.name || '').toLowerCase().trim());
                  const physical = resolveVariegatoDensity(item, ing);
                  const costKg = item.costKg !== undefined && item.costKg > 0 ? item.costKg : (ing ? ing.costKg : 0);
                  const totalItemCost = (item.grams * costKg) / 1000;
                  const pctCalda = caldaGrams > 0 ? (item.grams / caldaGrams) * 100 : 0;
                  const itemVolMl = item.grams > 0 && physical.density > 0
                    ? Math.round(item.grams / physical.density)
                    : 0;

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
                      <div className="w-full sm:w-28 flex items-center bg-slate-900 border border-slate-700 focus-within:border-amber-500 rounded-xl px-2.5 py-1.5 shadow-inner shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={item.grams || ''}
                          onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-sm text-right font-black font-mono text-amber-300 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400 pl-1.5 shrink-0">g</span>
                      </div>

                      {/* Botão Mixer */}
                      <button
                        type="button"
                        onClick={() => handleToggleMixer(idx)}
                        className={`w-full sm:w-auto px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${
                          physical.method === 'mixer'
                            ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm'
                            : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title={
                          physical.method === 'mixer'
                            ? `Mixer ativo (+${physical.overrun}% ar). Clique para alternar para direto.`
                            : 'Ativar preparo com Mixer (+20% de aeração mecânica)'
                        }
                      >
                        <span>🌪️</span>
                        <span>Mixer {physical.method === 'mixer' ? `+${physical.overrun}%` : ''}</span>
                      </button>

                      {/* Pílula de Densidade e Volume */}
                      <div
                        className="w-full sm:w-24 flex flex-col items-center justify-center bg-slate-900 border border-slate-700/80 rounded-xl py-1 px-1.5 shrink-0"
                        title={`Densidade aparente: ${physical.density.toFixed(2)} g/ml`}
                      >
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {physical.density.toFixed(2)} g/ml
                        </span>
                        <span className="text-[10px] text-cyan-300 font-mono">
                          ~{itemVolMl} ml
                        </span>
                      </div>

                      {/* Preço Unitário R$/kg */}
                      <div className="w-full sm:w-24 flex items-center bg-slate-900 border border-slate-700 focus-within:border-amber-500 rounded-xl px-2 py-1.5 shadow-inner shrink-0">
                        <span className="text-xs font-mono text-slate-400 pr-1">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={costKg || ''}
                          onChange={e => handleChangeCost(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-xs text-right font-bold font-mono text-emerald-400 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                          title="Custo da matéria-prima por kg"
                        />
                        <span className="text-[10px] font-mono text-slate-500 pl-1 shrink-0">/kg</span>
                      </div>

                      {/* Custo Calculado da Porção */}
                      <div className="w-full sm:w-20 text-right shrink-0 px-1">
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

