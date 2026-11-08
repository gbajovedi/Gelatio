import React from 'react';
import { VariegatoCostingAnalysis } from '../../types/variegato';
import { DollarSign, PieChart, Layers, Package } from 'lucide-react';

interface VariegatoCostingCardProps {
  costing: VariegatoCostingAnalysis;
  onDosageChange: (val: number) => void;
}

export const VariegatoCostingCard: React.FC<VariegatoCostingCardProps> = ({
  costing,
  onDosageChange
}) => {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Custos & Rendimento</h4>
            <p className="text-[11px] text-slate-400">Impacto pós-cocção e na cuba</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          R$ {costing.finalCostKg.toFixed(2)}/kg
        </span>
      </div>

      {/* Main Cost Display */}
      <div className="my-2 grid grid-cols-2 gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custo Insumos (Lote)</span>
          <div className="font-mono text-sm font-bold text-slate-200 mt-0.5">
            R$ {costing.initialCost.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custo Kg Pronto</span>
          <div className="font-mono text-base font-black text-emerald-300 mt-0.5">
            R$ {costing.finalCostKg.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Dosage in Gelato Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Dosagem no Gelato:
          </span>
          <span className="font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
            {costing.dosagePercent}% na cuba
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="35"
          step="1"
          value={costing.dosagePercent}
          onChange={e => onDosageChange(parseInt(e.target.value) || 15)}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>5% (Leve)</span>
          <span>15% (Padrão)</span>
          <span>35% (Intenso)</span>
        </div>
      </div>

      {/* Additional Marginal Cost Display */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
        <div className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Porção (60g):</span>
          <span className="font-mono font-bold text-slate-200">+R$ {costing.additionalCostPerScoop.toFixed(2)}</span>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Package className="w-3 h-3 text-slate-400" />
            Pote 500ml:
          </span>
          <span className="font-mono font-bold text-emerald-400">+R$ {costing.additionalCostPerPint.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
