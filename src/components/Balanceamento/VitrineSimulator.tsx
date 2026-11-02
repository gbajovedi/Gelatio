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
    name: 'Pozzetti (-11°C)',
    tempC: -11.0,
    icon: <Layers className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'ventilated',
    name: 'Vitrine Clássica (-12°C)',
    tempC: -12.0,
    icon: <Wind className="w-3.5 h-3.5 text-sky-400" />
  },
  {
    id: 'open',
    name: 'Vitrine Aberta (-14°C)',
    tempC: -14.0,
    icon: <SunMedium className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    id: 'freezer',
    name: 'Pote / Freezer (-18°C)',
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
    <div className="bg-slate-900/95 rounded-2xl border border-slate-700/80 p-4 shadow-md space-y-3.5">
      {/* Header com Título e Status da Textura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm uppercase font-bold tracking-wider text-cyan-200">
              Simulador Térmico da Vitrine (Dureza vs. Temperatura)
            </h4>
            <span className="text-[11px] text-slate-400 block">
              Comportamento e colherabilidade do gelato conforme a temperatura de serviço
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`text-xs px-3 py-1 rounded-full font-bold border shadow-sm ${state.statusBadgeColor} ${state.statusBorderColor}`}>
            {state.statusLabel}
          </span>

          {/* Ícone de Diagnóstico com Tooltip Flutuante ao Passar o Mouse (Zero Layout Shift) */}
          <div className="relative group/tip flex items-center">
            <button
              type="button"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-inner"
              title="Ver diagnóstico e faixa ideal"
              aria-label="Ver diagnóstico e faixa ideal"
            >
              {state.status === 'ideal' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* Popover Flutuante com Seta */}
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

              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                🌡️ <strong>Faixa ideal para esta receita:</strong>{' '}
                <span className="font-mono font-bold text-amber-300">
                  {state.idealTempRange.minTemp.toFixed(1)}°C
                </span>{' '}
                a{' '}
                <span className="font-mono font-bold text-amber-300">
                  {state.idealTempRange.maxTemp.toFixed(1)}°C
                </span>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor Rápido de Equipamentos & Controle Térmico */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Presets de Equipamentos (8 cols) */}
        <div className="md:col-span-8 flex flex-wrap gap-1.5">
          {EQUIPMENT_PRESETS.map(preset => {
            const isActive = Math.abs(selectedTemp - preset.tempC) < 0.1;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTemp(preset.tempC)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-inner ${
                  isActive
                    ? 'bg-cyan-500/25 text-white border-cyan-400/60 ring-1 ring-cyan-400/30 font-black'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-900'
                }`}
              >
                {preset.icon}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Stepper Térmico Preciso (ajustado com precisão ao tamanho dos dados) */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end">
          <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedTemp(prev => Math.min(-8, +(prev + 0.5).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors"
              title="Aumentar temperatura (+0.5°C)"
            >
              +
            </button>
            <div className="px-2 text-center min-w-[70px]">
              <span className="font-mono text-base font-black text-amber-300 tracking-tight block">
                {selectedTemp.toFixed(1)}°C
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTemp(prev => Math.max(-20, +(prev - 0.5).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black flex items-center justify-center transition-colors"
              title="Diminuir temperatura (-0.5°C)"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Régua Visual de Consistência e Dureza */}
      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Escala de Consistência & Ponto de Espátula:</span>
          </span>
          <span className="font-mono text-slate-200 font-bold">
            ❄️ <strong>{state.icePercent.toFixed(1)}% de gelo</strong> ({state.frozenWaterGrams}g)
            <span className="text-slate-400 font-normal ml-1.5">| 💧 {state.liquidPercent.toFixed(1)}% xarope ({state.liquidWaterGrams}g)</span>
          </span>
        </div>

        {/* Trilho Visual com Marcador Dinâmico */}
        <div className="relative py-2 flex items-center">
          {/* Barra Gradiente com Zonas de Textura */}
          <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex shadow-inner">
            <div style={{ width: '27.5%' }} className="bg-amber-500/30 border-r border-slate-950/50" title="Muito Macio (< 56%)" />
            <div style={{ width: '20%' }} className="bg-amber-500/50 border-r border-slate-950/50" title="Macio & Cremoso (56% a 64%)" />
            <div style={{ width: '27.5%' }} className="bg-emerald-500/80 border-r border-slate-950/50 ring-1 ring-emerald-400" title="Spatolabile Ideal (64% a 75%)" />
            <div style={{ width: '17.5%' }} className="bg-sky-500/60 border-r border-slate-950/50" title="Firme / Estruturado (75% a 82%)" />
            <div style={{ width: '7.5%' }} className="bg-purple-500/70" title="Ponto de Freezer (> 82%)" />
          </div>

          {/* Marcador do Ponto Atual com Indicador de Posição (Centralizado perfeitamente e estático) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none"
            style={{ left: `${markerPosition}%` }}
          >
            <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md shadow-amber-500/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>
          </div>
        </div>

        {/* Legenda das Zonas */}
        <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5 select-none">
          <span className="text-amber-400/80">Muito Macio</span>
          <span className="text-amber-300">Macio</span>
          <span className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>★</span> Spatolabile Ideal (Vitrine)
          </span>
          <span className="text-sky-300">Firme</span>
          <span className="text-purple-300">Freezer (-18°C)</span>
        </div>
      </div>
    </div>
  );
};
