import React from 'react';
import {
  VariegatoThermalApplication,
  VariegatoThermalStatus,
  VariegatoThermalGuidance
} from '../../types/variegato';
import { Store, Snowflake, CheckCircle2, AlertTriangle, AlertCircle, ThermometerSnowflake } from 'lucide-react';

interface VariegatoThermalCardProps {
  application: VariegatoThermalApplication;
  onApplicationChange: (app: VariegatoThermalApplication) => void;
  thermalStatus: VariegatoThermalStatus;
  thermalGuidance?: VariegatoThermalGuidance;
}

export const VariegatoThermalCard: React.FC<VariegatoThermalCardProps> = ({
  application,
  onApplicationChange,
  thermalStatus,
  thermalGuidance
}) => {
  const isVitrine = application === 'vitrine';

  const getStatusBadge = () => {
    switch (thermalStatus.status) {
      case 'ideal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plasticidade Ideal</span>
          </span>
        );
      case 'freezing_risk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Risco de Congelamento</span>
          </span>
        );
      case 'too_fluid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Excesso de Fluidez</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Ponto Térmico de Aplicação</h4>
            <p className="text-[11px] text-slate-400">Comportamento a frio da mescla</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Toggles */}
      <div className="my-3 grid grid-cols-2 gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onApplicationChange('vitrine')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isVitrine
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Vitrine (-12°C)</span>
        </button>

        <button
          type="button"
          onClick={() => onApplicationChange('freezer')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            !isVitrine
              ? 'bg-sky-500/25 text-sky-300 border border-sky-500/50 shadow-sm shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Snowflake className="w-3.5 h-3.5" />
          <span>Pote Freezer (-18°C)</span>
        </button>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">PAC Concentrado (1kg)</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-mono font-black text-cyan-300">{thermalStatus.pacValue}</span>
            <span className="text-xs font-semibold text-slate-400">pontos</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {isVitrine ? 'Alvo: 460–680' : 'Alvo: 540–780'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">PAC sobre Água Livre:</span>
          <div className="text-sm font-mono font-black text-teal-300 mt-0.5">
            {thermalStatus.pacOnWater || 0} pts
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {isVitrine ? 'Alvo: 180–320' : 'Alvo: 250–450'}
          </span>
        </div>
      </div>

      {/* Prescriptive Thermal Guidance Box */}
      <div
        className={`mt-3 p-3 rounded-xl border space-y-1 ${
          thermalStatus.status === 'ideal'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
            : thermalStatus.status === 'freezing_risk'
            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-100'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-100'
        }`}
      >
        <div className="text-xs font-bold leading-snug">
          {thermalGuidance ? thermalGuidance.headline : thermalStatus.label}
        </div>
        <p className="text-[11px] leading-relaxed opacity-90">
          {thermalGuidance && thermalGuidance.status !== 'ideal'
            ? thermalGuidance.actionInstruction
            : thermalStatus.description}
        </p>
        {thermalGuidance && thermalGuidance.status !== 'ideal' && (
          <p className="text-[10px] opacity-75 leading-snug pt-0.5">
            {thermalStatus.description}
          </p>
        )}
      </div>
    </div>
  );
};
