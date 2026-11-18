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
    <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 px-4 py-3 shadow-lg flex flex-col justify-between gap-2.5 h-full">
      {/* Header Compacto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-200 leading-none">
            Custos (CMV)
          </h4>
        </div>

        <span className="text-[11px] px-2.5 py-0.5 rounded-lg font-mono font-semibold bg-slate-950 text-slate-300 border border-slate-700/80 leading-none whitespace-nowrap">
          Lote: {finalWeight}g
        </span>
      </div>

      {/* 3 Colunas Limpas com Divisores Sutis */}
      <div className="grid grid-cols-3 divide-x divide-slate-700/60 items-center flex-1 py-0.5">
        {/* Coluna 1: Custo / kg (destaca c/ Mescla automaticamente quando existir variegato) */}
        <div className="pr-2.5 flex flex-col items-center justify-center text-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            {hasVariegatos ? 'Custo / kg Final' : 'Custo / kg'}
          </span>
          <span
            className={`text-lg xl:text-xl font-black font-mono tabular-nums leading-tight ${
              hasVariegatos ? 'text-amber-300' : 'text-white'
            }`}
            title={
              hasVariegatos
                ? `Calda base: R$ ${costing.caldaCostKg.toFixed(2)}/kg · Com ${costing.variegatoRatioPercent}% mescla: R$ ${costing.finalCostKg.toFixed(2)}/kg`
                : `Custo por quilo da calda base`
            }
          >
            R$ {(hasVariegatos ? costing.finalCostKg : costing.caldaCostKg).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">
            {hasVariegatos
              ? `Base R$ ${costing.caldaCostKg.toFixed(2)} · ${costing.variegatoRatioPercent}%`
              : 'Calda pura'}
          </span>
        </div>

        {/* Coluna 2: Custo Total do Lote */}
        <div className="px-2.5 flex flex-col items-center justify-center text-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Custo do Lote
          </span>
          <span className="text-lg xl:text-xl font-black font-mono tabular-nums text-emerald-400 leading-tight">
            R$ {costing.totalBatchCost.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
            {finalWeight}g pronto
          </span>
        </div>

        {/* Coluna 3: Bola (60g) */}
        <div className="pl-2.5 flex flex-col items-center justify-center text-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Bola (60g)
          </span>
          <span className="text-lg xl:text-xl font-black font-mono tabular-nums text-white leading-tight">
            R$ {costing.scoopCost60g.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
            ~{totalScoops} bolas
          </span>
        </div>
      </div>
    </div>
  );
};
