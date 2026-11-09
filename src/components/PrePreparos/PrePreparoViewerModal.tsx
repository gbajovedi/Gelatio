import React, { useState, useMemo, useEffect } from 'react';
import { Preparation, Ingredient, PreparationStep } from '../../types/gelato';
import { useModalDismiss } from '../../core/useModalDismiss';
import { calculatePreparationNutrients } from '../../core/preparationSync';
import { getInitialPreparationSteps } from '../../core/preparationStepMigration';
import { STEP_CATEGORIES_META } from '../../core/preparationTemplates';
import {
  isNeutroIngredient,
  roundIngredientGrams,
  STORAGE_KEY_SHOW_ROUNDED
} from '../../core/calculator';
import {
  X,
  ChefHat,
  Edit2,
  Scale,
  Utensils,
  Check,
  Thermometer,
  Clock,
  Sparkles,
  ListChecks,
  FileText,
  Layers,
  CheckCircle2,
  Circle,
  RotateCcw
} from 'lucide-react';

interface PrePreparoViewerModalProps {
  prep: Preparation | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (prep: Preparation) => void;
  availableIngredients?: Ingredient[];
}

export const PrePreparoViewerModal: React.FC<PrePreparoViewerModalProps> = ({
  prep,
  isOpen,
  onClose,
  onOpenEdit,
  availableIngredients = []
}) => {
  // Acessibilidade e fechamento universal (ESC, clique externo no backdrop e trava de scroll)
  useModalDismiss(isOpen, onClose);

  // Mapa de insumos para consulta rápida de categorias e proteção de neutros
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    (availableIngredients || []).forEach(ing => {
      if (ing.name) map.set(ing.name.toLowerCase().trim(), ing);
    });
    return map;
  }, [availableIngredients]);

  // Peso nominal original da formulação cadastrada
  const baseWeight = useMemo(() => {
    if (!prep || !prep.ingredients) return 0;
    return prep.ingredients.reduce((acc, curr) => acc + (Number(curr.grams) || 0), 0);
  }, [prep]);

  // Estado de escalonamento de lote (Modo Cozinha)
  const [targetBatchGrams, setTargetBatchGrams] = useState<number>(baseWeight);

  // Estado interativo de checklist de ingredientes a pesar
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Preferência de visualização de valores arredondados vs decimais exatos
  const [showRoundedValues, setShowRoundedValues] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOW_ROUNDED);
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Estado interativo do checklist de passos operacionais
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // Sincronizar targetBatchGrams e resetar checklists ao abrir ou alternar de pré-preparo
  useEffect(() => {
    if (baseWeight > 0) {
      setTargetBatchGrams(baseWeight);
      setCheckedIngredients({});
      setCheckedSteps({});
    }
  }, [prep?.id, baseWeight]);

  // Fator proporcional de escala
  const scaleRatio = baseWeight > 0 ? (targetBatchGrams || baseWeight) / baseWeight : 1;

  // Multiplicadores da receita base (confeitaria/pré-preparo artesanal)
  const RECIPE_MULTIPLIERS = useMemo(
    () => [
      { mult: 0.5, label: '½x' },
      { mult: 1, label: '1x (Base)' },
      { mult: 1.5, label: '1.5x' },
      { mult: 2, label: '2x' },
      { mult: 3, label: '3x' },
      { mult: 4, label: '4x' },
      { mult: 5, label: '5x' }
    ],
    []
  );

  const toggleStepCheck = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const toggleIngredientCheck = (ingName: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [ingName]: !prev[ingName]
    }));
  };

  const handleResetIngredientsChecklist = () => {
    setCheckedIngredients({});
  };

  const handleEditClick = () => {
    if (!prep) return;
    onClose();
    onOpenEdit(prep);
  };

  const prepProfile = useMemo(() => {
    if (!prep) return { costKg: 0, sugars: 0, fat: 0, msnf: 0, totalSolids: 0, pac: 0, pod: 0 };
    return calculatePreparationNutrients(prep, availableIngredients);
  }, [prep, availableIngredients]);

  // Custo total proporcional ao peso atual do lote
  const totalBatchCost = useMemo(() => {
    const currentWeight = targetBatchGrams || baseWeight;
    return (currentWeight * prepProfile.costKg) / 1000;
  }, [targetBatchGrams, baseWeight, prepProfile.costKg]);

  const steps: PreparationStep[] = useMemo(() => {
    if (!prep) return [];
    return getInitialPreparationSteps(prep);
  }, [prep]);

  if (!isOpen || !prep) return null;

  const hasSteps = steps.length > 0;
  const hasTextInstructions = Boolean(prep.instructions && prep.instructions.trim().length > 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizar modo de preparo de ${prep.name}`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl sm:max-w-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
              👩‍🍳
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    prep.category === 'Variegato'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : prep.category === 'Caldas'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : prep.category === 'Creminos'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                      : prep.category === 'Inclusões Crocantes'
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {prep.category}
                </span>
                {prep.isCustom && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Custom
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate mt-1">
                {prep.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEditClick}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Editar receita, formulação e modo de preparo"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Métricas e Resumo Rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Peso do Lote
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white">
              {Math.round(targetBatchGrams || baseWeight)} <span className="text-xs font-normal text-slate-400">g</span>
            </span>
            {Math.round(targetBatchGrams || baseWeight) !== Math.round(baseWeight) && (
              <span className="text-[10px] text-amber-400 font-mono block mt-0.5" title="Peso nominal original da fórmula">
                Base: {Math.round(baseWeight)}g ({scaleRatio.toFixed(2)}x)
              </span>
            )}
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Custo Estimado
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
              R$ {prepProfile.costKg.toFixed(2)}<span className="text-xs font-normal text-emerald-400/80">/kg</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono block mt-0.5 font-bold" title="Custo proporcional total do lote selecionado">
              Lote: R$ {totalBatchCost.toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Ingredientes
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-amber-300">
              {prep.ingredients.length} <span className="text-xs font-normal text-slate-400">itens</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {Object.values(checkedIngredients).filter(Boolean).length}/{prep.ingredients.length} pesados
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Modo de Preparo
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-sky-400">
              {hasSteps ? `${steps.length} passos` : hasTextInstructions ? 'Texto livre' : 'Não cadastrado'}
            </span>
            {hasSteps && (
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {Object.values(checkedSteps).filter(Boolean).length}/{steps.length} concluídos
              </span>
            )}
          </div>
        </div>

        {/* Controle de Escala de Lote / Peso Desejado */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Peso Desejado do Lote:</span>
              </span>
              {baseWeight > 0 && Math.abs(scaleRatio - 1) > 0.01 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  {scaleRatio.toFixed(scaleRatio % 1 === 0 ? 0 : 2)}x da base
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
              <input
                type="number"
                min="10"
                step="50"
                value={targetBatchGrams || ''}
                onChange={e => setTargetBatchGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 bg-transparent text-right text-base font-black font-mono text-amber-300 focus:outline-none"
              />
              <span className="text-xs font-mono font-bold text-slate-400">g</span>
            </div>
          </div>

          {/* Atalhos por Múltiplos da Receita Base */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <span className="text-[11px] text-slate-400 font-semibold uppercase pr-1 shrink-0">
              Múltiplos:
            </span>
            {RECIPE_MULTIPLIERS.map(({ mult, label }) => {
              const calculatedGrams = Math.round(baseWeight * mult);
              const isSelected = Math.abs(targetBatchGrams - calculatedGrams) <= 1;
              const formattedWeight =
                calculatedGrams >= 1000
                  ? `${(calculatedGrams / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
                  : `${calculatedGrams} g`;

              return (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setTargetBatchGrams(calculatedGrams)}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                  }`}
                  title={`${label}: ${calculatedGrams} g`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] ${
                      isSelected ? 'text-slate-900/80 font-bold' : 'text-slate-400 font-normal'
                    }`}
                  >
                    ({formattedWeight})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção 1: Ingredientes a Pesar (Checklist Interativo de Bancada) */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Ingredientes a Pesar ({prep.ingredients.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !showRoundedValues;
                  setShowRoundedValues(next);
                  try {
                    localStorage.setItem(STORAGE_KEY_SHOW_ROUNDED, String(next));
                  } catch {}
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer select-none ${
                  showRoundedValues
                    ? 'border-amber-500/70 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={
                  showRoundedValues
                    ? 'Valores arredondados ATIVOS (Neutros preservam decimais). Clique para ver decimais exatos.'
                    : 'Clique para mostrar valores arredondados para inteiros (Neutros nunca são arredondados).'
                }
              >
                <span className="font-mono text-xs font-bold">≈</span>
                <span>{showRoundedValues ? 'Arredondado' : 'Decimais'}</span>
                {showRoundedValues && (
                  <span
                    className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded px-1 font-mono font-bold"
                    title="Ingredientes neutros e estabilizantes protegidos com 1 casa decimal"
                  >
                    Neutro .0g
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetIngredientsChecklist}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-1"
                title="Desmarcar todos os ingredientes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desmarcar todos</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden shadow-lg">
            {prep.ingredients.map((ing, idx) => {
              const ingMatch = ingredientsMap.get((ing.name || '').toLowerCase().trim());
              const isNeutro = isNeutroIngredient(ing.name, ingMatch?.category);
              const scaledGrams = roundIngredientGrams(
                Number(ing.grams) * scaleRatio,
                isNeutro,
                showRoundedValues
              );
              const percentage =
                baseWeight > 0 ? ((Number(ing.grams) / baseWeight) * 100).toFixed(1) : '0.0';
              const isChecked = !!checkedIngredients[ing.name];

              return (
                <div
                  key={idx}
                  onClick={() => toggleIngredientCheck(ing.name)}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-emerald-950/20 text-slate-500'
                      : 'hover:bg-slate-800/50 text-white'
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
                        title={ing.name}
                      >
                        {ing.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {percentage}% da fórmula
                      </span>
                    </div>
                  </div>

                  {/* Peso Destacado para Balança */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
                        isChecked ? 'line-through text-slate-500' : 'text-amber-300'
                      }`}
                    >
                      {scaledGrams}
                      <span className="text-xs sm:text-sm font-bold text-slate-400 ml-1">g</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-slate-900/90 px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-black text-white border-t border-slate-800">
              <span className="uppercase tracking-wider text-slate-400 text-xs">Total do Lote:</span>
              <div className="font-mono text-emerald-400 text-base sm:text-lg">
                {Math.round(targetBatchGrams || baseWeight)} g{' '}
                <span className="text-xs text-slate-400 font-normal">(100.0%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Modo de Preparo e Checklist de Cozinha */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Modo de Preparo & Orientações Técnicas
              </span>
            </div>
            {hasSteps && (
              <span className="text-[11px] text-amber-300/80 font-medium">
                Toque nos passos para marcar como concluídos
              </span>
            )}
          </div>

          {hasSteps ? (
            <div className="space-y-2.5">
              {steps.map((step, idx) => {
                const stepKey = `modal_step_${step.id || idx}`;
                const isChecked = !!checkedSteps[stepKey];
                const catMeta = STEP_CATEGORIES_META[step.category || 'outro'] || STEP_CATEGORIES_META.outro;

                return (
                  <div
                    key={step.id || idx}
                    onClick={() => toggleStepCheck(stepKey)}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer select-none ${
                      isChecked
                        ? 'bg-slate-950/70 border-slate-800 opacity-60'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 text-slate-950'
                              : 'border border-slate-600 hover:border-amber-400 text-slate-400'
                          }`}
                        >
                          {isChecked ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${isChecked ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {step.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 ${catMeta.badgeClass}`}>
                          <span>{catMeta.emoji}</span>
                          <span>{catMeta.label}</span>
                        </span>
                        {step.temperature && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold flex items-center gap-1">
                            <Thermometer className="w-2.5 h-2.5" />
                            <span>{step.temperature}</span>
                          </span>
                        )}
                        {step.duration && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{step.duration}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line pl-7.5 ${isChecked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : hasTextInstructions ? (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Instruções em Texto:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
                {prep.instructions}
              </p>
              <button
                type="button"
                onClick={handleEditClick}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 pt-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Converter em Passos Estruturados na Edição</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-900/30">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                Nenhum modo de preparo detalhado cadastrado ainda para este pré-preparo.
              </div>
              <button
                type="button"
                onClick={handleEditClick}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Cadastrar Modo de Preparo</span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleEditClick}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar Ingredientes e Modo de Preparo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

