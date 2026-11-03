import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, Ingredient, PricingSettings } from '../../types/gelato';
import { DEFAULT_PACKAGING_FORMATS, PackagingFormat, ProductionBatch } from '../../types/stock';
import { recordProductionBatch, calculateBatchCosts, calculateSuggestedPriceForFormat } from '../../core/stockService';
import { db } from '../../db/database';
import { ChefHat, Package, Plus, Calendar, Clock, DollarSign, Sparkles, Check, History, Layers } from 'lucide-react';

interface ProductionScreenProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  pricingSettings: PricingSettings;
  onBatchCreated: () => void;
  preSelectedRecipeId?: string;
  onClearPreSelected?: () => void;
}

export const ProductionScreen: React.FC<ProductionScreenProps> = ({
  recipes,
  ingredients,
  pricingSettings,
  onBatchCreated,
  preSelectedRecipeId,
  onClearPreSelected
}) => {
  // Map of ingredients for fast cost calculation
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Helper para calcular custo por kg da calda
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
    return totalGrams > 0 ? (totalCost / totalGrams) * 1000 : 15.0;
  };

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [recipes]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    preSelectedRecipeId || (sortedRecipes[0]?.id ?? '')
  );

  useEffect(() => {
    if (preSelectedRecipeId) {
      setSelectedRecipeId(preSelectedRecipeId);
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedRecipeId]);

  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || sortedRecipes[0];
  }, [recipes, selectedRecipeId, sortedRecipes]);

  // Formato de Embalagem
  const [selectedFormatId, setSelectedFormatId] = useState<string>('pote_500g');
  const [tubWeightGrams, setTubWeightGrams] = useState<number>(500);
  const [packagingCostUnit, setPackagingCostUnit] = useState<number>(pricingSettings.tubPackagingCost || 1.50);
  const [unitsProduced, setUnitsProduced] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [batchCode, setBatchCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentBatches, setRecentBatches] = useState<ProductionBatch[]>([]);

  // Carregar histórico recente de lotes
  const loadRecentBatches = async () => {
    try {
      const batches = await db.productionBatches.toArray();
      batches.sort((a, b) => new Date(b.producedAt).getTime() - new Date(a.producedAt).getTime());
      setRecentBatches(batches.slice(0, 8));
    } catch (e) {
      console.warn('Erro ao carregar histórico de produção:', e);
    }
  };

  useEffect(() => {
    loadRecentBatches();
  }, []);

  const handleSelectFormat = (fmt: PackagingFormat) => {
    setSelectedFormatId(fmt.id);
    setTubWeightGrams(fmt.tubWeightGrams);
    setPackagingCostUnit(fmt.defaultPackCost);
  };

  // Custo por kg da receita atual
  const recipeCostKg = useMemo(() => {
    return currentRecipe ? calculateRecipeCostKg(currentRecipe) : 15.0;
  }, [currentRecipe, ingredientsMap]);

  // Custos calculados em tempo real
  const batchCosts = useMemo(() => {
    return calculateBatchCosts(
      recipeCostKg,
      tubWeightGrams,
      unitsProduced,
      packagingCostUnit,
      pricingSettings
    );
  }, [recipeCostKg, tubWeightGrams, unitsProduced, packagingCostUnit, pricingSettings]);

  const suggestedPrice = useMemo(() => {
    return calculateSuggestedPriceForFormat(batchCosts.unitCostTotal, pricingSettings);
  }, [batchCosts.unitCostTotal, pricingSettings]);

  const projectedRevenue = suggestedPrice * unitsProduced;
  const projectedProfit = projectedRevenue - batchCosts.totalBatchCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipe || unitsProduced <= 0) return;

    setIsSubmitting(true);
    try {
      await recordProductionBatch({
        recipe: currentRecipe,
        recipeCostKg,
        tubWeightGrams,
        unitsProduced,
        packagingCostUnit,
        pricingSettings,
        customBatchCode: batchCode,
        notes: notes.trim() || undefined
      });

      setNotes('');
      setBatchCode('');
      await loadRecentBatches();
      onBatchCreated();
      alert(`✓ Lote de ${unitsProduced} potes de "${currentRecipe.name}" registrado com sucesso no estoque!`);
    } catch (err) {
      console.error('Erro ao registrar lote de produção:', err);
      alert('Falha ao registrar produção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário Principal de Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Dados da Produção */}
        <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Lançar Lote de Produção</h3>
                <span className="text-xs text-slate-400">
                  Dê entrada nos potes envasados e calcule o custo real por unidade
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 hidden sm:inline">
              Entrada no Estoque
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Escolha da Receita */}
            <div>
              <label className="text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <span>1. Sabor / Receita do Catálogo:</span>
                <span className="text-slate-500 font-normal">({sortedRecipes.length} receitas disponíveis)</span>
              </label>
              <select
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
            </div>

            {/* 2. Formato de Embalagem */}
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">
                2. Formato da Embalagem / Tamanho do Pote:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEFAULT_PACKAGING_FORMATS.filter(f => f.id !== 'personalizado').map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleSelectFormat(fmt)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedFormatId === fmt.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="block font-black text-xs">{fmt.name.split(' ')[0]} {fmt.name.split(' ')[1]}</span>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {fmt.tubWeightGrams}g
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parâmetros do Pote (Peso, Custo Embalagem e Qtd) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Peso Unitário (g):</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={tubWeightGrams || ''}
                  onChange={e => setTubWeightGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono font-bold text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Custo Embalagem (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={packagingCostUnit !== undefined ? packagingCostUnit : ''}
                  onChange={e => setPackagingCostUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono font-bold text-white focus:border-amber-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-amber-300 font-bold block mb-1">Qtd Potes Envasados:</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={unitsProduced || ''}
                  onChange={e => setUnitsProduced(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border-2 border-amber-500/80 rounded-lg p-2 text-base font-mono font-black text-amber-300 focus:outline-none"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            {/* Código do Lote e Observação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Identificação / Código do Lote (opcional):</label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={e => setBatchCode(e.target.value)}
                  placeholder="Ex: LOT-20261102-01 (gerado automático se vazio)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Anotações do Lote (opcional):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Textura sedosa, maturação de 12h"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:border-amber-400"
                />
              </div>
            </div>

            {/* Botão de Gravar Produção */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || unitsProduced <= 0}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package className="w-5 h-5 text-slate-950" />
                <span>Salvar Produção & Abastecer Estoque (+{unitsProduced} potes)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Painel Direito: Decomposição de Custo e Rentabilidade do Lote */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Resumo Financeiro do Lote</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Pote {tubWeightGrams}g
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Custo da Calda/Kg da Receita:</span>
                <strong className="font-mono text-white">R$ {recipeCostKg.toFixed(2)}/kg</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Gelato por Pote ({tubWeightGrams}g):</span>
                <strong className="font-mono text-slate-200">R$ {batchCosts.gelatoCostPerTub.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Embalagem Direta:</span>
                <strong className="font-mono text-slate-200">R$ {packagingCostUnit.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rateio Fixo Indireto:</span>
                <strong className="font-mono text-slate-200">R$ {batchCosts.fixedOverheadUnit.toFixed(2)}</strong>
              </div>

              <div className="pt-2 border-t border-slate-700/80 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-white block">Custo Unitário Total:</span>
                  <span className="text-[10px] text-slate-400">Produto + Pote + Rateio</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-amber-300">
                    R$ {batchCosts.unitCostTotal.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">/pote pronto</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700/80 space-y-1.5 mt-2">
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Investimento no Lote ({unitsProduced} potes):</span>
                  <strong className="font-mono text-rose-300">R$ {batchCosts.totalBatchCost.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Preço Sugerido de Venda:</span>
                  <strong className="font-mono text-emerald-400">R$ {suggestedPrice.toFixed(2)}/un</strong>
                </div>
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Faturamento Estimado:</span>
                  <strong className="font-mono text-white">R$ {projectedRevenue.toFixed(2)}</strong>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between text-xs">
                  <span className="font-bold text-emerald-300">Lucro Operacional Projetado:</span>
                  <strong className="font-mono text-emerald-400 font-black">
                    R$ {projectedProfit.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Dica Operacional */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">💡 Controle por Lotes:</span>
            <p className="leading-relaxed text-[11px]">
              Ao registrar a produção, o Gelatio atualiza o custo médio ponderado do estoque daquele sabor e soma as unidades disponíveis nos freezers para venda imediata no PDV.
            </p>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Lotes Produzidos */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-bold text-white">Histórico dos Últimos Lotes Produzidos</h4>
          </div>
          <span className="text-xs text-slate-400">Últimos {recentBatches.length} registros</span>
        </div>

        {recentBatches.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Nenhum lote de produção lançado ainda. Registre o primeiro lote acima!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Data / Lote</th>
                  <th className="py-2.5 px-3">Sabor</th>
                  <th className="py-2.5 px-3">Formato</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Custo Total</th>
                  <th className="py-2.5 px-3">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {recentBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-750 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="text-white font-mono block text-xs">
                        {new Date(b.producedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{b.batchCode}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-amber-300 font-bold block">{b.recipeName}</span>
                      <span className="text-[10px] text-slate-400">{b.category}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
                        {b.tubWeightGrams}g
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      +{b.unitsProduced} potes
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      R$ {b.unitCostTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      R$ {b.totalBatchCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(b.expiresAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
