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
    name: 'Pozzetti (-11°)',
    tempC: -11.0,
    icon: <Layers className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'ventilated',
    name: 'Vitrine (-12°)',
    tempC: -12.0,
    icon: <Wind className="w-3.5 h-3.5 text-sky-400" />
  },
  {
    id: 'open',
    name: 'Aberta (-14°)',
    tempC: -14.0,
    icon: <SunMedium className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    id: 'freezer',
    name: 'Freezer (-18°)',
    tempC: -18.0,
    icon: <Archive className="w-3.5 h-3.5 text-purple-400" />
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
    <div className="bg-slate-900/95 rounded-2xl border border-slate-700/80 p-4 shadow-md flex flex-col justify-between space-y-3 h-full">
      {/* Header com Título, Subtítulo e Status da Textura */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5 text-cyan-300 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm uppercase font-bold tracking-wider text-cyan-200 truncate leading-none">
              Simulador Térmico da Vitrine
            </h4>
            <span className="text-[11px] text-slate-400 block truncate mt-1">
              Curva de congelamento e colherabilidade por temperatura
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold border shadow-sm ${state.statusBadgeColor} ${state.statusBorderColor}`}
          >
            {state.statusLabel}
          </span>

          {/* Ícone de Diagnóstico & Metodologia com Popover Flutuante */}
          <div className="relative group/tip flex items-center">
            <button
              type="button"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-inner"
              title="Ver diagnóstico e metodologia"
              aria-label="Ver diagnóstico e metodologia"
            >
              {state.status === 'ideal' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* Popover Flutuante */}
            <div className="absolute right-0 top-full mt-2 opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-all duration-200 z-50 w-72 sm:w-80 p-3.5 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-left text-xs leading-relaxed space-y-2">
              <div className="absolute -top-1.5 right-2.5 w-3 h-3 rotate-45 bg-slate-950 border-l border-t border-slate-700/90" />

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
                  * Modelo preditivo Goff &amp; Hartel baseado na Lei Crioscópica de Raoult.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Equipamentos (4 Cards com Tamanho Adaptativo preenchendo 100% da largura) */}
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {EQUIPMENT_PRESETS.map(preset => {
          const isActive = Math.abs(selectedTemp - preset.tempC) < 0.1;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedTemp(preset.tempC)}
              className={`w-full py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 border shadow-inner text-center select-none ${
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

      {/* Caixa de Fração em Equilíbrio (com Controle Térmico fixado no topo direito do card) */}
      <div className="relative flex-1 flex flex-col justify-between bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        {/* Topo do Card de Fração em Equilíbrio: Título na Esquerda e Controle de Temperatura na Direita */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold flex items-center gap-1.5 text-slate-100 text-xs sm:text-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Fração em Equilíbrio:</span>
          </span>

          {/* Stepper Térmico com Posição Relativa Fixa à Direita do Card */}
          <div className="inline-flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-xl border border-slate-700/80 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTemp(prev => Math.max(-20, +(prev - 0.5).toFixed(1)))}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors active:scale-95"
              title="Diminuir temperatura (-0.5°C)"
            >
              -
            </button>
            <div className="px-1.5 text-center min-w-[54px]">
              <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tracking-tight block">
                {selectedTemp.toFixed(1)}°C
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTemp(prev => Math.min(-8, +(prev + 0.5).toFixed(1)))}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors active:scale-95"
              title="Aumentar temperatura (+0.5°C)"
            >
              +
            </button>
          </div>
        </div>

        {/* Pílulas de Balanço Dual (Gelo vs Fase Líquida) */}
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] sm:text-xs">
          <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold px-2 py-0.5 rounded-lg">
            ❄️ {state.icePercent.toFixed(1)}% gelo{' '}
            <span className="text-cyan-200/70 font-normal">({state.frozenWaterGrams}g)</span>
          </span>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-lg">
            💧 {state.liquidPercent.toFixed(1)}% líquido{' '}
            <span className="text-amber-200/70 font-normal">({state.liquidWaterGrams}g)</span>
          </span>
        </div>

        {/* Trilho Visual com Marcador Dinâmico */}
        <div className="relative py-1.5 flex items-center">
          <div className="vitrine-track h-3 w-full rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex shadow-inner">
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
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none"
            style={{ left: `${markerPosition}%` }}
          >
            <div className="vitrine-marker-ring w-4.5 h-4.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md shadow-amber-500/50 flex items-center justify-center">
              <div className="vitrine-marker-dot w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>
          </div>
        </div>

        {/* Legenda das Zonas Compacta */}
        <div className="flex justify-between text-[10px] font-bold text-slate-400 select-none pt-0.5">
          <span className="text-amber-400/80">Muito Macio</span>
          <span className="text-amber-300">Macio</span>
          <span className="text-emerald-400 font-extrabold">★ Espatulabilidade Ideal</span>
          <span className="text-sky-300">Firme</span>
          <span className="text-purple-300">Freezer</span>
        </div>
      </div>

      {/* Nota Metodológica e Disclaimer do Modelo Crioscópico */}
      <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/80 flex items-center justify-between gap-1 leading-tight">
        <span className="truncate">
          * Estimativa termodinâmica pela <strong>Lei Crioscópica de Raoult</strong> (W<sub>livre</sub> = PAC × 5,434 / |T|).
        </span>
        <span className="shrink-0 font-medium text-slate-400 text-[9px] bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
          Goff &amp; Hartel
        </span>
      </div>
    </div>
  );
};
