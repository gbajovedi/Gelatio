import React from 'react';
import {
  VariegatoRheologyLevel,
  VariegatoRheologyStatus,
  VariegatoRheologyGuidance,
  VariegatoStyleId
} from '../../types/variegato';
import { getHydrocolloidRangeForRheology } from '../../core/variegatoAdvisor';
import {
  Activity,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Wand2,
  Droplets
} from 'lucide-react';

interface VariegatoRheologyCardProps {
  level: VariegatoRheologyLevel;
  onLevelChange: (lvl: VariegatoRheologyLevel) => void;
  rheologyStatus: VariegatoRheologyStatus;
  rheologyGuidance: VariegatoRheologyGuidance;
  hydrocolloidsPct: number;
  styleId?: VariegatoStyleId;
  onApplyRheologyFix?: (ingredientName: string, newGrams: number) => void;
  onApplyAcidFix?: (acidGrams: number) => void;
}

export const VariegatoRheologyCard: React.FC<VariegatoRheologyCardProps> = ({
  level,
  onLevelChange,
  rheologyStatus,
  rheologyGuidance,
  hydrocolloidsPct,
  styleId = 'fruta_gelificada',
  onApplyRheologyFix,
  onApplyAcidFix
}) => {
  const {
    status,
    isFatBasedExempt,
    targetMinPct,
    targetMaxPct,
    targetGramsMin,
    targetGramsMax,
    currentHydrocolloidGrams,
    deltaGrams,
    suggestedActionName,
    suggestedActionGrams,
    headline,
    actionInstruction,
    alternativeTip,
    acidActivationNeeded,
    acidGramsRecommended
  } = rheologyGuidance;

  const rangeL1 = getHydrocolloidRangeForRheology(1, styleId, isFatBasedExempt ? 20 : 0);
  const rangeL2 = getHydrocolloidRangeForRheology(2, styleId, isFatBasedExempt ? 20 : 0);
  const rangeL3 = getHydrocolloidRangeForRheology(3, styleId, isFatBasedExempt ? 20 : 0);

  // Escala visual da barra (até 1.50% de hidrocolóide)
  const maxScalePct = Math.max(1.5, targetMaxPct * 1.25, hydrocolloidsPct * 1.15);
  const currentBarPct = Math.min(100, Math.max(2, (hydrocolloidsPct / maxScalePct) * 100));
  const minMarkerPct = Math.min(100, (targetMinPct / maxScalePct) * 100);
  const maxMarkerPct = Math.min(100, (targetMaxPct / maxScalePct) * 100);

  const getStatusBadge = () => {
    if (isFatBasedExempt) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Base Lipídica</span>
        </span>
      );
    }

    switch (status) {
      case 'aligned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alinhado ao Alvo</span>
          </span>
        );
      case 'below':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
            <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Faltam +{Math.abs(deltaGrams).toFixed(1)} g</span>
          </span>
        );
      case 'above':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10">
            <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Reduzir -{Math.abs(deltaGrams).toFixed(1)} g</span>
          </span>
        );
    }
  };

  const getBoxStyle = () => {
    if (isFatBasedExempt) return 'bg-sky-500/10 border-sky-500/30 text-sky-100';
    if (status === 'aligned') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100';
    if (status === 'below') return 'bg-amber-500/10 border-amber-500/40 text-amber-100';
    return 'bg-rose-500/10 border-rose-500/40 text-rose-100';
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300 truncate">
              Reologia & Viscosidade
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              Meta de fluxo e orientação de dosagem
            </p>
          </div>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* 3-Level Dynamic Selector */}
      <div className="my-3 grid grid-cols-3 gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onLevelChange(1)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center ${
            level === 1
              ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-sm shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title={`Nível 1: ${rangeL1.label} (${rangeL1.minPct.toFixed(2)}%–${rangeL1.maxPct.toFixed(2)}%)`}
        >
          <span>1. Fluido</span>
          {!isFatBasedExempt && (
            <span className="text-[9px] font-normal opacity-75">
              {rangeL1.minPct.toFixed(2)}–{rangeL1.maxPct.toFixed(2)}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onLevelChange(2)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center ${
            level === 2
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title={`Nível 2: ${rangeL2.label} (${rangeL2.minPct.toFixed(2)}%–${rangeL2.maxPct.toFixed(2)}%)`}
        >
          <span>2. Pastoso</span>
          {!isFatBasedExempt && (
            <span className="text-[9px] font-normal opacity-75">
              {rangeL2.minPct.toFixed(2)}–{rangeL2.maxPct.toFixed(2)}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onLevelChange(3)}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center ${
            level === 3
              ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
          title={`Nível 3: ${rangeL3.label} (${rangeL3.minPct.toFixed(2)}%–${rangeL3.maxPct.toFixed(2)}%)`}
        >
          <span>3. Firme</span>
          {!isFatBasedExempt && (
            <span className="text-[9px] font-normal opacity-75">
              {rangeL3.minPct.toFixed(2)}–{rangeL3.maxPct.toFixed(2)}%
            </span>
          )}
        </button>
      </div>

      {/* Comparative Target vs Current Indicator */}
      {!isFatBasedExempt && (
        <div className="space-y-1.5 mb-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Atual:{' '}
              <strong className="font-mono text-white">
                {currentHydrocolloidGrams.toFixed(1)} g
              </strong>{' '}
              <span className="text-slate-400">({hydrocolloidsPct.toFixed(2)}%)</span>
            </span>
            <span className="text-slate-400">
              Meta p/ lote:{' '}
              <strong className="font-mono text-teal-300">
                {targetGramsMin.toFixed(1)}–{targetGramsMax.toFixed(1)} g
              </strong>
            </span>
          </div>

          {/* Target Range Progress Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
            {/* Ideal zone highlight */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-400/50"
              style={{
                left: `${minMarkerPct}%`,
                width: `${Math.max(4, maxMarkerPct - minMarkerPct)}%`
              }}
              title={`Faixa Ideal: ${targetMinPct.toFixed(2)}% a ${targetMaxPct.toFixed(2)}%`}
            />
            {/* Actual fill */}
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'aligned'
                  ? 'bg-emerald-400'
                  : status === 'below'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
              style={{ width: `${currentBarPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Viscosidade est.: ~{rheologyStatus.estimatedCps.toLocaleString('pt-BR')} cps</span>
            <span className="text-teal-400 font-semibold">{rheologyStatus.label}</span>
          </div>
        </div>
      )}

      {/* Actionable Prescriptive Guidance Box */}
      <div className={`p-3 rounded-xl border space-y-2 ${getBoxStyle()}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-bold leading-snug">{headline}</div>
        </div>

        <p className="text-[11px] leading-relaxed opacity-90">{actionInstruction}</p>

        <p className="text-[10px] opacity-75 italic leading-snug">{alternativeTip}</p>

        {/* Action Buttons */}
        {!isFatBasedExempt && status !== 'aligned' && onApplyRheologyFix && (
          <button
            type="button"
            onClick={() => onApplyRheologyFix(suggestedActionName, suggestedActionGrams)}
            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Aplicar na Receita: Ajustar {suggestedActionName} para {suggestedActionGrams.toFixed(1)} g
            </span>
          </button>
        )}

        {acidActivationNeeded && (
          <div className="pt-2 border-t border-slate-700/40 flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5 text-[11px] text-yellow-200">
              <Droplets className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
              <span>
                <strong>Ativação de Gelificação:</strong> A pectina requer acidez para formar gel. Adicione{' '}
                <strong>{acidGramsRecommended.toFixed(1)} g de Suco de Limão</strong> (ou 1 g de Ácido Cítrico) ao final da cocção.
              </span>
            </div>
            {onApplyAcidFix && (
              <button
                type="button"
                onClick={() => onApplyAcidFix(acidGramsRecommended)}
                className="w-full py-1 px-2.5 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <span>+ Adicionar {acidGramsRecommended.toFixed(1)} g de Suco de Limão na tabela</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
