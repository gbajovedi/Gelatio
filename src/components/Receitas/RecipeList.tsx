import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient } from '../../types/gelato';
import {
  Search,
  Plus,
  Trash2,
  BookOpen,
  Eye,
  X,
  Scale,
  Copy,
  ArrowUpDown,
  Layers,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  GraduationCap,
  FileText,
  Package
} from 'lucide-react';
import { db, stylesDataMap } from '../../db/database';
import { calculateBatchAnalysis } from '../../core/calculator';
import {
  STYLES_UPDATED_EVENT,
  getActivePresetId,
  applyGoldStandardPreset,
  applyCarpigianiPreset,
  applyCustomPreset,
  saveStoredStyles,
  getStoredStyles,
  StylePresetId
} from '../../core/stylesStorage';
import { RecipeViewerModal } from './RecipeViewerModal';
import { AnvisaNutritionalModal } from './AnvisaNutritionalModal';
import { StyleSettingsModal } from '../Balanceamento/StyleSettingsModal';
import { VariegatoQuickModal } from './VariegatoQuickModal';
import { getCategoryTheme, CategoryBadge } from '../../core/categoryThemes';

interface RecipeListProps {
  recipes: Recipe[];
  ingredients?: Ingredient[];
  onSelectRecipe: (id: string) => void;
  onProduceRecipe?: (id: string) => void;
  onRefresh: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  ingredients = [],
  onSelectRecipe,
  onProduceRecipe,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'balanced' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'custom-first' | 'cost-asc' | 'pac-desc'>('name-asc');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Sincronizar viewingRecipe quando as mesclas forem salvas ou recarregadas
  useEffect(() => {
    if (viewingRecipe) {
      const fresh = recipes.find(r => r.id === viewingRecipe.id);
      if (fresh) {
        setViewingRecipe(fresh);
      }
    }
  }, [recipes]);
  const [nutritionalRecipe, setNutritionalRecipe] = useState<Recipe | null>(null);
  const [editingVariegatoRecipe, setEditingVariegatoRecipe] = useState<Recipe | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [stylesRevision, setStylesRevision] = useState(0);
  const [activePreset, setActivePreset] = useState<StylePresetId>(() => getActivePresetId());

  // Reage imediatamente a alterações nas metas físico-químicas
  useEffect(() => {
    const handleStylesUpdate = () => {
      setStylesRevision(prev => prev + 1);
      setActivePreset(getActivePresetId());
    };
    window.addEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
    window.addEventListener('storage', handleStylesUpdate);
    return () => {
      window.removeEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
      window.removeEventListener('storage', handleStylesUpdate);
    };
  }, []);

  // Sincroniza a receita aberta em visualização caso seus dados sejam atualizados externamente
  useEffect(() => {
    if (viewingRecipe) {
      const fresh = recipes.find(r => r.id === viewingRecipe.id);
      if (fresh && fresh !== viewingRecipe) {
        setViewingRecipe(fresh);
      }
    }
  }, [recipes, viewingRecipe]);

  const handleSelectPreset = (preset: StylePresetId) => {
    if (preset === 'gold') {
      applyGoldStandardPreset();
      setActivePreset('gold');
    } else if (preset === 'carpigiani') {
      applyCarpigianiPreset();
      setActivePreset('carpigiani');
    } else if (preset === 'custom') {
      if (activePreset !== 'custom') {
        applyCustomPreset();
        setActivePreset('custom');
      } else {
        setIsStyleModalOpen(true);
      }
    }
  };

  // Fast ingredient lookup map
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Pre-calculate technical metrics for each recipe
  const metrics = useMemo(() => {
    const map = new Map<
      string,
      {
        pac: number;
        pod: number;
        fatPct: number;
        sugarsPct: number;
        costKg: number;
        totalWeight: number;
        caldaWeight: number;
        variegatoWeight: number;
        variegatoCost: number;
        variegatoCount: number;
        needsAdjustment: boolean;
        unbalanceReasons: string[];
      }
    >();

    for (const recipe of recipes) {
      let caldaWeight = 0;
      let caldaCost = 0;
      let variegatoWeight = 0;
      let variegatoCost = 0;

      for (const item of recipe.ingredients || []) {
        caldaWeight += item.grams;
        const ing = ingredientsMap.get(item.name.toLowerCase().trim());
        if (ing) {
          caldaCost += (item.grams / 1000) * (ing.costKg || 0);
        }
      }

      const validVariegatos = (recipe.variegatos || []).filter(v => v.name && v.grams > 0);
      for (const v of validVariegatos) {
        variegatoWeight += v.grams;
        const ing = ingredientsMap.get(v.name.toLowerCase().trim());
        const unitCost = v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0);
        variegatoCost += (v.grams / 1000) * unitCost;
      }

      const totalWeight = caldaWeight + variegatoWeight;
      const totalCost = caldaCost + variegatoCost;
      const costKg = totalWeight > 0 ? (totalCost / (totalWeight / 1000)) : 0;

      // Target style standard
      const targetStyleName = recipe.targetStyle || recipe.category || 'Gelatos de Leite';
      const currentStyle = stylesDataMap[targetStyleName] || stylesDataMap['Gelatos de Leite'];

      let pacVal = 0;
      let podVal = 0;
      let fatPct = 0;
      let sugarsPct = 0;
      let needsAdjustment = false;
      const unbalanceReasons: string[] = [];

      if (recipe.ingredients && recipe.ingredients.length > 0 && currentStyle) {
        const analysis = calculateBatchAnalysis(
          recipe.ingredients,
          recipe.variegatos || [],
          currentStyle,
          ingredientsMap
        );

        pacVal = Math.round(analysis.percentages.pac);
        podVal = Math.round(analysis.percentages.pod);
        fatPct = analysis.percentages.fat * 100;
        sugarsPct = analysis.percentages.sugars * 100;

        const isCriticalDeviation = (val: number, min: number, max: number, tol: number) =>
          val < (min - tol) || val > (max + tol);

        const criticalReasons: string[] = [];

        // 1. Risco crítico de arenosidade (Fórmula de Caviezel: SLNG excede teto seguro em > 0.8%)
        const sandiness = analysis.sandinessRisk;
        if (sandiness && sandiness.isAtRisk && sandiness.excessPct > 0.008) {
          criticalReasons.push(
            `Arenosidade: SLNG (${(analysis.percentages.msnf * 100).toFixed(1)}%) excede o teto seguro de Caviezel (${(sandiness.maxSafeMsnf * 100).toFixed(1)}%)`
          );
        }

        // 2. Desvios críticos de PAC ou POD (> 15 pontos da meta)
        if (isCriticalDeviation(analysis.percentages.pac, currentStyle.min.pac, currentStyle.max.pac, 15)) {
          criticalReasons.push(`PAC fora de tolerância (${Math.round(analysis.percentages.pac)} vs meta ${currentStyle.min.pac}-${currentStyle.max.pac})`);
        }
        if (isCriticalDeviation(analysis.percentages.pod, currentStyle.min.pod, currentStyle.max.pod, 15)) {
          criticalReasons.push(`POD fora de tolerância (${Math.round(analysis.percentages.pod)} vs meta ${currentStyle.min.pod}-${currentStyle.max.pod})`);
        }

        // 3. Desvios críticos de Gordura ou Açúcares (> 2.0% da meta)
        if (isCriticalDeviation(analysis.percentages.fat, currentStyle.min.fat, currentStyle.max.fat, 0.02)) {
          criticalReasons.push(`Gordura (${(analysis.percentages.fat * 100).toFixed(1)}% vs meta ${(currentStyle.min.fat * 100).toFixed(0)}-${(currentStyle.max.fat * 100).toFixed(0)}%)`);
        }
        if (isCriticalDeviation(analysis.percentages.sugars, currentStyle.min.sugars, currentStyle.max.sugars, 0.02)) {
          criticalReasons.push(`Açúcares (${(analysis.percentages.sugars * 100).toFixed(1)}% vs meta ${(currentStyle.min.sugars * 100).toFixed(0)}-${(currentStyle.max.sugars * 100).toFixed(0)}%)`);
        }

        needsAdjustment = criticalReasons.length > 0;
        unbalanceReasons.push(...criticalReasons);
      }

      map.set(recipe.id, {
        pac: pacVal,
        pod: podVal,
        fatPct,
        sugarsPct,
        costKg,
        totalWeight,
        caldaWeight,
        variegatoWeight,
        variegatoCost,
        variegatoCount: validVariegatos.length,
        needsAdjustment,
        unbalanceReasons
      });
    }

    return map;
  }, [recipes, ingredientsMap, stylesRevision]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (r.category) set.add(r.category);
    }
    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
    return ['Todas', ...sorted];
  }, [recipes]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: 0 };
    for (const r of recipes) {
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchSearch) continue;

      const isCritical = metrics.get(r.id)?.needsAdjustment;
      if (balanceFilter === 'balanced' && isCritical) continue;
      if (balanceFilter === 'critical' && !isCritical) continue;

      counts.Todas = (counts.Todas || 0) + 1;
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    }
    return counts;
  }, [recipes, search, balanceFilter, metrics]);

  // Contadores contextuais dinâmicos para o Cockpit de Status de Balanceamento
  const balanceStatusCounts = useMemo(() => {
    let all = 0;
    let balanced = 0;
    let critical = 0;

    for (const r of recipes) {
      const matchCat = selectedCategory === 'Todas' || r.category === selectedCategory;
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchCat || !matchSearch) continue;

      all++;
      if (metrics.get(r.id)?.needsAdjustment) {
        critical++;
      } else {
        balanced++;
      }
    }

    return { all, balanced, critical };
  }, [recipes, selectedCategory, search, metrics]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = selectedCategory === 'Todas' || r.category === selectedCategory;
      const matchSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())));
      if (!matchCat || !matchSearch) return false;

      const isCritical = metrics.get(r.id)?.needsAdjustment;
      if (balanceFilter === 'balanced' && isCritical) return false;
      if (balanceFilter === 'critical' && !isCritical) return false;

      return true;
    });
  }, [recipes, search, selectedCategory, balanceFilter, metrics]);

  const sortedAndFilteredRecipes = useMemo(() => {
    const list = [...filteredRecipes];
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'custom-first') {
      list.sort((a, b) => (b.isCustom ? 1 : 0) - (a.isCustom ? 1 : 0) || a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'cost-asc') {
      list.sort((a, b) => {
        const costA = metrics.get(a.id)?.costKg || 0;
        const costB = metrics.get(b.id)?.costKg || 0;
        return costA - costB;
      });
    } else if (sortBy === 'pac-desc') {
      list.sort((a, b) => {
        const pacA = metrics.get(a.id)?.pac || 0;
        const pacB = metrics.get(b.id)?.pac || 0;
        return pacB - pacA;
      });
    }
    return list;
  }, [filteredRecipes, sortBy, metrics]);

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a receita "${name}"? Esta ação removerá a receita do catálogo.`)) {
      await db.recipes.delete(id);
      onRefresh();
    }
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: `${recipe.name} (Cópia)`,
      isCustom: true
    };
    await db.recipes.add(newRecipe);
    onRefresh();
  };

  return (
    <>
      <div className="no-print space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header & Search */}
        <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-amber-400" />
                <span>Catálogo & Livro de Receitas</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Toque em qualquer receita para abrir a <strong>Ficha de Produção (Modo Cozinha)</strong> ou clique em{' '}
                <strong>Balancear</strong> para calibrar a fórmula na bancada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectRecipe('new')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Receita</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative w-full">
              <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por sabor ou insumo (ex: pistache, chocolate, maracujá, manga)..."
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

            {/* Linha de Controles: Seletor de Fórmula (Metodologia) + Cockpit de Status */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5 pb-1">
              {/* Seletor de Metodologia/Fórmula */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                  Fórmula:
                </span>
                <div className="inline-flex p-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl gap-1 shadow-inner flex-wrap">
                  {/* Padrão Ouro */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('gold')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activePreset === 'gold'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    }`}
                    title="Padrão Ouro Híbrido Protegido (PAC Clássico Italiano + Caviezel Anti-Arenosidade)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Padrão Ouro</span>
                  </button>

                  {/* Padrão Clássico Italiano */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('carpigiani')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activePreset === 'carpigiani'
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                        : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/10'
                    }`}
                    title="Padrão Clássico Italiano - Diretrizes Acadêmicas Tradicionais"
                  >
                    <GraduationCap className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Padrão Clássico Italiano</span>
                  </button>

                  {/* Personalizado */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activePreset === 'custom'
                        ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20 font-black'
                        : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
                    }`}
                    title="Metas Customizadas do Mestre Gelatiere (clique para abrir edição)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Personalizado</span>
                  </button>
                </div>
              </div>

              {/* Status de Balanceamento: Cockpit de Ação Rápida */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                  Status:
                </span>
                <div className="inline-flex p-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl gap-1 shadow-inner flex-wrap">
                  {/* Todas */}
                  <button
                    type="button"
                    onClick={() => setBalanceFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      balanceFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <Layers
                      className={`w-3.5 h-3.5 ${
                        balanceFilter === 'all' ? 'text-slate-950 stroke-[2.4]' : 'text-slate-400'
                      }`}
                    />
                    <span>Todas</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        balanceFilter === 'all'
                          ? 'bg-amber-600/35 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {balanceStatusCounts.all}
                    </span>
                  </button>

                  {/* Balanceadas */}
                  <button
                    type="button"
                    onClick={() => setBalanceFilter('balanced')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      balanceFilter === 'balanced'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        balanceFilter === 'balanced' ? 'text-slate-950 stroke-[2.6]' : 'text-emerald-400'
                      }`}
                    />
                    <span>Balanceadas</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        balanceFilter === 'balanced'
                          ? 'bg-emerald-600/35 text-slate-950 font-black'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {balanceStatusCounts.balanced}
                    </span>
                  </button>

                  {/* Precisam de Ajuste */}
                  <button
                    type="button"
                    onClick={() => setBalanceFilter('critical')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      balanceFilter === 'critical'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <AlertCircle
                      className={`w-3.5 h-3.5 ${
                        balanceFilter === 'critical' ? 'text-slate-950 stroke-[2.6]' : 'text-amber-400'
                      }`}
                    />
                    <span>Precisam de Ajuste</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        balanceFilter === 'critical'
                          ? 'bg-amber-600/35 text-slate-950 font-black'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {balanceStatusCounts.critical}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category filter pills with counters and unique icons */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                const count = categoryCounts[cat] || 0;
                const catTheme = cat !== 'Todas' ? getCategoryTheme(cat) : null;
                const isDimmed = count === 0 && cat !== 'Todas' && !isSelected;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : isDimmed
                        ? 'bg-slate-900/60 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 opacity-60'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {catTheme ? (
                      <span className={isSelected ? 'text-slate-950' : ''}>
                        {catTheme.icon}
                      </span>
                    ) : (
                      <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                    )}
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isSelected
                          ? 'bg-amber-600/30 text-slate-950'
                          : isDimmed
                          ? 'bg-slate-800/50 text-slate-500'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-bar: Results Count & Quick Sort */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Exibindo <strong className="text-amber-400 font-mono font-bold">{sortedAndFilteredRecipes.length}</strong>{' '}
                  de <strong className="text-slate-200 font-mono font-bold">{recipes.length}</strong> receitas
                  {balanceFilter !== 'all' && (
                    <span>
                      {' '}
                      (
                      <strong className={balanceFilter === 'balanced' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {balanceFilter === 'balanced' ? 'Balanceadas' : 'Precisam de Ajuste'}
                      </strong>
                      )
                    </span>
                  )}
                  {selectedCategory !== 'Todas' && (
                    <span>
                      {' '}
                      em <span className="text-white font-bold">{selectedCategory}</span>
                    </span>
                  )}
                </span>

                {(selectedCategory !== 'Todas' || balanceFilter !== 'all' || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Todas');
                      setBalanceFilter('all');
                      setSearch('');
                    }}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 underline font-semibold ml-2 cursor-pointer transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-400">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  <option value="name-asc">Nome (A - Z)</option>
                  <option value="custom-first">Personalizadas Primeiro</option>
                  <option value="cost-asc">Menor Custo/kg</option>
                  <option value="pac-desc">Maior PAC (Mais Macio)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsStyleModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all shadow-inner flex items-center gap-1.5 shrink-0 group"
                  title="Configurar metas físico-químicas e limites técnicos dos estilos"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
                  <span className="hidden sm:inline">Metas Técnicas</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of recipe cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAndFilteredRecipes.map(recipe => {
            const m = metrics.get(recipe.id);
            const totalWeight = m?.totalWeight ?? (recipe.ingredients ? recipe.ingredients.reduce((a, b) => a + b.grams, 0) : 0);
            const theme = getCategoryTheme(recipe.category);

            return (
              <div
                key={recipe.id}
                className="relative overflow-hidden bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-5 shadow-lg hover:border-amber-500/50 transition-all flex flex-col justify-between group hover:shadow-amber-500/5 cursor-pointer"
                onClick={() => setViewingRecipe(recipe)}
              >
                {/* Top Category Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />

                <div className="space-y-3.5">
                  {/* Meta Badges (Category & Custom & Variegato & Warning) + Ações Rápidas no Canto Superior Direito */}
                  <div className="flex items-center justify-between gap-2 min-h-[32px]">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <CategoryBadge category={recipe.category} />

                      {recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVariegatoRecipe(recipe);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                          title={`Clique para gerenciar mesclas desta receita (${recipe.variegatos.length} cadastrada${recipe.variegatos.length > 1 ? 's' : ''})`}
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
                      )}
                      {recipe.isCustom && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold whitespace-nowrap">
                          ✨ Personalizada
                        </span>
                      )}
                      {m?.needsAdjustment && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectRecipe(recipe.id);
                          }}
                          title={
                            m.unbalanceReasons.length > 0
                              ? `Ajuste recomendado na fórmula:\n• ${m.unbalanceReasons.join('\n• ')}\n\nClique para balancear na bancada`
                              : 'Ajuste recomendado na fórmula\n\nClique para balancear na bancada'
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
                          aria-label="Ajuste recomendado na fórmula"
                        >
                          <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 stroke-[2.3]" />
                        </button>
                      )}
                    </div>

                    {/* Botões de Ações Rápidas: Mesclas, Tabela Nutricional, Copiar e Excluir no Canto Superior Direito */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingVariegatoRecipe(recipe)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 border ${
                          recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0)
                            ? 'text-amber-300 bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/15 border-slate-700/80 hover:border-amber-500/30'
                        }`}
                        title={
                          recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0)
                            ? `Gerenciar mesclas de "${recipe.name}" (${recipe.variegatos.length} vinculada${recipe.variegatos.length > 1 ? 's' : ''})`
                            : `Adicionar mescla / variegato a "${recipe.name}"`
                        }
                      >
                        <span className="text-xs">🍯</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNutritionalRecipe(recipe)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/15 border border-slate-700/80 hover:border-emerald-500/30 flex items-center justify-center transition-colors active:scale-95"
                        title={`Tabela Nutricional ANVISA de "${recipe.name}"`}
                      >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateRecipe(recipe)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/15 border border-slate-700/80 hover:border-amber-500/30 flex items-center justify-center transition-colors active:scale-95"
                        title={`Duplicar receita "${recipe.name}"`}
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-700/80 hover:border-rose-500/30 flex items-center justify-center transition-colors active:scale-95"
                        title="Excluir esta receita do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recipe Title: Altura mínima para 2 linhas garantindo alinhamento uniforme do cockpit de dados */}
                  <h3
                    className="font-bold text-base sm:text-lg text-white group-hover:text-amber-200 transition-colors leading-snug break-words min-h-[2.85rem] sm:min-h-[3.35rem] flex items-start"
                    title={recipe.name}
                  >
                    <span>{recipe.name}</span>
                  </h3>

                  {/* Pílulas em Destaque de Mesclas e Variegatos */}
                  {recipe.variegatos && recipe.variegatos.some(v => v.name && v.grams > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1" onClick={e => e.stopPropagation()}>
                      {recipe.variegatos.filter(v => v.name && v.grams > 0).map((v, i) => {
                        const ing = ingredientsMap.get(v.name.toLowerCase().trim());
                        const unitCost = v.costKg !== undefined && v.costKg > 0 ? v.costKg : (ing ? ing.costKg : 0);
                        const itemCost = (v.grams * unitCost) / 1000;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditingVariegatoRecipe(recipe)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                            title={`Mescla pós-calda: ${v.name} (${v.grams}g) — Custo: R$ ${itemCost.toFixed(2).replace('.', ',')}\nClique para gerenciar mesclas`}
                          >
                            <span className="text-amber-400">🍯</span>
                            <span className="truncate max-w-[140px] sm:max-w-[170px]">{v.name}</span>
                            <span className="text-amber-400 font-mono text-[11px] font-extrabold bg-amber-500/20 px-1 py-0.5 rounded">
                              {v.grams}g
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Linha unificada: Insumos, Peso base e Custo/kg */}
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-400 font-mono font-medium pt-1">
                    <span
                      className="flex items-center gap-1.5"
                      title={m?.variegatoCount ? `${recipe.ingredients?.length ?? 0} insumos na calda base + ${m.variegatoCount} mescla(s) pós-congelamento` : 'Quantidade de insumos na fórmula'}
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Insumos: <strong className="text-slate-200 font-bold">
                          {recipe.ingredients?.length ?? 0}
                          {m?.variegatoCount ? ` + ${m.variegatoCount}` : ''}
                        </strong>
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1.5"
                      title={m?.variegatoWeight ? `Peso total do lote pronto: ${Math.round(m.caldaWeight || 0)}g calda + ${Math.round(m.variegatoWeight)}g mescla` : 'Peso base da calda'}
                    >
                      <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Peso: <strong className="text-slate-200 font-bold">{Math.round(totalWeight)} g</strong>
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25 text-amber-300 font-bold text-xs"
                      title={m?.variegatoWeight ? `Custo consolidado por kg (calda + mesclas somadas)` : 'Custo estimado por kg de insumos'}
                    >
                      <span>
                        {m?.costKg !== undefined && m.costKg > 0
                          ? `R$ ${m.costKg.toFixed(2).replace('.', ',')}/kg`
                          : 'R$ --/kg'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions: 3 botões perfeitamente equilibrados */}
                <div
                  className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-700/60"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setViewingRecipe(recipe)}
                    className="flex-1 h-9 sm:h-10 px-2 bg-slate-900/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm min-w-0"
                    title="Abrir ficha técnica de produção e modo cozinha"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="whitespace-nowrap">Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecipe(recipe.id)}
                    className="flex-1 h-9 sm:h-10 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/15 active:scale-95 min-w-0"
                    title="Balancear receita na bancada"
                  >
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Balancear</span>
                  </button>

                  {onProduceRecipe && (
                    <button
                      type="button"
                      onClick={() => onProduceRecipe(recipe.id)}
                      className="flex-1 h-9 sm:h-10 px-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold border border-emerald-500/40 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 min-w-0"
                      title={`Produzir lote de "${recipe.name}" no estoque`}
                    >
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Produzir</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedAndFilteredRecipes.length === 0 && (
          <div className="text-center py-16 bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium">
            Nenhuma receita encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Full-Screen Kitchen Mode Viewer Modal */}
      <RecipeViewerModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onOpenInCalculator={onSelectRecipe}
        onRecipeUpdated={onRefresh}
        availableIngredients={ingredients}
      />

      {/* Modal da Tabela Nutricional Oficial ANVISA */}
      <AnvisaNutritionalModal
        recipe={nutritionalRecipe}
        isOpen={!!nutritionalRecipe}
        onClose={() => setNutritionalRecipe(null)}
        ingredients={ingredients}
      />

      {/* Modal Rápido de Gestão de Mesclas & Variegatos */}
      <VariegatoQuickModal
        recipe={editingVariegatoRecipe}
        availableIngredients={ingredients}
        isOpen={!!editingVariegatoRecipe}
        onClose={() => setEditingVariegatoRecipe(null)}
        onSaved={() => {
          onRefresh();
        }}
      />

      {/* Modal de Ajuste de Metas Físico-Químicas */}
      <StyleSettingsModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        initialStyleName={selectedCategory !== 'Todas' ? selectedCategory : 'Gelatos de Leite'}
        onStyleUpdated={() => {
          setStylesRevision(prev => prev + 1);
        }}
      />
    </>
  );
};
