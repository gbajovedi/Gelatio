import React from 'react';
import { VariegatoAnalysisPercentages, VariegatoStyleStandard } from '../../types/variegato';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  Candy,
  Droplet,
  Layers,
  ShieldAlert,
  Sparkles,
  Percent
} from 'lucide-react';

interface VariegatoNutrientGridProps {
  percentages: VariegatoAnalysisPercentages;
  style: VariegatoStyleStandard;
}

interface MetricCardConfig {
  title: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  min: number;
  max: number;
  isMaxLimitOnly?: boolean;
  decimals?: number;
  description: string;
  accentColor: string;
}

export const VariegatoNutrientGrid: React.FC<VariegatoNutrientGridProps> = ({
  percentages,
  style
}) => {
  const cards: MetricCardConfig[] = [
    {
      title: '°Brix Pós-Cocção',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      value: percentages.brix,
      unit: '°Bx',
      min: style.min.brix,
      max: style.max.brix,
      decimals: 1,
      description: 'Sólidos solúveis concentrados',
      accentColor: 'from-amber-500 to-amber-300'
    },
    {
      title: 'PAC Efetivo Concentrado',
      icon: <Snowflake className="w-4 h-4 text-cyan-400" />,
      value: percentages.pac,
      unit: 'pts',
      min: style.min.pac,
      max: style.max.pac,
      decimals: 0,
      description: 'Maleabilidade e ponto anticongelante',
      accentColor: 'from-cyan-500 to-sky-400'
    },
    {
      title: 'Açúcares Totais',
      icon: <Candy className="w-4 h-4 text-rose-400" />,
      value: percentages.sugars,
      unit: '%',
      min: style.min.sugars,
      max: style.max.sugars,
      decimals: 1,
      description: 'Concentração de sacarídeos',
      accentColor: 'from-rose-500 to-pink-400'
    },
    {
      title: 'Gorduras Totais',
      icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
      value: percentages.fat,
      unit: '%',
      min: style.min.fat,
      max: style.max.fat,
      decimals: 1,
      description: 'Fração lipídica e cremosidade',
      accentColor: 'from-yellow-500 to-amber-400'
    },
    {
      title: 'Taxa de Hidrocolóides',
      icon: <Layers className="w-4 h-4 text-teal-400" />,
      value: percentages.hydrocolloids,
      unit: '%',
      min: style.min.hydrocolloids,
      max: style.max.hydrocolloids,
      decimals: 2,
      description: 'Pectina, gomas e retenção coloidal',
      accentColor: 'from-teal-500 to-emerald-400'
    },
    {
      title: 'Razão Sacarose / Anti-Cristal.',
      icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
      value: percentages.sucroseRatio,
      unit: '%',
      min: 0,
      max: style.min.maxSucroseRatio || 60,
      isMaxLimitOnly: true,
      decimals: 1,
      description: 'Limite seguro ≤ 60% para não cristalizar',
      accentColor: 'from-purple-500 to-indigo-400'
    },
    {
      title: 'Água Residual Livre',
      icon: <Droplet className="w-4 h-4 text-blue-400" />,
      value: percentages.water,
      unit: '%',
      min: style.min.water,
      max: style.max.water,
      decimals: 1,
      description: 'Fase aquosa não congelada',
      accentColor: 'from-blue-500 to-cyan-400'
    },
    {
      title: 'Atividade de Água (aw)',
      icon: <Percent className="w-4 h-4 text-emerald-400" />,
      value: percentages.estimatedAw,
      unit: 'aw',
      min: 0.35,
      max: 0.80,
      isMaxLimitOnly: true,
      decimals: 3,
      description: 'Estabilidade microbiológica (< 0.80)',
      accentColor: 'from-emerald-500 to-teal-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const isOk = card.isMaxLimitOnly
          ? card.value <= card.max
          : card.value >= card.min && card.value <= card.max;

        // Progress bar percentage calculation
        const range = card.max - card.min;
        const progressPct = range > 0
          ? Math.min(100, Math.max(5, ((card.value - card.min) / range) * 100))
          : 50;

        return (
          <div
            key={idx}
            className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-3 shadow-md flex flex-col justify-between hover:border-slate-600 transition-all group"
          >
            {/* Top row */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-slate-800 border border-slate-700/80">
                  {card.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-300 leading-tight">
                  {card.title}
                </span>
              </div>

              {isOk ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  No Alvo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Ajustar
                </span>
              )}
            </div>

            {/* Metric Value */}
            <div className="my-2 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-mono font-black text-white group-hover:text-amber-300 transition-colors">
                  {card.value.toFixed(card.decimals ?? 1)}
                </span>
                <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-right">
                {card.isMaxLimitOnly ? (
                  <span>Máx: {card.max}{card.unit}</span>
                ) : (
                  <span>{card.min} – {card.max}{card.unit}</span>
                )}
              </div>
            </div>

            {/* Horizontal Mini Range Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full bg-gradient-to-r ${card.accentColor} rounded-full transition-all duration-300`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-500 truncate" title={card.description}>
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
