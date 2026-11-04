import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Recipe, Ingredient, StyleStandard, VariegatoItem, RecipeItem } from '../../types/gelato';
import { calculateBatchAnalysis } from '../../core/calculator';
import { getStoredPricingParams, getPricingSettings, PRICING_UPDATED_EVENT, PricingParams } from '../../core/pricingStorage';
import {
  STYLES_UPDATED_EVENT,
  getActivePresetId,
  applyGoldStandardPreset,
  applyCarpigianiPreset,
  applyCustomPreset,
  hasCarpigianiData,
  isOfficialStyle,
  isStyleModifiedFromOfficial,
  resetSingleStyleToReference,
  StylePresetId
} from '../../core/stylesStorage';
import { stylesDataMap, db } from '../../db/database';
import { NutrientBars } from './NutrientBars';
import { CalibrationAlerts } from './CalibrationAlerts';
import { AllergensBadge } from './AllergensBadge';
import { PostProduction } from './PostProduction';
import { SaveRecipeModal } from './SaveRecipeModal';
import { RecipeSearchCombobox } from './RecipeSearchCombobox';
import { ProfitSimulator } from './ProfitSimulator';
import { StyleSettingsModal } from './StyleSettingsModal';
import { StyleSearchCombobox } from './StyleSearchCombobox';
import { CategoryBadge, getCategoryTheme } from '../../core/categoryThemes';
import {
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Scale,
  Printer,
  ChevronDown,
  Sparkles,
  DollarSign,
  Layers,
  ChefHat,
  X,
  ArrowDownWideNarrow,
  AlertTriangle,
  PieChart,
  SlidersHorizontal,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

const getIngredientCategoryPill = (category?: string) => {
  if (!category) return null;
  switch (category) {
    case 'Laticínios':
      return { icon: '🥛', label: 'Lácteo', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
    case 'Açúcares':
      return { icon: '🍬', label: 'Açúcar', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    case 'Chocolates & Cacau':
      return { icon: '🍫', label: 'Cacau', color: 'bg-amber-900/30 text-amber-200 border-amber-700/40' };
    case 'Pastas & Oleaginosas':
      return { icon: '🌰', label: 'Pasta', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    case 'Frutas':
    case 'Frutas & Polpas':
      return { icon: '🍓', label: 'Fruta', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    case 'Neutros & Fibras':
    case 'Neutros, Gomas & Fibras':
      return { icon: '🧪', label: 'Neutro', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    case 'Bases & Pré-preparos':
      return { icon: '🥣', label: 'Base', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    case 'Variegatos & Recheios':
      return { icon: '🍯', label: 'Mescla', color: 'bg-yellow-600/15 text-yellow-200 border-yellow-600/30' };
    case 'Álcoois & Bebidas':
      return { icon: '🍸', label: 'Álcool', color: 'bg-amber-600/20 text-amber-300 border-amber-500/40' };
    case 'Bebidas Vegetais & Plant-Based':
      return { icon: '🌱', label: 'Vegetal', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    case 'Ovos & Proteínas':
      return { icon: '🥚', label: 'Ovo/Prot', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' };
    case 'Confeitaria & Inclusões':
      return { icon: '🍪', label: 'Confeitaria', color: 'bg-orange-600/20 text-orange-200 border-orange-500/40' };
    default:
      return { icon: '📦', label: category, color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
  }
};

interface BalancingScreenProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  initialRecipeId?: string;
  recipeSelectionToken?: number;
  onRecipeSaved: () => void;
  onActiveRecipeChange?: (id: string) => void;
}

/**
 * Retorna a primeira receita em ordem alfabética do catálogo.
 */
const getFirstAlphabeticalRecipe = (recs: Recipe[]): Recipe | undefined => {
  if (!recs || recs.length === 0) return undefined;
  return [...recs].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))[0];
};

/**
 * Localiza a receita alvo para a bancada (pelo ID salvo ou fallback alfabético).
 */
const getTargetInitialRecipe = (recs: Recipe[], targetId?: string): Recipe | undefined => {
  if (!recs || recs.length === 0) return undefined;
  if (targetId && targetId !== 'new') {
    const found = recs.find(r => r.id === targetId);
    if (found) return found;
  }
  return getFirstAlphabeticalRecipe(recs);
};

export const BalancingScreen: React.FC<BalancingScreenProps> = ({
  recipes,
  ingredients,
  initialRecipeId,
  recipeSelectionToken,
  onRecipeSaved,
  onActiveRecipeChange
}) => {
  // Obter receita inicial com fallback seguro para a primeira do catálogo alfabético
  const initialRecipe = useMemo(() => {
    if (initialRecipeId === 'new') return undefined;
    return getTargetInitialRecipe(recipes, initialRecipeId);
  }, []);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(() => {
    if (initialRecipeId === 'new') return 'new';
    return initialRecipe?.id || (initialRecipeId && initialRecipeId !== 'new' ? initialRecipeId : (getFirstAlphabeticalRecipe(recipes)?.id ?? ''));
  });

  const lastLoadedRecipeIdRef = useRef<string | null>(initialRecipe?.id || (initialRecipeId === 'new' ? 'new' : null));
  const lastActionTokenRef = useRef<number>(recipeSelectionToken || 0);

  const [recipeName, setRecipeName] = useState<string>(() => {
    if (initialRecipeId === 'new') return 'Novo Gelato Artesanal';
    return initialRecipe?.name || 'Receita sem título';
  });

  const [targetStyleName, setTargetStyleName] = useState<string>(() => {
    if (initialRecipeId === 'new') return 'Gelatos de Leite';
    return initialRecipe?.targetStyle || initialRecipe?.category || 'Gelatos de Leite';
  });

  const [items, setItems] = useState<RecipeItem[]>(() => {
    if (initialRecipeId === 'new') {
      return [
        { name: 'Leite Integral', grams: 620 },
        { name: 'Creme De Leite Fresco 35%', grams: 150 },
        { name: 'Leite Em Pó Desnatado', grams: 45 },
        { name: 'Açúcar', grams: 120 },
        { name: 'Dextrose', grams: 35 },
        { name: 'Neutro', grams: 5 }
      ];
    }
    return initialRecipe?.ingredients ? JSON.parse(JSON.stringify(initialRecipe.ingredients)) : [];
  });

  const [variegatos, setVariegatos] = useState<VariegatoItem[]>(() => {
    return initialRecipe?.variegatos ? JSON.parse(JSON.stringify(initialRecipe.variegatos)) : [];
  });

  const [isDirty, setIsDirty] = useState<boolean>(() => initialRecipeId === 'new');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [styleModalInitialName, setStyleModalInitialName] = useState<string | undefined>(undefined);
  const [styleModalCreateMode, setStyleModalCreateMode] = useState<boolean>(false);
  const [stylesRevision, setStylesRevision] = useState<number>(0);
  const [activePresetId, setActivePresetId] = useState<StylePresetId>(() => getActivePresetId());

  const [batchScaleInput, setBatchScaleInput] = useState<string>(() => {
    if (initialRecipeId === 'new') return '975';
    const totalG = initialRecipe?.ingredients ? initialRecipe.ingredients.reduce((acc, i) => acc + i.grams, 0) : 1000;
    return String(Math.round(totalG));
  });

  const [lastActiveRecipeId, setLastActiveRecipeId] = useState<string>(() => {
    return initialRecipe?.id || (initialRecipeId && initialRecipeId !== 'new' ? initialRecipeId : (getFirstAlphabeticalRecipe(recipes)?.id ?? ''));
  });

  const handleOpenStyleSettings = (styleName?: string, createMode?: boolean) => {
    setStyleModalInitialName(styleName || targetStyleName);
    setStyleModalCreateMode(!!createMode);
    setIsStyleModalOpen(true);
  };

  // Map of ingredients by lowercase name for fast lookup
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Load recipe into editor
  const loadRecipe = (rec: Recipe) => {
    setSelectedRecipeId(rec.id);
    lastLoadedRecipeIdRef.current = rec.id;
    if (rec.id !== 'new') {
      setLastActiveRecipeId(rec.id);
      try {
        localStorage.setItem('gelato_active_recipe_id', rec.id);
      } catch {}
      if (onActiveRecipeChange) onActiveRecipeChange(rec.id);
    }
    setRecipeName(rec.name);
    setTargetStyleName(rec.targetStyle || rec.category || 'Gelatos de Leite');
    setItems(rec.ingredients ? JSON.parse(JSON.stringify(rec.ingredients)) : []);
    setVariegatos(rec.variegatos ? JSON.parse(JSON.stringify(rec.variegatos)) : []);
    const totalG = rec.ingredients ? rec.ingredients.reduce((acc, i) => acc + i.grams, 0) : 1000;
    setBatchScaleInput(String(Math.round(totalG)));
    setIsDirty(false);
  };

  useEffect(() => {
    // 1. Ação explícita disparada a partir do catálogo (ex: 'Criar Nova Receita' ou 'Balancear')
    if (recipeSelectionToken && recipeSelectionToken !== lastActionTokenRef.current) {
      lastActionTokenRef.current = recipeSelectionToken;
      if (initialRecipeId === 'new') {
        handleStartNewRecipe();
        return;
      }
      if (initialRecipeId) {
        const found = recipes.find(r => r.id === initialRecipeId);
        if (found) {
          loadRecipe(found);
          return;
        }
      }
    }

    // 2. Sincronização padrão ou montagem inicial
    if (initialRecipeId === 'new') {
      if (lastLoadedRecipeIdRef.current !== 'new' || items.length === 0) {
        handleStartNewRecipe();
      }
      return;
    }

    // Determinar a receita que deve estar carregada (pelo ID ativo ou fallback para primeira em ordem alfabética)
    const target = getTargetInitialRecipe(recipes, initialRecipeId);
    if (target) {
      const shouldLoad =
        lastLoadedRecipeIdRef.current !== target.id ||
        items.length === 0 ||
        recipeName === 'Receita sem título';

      if (shouldLoad) {
        loadRecipe(target);
      }
    }
  }, [initialRecipeId, recipeSelectionToken, recipes]);

  // Sincronização em tempo real com metas físico-químicas
  useEffect(() => {
    const handleStylesUpdate = (e: Event) => {
      setStylesRevision(prev => prev + 1);
      const customEvt = e as CustomEvent;
      if (customEvt?.detail?.presetId) {
        setActivePresetId(customEvt.detail.presetId);
      } else {
        setActivePresetId(getActivePresetId());
      }
    };
    window.addEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
    window.addEventListener('storage', handleStylesUpdate);
    return () => {
      window.removeEventListener(STYLES_UPDATED_EVENT, handleStylesUpdate);
      window.removeEventListener('storage', handleStylesUpdate);
    };
  }, []);

  const currentStyle: StyleStandard = useMemo(() => {
    return stylesDataMap[targetStyleName] || stylesDataMap['Gelatos de Leite'];
  }, [targetStyleName, stylesRevision]);

  const isTargetOfficial = useMemo(() => {
    return isOfficialStyle(targetStyleName);
  }, [targetStyleName]);

  const isTargetModified = useMemo(() => {
    return isStyleModifiedFromOfficial(targetStyleName);
  }, [targetStyleName, stylesRevision, activePresetId]);

  // Sincronização em tempo real com os parâmetros da aba Precificação
  const [pricingParams, setPricingParams] = useState<PricingParams>(getStoredPricingParams);

  useEffect(() => {
    const handlePricingUpdate = () => {
      setPricingParams(getStoredPricingParams());
    };
    window.addEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
    window.addEventListener('storage', handlePricingUpdate);
    return () => {
      window.removeEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
      window.removeEventListener('storage', handlePricingUpdate);
    };
  }, []);

  const pricingSettings = useMemo(() => getPricingSettings(pricingParams), [pricingParams]);

  // Real-time calculation analysis usando as regras da aba de Precificação
  const analysis = useMemo(() => {
    return calculateBatchAnalysis(items, variegatos, currentStyle, ingredientsMap, pricingSettings);
  }, [items, variegatos, currentStyle, ingredientsMap, pricingSettings]);

  // Decomposição de custos por categoria de insumo
  const categoryCostBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalCaldaCost = 0;

    for (const item of items) {
      const ing = ingredientsMap.get(item.name.toLowerCase().trim());
      const itemCost = ing ? (item.grams * ing.costKg) / 1000 : 0;
      const cat = ing?.category || 'Outros';
      map.set(cat, (map.get(cat) || 0) + itemCost);
      totalCaldaCost += itemCost;
    }

    if (totalCaldaCost <= 0) return [];

    return Array.from(map.entries())
      .map(([cat, cost]) => ({
        category: cat,
        cost,
        pct: (cost / totalCaldaCost) * 100
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [items, ingredientsMap]);

  // Sort ingredients by descending weight (standard culinary practice)
  const handleSortByWeight = () => {
    const sorted = [...items].sort((a, b) => (b.grams || 0) - (a.grams || 0));
    setItems(sorted);
    setIsDirty(true);
  };

  // Handle recipe change from selector
  const handleStartNewRecipe = () => {
    if (selectedRecipeId !== 'new') {
      setLastActiveRecipeId(selectedRecipeId);
    }
    handleSelectRecipe('new');
  };

  const handleCancelNewRecipe = () => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        'Deseja cancelar o cadastro desta nova receita e voltar à bancada normal? Quaisquer alterações não salvas serão descartadas.'
      );
      if (!confirmCancel) return;
    }

    const firstAlpha = getFirstAlphabeticalRecipe(recipes);
    const fallbackId = lastActiveRecipeId && lastActiveRecipeId !== 'new' ? lastActiveRecipeId : firstAlpha?.id;
    const rec = recipes.find(r => r.id === fallbackId) || firstAlpha;
    if (rec) {
      loadRecipe(rec);
    }
  };

  const handleSelectRecipe = (id: string) => {
    if (id === 'new') {
      setSelectedRecipeId('new');
      lastLoadedRecipeIdRef.current = 'new';
      if (onActiveRecipeChange) onActiveRecipeChange('new');
      try {
        localStorage.setItem('gelato_active_recipe_id', 'new');
      } catch {}
      setRecipeName('Novo Gelato Artesanal');
      setTargetStyleName('Gelatos de Leite');
      setItems([
        { name: 'Leite Integral', grams: 620 },
        { name: 'Creme De Leite Fresco 35%', grams: 150 },
        { name: 'Leite Em Pó Desnatado', grams: 45 },
        { name: 'Açúcar', grams: 120 },
        { name: 'Dextrose', grams: 35 },
        { name: 'Neutro', grams: 5 }
      ]);
      setVariegatos([]);
      setBatchScaleInput('975');
      setIsDirty(true);
      return;
    }

    const rec = recipes.find(r => r.id === id);
    if (rec) loadRecipe(rec);
  };

  // Modify row grammage
  const handleGramsChange = (index: number, newGrams: number) => {
    const next = [...items];
    next[index] = { ...next[index], grams: Math.max(0, newGrams) };
    setItems(next);
    setIsDirty(true);
  };

  // Modify row ingredient name
  const handleNameChange = (index: number, newName: string) => {
    const next = [...items];
    next[index] = { ...next[index], name: newName };
    setItems(next);
    setIsDirty(true);
  };

  // Add new ingredient row
  const handleAddRow = () => {
    setItems([...items, { name: '', grams: 50 }]);
    setIsDirty(true);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
    setIsDirty(true);
  };

  // Scale entire batch proportionally
  const handleApplyBatchScale = (targetGrams: number) => {
    if (analysis.caldaWeight <= 0 || targetGrams <= 0) return;
    const ratio = targetGrams / analysis.caldaWeight;

    const scaledItems = items.map(i => ({
      ...i,
      grams: Math.round(i.grams * ratio * 10) / 10
    }));

    const scaledVariegatos = variegatos.map(v => ({
      ...v,
      grams: Math.round(v.grams * ratio * 10) / 10
    }));

    setItems(scaledItems);
    setVariegatos(scaledVariegatos);
    setBatchScaleInput(String(targetGrams));
    setIsDirty(true);
  };

  // Dynamic font sizing for gram inputs to prevent clipping on scaled batches
  const getGramsInputFontSize = (val: number | string) => {
    const len = String(val).length;
    if (len >= 7) return 'text-[11px] sm:text-xs';
    if (len >= 6) return 'text-xs sm:text-sm';
    return 'text-sm';
  };

  // Save changes to current recipe in IndexedDB
  const handleUpdateExisting = async (updatedName?: string, updatedCategory?: string, updatedNotes?: string) => {
    if (selectedRecipeId === 'new') return;
    const existing = await db.recipes.get(selectedRecipeId);
    if (!existing) return;

    const finalName = updatedName?.trim() || recipeName.trim();
    const finalCategory = updatedCategory?.trim() || targetStyleName;

    const updated: Recipe = {
      ...existing,
      name: finalName,
      category: finalCategory,
      targetStyle: finalCategory,
      notes: updatedNotes !== undefined ? updatedNotes : existing.notes,
      ingredients: items,
      variegatos: variegatos,
      totalGrams: analysis.caldaWeight,
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(updated);
    setRecipeName(finalName);
    setIsDirty(false);
    onRecipeSaved();
  };

  // Save as new custom recipe
  const handleSaveAsNew = async (name: string, category: string, notes: string) => {
    const newId = `custom_${Date.now()}`;
    const newRecipe: Recipe = {
      id: newId,
      name,
      category,
      targetStyle: category,
      ingredients: items,
      variegatos: variegatos,
      totalGrams: analysis.caldaWeight,
      isCustom: true,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(newRecipe);
    setSelectedRecipeId(newId);
    lastLoadedRecipeIdRef.current = newId;
    if (onActiveRecipeChange) onActiveRecipeChange(newId);
    try {
      localStorage.setItem('gelato_active_recipe_id', newId);
    } catch {}
    setRecipeName(name);
    setIsDirty(false);
    onRecipeSaved();
  };

  // Restore active recipe to original
  const handleReset = () => {
    if (selectedRecipeId === 'new') {
      handleSelectRecipe('new');
      return;
    }
    const rec = recipes.find(r => r.id === selectedRecipeId);
    if (rec) loadRecipe(rec);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card (z-30 so search combobox dropdown floats above subsequent cards without clipping) */}
      <div className="relative z-30 bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3.5">
        {/* Dynamic Category Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${getCategoryTheme(targetStyleName).gradient}`} />
        
        {/* Badge de Status / Contexto */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            Bancada de Balanceamento
          </span>
          {selectedRecipeId === 'new' ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cadastrando Nova Receita
            </span>
          ) : isDirty ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Edições ativas na bancada
            </span>
          ) : null}
        </div>

        {/* LINHA 1: Caixa de Sabor do Gelato alinhada com os Botões de Ação */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-2xl">
            {/* Recipe Name Input with Integrated Catalog Search */}
            <RecipeSearchCombobox
              recipes={recipes}
              selectedRecipeId={selectedRecipeId}
              onSelectRecipe={handleSelectRecipe}
              recipeName={recipeName}
              onRecipeNameChange={name => {
                setRecipeName(name);
                setIsDirty(true);
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {selectedRecipeId === 'new' ? (
              <button
                type="button"
                onClick={handleCancelNewRecipe}
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Cancelar criação da nova receita e voltar à receita anterior"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cancelar / Voltar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartNewRecipe}
                className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Criar uma nova receita personalizada a partir do zero"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Nova Receita</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={selectedRecipeId === 'new'}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Reverter alterações e voltar à receita original"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reverter</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Receita</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Imprimir Ficha Técnica de Produção"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
          </div>
        </div>

        {/* LINHA 2: Barra Contextual Limpa e Unificada de Estilos */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-700/60">
          {/* Seletor Combobox Inteligente com busca instantânea e gestão de estilos */}
          <StyleSearchCombobox
            selectedStyleName={targetStyleName}
            onSelectStyle={newStyle => {
              setTargetStyleName(newStyle);
              setIsDirty(true);
            }}
            onOpenSettings={(styleName, createMode) => {
              handleOpenStyleSettings(styleName, createMode);
            }}
          />

          {/* Controles Contextuais (Oficial vs Estilo da Casa) */}
          <div className="flex items-center gap-2 flex-wrap">
            {isTargetOfficial ? (
              <>
                {/* Segmented Switch: Referência Bibliográfica (Padrão Ouro | Padrão Clássico Italiano) */}
                <div className="inline-flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => applyGoldStandardPreset()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activePresetId === 'gold' && !isTargetModified
                        ? 'bg-emerald-500/25 text-emerald-300 shadow-sm border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Padrão Ouro Híbrido Protegido (Recomendado: Caviezel + PAC Clássico Italiano)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Padrão Ouro</span>
                  </button>

                  {hasCarpigianiData(targetStyleName) && (
                    <button
                      type="button"
                      onClick={() => applyCarpigianiPreset()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activePresetId === 'carpigiani' && !isTargetModified
                          ? 'bg-sky-500/25 text-sky-300 shadow-sm border border-sky-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Padrão Clássico Italiano (Diretrizes Acadêmicas Tradicionais)"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                      <span>Padrão Clássico Italiano</span>
                    </button>
                  )}
                </div>

                {/* Indicador de metas modificadas pelo usuário com atalho para resetar */}
                {isTargetModified && (
                  <button
                    type="button"
                    onClick={() => {
                      resetSingleStyleToReference(targetStyleName);
                      setStylesRevision(prev => prev + 1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-500/25 transition-all shadow-inner"
                    title="Este estilo oficial possui metas editadas. Clique para restaurar ao padrão."
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>Metas Editadas (Resetar)</span>
                  </button>
                )}
              </>
            ) : (
              /* Estilo da Gelateria */
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Estilo da Casa</span>
              </div>
            )}

            {/* Ajustar Metas (Abre a Modal Técnica) */}
            <button
              type="button"
              onClick={() => handleOpenStyleSettings(targetStyleName, false)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-inner shrink-0 group border bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-500/50"
              title="Ajustar manualmente metas e limites físico-químicos"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span>Ajustar Metas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Nutrient Gauges */}
      <NutrientBars analysis={analysis} />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ingredients Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Composição da Calda Base</h3>
                  <span className="text-xs font-medium text-slate-400">({items.length} insumos)</span>
                </div>

                <button
                  type="button"
                  onClick={handleSortByWeight}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ml-1"
                  title="Ordenar ingredientes por maior peso (prática culinária profissional)"
                >
                  <ArrowDownWideNarrow className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ordenar por Peso</span>
                </button>
              </div>

              {/* Batch Scale Controls with Quick-Pills */}
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Lote:</span>
                </div>

                <div className="flex items-center bg-slate-800 border border-slate-700 focus-within:border-amber-500 rounded-lg px-2 py-1 shadow-inner transition-colors">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={batchScaleInput}
                    onChange={e => setBatchScaleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleApplyBatchScale(parseFloat(batchScaleInput) || 1000);
                      }
                    }}
                    className="w-20 bg-transparent text-sm text-right font-mono font-black text-amber-300 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title="Digite o peso desejado do lote em gramas"
                  />
                  <span className="text-xs text-slate-400 font-mono font-bold pl-1">g</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyBatchScale(parseFloat(batchScaleInput) || 1000)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 shrink-0"
                  title="Recalcular gramaturas proporcionalmente para este tamanho de lote"
                >
                  <span>Escalar</span>
                </button>

                {/* Quick scale shortcut buttons */}
                <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2 ml-1">
                  {[
                    { label: '1kg', grams: 1000, title: '1 kg (Receita Base / Teste)' },
                    { label: '3kg', grams: 3000, title: '3 kg (Produção Média / Cuba)' },
                    { label: '4kg', grams: 4000, title: '4 kg (Cuba Padrão GN 5L)' }
                  ].map(preset => {
                    const isCurrent = Math.abs(analysis.caldaWeight - preset.grams) < 2;
                    return (
                      <button
                        key={preset.grams}
                        type="button"
                        onClick={() => {
                          setBatchScaleInput(String(preset.grams));
                          handleApplyBatchScale(preset.grams);
                        }}
                        className={`px-2 py-1 font-mono font-bold rounded-md text-xs transition-all ${
                          isCurrent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                        title={preset.title}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ingredients Table with readable font sizes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider font-bold">
                    <th className="py-3 pl-2">Ingrediente / Matéria-Prima</th>
                    <th className="py-3 text-right w-48">Peso (g)</th>
                    <th className="py-3 text-right w-24">% Calda</th>
                    <th className="py-3 text-right w-28">Custo R$</th>
                    <th className="py-3 text-center w-12">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map((item, idx) => {
                    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
                    const pct = analysis.caldaWeight > 0 ? (item.grams / analysis.caldaWeight) * 100 : 0;
                    const itemCost = ing ? (item.grams * ing.costKg) / 1000 : 0;
                    const catPill = ing ? getIngredientCategoryPill(ing.category) : null;
                    const isUnknown = item.name.trim() !== '' && !ing;

                    return (
                      <tr key={idx} className="hover:bg-slate-750/40 transition-colors group">
                        <td className="py-2 pl-2">
                          <div className="relative flex items-center w-full">
                            <input
                              type="text"
                              list="ingredients-datalist"
                              value={item.name}
                              onChange={e => handleNameChange(idx, e.target.value)}
                              placeholder="Digite ou escolha o insumo..."
                              className={`w-full bg-slate-900 border ${
                                isUnknown ? 'border-amber-500/60 focus:border-amber-500' : 'border-slate-700 focus:border-amber-500'
                              } rounded-xl pl-3 ${
                                catPill || isUnknown ? 'pr-28 sm:pr-32' : 'pr-3'
                              } py-2 text-sm text-white focus:outline-none font-semibold transition-colors`}
                            />

                            {/* Embedded Category Chip / Warning Pill inside the right end of the input */}
                            <div className="absolute right-2 flex items-center gap-1.5 pointer-events-none">
                              {catPill && (
                                <span
                                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-sm select-none ${catPill.color}`}
                                  title={`Categoria: ${ing?.category}`}
                                >
                                  <span>{catPill.icon}</span>
                                  <span>{catPill.label}</span>
                                </span>
                              )}
                              {isUnknown && (
                                <span
                                  className="px-2 py-0.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 text-[11px] font-bold flex items-center gap-1 shadow-sm select-none"
                                  title="Insumo não cadastrado no banco comercial"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="hidden sm:inline">Não cadastrado</span>
                                  <span className="sm:hidden">Novo</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleGramsChange(idx, Math.max(0, item.grams - 5))}
                              className="w-7 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-500/60 hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all"
                              title="Diminuir 5g (-5g)"
                            >
                              -5
                            </button>
                            <input
                              type="number"
                              value={item.grams === 0 ? '' : item.grams}
                              onChange={e => handleGramsChange(idx, parseFloat(e.target.value) || 0)}
                              className={`w-24 sm:w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono font-bold text-white tabular-nums tracking-tight focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getGramsInputFontSize(item.grams)}`}
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => handleGramsChange(idx, item.grams + 5)}
                              className="w-7 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-500/60 hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all"
                              title="Aumentar 5g (+5g)"
                            >
                              +5
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-200 text-sm">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-200 text-sm">
                          <span
                            title={ing && ing.costKg <= 0 ? 'Sem custo/kg cadastrado' : undefined}
                            className={ing && ing.costKg <= 0 ? 'text-slate-400' : 'text-slate-200'}
                          >
                            R$ {itemCost.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                            title="Remover Ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 font-black text-white text-sm">
                    <td className="py-3.5 pl-2 text-base">Total Calda Base</td>
                    <td className="py-3.5 text-right font-mono text-amber-300 text-base">
                      {Math.round(analysis.caldaWeight)} g
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-300">100.0%</td>
                    <td className="py-3.5 text-right font-mono text-emerald-400 text-base">
                      R$ {analysis.totals.cost.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add Row Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Insumo na Calda</span>
              </button>
            </div>
          </div>

          {/* Variegatos & Inclusions Module */}
          <PostProduction
            variegatos={variegatos}
            availableIngredients={ingredients}
            caldaWeightGrams={analysis.caldaWeight}
            onUpdateVariegatos={v => {
              setVariegatos(v);
              setIsDirty(true);
            }}
          />

          {/* Allergens Regulation Badge */}
          <AllergensBadge allergensLabel={analysis.allergensLabel} />
        </div>

        {/* Right Column: Financial & Factory Cost Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Calibração Necessária & Alerta de Arenosidade */}
          <CalibrationAlerts analysis={analysis} />

          {/* 2. Engenharia de Custos */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Engenharia de Custos</h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-900 text-slate-300 border border-slate-700 shadow-sm">
                Fábrica / CMV
              </span>
            </div>

            {/* KPI Cards with Punchy Numbers */}
            <div className="space-y-3">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Custo Calda Base
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    R$ {analysis.costing.caldaCostKg.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">/ kg de calda</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Peso Calda
                  </span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {Math.round(analysis.caldaWeight)} g
                  </span>
                </div>
              </div>

              {variegatos.length > 0 && (
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/40 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                      Custo Final c/ Mescla
                    </span>
                    <span className="text-2xl font-black text-amber-200 font-mono">
                      R$ {analysis.costing.finalCostKg.toFixed(2)}
                    </span>
                    <span className="text-xs text-amber-300/80 block font-medium">/ kg produto pronto</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                      Mescla no Total
                    </span>
                    <span className="text-lg font-black text-amber-200 font-mono">
                      {analysis.costing.variegatoRatioPercent}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Custo do Lote
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    R$ {analysis.costing.totalBatchCost.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Bola (60g)
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    R$ {analysis.costing.scoopCost60g.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Category Cost Composition Bar */}
              {categoryCostBreakdown.length > 0 && (
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-amber-400" />
                      Decomposição do Custo
                    </span>
                    <span className="text-slate-400 font-mono text-xs">
                      Base: R$ {analysis.totals.cost.toFixed(2)}
                    </span>
                  </div>

                  {/* Multi-segment stacked progress bar */}
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
                    {categoryCostBreakdown.map((cat, i) => {
                      const colors = [
                        'bg-sky-400',
                        'bg-amber-400',
                        'bg-orange-400',
                        'bg-rose-400',
                        'bg-teal-400',
                        'bg-purple-400',
                        'bg-yellow-500'
                      ];
                      return (
                        <div
                          key={cat.category}
                          className={`h-full ${colors[i % colors.length]} transition-all`}
                          style={{ width: `${cat.pct}%` }}
                          title={`${cat.category}: R$ ${cat.cost.toFixed(2)} (${cat.pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Micro-legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300 pt-0.5">
                    {categoryCostBreakdown.slice(0, 4).map((cat, i) => {
                      const dotColors = [
                        'bg-sky-400',
                        'bg-amber-400',
                        'bg-orange-400',
                        'bg-rose-400',
                        'bg-teal-400',
                        'bg-purple-400',
                        'bg-yellow-500'
                      ];
                      return (
                        <span key={cat.category} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                          <span className="text-slate-400">{cat.category}:</span>
                          <strong className="text-white font-mono">{cat.pct.toFixed(0)}%</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Módulo Executivo de Precificação Comercial & Rendimento com Overrun (Largura Total) */}
      <ProfitSimulator
        finalCostKg={analysis.costing.finalCostKg}
        batchWeightGrams={analysis.costing.finalWeightGrams || analysis.caldaWeight}
        caldaWeightGrams={analysis.caldaWeight}
        totalVariegatoGrams={analysis.costing.totalVariegatoGrams || 0}
        densityAndVolume={analysis.densityAndVolume}
        pricingParams={pricingParams}
        pricingSettings={pricingSettings}
        onMarginSaved={(newMargin) => {
          setPricingParams(prev => ({ ...prev, targetMargin: newMargin }));
        }}
      />

      {/* Datalist for fast ingredient autocompletion */}
      <datalist id="ingredients-datalist">
        {ingredients.map(ing => {
          const pill = getIngredientCategoryPill(ing.category);
          return (
            <option key={ing.id} value={ing.name}>
              {pill ? pill.icon + ' ' : ''}{ing.category} (R$ {ing.costKg.toFixed(2)}/kg)
            </option>
          );
        })}
      </datalist>

      {/* Save Modal */}
      <SaveRecipeModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentName={recipeName}
        currentCategory={targetStyleName}
        isExisting={selectedRecipeId !== 'new'}
        onUpdateExisting={handleUpdateExisting}
        onSaveAsNew={handleSaveAsNew}
      />

      {/* Modal de Ajuste de Metas Físico-Químicas */}
      <StyleSettingsModal
        isOpen={isStyleModalOpen}
        onClose={() => {
          setIsStyleModalOpen(false);
          setStyleModalCreateMode(false);
        }}
        initialStyleName={styleModalInitialName || targetStyleName}
        initialCreateMode={styleModalCreateMode}
        onStyleUpdated={(updatedStyleName) => {
          setStylesRevision(prev => prev + 1);
          if (updatedStyleName) {
            setTargetStyleName(updatedStyleName);
            setIsDirty(true);
          }
        }}
      />
    </div>
  );
};
