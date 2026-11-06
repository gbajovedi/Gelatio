import React, { useState, useMemo } from 'react';
import { Preparation, Ingredient, PreparationStep } from '../../types/gelato';
import { useModalDismiss } from '../../core/useModalDismiss';
import { calculatePreparationNutrients } from '../../core/preparationSync';
import { getInitialPreparationSteps } from '../../core/preparationStepMigration';
import { STEP_CATEGORIES_META } from '../../core/preparationTemplates';
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
  FileText
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

  // Estado interativo do checklist de bancada para o operador na cozinha
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const toggleStepCheck = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleEditClick = () => {
    if (!prep) return;
    onClose();
    onOpenEdit(prep);
  };

  const totalGrams = useMemo(() => {
    if (!prep || !prep.ingredients) return 0;
    return prep.ingredients.reduce((acc, curr) => acc + (Number(curr.grams) || 0), 0);
  }, [prep]);

  const prepProfile = useMemo(() => {
    if (!prep) return { costKg: 0, sugars: 0, fat: 0, msnf: 0, totalSolids: 0, pac: 0, pod: 0 };
    return calculatePreparationNutrients(prep, availableIngredients);
  }, [prep, availableIngredients]);

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
              Peso da Batelada
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white">
              {Math.round(totalGrams)} <span className="text-xs font-normal text-slate-400">g</span>
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Custo Estimado
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
              R$ {prepProfile.costKg.toFixed(2)}<span className="text-xs font-normal text-emerald-400/80">/kg</span>
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Ingredientes
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-amber-300">
              {prep.ingredients.length} <span className="text-xs font-normal text-slate-400">itens</span>
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Modo de Preparo
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-sky-400">
              {hasSteps ? `${steps.length} passos` : hasTextInstructions ? 'Texto livre' : 'Não cadastrado'}
            </span>
          </div>
        </div>

        {/* Seção 1: Ingredientes e Formulação em Proporção */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Ingredientes & Formulação
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Total: {Math.round(totalGrams)} g
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 overflow-hidden rounded-xl border border-slate-800">
            <div className="bg-slate-900/90 px-3 py-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Ingrediente</span>
              <div className="flex items-center gap-5 sm:gap-8">
                <span className="w-16 text-right">Peso</span>
                <span className="w-14 text-right">Proporção</span>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/50 bg-slate-900/40">
              {prep.ingredients.map((ing, idx) => {
                const percentage = totalGrams > 0 ? ((Number(ing.grams) / totalGrams) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={idx}
                    className="px-3 py-2 flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="font-medium text-white">{ing.name}</span>
                    <div className="flex items-center gap-5 sm:gap-8 font-mono">
                      <span className="w-16 text-right font-bold text-amber-300">
                        {ing.grams} g
                      </span>
                      <span className="w-14 text-right font-semibold text-slate-400">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/90 px-3 py-2.5 flex items-center justify-between text-xs sm:text-sm font-black text-white">
              <span>Peso Total da Formulação:</span>
              <div className="flex items-center gap-5 sm:gap-8 font-mono">
                <span className="w-16 text-right text-emerald-400 font-bold">{Math.round(totalGrams)} g</span>
                <span className="w-14 text-right text-emerald-400 font-bold">100.0%</span>
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

