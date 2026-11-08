import React from 'react';
import { VariegatoCookingState } from '../../types/variegato';
import { Flame, Scale, Droplet, ArrowRight, Snowflake } from 'lucide-react';

interface VariegatoCookingReductionCardProps {
  initialWeightGrams: number;
  finalWeightGrams: number;
  waterEvaporatedGrams: number;
  waterEvaporationPercent: number;
  totalSolubleSolidsGrams: number;
  targetBrix: number;
  onTargetBrixChange: (val: number) => void;
  cookingState: VariegatoCookingState;
}

export const VariegatoCookingReductionCard: React.FC<VariegatoCookingReductionCardProps> = ({
  initialWeightGrams,
  finalWeightGrams,
  waterEvaporatedGrams,
  waterEvaporationPercent,
  totalSolubleSolidsGrams,
  targetBrix,
  onTargetBrixChange,
  cookingState
}) => {
  const isReduction = cookingState === 'active_reduction';

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {isReduction ? <Flame className="w-4 h-4 text-amber-400" /> : <Snowflake className="w-4 h-4 text-cyan-400" />}
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Balanço de Cocção & Redução</h4>
            <p className="text-[11px] text-slate-400">Ponto exato de parada na balança</p>
          </div>
        </div>

        {/* State Badge */}
        {isReduction ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Redução Ativa</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cocção Fria</span>
          </span>
        )}
      </div>

      {/* Target Brix Input & Soluble solids */}
      <div className="my-2.5 grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            °Brix Alvo Desejado
          </label>
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="number"
              step="0.5"
              min="20"
              max="90"
              value={targetBrix}
              onChange={e => onTargetBrixChange(parseFloat(e.target.value) || 68)}
              className="w-20 bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 text-center"
            />
            <span className="text-xs font-bold text-amber-400/80">°Brix</span>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Sólidos Solúveis
          </span>
          <div className="mt-1 font-mono text-sm font-bold text-slate-200">
            {totalSolubleSolidsGrams.toFixed(1)}g
          </div>
          <span className="text-[10px] text-slate-500">
            de {Math.round(initialWeightGrams)}g iniciais
          </span>
        </div>
      </div>

      {/* CAIXA DE BALANÇA EM LED DIGITAL (Destaque Principal) */}
      <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 p-3 shadow-lg shadow-amber-500/15 my-1">
        <div className="flex items-center justify-between pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            PESO FINAL NA BALANÇA (Alvo de Cocção)
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            PONTO DE DESLIGAR
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black tracking-tight text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              {Math.round(finalWeightGrams)}
            </span>
            <span className="text-sm font-mono font-bold text-amber-400/80">gramas</span>
          </div>

          {isReduction && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <Droplet className="w-3 h-3 text-cyan-400" />
                Vapor de Água:
              </span>
              <div className="text-xs font-mono font-bold text-cyan-300">
                -{waterEvaporatedGrams.toFixed(1)}g ({waterEvaporationPercent.toFixed(1)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
        <span className="flex items-center gap-1">
          <span className="text-slate-300 font-mono">{Math.round(initialWeightGrams)}g</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-amber-300 font-mono font-bold">{Math.round(finalWeightGrams)}g</span>
        </span>
        <span className="text-[10px] text-slate-500">
          {isReduction ? 'Pesar tacho quente na balança' : 'Sem perda de peso na cocção'}
        </span>
      </div>
    </div>
  );
};
