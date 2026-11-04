import React from 'react';
import { DollarSign, PieChart } from 'lucide-react';
import { BatchAnalysis } from '../../types/gelato';

export type CostingData = BatchAnalysis['costing'];

export interface CategoryCostItem {
  category: string;
  cost: number;
  pct: number;
}

export interface CustosCardProps {
  costing: CostingData;
  caldaWeight: number;
  totalsCost: number;
  categoryCostBreakdown?: CategoryCostItem[];
  hasVariegatos?: boolean;
}

export const CustosCard: React.FC<CustosCardProps> = ({
  costing,
  caldaWeight,
  totalsCost,
  categoryCostBreakdown = [],
  hasVariegatos = false
}) => {
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
    <div className="bg-slate-900/95 rounded-2xl border border-slate-700/80 p-4 shadow-md flex flex-col justify-between space-y-3">
      {/* Header do Card */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm uppercase font-bold tracking-wider text-emerald-200">
            Custos
          </h4>
        </div>

        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-950 text-slate-300 border border-slate-800 shadow-sm">
          Fábrica / CMV
        </span>
      </div>

      {/* Grid Principal de KPIs */}
      <div className="space-y-2">
        {/* Bloco 1: Custo Calda Base e Peso */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Custo Calda Base
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                R$ {costing.caldaCostKg.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">/ kg</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Peso Calda
            </span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono block mt-0.5">
              {Math.round(caldaWeight)} g
            </span>
          </div>
        </div>

        {/* Bloco Dinâmico: Custo Final com Mescla (se houver pós-produção) */}
        {hasVariegatos && (
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between shadow-inner animate-fade-in">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Custo Final c/ Mescla
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-amber-200 font-mono">
                  R$ {costing.finalCostKg.toFixed(2)}
                </span>
                <span className="text-[11px] text-amber-300/80 font-medium">/ kg</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Mescla no Total
              </span>
              <span className="text-base sm:text-lg font-black text-amber-200 font-mono block mt-0.5">
                {costing.variegatoRatioPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Bloco 2: Custo do Lote e Bola 60g */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Custo do Lote
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
              R$ {costing.totalBatchCost.toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Bola (60g)
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
              R$ {costing.scoopCost60g.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Decomposição do Custo por Categoria */}
        {categoryCostBreakdown.length > 0 && (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <PieChart className="w-3 h-3 text-amber-400" />
                Decomposição
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                Base: R$ {totalsCost.toFixed(2)}
              </span>
            </div>

            {/* Multi-segment stacked progress bar */}
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
              {categoryCostBreakdown.map((cat, i) => (
                <div
                  key={cat.category}
                  className={`h-full ${dotColors[i % dotColors.length]} transition-all`}
                  style={{ width: `${cat.pct}%` }}
                  title={`${cat.category}: R$ ${cat.cost.toFixed(2)} (${cat.pct.toFixed(1)}%)`}
                />
              ))}
            </div>

            {/* Micro-legenda */}
            <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-slate-300 pt-0.5">
              {categoryCostBreakdown.slice(0, 4).map((cat, i) => (
                <span key={cat.category} className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                  <span className="text-slate-400">{cat.category}:</span>
                  <strong className="text-white font-mono">{cat.pct.toFixed(0)}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
