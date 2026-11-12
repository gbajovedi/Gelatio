import React, { useState, useMemo } from 'react';
import { StockItem, StockKPIs } from '../../types/stock';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { CategoryBadge, getCategoryTheme } from '../../core/categoryThemes';

interface StockOverviewProps {
  stockItems: StockItem[];
  kpis: StockKPIs;
  onNavigateToProduction: (recipeId?: string) => void;
  onNavigateToPOS: (stockItem?: StockItem) => void;
  onRefresh: () => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({
  stockItems,
  kpis,
  onNavigateToProduction,
  onNavigateToPOS,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [adjustmentTargetItem, setAdjustmentTargetItem] = useState<StockItem | null>(null);

  // Categorias únicas presentes no estoque
  const categories = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [stockItems]);

  // Filtro dos itens
  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchSearch = item.recipeName.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const units = item.currentUnits;
      const minAlert = item.minStockAlert || 3;

      let matchStatus = true;
      if (statusFilter === 'available') matchStatus = units > minAlert;
      else if (statusFilter === 'low') matchStatus = units > 0 && units <= minAlert;
      else if (statusFilter === 'out') matchStatus = units <= 0;

      return matchSearch && matchCat && matchStatus;
    });
  }, [stockItems, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. KPIs Consolidados do Estoque */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Potes */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Potes Congelados (-18°C)
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {kpis.totalTubsInStock}
              <span className="text-xs text-slate-400 font-normal ml-1">unidades</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {kpis.flavorsInStockCount} sabores disponíveis
            </span>
          </div>
        </div>

        {/* Capital Imobilizado */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Capital Imobilizado
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
              R$ {kpis.totalCapitalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Custo total de fabricação
            </span>
          </div>
        </div>

        {/* Potencial de Venda */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Potencial de Faturamento
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              R$ {kpis.totalPotentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              Lucro potencial: +R$ {(kpis.totalPotentialRevenue - kpis.totalCapitalInvested).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Alerta de Ruptura */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border shrink-0 ${
            kpis.lowStockItemsCount > 0 || kpis.outOfStockCount > 0
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Alertas de Estoque
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {kpis.lowStockItemsCount}
              <span className="text-xs text-rose-300 font-normal ml-1">baixo</span>
              {kpis.outOfStockCount > 0 && (
                <span className="text-xs text-rose-400 font-bold ml-1.5">
                  ({kpis.outOfStockCount} zerados)
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {kpis.lowStockItemsCount === 0 && kpis.outOfStockCount === 0
                ? 'Estoque totalmente abastecido'
                : 'Atenção aos sabores críticos'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Busca, Filtros e Ações Rápidas */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
          {/* Busca por Sabor */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar sabor em estoque..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Filtro por Categoria */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold shrink-0 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({stockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'available' ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Abastecidos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'low' ? 'bg-rose-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Baixo Estoque
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('out')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'out' ? 'bg-slate-700 text-white font-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Zerados
            </button>
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <button
          type="button"
          onClick={() => onNavigateToProduction()}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Produzir Lote</span>
        </button>
      </div>

      {/* 3. Tabela / Grid do Estoque */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-12 text-center space-y-3">
          <div className="text-4xl">🍨</div>
          <h4 className="text-base font-bold text-white">Nenhum pote encontrado no estoque</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {stockItems.length === 0
              ? 'Você ainda não registrou nenhuma produção de gelato. Clique no botão abaixo para lançar seu primeiro lote e iniciar o controle de estoque!'
              : 'Nenhum sabor corresponde aos filtros ou termo de busca selecionados.'}
          </p>
          {stockItems.length === 0 && (
            <button
              type="button"
              onClick={() => onNavigateToProduction()}
              className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              + Produzir Primeiro Lote
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-700/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Sabor / Receita</th>
                  <th className="py-3 px-4">Formato</th>
                  <th className="py-3 px-4 text-center">Nível de Estoque</th>
                  <th className="py-3 px-4 text-right">Saldo Atual</th>
                  <th className="py-3 px-4 text-right">Custo Médio</th>
                  <th className="py-3 px-4 text-right">Preço Sugerido</th>
                  <th className="py-3 px-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredItems.map(item => {
                  const minAlert = item.minStockAlert || 3;
                  const isOut = item.currentUnits <= 0;
                  const isLow = item.currentUnits > 0 && item.currentUnits <= minAlert;
                  const statusColor = isOut
                    ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                    : isLow
                    ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';

                  const statusLabel = isOut ? 'Esgotado' : isLow ? 'Baixo Estoque' : 'Abastecido';

                  return (
                    <tr key={item.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🍨</span>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {item.recipeName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.category || 'Gelatos'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 font-mono text-[11px] font-bold">
                          {item.tubWeightGrams}g
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`text-base font-black font-mono ${
                          isOut ? 'text-rose-400' : isLow ? 'text-amber-300' : 'text-emerald-400'
                        }`}>
                          {item.currentUnits}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          potes no freezer
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        R$ {item.avgCostUnit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        R$ {item.suggestedPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão Vender */}
                          <button
                            type="button"
                            onClick={() => onNavigateToPOS(item)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold border border-emerald-500/40 text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Registrar venda rápida deste pote no PDV"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Vender</span>
                          </button>

                          {/* Botão Produzir */}
                          <button
                            type="button"
                            onClick={() => onNavigateToProduction(item.recipeId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Produzir mais unidades deste sabor"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>Produzir</span>
                          </button>

                          {/* Botão Ajuste / Perda */}
                          <button
                            type="button"
                            onClick={() => setAdjustmentTargetItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Registrar descarte, degustação ou acerto de inventário"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque */}
      {adjustmentTargetItem && (
        <StockAdjustmentModal
          isOpen={adjustmentTargetItem !== null}
          stockItem={adjustmentTargetItem}
          onClose={() => setAdjustmentTargetItem(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
