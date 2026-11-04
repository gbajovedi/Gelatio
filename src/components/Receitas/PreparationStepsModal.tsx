import React, { useState, useEffect } from 'react';
import { Recipe, PreparationStep, PreparationStepCategory } from '../../types/gelato';
import {
  PREPARATION_TEMPLATES,
  STEP_CATEGORIES_META,
  PreparationTemplate,
  instantiateTemplateSteps,
  suggestPreparationTemplate
} from '../../core/preparationTemplates';
import {
  X,
  ChefHat,
  Edit3,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Thermometer,
  Clock,
  Printer,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface PreparationStepsModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSaveSteps: (steps: PreparationStep[]) => Promise<void>;
}

export const PreparationStepsModal: React.FC<PreparationStepsModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSaveSteps
}) => {
  if (!isOpen) return null;

  const [steps, setSteps] = useState<PreparationStep[]>(() => {
    return recipe.preparationSteps && recipe.preparationSteps.length > 0
      ? JSON.parse(JSON.stringify(recipe.preparationSteps))
      : [];
  });

  const [mode, setMode] = useState<'view' | 'edit'>(() => {
    return recipe.preparationSteps && recipe.preparationSteps.length > 0 ? 'view' : 'edit';
  });

  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState<PreparationTemplate | null>(null);

  // Sincroniza passos quando a receita mudar
  useEffect(() => {
    const initialSteps = recipe.preparationSteps && recipe.preparationSteps.length > 0
      ? JSON.parse(JSON.stringify(recipe.preparationSteps))
      : [];
    setSteps(initialSteps);
    setMode(initialSteps.length > 0 ? 'view' : 'edit');
    setCheckedSteps({});
    setSaveSuccess(false);
  }, [recipe]);

  const handleToggleCheck = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleResetChecklist = () => {
    setCheckedSteps({});
  };

  const handleLoadTemplate = (template: PreparationTemplate) => {
    if (steps.length > 0) {
      setConfirmTemplate(template);
    } else {
      const newSteps = instantiateTemplateSteps(template);
      setSteps(newSteps);
    }
  };

  const handleConfirmTemplate = () => {
    if (!confirmTemplate) return;
    const newSteps = instantiateTemplateSteps(confirmTemplate);
    setSteps(newSteps);
    setConfirmTemplate(null);
  };

  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    const newStep: PreparationStep = {
      id: `step_${Date.now()}_${nextOrder}`,
      order: nextOrder,
      title: `Novo Passo ${nextOrder}`,
      description: '',
      temperature: '',
      duration: '',
      category: 'outro'
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, updates: Partial<PreparationStep>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    setSteps(updated);
  };

  const handleDeleteStep = (index: number) => {
    const updated = [...steps];
    updated.splice(index, 1);
    // Reordenar
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }
    const updated = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Atualizar order
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSteps(steps);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setMode('view');
      }, 700);
    } catch (err) {
      console.error('Erro ao salvar passos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const suggested = suggestPreparationTemplate(recipe);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <ChefHat className="w-6 h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white truncate" title={recipe.name}>
                  {recipe.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Modo de Preparo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Instruções operacionais e controle térmico de produção
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Alternador de Modo: Cozinha vs Editor */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'view'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo de execução na cozinha com checklist"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Cozinha</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'edit'
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Editar, adicionar e reordenar passos"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar ({steps.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* MODO 1: VISUALIZAÇÃO / COZINHA */}
          {mode === 'view' && (
            <div className="space-y-4">
              {steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <ChefHat className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-white">Nenhum modo de preparo configurado</h4>
                    <p className="text-xs text-slate-400">
                      Você pode carregar um template canônico da gelateria italiana com 1 clique ou escrever os passos personalizados desta receita.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const newSteps = instantiateTemplateSteps(suggested);
                        setSteps(newSteps);
                        setMode('edit');
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Carregar Modelo Sugerido ({suggested.name})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('edit')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-700 transition-colors"
                    >
                      Criar do Zero
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Barra de Progresso do Checklist na Cozinha */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Progresso na Cozinha:
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {Object.values(checkedSteps).filter(Boolean).length} de {steps.length} concluídos
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {Object.values(checkedSteps).some(Boolean) && (
                        <button
                          type="button"
                          onClick={handleResetChecklist}
                          className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reiniciar checklist</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timeline Vertical de Passos */}
                  <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-slate-800 my-2">
                    {steps.map((step, idx) => {
                      const isChecked = !!checkedSteps[step.id];
                      const meta = STEP_CATEGORIES_META[step.category || 'outro'];

                      return (
                        <div
                          key={step.id}
                          onClick={() => handleToggleCheck(step.id)}
                          className={`relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer group ${
                            isChecked
                              ? 'bg-slate-900/40 border-emerald-500/40 opacity-75'
                              : 'bg-slate-900/95 border-slate-700/80 hover:border-slate-600 shadow-md'
                          }`}
                        >
                          {/* Marcador Ordinal na Linha Vertical */}
                          <div
                            className={`absolute -left-[35px] sm:-left-[43px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110 shadow-md ${
                              isChecked
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-900 text-amber-400 border-amber-500/60'
                            }`}
                          >
                            {isChecked ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Cabeçalho do Passo */}
                          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-sm sm:text-base font-bold ${
                                  isChecked ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {step.title}
                              </h4>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${meta.badgeClass}`}
                              >
                                <span>{meta.emoji}</span>
                                <span>{meta.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {step.temperature && (
                                <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold flex items-center gap-1">
                                  <Thermometer className="w-3 h-3 text-amber-400" />
                                  <span>{step.temperature}</span>
                                </span>
                              )}
                              {step.duration && (
                                <span className="text-xs px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-400" />
                                  <span>{step.duration}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Instrução Detalhada */}
                          <p
                            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                              isChecked ? 'text-slate-400' : 'text-slate-300'
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: EDITOR DE PASSOS */}
          {mode === 'edit' && (
            <div className="space-y-5">
              {/* Barra de Templates Prontos */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Carregar Modelo Canônico Italiano:
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Substitui ou preenche a sequência
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  {PREPARATION_TEMPLATES.map(tpl => {
                    const isRecSuggested = tpl.id === suggested.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleLoadTemplate(tpl)}
                        className={`p-2.5 rounded-xl border text-left transition-all text-xs font-semibold flex flex-col justify-between group relative ${
                          isRecSuggested
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 hover:bg-amber-500/25'
                            : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1 text-slate-200 group-hover:text-amber-300">
                            <span>{tpl.badge}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1 line-clamp-2">
                            {tpl.name}
                          </span>
                        </div>
                        {isRecSuggested && (
                          <span className="mt-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            ★ Recomendado p/ esta receita
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista Editável de Passos */}
              <div className="space-y-3.5">
                {steps.map((step, idx) => {
                  return (
                    <div
                      key={step.id}
                      className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 space-y-3 shadow-sm hover:border-slate-600 transition-colors"
                    >
                      {/* Linha 1: Número, Título e Ações de Reordenação/Exclusão */}
                      <div className="flex items-center justify-between gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={e => handleUpdateStep(idx, { title: e.target.value })}
                            placeholder="Título do passo (ex: Pasteurização Alta)..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        {/* Botões de Ação do Passo */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'down')}
                            disabled={idx === steps.length - 1}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(idx)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-colors ml-1"
                            title="Excluir este passo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Linha 2: Categoria, Temperatura e Duração */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Categoria do Processo:
                          </label>
                          <select
                            value={step.category || 'outro'}
                            onChange={e => handleUpdateStep(idx, { category: e.target.value as PreparationStepCategory })}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                          >
                            {Object.entries(STEP_CATEGORIES_META).map(([catKey, catMeta]) => (
                              <option key={catKey} value={catKey}>
                                {catMeta.emoji} {catMeta.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Temperatura Sugerida:
                          </label>
                          <input
                            type="text"
                            value={step.temperature || ''}
                            onChange={e => handleUpdateStep(idx, { temperature: e.target.value })}
                            placeholder="Ex: 85°C, 4°C, -8°C..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-amber-300 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Tempo Estimado / Repouso:
                          </label>
                          <input
                            type="text"
                            value={step.duration || ''}
                            onChange={e => handleUpdateStep(idx, { duration: e.target.value })}
                            placeholder="Ex: 15 min, 4h a 12h..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-sky-300 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                          />
                        </div>
                      </div>

                      {/* Linha 3: Descrição Detalhada da Operação */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Instruções Técnicas da Operação:
                        </label>
                        <textarea
                          rows={2}
                          value={step.description}
                          onChange={e => handleUpdateStep(idx, { description: e.target.value })}
                          placeholder="Descreva o procedimento técnico, cuidados de higiene e manipulação..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Adicionar Passo */}
              <button
                type="button"
                onClick={handleAddStep}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl text-xs font-bold text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 group bg-slate-900/50 hover:bg-amber-500/5"
              >
                <Plus className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Adicionar Passo Operacional</span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-400">
            {steps.length === 0 ? (
              <span>Nenhum passo cadastrado.</span>
            ) : (
              <span>
                Total de <strong>{steps.length} passos</strong> registrados.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {mode === 'edit' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancelar Edição
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                    saveSuccess
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Salvo com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Salvando...' : 'Salvar Modo de Preparo'}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-slate-700 transition-colors"
              >
                Concluir Visualização
              </button>
            )}
          </div>
        </div>

        {/* Modal de Confirmação para Substituir Passos por Template */}
        {confirmTemplate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-base font-bold text-white">Substituir passos existentes?</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Carregar o modelo <strong>"{confirmTemplate.name}"</strong> substituirá os {steps.length} passos atuais por {confirmTemplate.steps.length} passos do novo modelo. Deseja continuar?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmTemplate(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTemplate}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md"
                >
                  Sim, Carregar Modelo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

