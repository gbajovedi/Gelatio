import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, VariegatoItem, Ingredient } from '../../types/gelato';
import { CategoryBadge } from '../../core/categoryThemes';
import { db } from '../../db/database';
import {
  X,
  Scale,
  Printer,
  CheckCircle2,
  Circle,
  RotateCcw,
  Layers,
  ChefHat,
  Edit3,
  Plus,
  Trash2,
  Save,
  Check
} from 'lucide-react';

interface RecipeViewerModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInCalculator: (id: string) => void;
  onRecipeUpdated?: () => void;
  availableIngredients?: Ingredient[];
}

export const RecipeViewerModal: React.FC<RecipeViewerModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onOpenInCalculator,
  onRecipeUpdated,
  availableIngredients = []
}) => {
  if (!isOpen || !recipe) return null;

  const baseWeight = useMemo(() => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 1000;
    return recipe.ingredients.reduce((acc, item) => acc + item.grams, 0);
  }, [recipe]);

  const [targetBatchGrams, setTargetBatchGrams] = useState<number>(Math.round(baseWeight));
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Estado interativo das mesclas / variegatos
  const [variegatos, setVariegatos] = useState<VariegatoItem[]>([]);
  const [isDirtyVariegatos, setIsDirtyVariegatos] = useState(false);
  const [isSavingVariegatos, setIsSavingVariegatos] = useState(false);
  const [saveVariegatoSuccess, setSaveVariegatoSuccess] = useState(false);

  // Reset batch, checklist e mesclas quando a receita muda
  useEffect(() => {
    setTargetBatchGrams(Math.round(baseWeight));
    setCheckedItems({});
    const initialVars = recipe.variegatos && recipe.variegatos.length > 0
      ? JSON.parse(JSON.stringify(recipe.variegatos))
      : [];
    setVariegatos(initialVars);
    setIsDirtyVariegatos(false);
    setSaveVariegatoSuccess(false);
  }, [recipe, baseWeight]);

  // Ratio to scale ingredients
  const scaleRatio = baseWeight > 0 ? targetBatchGrams / baseWeight : 1;

  // Toggle checklist for kitchen weighing
  const toggleCheck = (name: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleResetChecklist = () => {
    setCheckedItems({});
  };

  // Quick preset sizes
  const presets = [1000, 2000, 2500, 3000, 4000, 5000];

  // Insumos candidatos para autocomplete de mesclas
  const variegatoCandidates = useMemo(() => {
    return availableIngredients.filter(i =>
      /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja|geleia|morango|frutas)/i.test(
        i.name
      )
    );
  }, [availableIngredients]);

  // Handlers para Mesclas
  const handleAddVariegato = () => {
    setVariegatos(prev => [...prev, { name: '', grams: 150, costKg: 0 }]);
    setIsDirtyVariegatos(true);
  };

  const handleRemoveVariegato = (index: number) => {
    setVariegatos(prev => prev.filter((_, i) => i !== index));
    setIsDirtyVariegatos(true);
  };

  const handleChangeVariegatoGrams = (index: number, grams: number) => {
    setVariegatos(prev => {
      const next = [...prev];
      next[index] = { ...next[index], grams: Math.max(0, grams) };
      return next;
    });
    setIsDirtyVariegatos(true);
  };

  const handleChangeVariegatoName = (index: number, name: string) => {
    setVariegatos(prev => {
      const next = [...prev];
      const ing = availableIngredients.find(
        i => i.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      next[index] = {
        ...next[index],
        name,
        costKg: ing ? ing.costKg : next[index].costKg
      };
      return next;
    });
    setIsDirtyVariegatos(true);
  };

  const handleSaveVariegatos = async () => {
    if (!recipe) return;
    setIsSavingVariegatos(true);
    try {
      const cleanVariegatos = variegatos
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

      await db.recipes.update(recipe.id, {
        variegatos: cleanVariegatos,
        updatedAt: new Date().toISOString()
      });

      recipe.variegatos = cleanVariegatos;
      setIsDirtyVariegatos(false);
      setSaveVariegatoSuccess(true);
      setTimeout(() => setSaveVariegatoSuccess(false), 2500);

      if (onRecipeUpdated) {
        onRecipeUpdated();
      }
    } catch (e) {
      alert('Erro ao salvar mesclas da receita: ' + e);
    } finally {
      setIsSavingVariegatos(false);
    }
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-0 sm:p-4">
      {/* Full screen on mobile (w-full h-full), elegant rounded modal on desktop */}
      <div className="print-recipe-card bg-slate-900 border border-slate-700/80 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 bg-slate-800 border-b border-slate-700/80 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                Ficha de Produção • Modo Cozinha
              </span>
              <CategoryBadge category={recipe.category} />
            </div>

            <h2
              className="text-xl sm:text-2xl font-black text-white tracking-tight break-words leading-tight"
              title={recipe.name}
            >
              {recipe.name}
            </h2>
            <p className="no-print text-xs text-slate-400">
              Ajuste o lote e quantidades de mescla abaixo para pesagem e produção.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="no-print p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Fechar Visualizador"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="print-recipe-body flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Batch Scaling Control Bar */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Peso Desejado do Lote:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={targetBatchGrams || ''}
                  onChange={e => setTargetBatchGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 bg-transparent text-right text-base font-black font-mono text-amber-300 focus:outline-none"
                />
                <span className="text-xs font-mono font-bold text-slate-400">g</span>
              </div>
            </div>

            {/* Quick scale preset buttons */}
            <div className="no-print flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase pr-1 shrink-0">
                Atalhos:
              </span>
              {presets.map(grams => (
                <button
                  key={grams}
                  type="button"
                  onClick={() => setTargetBatchGrams(grams)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
                    targetBatchGrams === grams
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700'
                  }`}
                >
                  {grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Checklist Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Ingredientes a Pesar ({recipe.ingredients?.length ?? 0}):</span>
              </h3>

              <button
                type="button"
                onClick={handleResetChecklist}
                className="no-print text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Desmarcar todos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Desmarcar todos</span>
              </button>
            </div>

            <div className="bg-slate-800/70 rounded-2xl border border-slate-700/80 divide-y divide-slate-700/50 overflow-hidden shadow-lg">
              {recipe.ingredients &&
                recipe.ingredients.map((item, idx) => {
                  const scaledGrams = Math.round(item.grams * scaleRatio * 10) / 10;
                  const pct = baseWeight > 0 ? (item.grams / baseWeight) * 100 : 0;
                  const isChecked = !!checkedItems[item.name];

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(item.name)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/20 text-slate-500'
                          : 'hover:bg-slate-750/50 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                              : 'text-slate-500 hover:text-slate-400 border border-slate-600'
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <span
                            className={`text-sm sm:text-base font-bold block break-words ${
                              isChecked ? 'line-through text-slate-500' : 'text-white'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {pct.toFixed(1)}% da calda
                          </span>
                        </div>
                      </div>

                      {/* Prominent Scale Weight */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
                            isChecked ? 'line-through text-slate-500' : 'text-amber-300'
                          }`}
                        >
                          {scaledGrams}
                          <span className="text-xs sm:text-sm font-bold text-slate-400 ml-1">
                            g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Variegatos / Inclusions Card Interativo */}
          <div className="bg-amber-500/10 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🍯</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Mesclas & Variegatos Pós-Calda ({variegatos.length}):
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddVariegato}
                  className="no-print px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Adicionar mescla pós-congelamento nesta receita"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Mescla</span>
                </button>

                {isDirtyVariegatos && (
                  <button
                    type="button"
                    disabled={isSavingVariegatos}
                    onClick={handleSaveVariegatos}
                    className="no-print px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Salvar alterações na receita permanentemente"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingVariegatos ? 'Salvando...' : 'Salvar Mesclas'}</span>
                  </button>
                )}

                {saveVariegatoSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Salvo!</span>
                  </span>
                )}
              </div>
            </div>

            {variegatos.length === 0 ? (
              <div className="text-center py-5 text-xs text-amber-200/80 border border-dashed border-amber-500/30 rounded-xl space-y-1">
                <p>Nenhuma mescla ou variegato cadastrado nesta receita.</p>
                <button
                  type="button"
                  onClick={handleAddVariegato}
                  className="no-print text-amber-300 hover:text-amber-200 font-bold underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar agora (ex: Nutella, Brigadeiro, Caramelo...)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {variegatos.map((v, i) => {
                  const scaledVarGrams = Math.round(v.grams * scaleRatio * 10) / 10;
                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-amber-500/25 hover:border-amber-500/40 transition-colors"
                    >
                      {/* Nome do Variegato */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          list="viewer-variegatos-options"
                          value={v.name}
                          onChange={e => handleChangeVariegatoName(i, e.target.value)}
                          placeholder="Nome da mescla (ex: Variegato de Nutella)..."
                          className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-amber-200 placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      {/* Quantidade na Receita Base & Lote Escalonado */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 focus-within:border-amber-500 rounded-lg px-2 py-1" title="Quantidade base por receita padrão de calda">
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Base:</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={v.grams || ''}
                            onChange={e => handleChangeVariegatoGrams(i, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-transparent text-right font-mono font-black text-amber-300 text-xs sm:text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <span className="text-xs font-mono text-slate-400 font-bold">g</span>
                        </div>

                        {/* Peso a Pesar no Lote Escalonado */}
                        <div
                          className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/35 rounded-lg px-2.5 py-1"
                          title={`Quantidade de mescla a pesar para o lote atual escalonado de ${targetBatchGrams}g`}
                        >
                          <span className="text-[10px] text-amber-300/80 uppercase font-sans font-bold">Lote:</span>
                          <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                            {scaledVarGrams} g
                          </span>
                        </div>

                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariegato(i)}
                          className="no-print p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
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

            {isDirtyVariegatos && (
              <div className="no-print pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingVariegatos}
                  onClick={handleSaveVariegatos}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingVariegatos ? 'Salvando...' : 'Salvar Alterações na Receita'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Notes (if any) */}
          {recipe.notes && (
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Observações do Chef:
              </span>
              <p className="leading-relaxed">{recipe.notes}</p>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-800 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs sm:text-sm text-slate-300 font-mono font-bold">
            Total Calda Base:{' '}
            <strong className="text-emerald-400 text-base sm:text-lg">
              {targetBatchGrams} g
            </strong>
            {variegatos.length > 0 && (
              <span className="text-amber-300 text-xs font-normal ml-1.5">
                (+{Math.round(variegatos.reduce((acc, v) => acc + (v.grams * scaleRatio), 0))}g mesclas)
              </span>
            )}
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInCalculator(recipe.id);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar no Balanceador</span>
            </button>
          </div>
        </div>

        <datalist id="viewer-variegatos-options">
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
