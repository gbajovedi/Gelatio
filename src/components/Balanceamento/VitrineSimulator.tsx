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

  // Análise termodinâmica instantânea (escala explícita per1000g vinda de validations.pac.val)
  const state = useMemo(() => {
    return calculateFreezingState(waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams, 'per1000g');
  }, [waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams]);

  // Posição percentual do marcador na escala simétrica (49% a 90% de gelo => centro exato 69.5% = 50% da barra)
  const markerPosition = Math.max(0, Math.min(100, ((state.icePercent - 49) / (90 - 49)) * 100));

  // Brilho reativo da agulha de precisão conforme o status térmico atual
  const needleGlowClass =
    state.status === 'ideal'
      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,1),0_0_12px_rgba(52,211,153,0.95)] ring-1 ring-emerald-300'
      : state.status === 'very_soft' || state.status === 'soft'
      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,1),0_0_12px_rgba(245,158,11,0.95)] ring-1 ring-amber-300'
      : 'bg-white shadow-[0_0_6px_rgba(255,255,255,1),0_0_12px_rgba(56,189,248,0.95)] ring-1 ring-sky-300';

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
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-inner"
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
                  {Math.abs(state.idealTempRange.minTemp - state.idealTempRange.maxTemp) < 0.05 ? (
                    <span className="font-mono font-bold text-amber-300">
                      {state.idealTempRange.maxTemp <= -20
                        ? 'abaixo de -20.0°C (calda muito macia)'
                        : 'acima de -8.0°C (calda muito firme)'}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono font-bold text-amber-300">
                        {state.idealTempRange.minTemp.toFixed(1)}°C
                      </span>{' '}
                      a{' '}
                      <span className="font-mono font-bold text-amber-300">
                        {state.idealTempRange.maxTemp.toFixed(1)}°C
                      </span>
                    </>
                  )}
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
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
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

      {/* Linha 3: Barra de Espatulabilidade (Líquido/Macio ← Gradiente Contínuo com Verde Centralizado → Gelo/Firme) */}
      <div className="flex items-start gap-2.5 pt-0.5">
        <span
          className="bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 tabular-nums mt-0.5"
          title={`${state.liquidWaterGrams}g de água livre (fase xarope não congelada)`}
        >
          💧 {state.liquidPercent.toFixed(1)}% líq.
        </span>

        <div className="flex-1 min-w-0">
          {/* Trilho Contínuo Térmico + Delimitadores da Janela Ideal (64%–75%) + Agulha de Precisão */}
          <div className="relative py-1 flex items-center">
            <div
              className="vitrine-track relative h-2.5 w-full rounded-full border border-slate-700/90 overflow-hidden shadow-inner"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #f97316 0%, #f59e0b 23%, #10b981 36.6%, #34d399 50%, #10b981 63.4%, #38bdf8 79%, #6366f1 100%)'
              }}
              title="Escala contínua de espatulabilidade (49% a 90% de água congelada · Janela ideal centralizada em 64%–75%)"
            >
              {/* Delimitadores translúcidos sutis da zona verde ideal (64% = 36.6% | 75% = 63.4%) */}
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-white/65 pointer-events-none"
                style={{ left: '36.6%' }}
                title="Início da Espatulabilidade Ideal (64% gelo)"
              />
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-white/65 pointer-events-none"
                style={{ left: '63.4%' }}
                title="Fim da Espatulabilidade Ideal (75% gelo)"
              />
            </div>

            {/* Agulha Vertical de Alta Precisão */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none z-10"
              style={{ left: `${markerPosition}%` }}
              title={`Água congelada a ${selectedTemp.toFixed(1)}°C: ${state.icePercent.toFixed(1)}% (${state.statusLabel})`}
            >
              <div className={`vitrine-marker-ring w-[4px] h-4 rounded-full ${needleGlowClass}`} />
            </div>
          </div>

          {/* Micro-Legenda Gráfica responsiva sem colisão em telas estreitas */}
          <div className="grid grid-cols-3 items-center text-[9px] leading-none select-none mt-1 px-0.5 gap-1">
            <span className="text-amber-400/90 font-semibold text-left truncate">Macio</span>
            <span className="text-emerald-400 font-bold text-center whitespace-nowrap">
              <span className="sm:hidden">Ideal 64–75%</span>
              <span className="hidden sm:inline">Ideal · 64–75% gelo</span>
            </span>
            <span className="text-sky-400/90 font-semibold text-right truncate">
              <span className="sm:hidden">Firme</span>
              <span className="hidden sm:inline">Firme / Freezer</span>
            </span>
          </div>
        </div>

        <span
          className="bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 tabular-nums mt-0.5"
          title={`${state.frozenWaterGrams}g de água congelada em microcristais`}
        >
          ❄️ {state.icePercent.toFixed(1)}% gelo
        </span>
      </div>
    </div>
  );
};
