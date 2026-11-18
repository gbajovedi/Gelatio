import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  CheckCircle2,
  Info
} from 'lucide-react';
import { calculateFreezingState } from '../../core/freezingCurve';
import { BatchAnalysis } from '../../types/gelato';

interface VitrineSimulatorProps {
  waterPct: number; // 0 a 1 (ex: 0.64)
  pac: number; // ex: 250
  totalSolids: number; // 0 a 1 (ex: 0.36)
  caldaWeightGrams: number;
  servingTemperature?: number | string;
  corvittoMetrics?: BatchAnalysis['corvittoMetrics'];
}

interface EquipmentPreset {
  id: string;
  label: string;
  tempLabel: string;
  tempC: number;
}

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  { id: 'pozzetti', label: 'Pozzetti', tempLabel: '-11°', tempC: -11.0 },
  { id: 'ventilated', label: 'Vitrine', tempLabel: '-12°', tempC: -12.0 },
  { id: 'open', label: 'Aberta', tempLabel: '-14°', tempC: -14.0 },
  { id: 'freezer', label: 'Freezer', tempLabel: '-18°', tempC: -18.0 }
];

export const VitrineSimulator: React.FC<VitrineSimulatorProps> = ({
  waterPct,
  pac,
  totalSolids,
  caldaWeightGrams,
  servingTemperature,
  corvittoMetrics
}) => {
  const [selectedTemp, setSelectedTemp] = useState<number>(-12.0);

  // Análise termodinâmica instantânea
  const state = useMemo(() => {
    return calculateFreezingState(waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams);
  }, [waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams]);

  // Posição percentual do marcador na barra de textura (45% a 85% de gelo mapeado em 0% a 100%)
  const markerPosition = Math.max(0, Math.min(100, ((state.icePercent - 45) / (85 - 45)) * 100));

  // Quando o usuário seleciona Freezer (-18°C), exibe diagnóstico crioscópico específico de pote de freezer
  const isFreezerRange = selectedTemp <= -16.5 && !!corvittoMetrics;

  let activeBadgeText = state.statusLabel;
  let activeBadgeClasses = `${state.statusBadgeColor} ${state.statusBorderColor}`;

  if (isFreezerRange && corvittoMetrics) {
    activeBadgeText = corvittoMetrics.freezerLabel;
    if (corvittoMetrics.freezerStatus === 'duro') {
      activeBadgeClasses = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    } else if (corvittoMetrics.freezerStatus === 'colher') {
      activeBadgeClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    } else {
      activeBadgeClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  }

  return (
    <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 px-4 py-3 shadow-lg flex flex-col justify-between gap-2.5 h-full">
      {/* Linha 1: Cabeçalho enxuto (Título + Temp. Ideal + Status Único + Info Popover) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-200 whitespace-nowrap leading-none">
            Serviço &amp; Vitrine
          </h4>
          {servingTemperature !== undefined && (
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 whitespace-nowrap leading-none"
              title="Temperatura ideal estimada de serviço para espatulabilidade ótima na vitrine"
            >
              Ideal: {servingTemperature}°C
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border leading-tight shadow-sm whitespace-nowrap ${activeBadgeClasses}`}
            title={
              isFreezerRange && corvittoMetrics
                ? `PAC Água Livre: ${corvittoMetrics.pacWater}${
                    corvittoMetrics.neededPacForFreezer > 0
                      ? ` (+${corvittoMetrics.neededPacForFreezer} PAC p/ ponto de colher)`
                      : ' (ponto de colher imediato)'
                  }`
                : state.diagnostic
            }
          >
            {activeBadgeText}
          </span>

          {/* Ícone de Diagnóstico & Metodologia com Popover Flutuante */}
          <div className="relative group/tip flex items-center">
            <button
              type="button"
              className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-inner"
              title="Ver diagnóstico térmico completo e metodologia"
              aria-label="Ver diagnóstico e metodologia"
            >
              {state.status === 'ideal' && !isFreezerRange ? (
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
                <span>Diagnóstico Térmico &amp; Crioscópico</span>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                {state.diagnostic}
              </p>

              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>
                  🌡️ <strong>Faixa ideal de vitrine:</strong>{' '}
                  <span className="font-mono font-bold text-amber-300">
                    {state.idealTempRange.minTemp.toFixed(1)}°C
                  </span>{' '}
                  a{' '}
                  <span className="font-mono font-bold text-amber-300">
                    {state.idealTempRange.maxTemp.toFixed(1)}°C
                  </span>
                </div>
                {corvittoMetrics && (
                  <div>
                    ❄️ <strong>Pote Freezer (-18°C):</strong>{' '}
                    <span className="font-mono font-bold text-cyan-300">
                      PAC Água Livre {corvittoMetrics.pacWater}
                    </span>{' '}
                    — {corvittoMetrics.freezerLabel}
                    {corvittoMetrics.neededPacForFreezer > 0
                      ? ` (+${corvittoMetrics.neededPacForFreezer} PAC p/ ponto de colher)`
                      : ' (ponto de colher imediato)'}
                  </div>
                )}
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  * Estimativa termodinâmica pela <strong>Lei Crioscópica de Raoult</strong> (W<sub>livre</sub> = PAC × 5,434 / |T|) — Goff &amp; Hartel.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha 2: Presets Segmentados (2x2 mobile, 4 colunas >= sm) + Stepper Fino na mesma linha */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner flex-1">
          {EQUIPMENT_PRESETS.map(preset => {
            const isActive = Math.abs(selectedTemp - preset.tempC) < 0.1;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTemp(preset.tempC)}
                className={`py-1 px-1.5 rounded-lg transition-all flex flex-col items-center justify-center leading-tight select-none border ${
                  isActive
                    ? 'bg-cyan-500/25 text-white border-cyan-400/60 shadow-sm font-bold'
                    : 'bg-transparent text-slate-300 border-transparent hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <span className="text-[11px] whitespace-nowrap">{preset.label}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-200 font-bold' : 'text-slate-400'}`}>
                  {preset.tempLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stepper Térmico Compacto */}
        <div className="inline-flex items-center justify-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedTemp(prev => Math.max(-20, +(prev - 0.5).toFixed(1)))}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700/80 text-white text-sm font-bold flex items-center justify-center transition-colors active:scale-95"
            title="Diminuir temperatura (-0.5°C)"
            aria-label="Diminuir temperatura em 0.5 graus"
          >
            -
          </button>
          <span className="font-mono text-xs sm:text-sm font-black text-white tabular-nums tracking-tight min-w-[54px] text-center">
            {selectedTemp.toFixed(1)}°C
          </span>
          <button
            type="button"
            onClick={() => setSelectedTemp(prev => Math.min(-8, +(prev + 0.5).toFixed(1)))}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700/80 text-white text-sm font-bold flex items-center justify-center transition-colors active:scale-95"
            title="Aumentar temperatura (+0.5°C)"
            aria-label="Aumentar temperatura em 0.5 graus"
          >
            +
          </button>
        </div>
      </div>

      {/* Linha 3: Barra Única Inline de Equilíbrio (Gelo | Trilho de Textura | Líquido) */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <span
          className="bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 tabular-nums"
          title={`${state.frozenWaterGrams}g de água congelada`}
        >
          ❄️ {state.icePercent.toFixed(1)}% gelo
        </span>

        <div className="relative flex-1 py-1 flex items-center">
          <div className="vitrine-track h-2.5 w-full rounded-full bg-slate-950 border border-slate-700 overflow-hidden flex shadow-inner">
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
            <div className="vitrine-marker-ring w-4 h-4 rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border-2 border-white shadow-[0_0_10px_rgba(250,204,21,0.95)] ring-1 ring-amber-400/70" />
          </div>
        </div>

        <span
          className="bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 tabular-nums"
          title={`${state.liquidWaterGrams}g de água livre (não congelada)`}
        >
          💧 {state.liquidPercent.toFixed(1)}% líquido
        </span>
      </div>
    </div>
  );
};
