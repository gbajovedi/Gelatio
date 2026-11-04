import { useState, useEffect, lazy, Suspense } from 'react';
import { db } from './db/database';
import { applyTheme, initThemeListener } from './core/theme';
import { Recipe, Ingredient, Preparation } from './types/gelato';
import { Navbar, NavTab } from './components/Navbar';
import { BalancingScreen } from './components/Balanceamento/BalancingScreen';
import { RecipeList } from './components/Receitas/RecipeList';

// Code-splitting via lazy loading para otimização do bundle inicial
const IngredientManager = lazy(() => import('./components/Ingredientes/IngredientManager').then(m => ({ default: m.IngredientManager })));
const PrePreparosList = lazy(() => import('./components/PrePreparos/PrePreparosList').then(m => ({ default: m.PrePreparosList })));
const PricingCalculator = lazy(() => import('./components/Financeiro/PricingCalculator').then(m => ({ default: m.PricingCalculator })));
const StockScreen = lazy(() => import('./components/Estoque/StockScreen').then(m => ({ default: m.StockScreen })));
const ImportExportModal = lazy(() => import('./components/ImportExport/ImportExportModal').then(m => ({ default: m.ImportExportModal })));

import initialIngredients from './data/ingredients.json';
import initialRecipes from './data/recipes.json';
import initialPreparations from './data/preparations.json';

const STORAGE_TAB_KEY = 'gelato_active_tab';
const STORAGE_RECIPE_KEY = 'gelato_active_recipe_id';
const VALID_TABS: NavTab[] = ['balanceamento', 'receitas', 'ingredientes', 'preparos', 'financeiro', 'estoque'];

const getInitialTab = (): NavTab => {
  if (typeof window !== 'undefined') {
    // 1. Prioridade: hash na URL (ex: #receitas, #ingredientes)
    const hash = window.location.hash.replace('#', '') as NavTab;
    if (VALID_TABS.includes(hash)) {
      return hash;
    }
    // 2. LocalStorage para restaurar a aba onde o usuário estava ao dar F5
    try {
      const stored = localStorage.getItem(STORAGE_TAB_KEY) as NavTab;
      if (VALID_TABS.includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Erro ao ler aba ativa do localStorage:', e);
    }
  }
  return 'balanceamento';
};

const getInitialRecipeId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(STORAGE_RECIPE_KEY) || '';
    } catch {}
  }
  return '';
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(getInitialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([getInitialTab()]));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string>(getInitialRecipeId);
  const [recipeSelectionToken, setRecipeSelectionToken] = useState<number>(0);
  const [produceRecipeId, setProduceRecipeId] = useState<string | undefined>(undefined);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB with bullet-proof fallback
  const refreshData = async () => {
    try {
      await db.initializeSeedData();
      const recs = await db.recipes.toArray();
      const ings = await db.ingredients.toArray();
      const preps = await db.preparations.toArray();

      const finalRecs = recs && recs.length > 0 ? recs : (initialRecipes as Recipe[]);
      const finalIngs = ings && ings.length > 0 ? ings : (initialIngredients as Ingredient[]);
      const finalPreps = preps && preps.length > 0 ? preps : (initialPreparations as Preparation[]);

      setRecipes(finalRecs);
      setIngredients(finalIngs);
      setPreparations(finalPreps);

      // Restaurar receita ativa previamente salva ou a primeira em ordem alfabética do catálogo
      const savedRecId = getInitialRecipeId();
      const hasSavedRec = savedRecId && savedRecId !== 'new' && finalRecs.some(r => r.id === savedRecId);
      const firstAlphabeticalRec = [...finalRecs].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      )[0];

      if (hasSavedRec) {
        setActiveRecipeId(savedRecId);
      } else if (firstAlphabeticalRec) {
        setActiveRecipeId(firstAlphabeticalRec.id);
        try {
          localStorage.setItem(STORAGE_RECIPE_KEY, firstAlphabeticalRec.id);
        } catch {}
      }
    } catch (err) {
      console.error('Falha ao carregar do IndexedDB, ativando base de segurança em memória:', err);
      const fallbackRecs = initialRecipes as Recipe[];
      const fallbackIngs = initialIngredients as Ingredient[];
      const fallbackPreps = initialPreparations as Preparation[];

      setRecipes(fallbackRecs);
      setIngredients(fallbackIngs);
      setPreparations(fallbackPreps);

      const savedRecId = getInitialRecipeId();
      const hasSavedRec = savedRecId && savedRecId !== 'new' && fallbackRecs.some(r => r.id === savedRecId);
      const firstFallback = [...fallbackRecs].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      )[0];
      if (hasSavedRec) {
        setActiveRecipeId(savedRecId);
      } else if (firstFallback) {
        setActiveRecipeId(firstFallback.id);
        try {
          localStorage.setItem(STORAGE_RECIPE_KEY, firstFallback.id);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
    try {
      localStorage.setItem(STORAGE_TAB_KEY, tab);
      window.location.hash = tab;
    } catch (e) {
      console.warn('Erro ao salvar aba ativa:', e);
    }
  };

  useEffect(() => {
    applyTheme();
    initThemeListener();
    refreshData();

    // Sincronizar caso o usuário use navegação por hash ou histórico
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        setVisitedTabs(prev => {
          if (prev.has(hash)) return prev;
          const next = new Set(prev);
          next.add(hash);
          return next;
        });
        localStorage.setItem(STORAGE_TAB_KEY, hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectRecipeFromCatalog = (id: string) => {
    setActiveRecipeId(id);
    setRecipeSelectionToken(Date.now());
    try {
      localStorage.setItem(STORAGE_RECIPE_KEY, id);
    } catch {}
    handleTabChange('balanceamento');
  };

  const handleProduceRecipeFromCatalog = (id: string) => {
    setProduceRecipeId(id);
    handleTabChange('estoque');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-4 animate-bounce">🍨</div>
        <h2 className="text-lg font-bold text-white mb-1">Carregando Gelatio...</h2>
        <p className="text-xs text-slate-400">Preparando banco de dados bromatológico offline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
        <div style={{ display: activeTab === 'balanceamento' ? 'block' : 'none' }}>
          {visitedTabs.has('balanceamento') && (
            <BalancingScreen
              recipes={recipes}
              ingredients={ingredients}
              initialRecipeId={activeRecipeId}
              recipeSelectionToken={recipeSelectionToken}
              onRecipeSaved={refreshData}
              onActiveRecipeChange={(id) => {
                setActiveRecipeId(id);
                try {
                  localStorage.setItem(STORAGE_RECIPE_KEY, id);
                } catch {}
              }}
            />
          )}
        </div>

        <div style={{ display: activeTab === 'receitas' ? 'block' : 'none' }}>
          {visitedTabs.has('receitas') && (
            <RecipeList
              recipes={recipes}
              ingredients={ingredients}
              onSelectRecipe={handleSelectRecipeFromCatalog}
              onProduceRecipe={handleProduceRecipeFromCatalog}
              onRefresh={refreshData}
            />
          )}
        </div>

        <div style={{ display: activeTab === 'ingredientes' ? 'block' : 'none' }}>
          {visitedTabs.has('ingredientes') && (
            <Suspense fallback={<div className="py-12 text-center text-slate-400 font-mono text-sm">Carregando catálogo de insumos...</div>}>
              <IngredientManager
                ingredients={ingredients}
                onRefresh={refreshData}
              />
            </Suspense>
          )}
        </div>

        <div style={{ display: activeTab === 'preparos' ? 'block' : 'none' }}>
          {visitedTabs.has('preparos') && (
            <Suspense fallback={<div className="py-12 text-center text-slate-400 font-mono text-sm">Carregando pré-preparos...</div>}>
              <PrePreparosList
                preparations={preparations}
                availableIngredients={ingredients}
                onRefresh={refreshData}
              />
            </Suspense>
          )}
        </div>

        <div style={{ display: activeTab === 'financeiro' ? 'block' : 'none' }}>
          {visitedTabs.has('financeiro') && (
            <Suspense fallback={<div className="py-12 text-center text-slate-400 font-mono text-sm">Carregando calculadora de custos...</div>}>
              <PricingCalculator />
            </Suspense>
          )}
        </div>

        <div style={{ display: activeTab === 'estoque' ? 'block' : 'none' }}>
          {visitedTabs.has('estoque') && (
            <Suspense fallback={<div className="py-12 text-center text-slate-400 font-mono text-sm">Carregando módulo de estoque...</div>}>
              <StockScreen
                recipes={recipes}
                ingredients={ingredients}
                initialProduceRecipeId={produceRecipeId}
                onClearInitialProduceRecipeId={() => setProduceRecipeId(undefined)}
              />
            </Suspense>
          )}
        </div>
      </main>

      {/* Backup and Import/Export Modal */}
      {isBackupModalOpen && (
        <Suspense fallback={null}>
          <ImportExportModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
            onDataChanged={refreshData}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
