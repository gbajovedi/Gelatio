import React from 'react';
import { DollarSign } from 'lucide-react';
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
  totalsCost?: number;
  categoryCostBreakdown?: CategoryCostItem[];
  hasVariegatos?: boolean;
}

export const CustosCard: React.FC<CustosCardProps> = ({
  costing,
  caldaWeight,
  hasVariegatos = false
}) => {
  const finalWeight = Math.round(costing.finalWeightGrams || caldaWeight);
  const totalScoops = Math.max(1, Math.floor(finalWeight / 60));

  return (
    <div className="bg-slate-900/95 rounded-xl border border-slate-700/80 px-3.5 py-2.5 shadow-md flex flex-col justify-between gap-2 h-full">
      {/* Header Compacto do Card */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-emerald-200 leading-none">
            Custos
          </h4>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-950 text-slate-300 border border-slate-800 shadow-sm leading-none">
          Fábrica / CMV
        </span>
      </div>

      {/* Grid Principal de KPIs (Matriz 2x2 Compacta e Simétrica) */}
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {/* Quadrante 1: Custo Calda Base */}
        <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex flex-col justify-center gap-0.5 shadow-inner">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Custo Calda Base
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
              {Math.round(caldaWeight)} g
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-black text-white font-mono leading-tight">
              R$ {costing.caldaCostKg.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">/kg</span>
          </div>
        </div>

        {/* Quadrante 2: Custo c/ Mescla ou Aviso de Nenhuma Mescla */}
        <div
          className={`px-2.5 py-1.5 rounded-lg border flex flex-col justify-center gap-0.5 shadow-inner transition-all ${
            hasVariegatos
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
              : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          {hasVariegatos ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider truncate text-amber-300">
                  Custo c/ Mescla
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-200 shrink-0">
                  {costing.variegatoRatioPercent}% mescla
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-black font-mono text-amber-200 leading-tight">
                  R$ {costing.finalCostKg.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-amber-300/80">/kg</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider truncate text-slate-400">
                  Custo c/ Mescla
                </span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  0% pura
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400 truncate leading-tight">
                Sem mescla adicionada
              </span>
            </>
          )}
        </div>

        {/* Quadrante 3: Custo Total do Lote */}
        <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex flex-col justify-center gap-0.5 shadow-inner">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Custo do Lote
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-300 shrink-0">
              {finalWeight} g
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-black text-emerald-300 font-mono leading-tight">
              R$ {costing.totalBatchCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">total</span>
          </div>
        </div>

        {/* Quadrante 4: Bola (60g) */}
        <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex flex-col justify-center gap-0.5 shadow-inner">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Bola (60g)
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-300 shrink-0">
              ~{totalScoops} bolas
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-black text-white font-mono leading-tight">
              R$ {costing.scoopCost60g.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">/un</span>
          </div>
        </div>
      </div>
    </div>
  );
};
