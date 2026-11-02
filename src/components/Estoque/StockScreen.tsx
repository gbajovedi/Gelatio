import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient } from '../../types/gelato';
import { StockItem, StockKPIs } from '../../types/stock';
import { getStoredPricingParams, getPricingSettings, PRICING_UPDATED_EVENT, PricingParams } from '../../core/pricingStorage';
import { calculateStockKPIs, STOCK_UPDATED_EVENT } from '../../core/stockService';
import { db } from '../../db/database';
import { StockOverview } from './StockOverview';
import { PosSalesScreen } from './PosSalesScreen';
import { ProductionScreen } from './ProductionScreen';
import { ProfitAnalyticsScreen } from './ProfitAnalyticsScreen';
import {
  Package,
  ShoppingCart,
  ChefHat,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export type StockSubTab = 'estoque_geral' | 'vendas_pdv' | 'producao' | 'dre_lucro';

interface StockScreenProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  initialProduceRecipeId?: string;
  onClearInitialProduceRecipeId?: () => void;
}

export const StockScreen: React.FC<StockScreenProps> = ({
  recipes,
  ingredients,
  initialProduceRecipeId,
  onClearInitialProduceRecipeId
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>(() => {
    return initialProduceRecipeId ? 'producao' : 'estoque_geral';
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [pricingParams, setPricingParams] = useState<PricingParams>(getStoredPricingParams);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de navegação interna
  const [targetRecipeIdForProduction, setTargetRecipeIdForProduction] = useState<string | undefined>(initialProduceRecipeId);
  const [targetStockItemForPOS, setTargetStockItemForPOS] = useState<StockItem | null>(null);

  useEffect(() => {
    if (initialProduceRecipeId) {
      setTargetRecipeIdForProduction(initialProduceRecipeId);
      setActiveSubTab('producao');
      if (onClearInitialProduceRecipeId) onClearInitialProduceRecipeId();
    }
  }, [initialProduceRecipeId]);

  const pricingSettings = useMemo(() => getPricingSettings(pricingParams), [pricingParams]);

  // Carregar itens de estoque do IndexedDB
  const loadStockData = async () => {
    try {
      const items = await db.stockItems.toArray();
      // Ordenar por ordem alfabética de sabor
      items.sort((a, b) => a.recipeName.localeCompare(b.recipeName, 'pt-BR'));
      setStockItems(items);
    } catch (e) {
      console.warn('Erro ao carregar estoque do IndexedDB:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();

    const handleStockUpdate = () => {
      loadStockData();
    };

    const handlePricingUpdate = () => {
      setPricingParams(getStoredPricingParams());
    };

    window.addEventListener(STOCK_UPDATED_EVENT, handleStockUpdate);
    window.addEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
    window.addEventListener('storage', handlePricingUpdate);

    return () => {
      window.removeEventListener(STOCK_UPDATED_EVENT, handleStockUpdate);
      window.removeEventListener(PRICING_UPDATED_EVENT, handlePricingUpdate);
      window.removeEventListener('storage', handlePricingUpdate);
    };
  }, []);

  const kpis = useMemo(() => {
    return calculateStockKPIs(stockItems);
  }, [stockItems]);

  const handleNavigateToProduction = (recipeId?: string) => {
    setTargetRecipeIdForProduction(recipeId);
    setActiveSubTab('producao');
  };

  const handleNavigateToPOS = (item?: StockItem) => {
    setTargetStockItemForPOS(item || null);
    setActiveSubTab('vendas_pdv');
  };

  const subTabs: { id: StockSubTab; label: string; icon: any; badge?: number | string; badgeColor?: string }[] = [
    {
      id: 'estoque_geral',
      label: 'Estoque Atual (-18°C)',
      icon: Package,
      badge: kpis.totalTubsInStock,
      badgeColor: 'bg-slate-700 text-slate-200'
    },
    {
      id: 'vendas_pdv',
      label: 'Frente de Caixa (PDV)',
      icon: ShoppingCart
    },
    {
      id: 'producao',
      label: 'Lançar Produção',
      icon: ChefHat
    },
    {
      id: 'dre_lucro',
      label: 'Controle de Lucro (DRE)',
      icon: TrendingUp
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho da Aba Estoque com Sub-Navegação Integrada */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Gestão de Estoque & Frente de Caixa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle de produção por lote, saldo de potes congelados, vendas em balcão e lucro líquido real.
          </p>
        </div>

        {/* Sub-Tabs de Navegação */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold shrink-0 overflow-x-auto max-w-full">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-950 text-amber-300 font-bold' : (tab.badgeColor || 'bg-slate-800 text-slate-300')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      <div>
        {activeSubTab === 'estoque_geral' && (
          <StockOverview
            stockItems={stockItems}
            kpis={kpis}
            onNavigateToProduction={handleNavigateToProduction}
            onNavigateToPOS={handleNavigateToPOS}
            onRefresh={loadStockData}
          />
        )}

        {activeSubTab === 'vendas_pdv' && (
          <PosSalesScreen
            stockItems={stockItems}
            pricingParams={pricingParams}
            onSaleCompleted={loadStockData}
            preSelectedStockItem={targetStockItemForPOS}
            onClearPreSelected={() => setTargetStockItemForPOS(null)}
          />
        )}

        {activeSubTab === 'producao' && (
          <ProductionScreen
            recipes={recipes}
            ingredients={ingredients}
            pricingSettings={pricingSettings}
            onBatchCreated={loadStockData}
            preSelectedRecipeId={targetRecipeIdForProduction}
            onClearPreSelected={() => setTargetRecipeIdForProduction(undefined)}
          />
        )}

        {activeSubTab === 'dre_lucro' && (
          <ProfitAnalyticsScreen
            pricingParams={pricingParams}
          />
        )}
      </div>
    </div>
  );
};
