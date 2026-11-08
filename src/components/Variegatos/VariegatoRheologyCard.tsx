import React from 'react';
import { VariegatoRheologyLevel, VariegatoRheologyStatus } from '../../types/variegato';
import { Activity, Gauge, Sparkles } from 'lucide-react';

interface VariegatoRheologyCardProps {
  level: VariegatoRheologyLevel;
  onLevelChange: (lvl: VariegatoRheologyLevel) => void;
  rheologyStatus: VariegatoRheologyStatus;
  hydrocolloidsPct: number;
}

export const VariegatoRheologyCard: React.FC<VariegatoRheologyCardProps> = ({
  level,
  onLevelChange,
  rheologyStatus,
  hydrocolloidsPct
}) => {
  // Gauge scale up to 15,000 cps for visual fill
  const maxCps = 15000;
  const cpsPercent = Math.min(100, Math.max(10, (rheologyStatus.estimatedCps / maxCps) * 100));

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Reologia & Viscosidade</h4>
            <p className="text-[11px] text-slate-400">Comportamento de fluxo na mesclagem</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">
          Nível {level} de 3
        </span>
      </div>

      {/* 3-Level Dynamic Selector */}
      <div className="my-3 grid grid-cols-3 gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onLevelChange(1)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
            level === 1
              ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-sm shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Nível 1: Fluido / Fio Contínuo"
        >
          1. Fluido
        </button>

        <button
          type="button"
          onClick={() => onLevelChange(2)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
            level === 2
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Nível 2: Pastoso Equilibrado"
        >
          2. Pastoso
        </button>

        <button
          type="button"
          onClick={() => onLevelChange(3)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
            level === 3
              ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Nível 3: Gel Estruturado"
        >
          3. Firme
        </button>
      </div>

      {/* Viscosity & Texturizer Visualizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-teal-400" />
            Viscosidade Teórica:
          </span>
          <span className="font-mono font-bold text-teal-300">
            ~{rheologyStatus.estimatedCps.toLocaleString('pt-BR')} cps
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${cpsPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Hidrocolóides presentes: <strong className="text-slate-200 font-mono">{hydrocolloidsPct.toFixed(2)}%</strong></span>
          <span className="text-teal-400 font-semibold">{rheologyStatus.label}</span>
        </div>
      </div>

      {/* Recommended texturizer recipe hint */}
      <div className="mt-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/90 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-300 leading-tight">
          <span className="font-bold text-amber-300">Sugestão Técnica: </span>
          {rheologyStatus.recommendedTexturizer}
        </div>
      </div>
    </div>
  );
};
