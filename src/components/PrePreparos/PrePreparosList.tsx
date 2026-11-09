import React, { useState, useMemo } from 'react';
import { Preparation, Ingredient, PreparationStep, PreparationStepCategory, Recipe } from '../../types/gelato';
import { db } from '../../db/database';
import {
  Search,
  ChefHat,
  X,
  Plus,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  Save,
  Sparkles,
  Utensils,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Clock,
  ArrowUp,
  ArrowDown,
  ListChecks,
  Check,
  FileText,
} from 'lucide-react';
import {
  calculatePreparationNutrients,
  syncPreparationToIngredient,
  syncAllPreparationsToIngredients,
  removeLinkedIngredientForPreparation,
} from '../../core/preparationSync';
import { useModalDismiss } from '../../core/useModalDismiss';
import {
  parseInstructionsToSteps,
  stepsToInstructions,
  getInitialPreparationSteps
} from '../../core/preparationStepMigration';
import { STEP_CATEGORIES_META } from '../../core/preparationTemplates';
import { PrePreparoViewerModal } from './PrePreparoViewerModal';

const STORAGE_EXPANDED_INGREDIENTS = 'gelatio_preparations_expanded_ingredients';

interface PrePreparosListProps {
  preparations: Preparation[];
  availableIngredients?: Ingredient[];
  recipes?: Recipe[];
  onRefresh?: () => void;
}

interface PreparationFormItem {
  name: string;
  grams: number | '';
}

export const PrePreparosList: React.FC<PrePreparosListProps> = ({
  preparations,
  availableIngredients = [],
  recipes = [],
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'Todas' | Preparation['category']>('Todas');
  const [methodFilter, setMethodFilter] = useState<'todos' | 'com_preparo' | 'sem_preparo'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrep, setEditingPrep] = useState<Preparation | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Preparation['category']>('Pré-preparo');
  const [instructions, setInstructions] = useState('');
  const [steps, setSteps] = useState<PreparationStep[]>([]);
  const [prepInputMode, setPrepInputMode] = useState<'steps' | 'text'>('steps');
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
  const [items, setItems] = useState<PreparationFormItem[]>([
    { name: '', grams: '' },
  ]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrep(null);
  };

  useModalDismiss(isModalOpen, handleCloseModal);

  // Estado de ingredientes: contraído por padrão e persistido no localStorage
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EXPANDED_INGREDIENTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleIngredients = (prepId: string) => {
    setExpandedIngredients(prev => {
      const next = { ...prev, [prepId]: !prev[prepId] };
      try {
        localStorage.setItem(STORAGE_EXPANDED_INGREDIENTS, JSON.stringify(next));
      } catch (err) {
        console.error('Falha ao salvar preferência de expansão de ingredientes:', err);
      }
      return next;
    });
  };

  // Estado do Modal de Visualização de Modo de Preparo
  const [viewingPrepForSteps, setViewingPrepForSteps] = useState<Preparation | null>(null);

  // Mapa memoizado de uso de cada pré-preparo nas receitas do catálogo
  const prepUsageMap = useMemo(() => {
    const map = new Map<string, { count: number; recipeNames: string[] }>();
    if (!recipes || recipes.length === 0) return map;

    for (const prep of preparations) {
      const pNameLower = prep.name.toLowerCase().trim();
      const matchedNames: string[] = [];
      for (const recipe of recipes) {
        const inIngredients = recipe.ingredients.some(
          i => i.name && i.name.toLowerCase().trim() === pNameLower
        );
        const inVariegatos = recipe.variegatos?.some(
          v => v.name && v.name.toLowerCase().trim() === pNameLower
        );
        if (inIngredients || inVariegatos) {
          matchedNames.push(recipe.name);
        }
      }
      map.set(prep.id, { count: matchedNames.length, recipeNames: matchedNames });
    }
    return map;
  }, [preparations, recipes]);

  const filtered = preparations.filter(p => {
    const matchCat = catFilter === 'Todas' || p.category === catFilter;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase()));

    const cardSteps = getInitialPreparationSteps(p);
    const hasStructuredSteps = cardSteps.length > 0;
    const hasTextOnly = !hasStructuredSteps && !!p.instructions && p.instructions.trim().length > 0;
    const hasMethod = hasStructuredSteps || hasTextOnly;

    const matchMethod =
      methodFilter === 'todos' ||
      (methodFilter === 'com_preparo' && hasMethod) ||
      (methodFilter === 'sem_preparo' && !hasMethod);

    return matchCat && matchSearch && matchMethod;
  });

  const allIngredientsExpanded = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every(p => !!expandedIngredients[p.id]);
  }, [filtered, expandedIngredients]);

  const toggleAllIngredients = () => {
    const nextVal = !allIngredientsExpanded;
    setExpandedIngredients(prev => {
      const next = { ...prev };
      filtered.forEach(p => {
        next[p.id] = nextVal;
      });
      try {
        localStorage.setItem(STORAGE_EXPANDED_INGREDIENTS, JSON.stringify(next));
      } catch (err) {
        console.error('Falha ao salvar preferências de expansão de ingredientes:', err);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    setModalError('');
    setIsSaving(false);
    setEditingPrep(null);
    setName('');
    setCategory('Pré-preparo');
    setInstructions('');
    setSteps([]);
    setPrepInputMode('steps');
    setItems([
      { name: '', grams: '' },
      { name: '', grams: '' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prep: Preparation) => {
    setModalError('');
    setIsSaving(false);
    setEditingPrep(prep);
    setName(prep.name);
    setCategory(prep.category);
    const initialSteps = getInitialPreparationSteps(prep);
    setSteps(initialSteps);
    setInstructions(prep.instructions || stepsToInstructions(initialSteps));
    setPrepInputMode(initialSteps.length > 0 ? 'steps' : 'text');
    setItems(
      prep.ingredients.length > 0
        ? prep.ingredients.map(i => ({ name: i.name, grams: i.grams }))
        : [{ name: '', grams: '' }]
    );
    setIsModalOpen(true);
  };

  const handleAddModalStep = () => {
    const nextOrder = steps.length + 1;
    const newStep: PreparationStep = {
      id: `step_${Date.now()}_${nextOrder}`,
      order: nextOrder,
      title: `Passo ${nextOrder}`,
      description: '',
      temperature: '',
      duration: '',
      category: 'aquecimento'
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateModalStep = (index: number, updates: Partial<PreparationStep>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    setSteps(updated);
  };

  const handleDeleteModalStep = (index: number) => {
    const updated = [...steps];
    updated.splice(index, 1);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  const handleMoveModalStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) {
      return;
    }
    const updated = [...steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  const handleConvertTextToStructuredSteps = () => {
    const parsed = parseInstructionsToSteps(instructions);
    if (parsed.length > 0) {
      setSteps(parsed);
      setPrepInputMode('steps');
    }
  };

  const handleDuplicate = async (prep: Preparation) => {
    try {
      const newId = `prep_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const duplicatedPrep: Preparation = {
        ...prep,
        id: newId,
        name: `${prep.name} (Cópia)`,
        isCustom: true,
        ingredients: prep.ingredients.map(ing => ({ ...ing })),
        instructions: prep.instructions || '',
        preparationSteps: prep.preparationSteps
          ? prep.preparationSteps.map(s => ({
              ...s,
              id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
            }))
          : undefined
      };

      await db.preparations.add(duplicatedPrep);
      await syncPreparationToIngredient(duplicatedPrep, availableIngredients);

      setSyncSuccessMessage(`Pré-preparo "${duplicatedPrep.name}" duplicado com sucesso!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao duplicar pré-preparo:', err);
      setModalError('Falha ao duplicar pré-preparo.');
    }
  };

  const handleDelete = async (prep: Preparation) => {
    const usage = prepUsageMap.get(prep.id);
    const usageWarning =
      usage && usage.count > 0
        ? `\n\nATENÇÃO: Este pré-preparo está em uso em ${usage.count} receita(s) do catálogo:\n• ${usage.recipeNames.slice(0, 3).join('\n• ')}${usage.count > 3 ? `\n...e mais ${usage.count - 3} receita(s)` : ''}\n\nA exclusão poderá desbalancear essas receitas.`
        : '';

    if (window.confirm(`Deseja realmente excluir o ${prep.category.toLowerCase()} "${prep.name}"?${usageWarning}`)) {
      await db.preparations.delete(prep.id);
      if (prep.isCustom) {
        await removeLinkedIngredientForPreparation(prep);
      }
      setSyncSuccessMessage(`Pré-preparo "${prep.name}" removido com sucesso.`);
      if (onRefresh) onRefresh();
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', grams: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'grams', value: string | number) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: field === 'grams' ? (value === '' ? '' : Math.max(0, Number(value))) : value,
        };
      })
    );
  };

  const totalModalGrams = items.reduce((acc, curr) => acc + (typeof curr.grams === 'number' ? curr.grams : 0), 0);

  // Perfil calculado em tempo real para o modal
  const modalProfile = useMemo(() => {
    const validItems = items
      .filter(item => item.name.trim() !== '' && typeof item.grams === 'number' && item.grams > 0)
      .map(item => ({ name: item.name.trim(), grams: Number(item.grams) }));
    return calculatePreparationNutrients({ name, category, ingredients: validItems }, availableIngredients);
  }, [items, name, category, availableIngredients]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!name.trim()) {
      setModalError('Por favor, informe o nome do pré-preparo / variegato.');
      return;
    }

    const validIngredients = items
      .filter(item => item.name.trim() !== '' && typeof item.grams === 'number' && item.grams > 0)
      .map(item => ({
        name: item.name.trim(),
        grams: Number(item.grams),
      }));

    if (validIngredients.length === 0) {
      setModalError('Adicione pelo menos um ingrediente com peso em gramas maior que zero.');
      return;
    }

    setIsSaving(true);
    try {
      const prepId = editingPrep ? editingPrep.id : `prep_${Date.now()}`;
      const consolidatedInstructions = steps.length > 0 ? stepsToInstructions(steps) : instructions.trim();

      const prepToSave: Preparation = {
        id: prepId,
        name: name.trim(),
        category,
        instructions: consolidatedInstructions,
        preparationSteps: steps.length > 0 ? steps : undefined,
        ingredients: validIngredients,
        isCustom: editingPrep ? editingPrep.isCustom : true,
      };

      // 1. Salvar no banco de pré-preparos
      await db.preparations.put(prepToSave);

      // 2. Sincronizar automaticamente os parâmetros físico-químicos e custo na tabela de insumos (db.ingredients)
      await syncPreparationToIngredient(prepToSave, availableIngredients, editingPrep?.name);

      setSyncSuccessMessage(
        `"${prepToSave.name}" salvo com sucesso e parâmetros físico-químicos sincronizados na aba de Insumos!`
      );

      setIsModalOpen(false);
      setEditingPrep(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Erro ao salvar preparação e sincronizar insumo:', err);
      setModalError(`Erro ao salvar no banco de dados: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setSyncSuccessMessage('');
    try {
      const result = await syncAllPreparationsToIngredients(preparations, availableIngredients);
      setSyncSuccessMessage(
        `Sincronização concluída: ${result.updatedCount} insumos atualizados e ${result.createdCount} novos cadastrados a partir das fórmulas de pré-preparos!`
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Erro ao sincronizar todos os pré-preparos:', err);
      alert(`Falha ao sincronizar: ${err?.message || err}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <ChefHat className="w-6 h-6 text-amber-400" />
              <span>Pré-preparos, Bases & Variegatos Caseiros</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {preparations.length} receitas auxiliares com parâmetros físico-químicos sincronizados automaticamente na aba Insumos.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isSyncingAll}
              onClick={handleSyncAll}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
              title="Recalcular parâmetros e sincronizar todos os pré-preparos na aba Insumos"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Insumos'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Pré-preparo / Variegato</span>
            </button>
          </div>
        </div>

        {syncSuccessMessage && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncSuccessMessage('')}
              className="p-1 text-emerald-400/70 hover:text-emerald-300 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome do pré-preparo ou insumo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-semibold shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Categoria */}
              {(['Todas', 'Pré-preparo', 'Variegato', 'Caldas', 'Creminos', 'Inclusões Crocantes'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    catFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Separador Visual entre Categoria e Modo de Preparo */}
              <div className="hidden sm:block h-6 w-px bg-slate-700/80 mx-1" />

              {/* Filtro de Modo de Preparo (Ativado Conjuntamente) */}
              {(
                [
                  { id: 'todos', label: 'Todos os Status de Preparo', shortLabel: 'Todos', icon: undefined },
                  { id: 'com_preparo', label: 'Com Modo de Preparo cadastrado', shortLabel: 'Com Preparo', icon: ChefHat },
                  { id: 'sem_preparo', label: 'Sem Modo de Preparo (Pendentes)', shortLabel: 'Sem Preparo', icon: Clock },
                ] as const
              ).map(opt => {
                const Icon = opt.icon;
                const isActive = methodFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethodFilter(opt.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                    title={opt.label}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {filtered.length > 0 && (
              <button
                type="button"
                onClick={toggleAllIngredients}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
                title={allIngredientsExpanded ? 'Recolher ingredientes de todos os cards' : 'Expandir ingredientes de todos os cards'}
              >
                {allIngredientsExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recolher Ingredientes ({filtered.length})</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expandir Ingredientes ({filtered.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of preparations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(prep => {
          const totalWeight = prep.ingredients.reduce((a, b) => a + (Number(b.grams) || 0), 0);
          const cardProfile = calculatePreparationNutrients(prep, availableIngredients);
          const isIngExpanded = !!expandedIngredients[prep.id];
          const cardSteps = getInitialPreparationSteps(prep);
          const hasStructuredSteps = cardSteps.length > 0;
          const hasTextOnly = !hasStructuredSteps && !!prep.instructions && prep.instructions.trim().length > 0;
          const isPending = !hasStructuredSteps && !hasTextOnly;
          const usage = prepUsageMap.get(prep.id);

          return (
            <div
              key={prep.id}
              onClick={() => setViewingPrepForSteps(prep)}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/60 hover:shadow-amber-500/10 transition-all group cursor-pointer"
            >
              <div className="space-y-3">
                {/* Cabeçalho do Card: Badges à esquerda e Ações à direita */}
                <div className="flex items-center justify-between gap-2 min-h-[28px]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                        Custom
                      </span>
                    )}
                    {usage && usage.count > 0 && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 shrink-0"
                        title={`Utilizado em ${usage.count} receita(s):\n• ${usage.recipeNames.slice(0, 5).join('\n• ')}${usage.count > 5 ? `\n...e mais ${usage.count - 5} receita(s)` : ''}`}
                      >
                        <BookOpen className="w-3 h-3 text-emerald-400" />
                        <span>{usage.count} {usage.count === 1 ? 'receita' : 'receitas'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDuplicate(prep);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/15 rounded-lg transition-all cursor-pointer"
                      title={`Duplicar "${prep.name}"`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenEdit(prep);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 rounded-lg transition-all cursor-pointer"
                      title={`Editar "${prep.name}"`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(prep);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer"
                      title={`Excluir "${prep.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Título do Pré-Preparo: Espaço reservado para 2 linhas garantindo visualização completa e alinhamento uniforme */}
                <h3
                  className="font-bold text-base text-white group-hover:text-amber-200 transition-colors leading-snug break-words min-h-[2.75rem] flex items-start"
                  title={prep.name}
                >
                  <span className="line-clamp-2">{prep.name}</span>
                </h3>

                {/* Ingredientes Colapsáveis com Persistência */}
                <div
                  className="rounded-xl border border-slate-700/70 bg-slate-900/80 overflow-hidden transition-all"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => toggleIngredients(prep.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors cursor-pointer group/ing"
                    aria-expanded={isIngExpanded}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 group-hover/ing:text-white transition-colors truncate">
                      <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Composição:</span>
                      <span className="text-slate-400 font-normal truncate">
                        {prep.ingredients.length} {prep.ingredients.length === 1 ? 'item' : 'itens'} •{' '}
                        <span className="font-mono font-bold text-amber-300">{Math.round(totalWeight)} g</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover/ing:text-amber-300 transition-colors shrink-0 ml-2">
                      <span>{isIngExpanded ? 'Ocultar' : 'Ver'}</span>
                      {isIngExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/ing:text-amber-300" />
                      )}
                    </div>
                  </button>

                  {isIngExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
                      {prep.ingredients.map((ing, iIdx) => (
                        <div key={iIdx} className="flex justify-between text-xs sm:text-sm text-slate-200">
                          <span className="truncate pr-2">{ing.name}</span>
                          <span className="font-mono text-amber-300 font-bold shrink-0">{ing.grams} g</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-700 flex justify-between text-xs sm:text-sm font-black text-white">
                        <span>Peso Total:</span>
                        <span className="font-mono text-emerald-400">{Math.round(totalWeight)} g</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Card: Custo e Botão Modo de Preparo com Status */}
              <div
                className="pt-3.5 mt-3.5 border-t border-slate-700/60 flex items-center justify-between gap-3"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Custo Estimado
                  </span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                    R$ {cardProfile.costKg.toFixed(2)}
                    <span className="text-[11px] font-normal text-emerald-400/80">/kg</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingPrepForSteps(prep)}
                  className={`px-3 sm:px-3.5 py-2 border rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 font-bold text-xs sm:text-sm ${
                    hasStructuredSteps
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 hover:border-amber-400 text-amber-300'
                      : hasTextOnly
                      ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 hover:border-sky-400 text-sky-300'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/70 hover:border-amber-500/30 text-slate-400 hover:text-slate-200'
                  }`}
                  title={
                    hasStructuredSteps
                      ? `Visualizar formulação e ${cardSteps.length} passos de preparo de "${prep.name}"`
                      : hasTextOnly
                      ? `Visualizar formulação e instruções em texto de "${prep.name}"`
                      : `Visualizar formulação e cadastrar modo de preparo de "${prep.name}"`
                  }
                >
                  <ChefHat
                    className={`w-4 h-4 ${
                      hasStructuredSteps
                        ? 'text-amber-400'
                        : hasTextOnly
                        ? 'text-sky-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{hasStructuredSteps ? 'Modo de Preparo' : hasTextOnly ? 'Instruções' : 'Sem Preparo'}</span>
                  {hasStructuredSteps && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-200 font-mono font-bold">
                      {cardSteps.length}
                    </span>
                  )}
                  {hasTextOnly && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/25 text-sky-200 font-medium">
                      Texto
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 border border-slate-700/80 text-slate-400">
                      Pendente
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado Vazio de Busca / Filtros Combinados */}
      {filtered.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum item encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Nenhum pré-preparo ou variegato corresponde à combinação de filtros selecionados.
          </p>
          {(search || catFilter !== 'Todas' || methodFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCatFilter('Todas');
                setMethodFilter('todos');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      )}

      {/* Modal: Cadastrar / Editar Pré-preparo ou Variegato */}
      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-xl sm:max-w-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
                  👨‍🍳
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>
                      {editingPrep
                        ? `Editar ${editingPrep.category}: ${editingPrep.name}`
                        : 'Cadastrar Pré-preparo / Variegato'}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Defina a formulação em gramas e as orientações de cocção e armazenamento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                title="Fechar"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="space-y-4">
              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Nome da Preparação / Receita:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Calda de Frutas Vermelhas, Geleia de Morango..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Tipo / Classificação:
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Preparation['category'])}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="Pré-preparo">Pré-preparo (Base de Calda, Calda Mestre, Pasta)</option>
                    <option value="Variegato">Variegato (Recheio / Mescla de Cuba)</option>
                    <option value="Caldas">Caldas (Calda Fluida / Cobertura Artesanal)</option>
                    <option value="Creminos">Creminos (Ganache / Pasta Trufada Macia)</option>
                    <option value="Inclusões Crocantes">Inclusões Crocantes (Crumble, Crocante, Farofa Selada)</option>
                  </select>
                </div>
              </div>

              {/* Datalist de Insumos Registrados */}
              <datalist id="registered-ingredients-list">
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.name} />
                ))}
              </datalist>

              {/* Formulação de Insumos */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      Ingredientes da Receita
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                    Total: {Math.round(totalModalGrams)} g
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          list="registered-ingredients-list"
                          placeholder="Nome do ingrediente..."
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium focus:border-amber-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="w-28 sm:w-32 relative">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="Peso"
                          value={item.grams === '' ? '' : item.grams}
                          onChange={e => handleItemChange(idx, 'grams', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                          g
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        title="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Mais um Ingrediente</span>
                </button>
              </div>

              {/* Painel de Pré-visualização da Sincronização com a Aba Insumos */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Parâmetros Calculados para a Aba Insumos
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sincronização Automática
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Açúcares</span>
                    <span className="text-sm font-mono font-bold text-amber-300">
                      {(modalProfile.sugars * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gordura</span>
                    <span className="text-sm font-mono font-bold text-amber-300">
                      {(modalProfile.fat * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SLNG</span>
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {(modalProfile.msnf * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Outros Sólidos</span>
                    <span className="text-sm font-mono font-bold text-purple-300">
                      {(modalProfile.otherSolids * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">PAC</span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {Math.round(modalProfile.pac)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">POD</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {Math.round(modalProfile.pod)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sólidos Totais</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">
                      {(modalProfile.totalSolids * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Custo Estimado</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      R$ {modalProfile.costKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  Ao salvar este pré-preparo, o insumo correspondente na aba <strong className="text-slate-200">Insumos</strong> será atualizado com estes valores exatos, refletindo imediatamente no balanceamento e custo de todas as suas receitas.
                </p>
              </div>

              {/* Modo de Preparo com Abas: Passos Estruturados vs Texto Livre */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>Modo de Preparo & Orientações Técnicas:</span>
                  </label>

                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setPrepInputMode('steps')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        prepInputMode === 'steps'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Passos Estruturados ({steps.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrepInputMode('text')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        prepInputMode === 'text'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Texto Livre</span>
                    </button>
                  </div>
                </div>

                {prepInputMode === 'steps' ? (
                  <div className="space-y-3">
                    {steps.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-950/40">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                          <ChefHat className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-slate-400 max-w-sm mx-auto">
                          Nenhum passo estruturado adicionado ainda. Adicione passos individuais ou converta a partir de anotações em texto.
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleAddModalStep}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar Primeiro Passo</span>
                          </button>
                          {instructions.trim().length > 0 && (
                            <button
                              type="button"
                              onClick={handleConvertTextToStructuredSteps}
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Converter do Texto Existente</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {steps.map((step, sIdx) => {
                          return (
                            <div
                              key={step.id || sIdx}
                              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                            >
                              {/* Linha 1: Ordem, Título, Mover e Excluir */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs flex items-center justify-center shrink-0">
                                    {sIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={e => handleUpdateModalStep(sIdx, { title: e.target.value })}
                                    placeholder="Título do passo (ex: Caramelização, Forno em Banho-Maria)..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                  />
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveModalStep(sIdx, 'up')}
                                    disabled={sIdx === 0}
                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover para cima"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveModalStep(sIdx, 'down')}
                                    disabled={sIdx === steps.length - 1}
                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover para baixo"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteModalStep(sIdx)}
                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-colors ml-1"
                                    title="Excluir este passo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Linha 2: Categoria, Temperatura e Duração */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Operação:
                                  </label>
                                  <select
                                    value={step.category || 'outro'}
                                    onChange={e => handleUpdateModalStep(sIdx, { category: e.target.value as PreparationStepCategory })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-500"
                                  >
                                    {Object.entries(STEP_CATEGORIES_META).map(([k, m]) => (
                                      <option key={k} value={k}>
                                        {m.emoji} {m.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Temperatura:
                                  </label>
                                  <input
                                    type="text"
                                    value={step.temperature || ''}
                                    onChange={e => handleUpdateModalStep(sIdx, { temperature: e.target.value })}
                                    placeholder="Ex: 180°C, 85°C, 4°C, Ambiente..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-amber-300 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Tempo / Duração:
                                  </label>
                                  <input
                                    type="text"
                                    value={step.duration || ''}
                                    onChange={e => handleUpdateModalStep(sIdx, { duration: e.target.value })}
                                    placeholder="Ex: 1h50m, 15 min, 6h a 12h..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-sky-300 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                                  />
                                </div>
                              </div>

                              {/* Linha 3: Descrição */}
                              <div>
                                <textarea
                                  rows={2}
                                  value={step.description}
                                  onChange={e => handleUpdateModalStep(sIdx, { description: e.target.value })}
                                  placeholder="Descreva o procedimento operacional, técnicas de cocção, ponto ou cuidados..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-y leading-relaxed"
                                />
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={handleAddModalStep}
                          className="w-full py-2.5 border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 group bg-slate-950/40 hover:bg-amber-500/5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>Adicionar Outro Passo Operacional</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      placeholder="Ex: Assar por 1h50m a 180 graus. Cobrir com papel alumínio e colocar assadeira com água embaixo..."
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors leading-relaxed"
                    />
                    {instructions.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleConvertTextToStructuredSteps}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Converter este Texto em Passos Estruturados</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Alerta de Validação ou Erro */}
              {modalError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Rodapé do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPrep(null);
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Salvando e Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar {category}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Dedicado de Visualização de Ingredientes & Modo de Preparo */}
      <PrePreparoViewerModal
        prep={viewingPrepForSteps}
        isOpen={!!viewingPrepForSteps}
        onClose={() => setViewingPrepForSteps(null)}
        onOpenEdit={handleOpenEdit}
        availableIngredients={availableIngredients}
      />
    </div>
  );
};
