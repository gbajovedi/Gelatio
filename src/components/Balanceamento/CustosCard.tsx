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
    <div className="bg-slate-900/95 rounded-2xl border border-slate-700/80 p-4 shadow-md flex flex-col justify-between space-y-3 h-full">
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

      {/* Grid Principal de KPIs (Matriz 2x2 Simétrica) */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {/* Quadrante 1: Custo Calda Base */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Custo Calda Base
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-xl font-black text-white font-mono">
                R$ {costing.caldaCostKg.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">/ kg</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Peso Calda:</span>
            <span className="font-mono font-bold text-amber-300">{Math.round(caldaWeight)} g</span>
          </div>
        </div>

        {/* Quadrante 2: Custo c/ Mescla ou Aviso de Nenhuma Mescla */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between shadow-inner transition-all ${
            hasVariegatos
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
              : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          {hasVariegatos ? (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block truncate text-amber-300">
                  Custo c/ Mescla
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-xl font-black font-mono text-amber-200">
                    R$ {costing.finalCostKg.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-medium text-amber-300/80">
                    / kg
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-amber-500/20 mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-amber-300/80">Mescla no total:</span>
                <span className="font-mono font-bold text-amber-200">
                  {costing.variegatoRatioPercent}%
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block truncate text-slate-400">
                  Custo c/ Mescla
                </span>
                <div className="mt-1 flex items-center">
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-300">
                    Nenhuma mescla adicionada
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Pós-Produção:</span>
                <span className="font-mono text-slate-400">0% (Calda pura)</span>
              </div>
            </>
          )}
        </div>

        {/* Quadrante 3: Custo Total do Lote */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Custo do Lote
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-xl font-black text-emerald-300 font-mono">
                R$ {costing.totalBatchCost.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Total Pronto:</span>
            <span className="font-mono font-bold text-slate-200">{finalWeight} g</span>
          </div>
        </div>

        {/* Quadrante 4: Bola (60g) */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Bola (60g)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-xl font-black text-white font-mono">
                R$ {costing.scoopCost60g.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">/ un</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Rendimento:</span>
            <span className="font-mono font-bold text-slate-200">~{totalScoops} bolas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
