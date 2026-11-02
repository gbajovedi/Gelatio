import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  Wind,
  Layers,
  Archive,
  Info,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  SunMedium
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
  desc: string;
}

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: 'pozzetti',
    name: 'Pozzetti',
    tempC: -11.0,
    icon: <Layers className="w-3.5 h-3.5 text-emerald-400" />,
    desc: 'Baldes embutidos fechados (mais quente e cremoso)'
  },
  {
    id: 'ventilated',
    name: 'Vitrine Ventilada',
    tempC: -12.0,
    icon: <Wind className="w-3.5 h-3.5 text-sky-400" />,
    desc: 'Padrão clássico de vitrines com circulação de ar'
  },
  {
    id: 'open',
    name: 'Vitrine Aberta',
    tempC: -14.0,
    icon: <SunMedium className="w-3.5 h-3.5 text-amber-400" />,
    desc: 'Exposição de montanhas ou regiões muito quentes'
  },
  {
    id: 'freezer',
    name: 'Freezer / Take Away',
    tempC: -18.0,
    icon: <Archive className="w-3.5 h-3.5 text-purple-400" />,
    desc: 'Armazenamento em potes para viagem'
  }
];

export const VitrineSimulator: React.FC<VitrineSimulatorProps> = ({
  waterPct,
  pac,
  totalSolids,
  caldaWeightGrams
}) => {
  const [selectedTemp, setSelectedTemp] = useState<number>(-12.0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Análise termodinâmica instantânea
  const state = useMemo(() => {
    return calculateFreezingState(waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams);
  }, [waterPct, pac, totalSolids, selectedTemp, caldaWeightGrams]);

  // Geometria da Curva SVG
  // Eixo X: -8°C (x = 40) a -20°C (x = 370)
  // Eixo Y: 45% gelo (y = 120) a 85% gelo (y = 20)
  const svgWidth = 380;
  const svgHeight = 130;
  const paddingX = 40;
  const paddingY = 15;
  const plotW = svgWidth - paddingX - 15;
  const plotH = svgHeight - paddingY - 20;

  const getX = (t: number) => {
    // -8°C -> 0, -20°C -> plotW
    const ratio = (t - (-8)) / (-20 - (-8));
    return paddingX + ratio * plotW;
  };

  const getY = (ice: number) => {
    // 45% -> plotH, 85% -> 0
    const clampedIce = Math.max(45, Math.min(85, ice));
    const ratio = (clampedIce - 45) / (85 - 45);
    return paddingY + (1 - ratio) * plotH;
  };

  // Caminho da curva SVG
  const pathD = useMemo(() => {
    if (!state.curvePoints || state.curvePoints.length === 0) return '';
    return state.curvePoints
      .map((pt, i) => {
        const x = getX(pt.tempC);
        const y = getY(pt.icePercent);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [state.curvePoints]);

  const activePointX = getX(selectedTemp);
  const activePointY = getY(state.icePercent);

  // Zona Ideal: 65% a 74%
  const idealYTop = getY(74);
  const idealYBottom = getY(65);
  const idealHeight = Math.max(2, idealYBottom - idealYTop);

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
      {/* Header do Card com Toggle de Expansão */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>Simulador Térmico de Vitrine</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Curva de Dureza
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Comportamento do gelato e colherabilidade segundo a temperatura de serviço
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-1"
        >
          <span>{isExpanded ? 'Recolher' : 'Expandir'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Presets Rápidos de Equipamentos da Gelateria */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Selecione o Equipamento / Vitrine:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EQUIPMENT_PRESETS.map(preset => {
                const isActive = Math.abs(selectedTemp - preset.tempC) < 0.1;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedTemp(preset.tempC)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between shadow-inner ${
                      isActive
                        ? 'bg-sky-500/20 border-sky-500/50 text-white ring-1 ring-sky-500/30'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                    title={preset.desc}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="shrink-0">{preset.icon}</span>
                      <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-slate-950/80 text-sky-300 border border-slate-800">
                        {preset.tempC > 0 ? `+${preset.tempC}` : preset.tempC}°C
                      </span>
                    </div>
                    <span className="text-xs font-bold truncate block">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider de Temperatura Interativo (-8°C a -20°C) */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Temperatura Atual da Vitrine:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemp(prev => Math.min(-8, +(prev + 0.5).toFixed(1)))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                  title="Aumentar 0.5°C (Mais quente)"
                >
                  +
                </button>
                <span className="font-mono text-lg font-black text-amber-300 min-w-[70px] text-center">
                  {selectedTemp.toFixed(1)}°C
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTemp(prev => Math.max(-20, +(prev - 0.5).toFixed(1)))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                  title="Diminuir 0.5°C (Mais frio)"
                >
                  -
                </button>
              </div>
            </div>

            <input
              type="range"
              min="-20"
              max="-8"
              step="0.5"
              value={selectedTemp}
              onChange={e => setSelectedTemp(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
              <span>-20°C (Freezer)</span>
              <span>-14°C (Vitrine Aberta)</span>
              <span>-12°C (Ventilada)</span>
              <span>-11°C (Pozzetti)</span>
              <span>-8°C (Suave)</span>
            </div>
          </div>

          {/* Gráfico da Curva de Congelamento SVG */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Curva Térmica de Congelamento (% Gelo vs °C)</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Faixa Spatolabile: 65% – 74%</span>
              </span>
            </div>

            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-32 select-none">
                {/* Linhas de Grade Horizontais */}
                <line x1={paddingX} y1={getY(80)} x2={svgWidth - 15} y2={getY(80)} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1={paddingX} y1={getY(70)} x2={svgWidth - 15} y2={getY(70)} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1={paddingX} y1={getY(60)} x2={svgWidth - 15} y2={getY(60)} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1={paddingX} y1={getY(50)} x2={svgWidth - 15} y2={getY(50)} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />

                {/* Rótulos do Eixo Y */}
                <text x="5" y={getY(80) + 3} fill="#64748b" fontSize="8" fontFamily="monospace">80%</text>
                <text x="5" y={getY(70) + 3} fill="#64748b" fontSize="8" fontFamily="monospace">70%</text>
                <text x="5" y={getY(60) + 3} fill="#64748b" fontSize="8" fontFamily="monospace">60%</text>
                <text x="5" y={getY(50) + 3} fill="#64748b" fontSize="8" fontFamily="monospace">50%</text>

                {/* Faixa Verde: Zona Ideal de Spatolabilità (65% a 74% de gelo) */}
                <rect
                  x={paddingX}
                  y={idealYTop}
                  width={plotW}
                  height={idealHeight}
                  fill="rgba(16, 185, 129, 0.12)"
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeDasharray="2 2"
                  strokeWidth="0.8"
                />

                {/* Linha da Curva de Congelamento */}
                <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Linha Vertical da Temperatura Ativa */}
                <line
                  x1={activePointX}
                  y1={paddingY}
                  x2={activePointX}
                  y2={svgHeight - 20}
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />

                {/* Ponto Pulsante da Temperatura Atual */}
                <circle cx={activePointX} cy={activePointY} r="7" fill="rgba(251, 191, 36, 0.25)" className="animate-ping" />
                <circle cx={activePointX} cy={activePointY} r="4.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />

                {/* Rótulos do Eixo X */}
                <text x={getX(-8)} y={svgHeight - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">-8°</text>
                <text x={getX(-11)} y={svgHeight - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">-11°</text>
                <text x={getX(-14)} y={svgHeight - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">-14°</text>
                <text x={getX(-17)} y={svgHeight - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">-17°</text>
                <text x={getX(-20)} y={svgHeight - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">-20°</text>
              </svg>
            </div>
          </div>

          {/* Cards Bifásicos de Estado da Água & Dureza */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Água Congelada */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>❄️</span>
                <span>Fração de Gelo</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-sky-300 font-mono">
                  {state.icePercent.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({state.frozenWaterGrams}g)
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Microcristais congelados estruturantes</p>
            </div>

            {/* Card 2: Fase Xarope Líquido */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>💧</span>
                <span>Xarope Não-Congelado</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {state.liquidPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({state.liquidWaterGrams}g)
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Fase contínua que confere maciez e cremosidade</p>
            </div>
          </div>

          {/* Termômetro Visual de Dureza & Consistência */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Índice de Consistência & Dureza:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${state.statusBadgeColor} ${state.statusBorderColor}`}>
                {state.statusLabel}
              </span>
            </div>

            {/* Barra de Progresso Multinível */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  state.status === 'too_soft'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                    : state.status === 'soft'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : state.status === 'ideal'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : state.status === 'firm'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-400'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                }`}
                style={{ width: `${state.hardnessIndex}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-0.5">
              <span>Muito Mole</span>
              <span>Mole</span>
              <span className="text-emerald-400">Spatolabile Ideal</span>
              <span>Firme</span>
              <span>Duro</span>
            </div>
          </div>

          {/* Diagnóstico Textual Inteligente do Gelatiere */}
          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
            state.status === 'ideal'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : state.status === 'too_soft' || state.status === 'hard'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              {state.status === 'ideal' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{state.diagnostic}</p>
                <p className="text-[11px] opacity-90">
                  🌡️ <strong>Faixa de serviço ideal para esta receita:</strong> entre{' '}
                  <span className="font-mono font-bold text-white">
                    {state.idealTempRange.minTemp.toFixed(1)}°C
                  </span>{' '}
                  e{' '}
                  <span className="font-mono font-bold text-white">
                    {state.idealTempRange.maxTemp.toFixed(1)}°C
                  </span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
