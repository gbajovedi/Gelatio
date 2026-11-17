import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  Wind,
  Layers,
  Archive,
  SunMedium,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateFreezingState } from '../../core/freezingCurve';

interface VitrineSimulatorProps {
  waterPct: number; // 0 a 1 (ex: 0.64)
  pac: number; // ex: 21.5
  totalSolids: number; // 0 a 1 (ex: 0.36)
  caldaWeightGrams: number;
}

interface EquipmentPreset {
  id: string;
  name: string;
  tempC: number;
  icon: React.ReactNode;
}

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: 'pozzetti',
    name: 'Pozzetti -11°',
    tempC: -11.0,
    icon: <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
  },
  {
    id: 'ventilated',
    name: 'Vitrine -12°',
    tempC: -12.0,
    icon: <Wind className="w-3 h-3 text-sky-400 shrink-0" />
  },
  {
    id: 'open',
    name: 'Aberta -14°',
    tempC: -14.0,
    icon: <SunMedium className="w-3 h-3 text-amber-400 shrink-0" />
  },
  {
    id: 'freezer',
    name: 'Freezer -18°',
    tempC: -18.0,
    icon: <Archive className="w-3 h-3 text-purple-400 shrink-0" />
  }
];

export const VitrineSimulator: React.FC<VitrineSimulatorProps> = ({
  waterPct,
  pac,
  totalSolids,
  caldaWeightGrams
}) => {
  const [selectedTemp, setSelectedTemp] = useState<number>(-12.0);

  // Análise termodinâmica instantânea
  const state = useMemo(() => {
    return calculateFreezingState(waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams);
  }, [waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams]);

  // Posição percentual do marcador na barra de textura (45% a 85% de gelo mapeado em 0% a 100%)
  const markerPosition = Math.max(0, Math.min(100, ((state.icePercent - 45) / (85 - 45)) * 100));

  return (
    <div className="bg-slate-900/95 rounded-xl border border-slate-700/80 px-3.5 py-2.5 shadow-md flex flex-col justify-between gap-2 h-full">
      {/* Header Compacto com Título, Status e Popover de Diagnóstico */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-cyan-300 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Thermometer className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-cyan-200 truncate leading-none">
            Simulador Térmico da Vitrine
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border leading-none shadow-sm ${state.statusBadgeColor} ${state.statusBorderColor}`}
          >
            {state.statusLabel}
          </span>

          {/* Ícone de Diagnóstico & Metodologia (Raoult / Goff & Hartel) com Popover Flutuante */}
          <div className="relative group/tip flex items-center">
            <button
              type="button"
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-inner"
              title="Ver diagnóstico térmico e metodologia (Goff & Hartel)"
              aria-label="Ver diagnóstico e metodologia"
            >
              {state.status === 'ideal' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Info className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>

            {/* Popover Flutuante */}
            <div className="absolute right-0 top-full mt-2 opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-all duration-200 z-50 w-72 sm:w-80 p-3.5 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-left text-xs leading-relaxed space-y-2">
              <div className="absolute -top-1.5 right-2 w-3 h-3 rotate-45 bg-slate-950 border-l border-t border-slate-700/90" />

              <div className="flex items-center gap-1.5 font-bold text-slate-100 border-b border-slate-800 pb-1.5">
                {state.status === 'ideal' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span>Diagnóstico Térmico da Receita</span>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                {state.diagnostic}
              </p>

              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>
                  🌡️ <strong>Faixa ideal recomendada:</strong>{' '}
                  <span className="font-mono font-bold text-amber-300">
                    {state.idealTempRange.minTemp.toFixed(1)}°C
                  </span>{' '}
                  a{' '}
                  <span className="font-mono font-bold text-amber-300">
                    {state.idealTempRange.maxTemp.toFixed(1)}°C
                  </span>.
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  * Estimativa termodinâmica pela <strong>Lei Crioscópica de Raoult</strong> (W<sub>livre</sub> = PAC × 5,434 / |T|) — Goff &amp; Hartel.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha de Controles Unificada: Presets de Equipamentos + Stepper Térmico */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-1.5 w-full">
        {/* Seletor de Equipamentos (2x2 mobile, 4 colunas >= sm) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1">
          {EQUIPMENT_PRESETS.map(preset => {
            const isActive = Math.abs(selectedTemp - preset.tempC) < 0.1;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTemp(preset.tempC)}
                className={`w-full py-1 px-1 rounded-lg text-[10px] tracking-tight font-bold transition-all flex items-center justify-center gap-1 border shadow-inner text-center select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/25 text-white border-cyan-400/60 ring-1 ring-cyan-400/30 font-black'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {preset.icon}
                <span className="truncate">{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Stepper Térmico Integrado */}
        <div className="inline-flex items-center justify-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-700/80 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setSelectedTemp(prev => Math.max(-20, +(prev - 0.5).toFixed(1)))}
            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors active:scale-95"
            title="Diminuir temperatura (-0.5°C)"
            aria-label="Diminuir temperatura em 0.5 graus"
          >
            -
          </button>
          <span className="font-mono text-xs font-black text-amber-300 tracking-tight px-1 min-w-[48px] text-center">
            {selectedTemp.toFixed(1)}°C
          </span>
          <button
            type="button"
            onClick={() => setSelectedTemp(prev => Math.min(-8, +(prev + 0.5).toFixed(1)))}
            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors active:scale-95"
            title="Aumentar temperatura (+0.5°C)"
            aria-label="Aumentar temperatura em 0.5 graus"
          >
            +
          </button>
        </div>
      </div>

      {/* Caixa Compacta de Fração em Equilíbrio (Gelo vs Fase Líquida + Trilho de Textura) */}
      <div className="bg-slate-950/80 px-2.5 py-2 rounded-lg border border-slate-800 space-y-1.5">
        {/* Pílulas de Balanço Dual (Gelo vs Fase Líquida) */}
        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold px-2 py-0.5 rounded-md">
            ❄️ {state.icePercent.toFixed(1)}% gelo{' '}
            <span className="text-cyan-200/70 font-normal">({state.frozenWaterGrams}g)</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-slate-400">
            <Sparkles className="w-3 h-3 text-cyan-400/80" />
            <span>Equilíbrio</span>
          </span>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-md">
            💧 {state.liquidPercent.toFixed(1)}% líquido{' '}
            <span className="text-amber-200/70 font-normal">({state.liquidWaterGrams}g)</span>
          </span>
        </div>

        {/* Trilho Visual Compacto com Marcador Dinâmico */}
        <div className="relative py-1 flex items-center">
          <div className="vitrine-track h-2 w-full rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex shadow-inner">
            <div
              style={{ width: '27.5%' }}
              className="bg-amber-500/30 border-r border-slate-950/50"
              title="Muito Macio (< 56%)"
            />
            <div
              style={{ width: '20%' }}
              className="bg-amber-500/50 border-r border-slate-950/50"
              title="Macio & Cremoso (56% a 64%)"
            />
            <div
              style={{ width: '27.5%' }}
              className="bg-emerald-500/80 border-r border-slate-950/50 ring-1 ring-emerald-400"
              title="Espatulabilidade Ideal (64% a 75%)"
            />
            <div
              style={{ width: '17.5%' }}
              className="bg-sky-500/60 border-r border-slate-950/50"
              title="Firme / Estruturado (75% a 82%)"
            />
            <div
              style={{ width: '7.5%' }}
              className="bg-purple-500/70"
              title="Ponto de Freezer (> 82%)"
            />
          </div>

          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none z-10"
            style={{ left: `${markerPosition}%` }}
          >
            <div className="vitrine-marker-ring w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border-2 border-white shadow-[0_0_10px_rgba(250,204,21,0.95)] ring-1 ring-amber-400/70" />
          </div>
        </div>

        {/* Legenda das Zonas Compacta */}
        <div className="flex justify-between text-[9px] font-bold text-slate-400 select-none leading-none">
          <span className="text-amber-400/80">Muito Macio</span>
          <span className="text-amber-300">Macio</span>
          <span className="text-emerald-400 font-extrabold">★ Espatulabilidade Ideal</span>
          <span className="text-sky-300">Firme</span>
          <span className="text-purple-300">Freezer</span>
        </div>
      </div>
    </div>
  );
};
