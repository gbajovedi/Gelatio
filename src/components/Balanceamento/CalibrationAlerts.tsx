import React from 'react';
import { BatchAnalysis } from '../../types/gelato';
import { AlertTriangle, Info, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface CalibrationAlertsProps {
  analysis: BatchAnalysis;
}

const NUTRIENT_METAS: Record<string, { label: string; unit: string }> = {
  sugars: { label: 'Açúcares', unit: '%' },
  fat: { label: 'Gordura', unit: '%' },
  msnf: { label: 'SLNG', unit: '%' },
  otherSolids: { label: 'Outros Sólidos', unit: '%' },
  totalSolids: { label: 'Sólidos Totais', unit: '%' },
  water: { label: 'Água', unit: '%' },
  pod: { label: 'POD', unit: '' },
  pac: { label: 'PAC', unit: '' },
  protein: { label: 'Proteína', unit: '%' }
};

export const CalibrationAlerts: React.FC<CalibrationAlertsProps> = ({ analysis }) => {
  const { validations, isBalanced, sandinessRisk: sandiness } = analysis;

  const pendingIssues = Object.entries(validations)
    .filter(([key, item]) => item.status !== 'Ok' && (key !== 'protein' || validations.protein.max > 0))
    .map(([key, item]) => {
      const meta = NUTRIENT_METAS[key] || { label: key, unit: '%' };
      const isRel = key === 'pod' || key === 'pac';
      const unit = meta.unit;

      const valStr = isRel ? `${Math.round(item.val)}` : `${(item.val * 100).toFixed(1)}${unit}`;
      const minStr = isRel ? `${item.min}` : `${(item.min * 100).toFixed(1)}${unit}`;
      const maxStr = isRel ? `${item.max}` : `${(item.max * 100).toFixed(1)}${unit}`;

      let deltaStr = '';
      if (item.status === 'Baixo') {
        const delta = isRel ? item.min - item.val : (item.min - item.val) * 100;
        deltaStr = isRel ? `${Math.round(delta)}` : `${delta.toFixed(1)}${unit}`;
      } else {
        const delta = isRel ? item.val - item.max : (item.val - item.max) * 100;
        deltaStr = isRel ? `${Math.round(delta)}` : `${delta.toFixed(1)}${unit}`;
      }

      return {
        key,
        name: meta.label,
        status: item.status,
        valStr,
        minStr,
        maxStr,
        deltaStr
      };
    });

  if (isBalanced && !sandiness?.isAtRisk) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 1. Checklist de Parâmetros Fora da Meta (Calibração Necessária) */}
      {!isBalanced && pendingIssues.length > 0 && (
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 shrink-0" />
              <span>Calibração Necessária ({pendingIssues.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Fora da Meta
            </span>
          </div>

          <div className="space-y-2">
            {pendingIssues.map(issue => (
              <div
                key={issue.key}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-colors shadow-sm ${
                  issue.status === 'Baixo'
                    ? 'bg-amber-500/10 text-slate-100 border-amber-500/40'
                    : 'bg-rose-500/10 text-slate-100 border-rose-500/40'
                }`}
              >
                {issue.status === 'Baixo' ? (
                  <ArrowDownCircle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="font-bold text-white truncate">{issue.name}</strong>
                    <span
                      className={`font-mono font-black ${
                        issue.status === 'Baixo' ? 'text-amber-300' : 'text-rose-300'
                      }`}
                    >
                      {issue.valStr}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block truncate">
                    {issue.status === 'Baixo'
                      ? `faltam ${issue.deltaStr} p/ mín. ${issue.minStr}`
                      : `excesso de ${issue.deltaStr} sobre máx. ${issue.maxStr}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Alerta de Arenosidade (Luca Caviezel) */}
      {sandiness?.isAtRisk && (
        <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/50 text-xs text-amber-900 dark:text-amber-200 shadow-md space-y-1.5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm">Alerta de Arenosidade (Caviezel)</span>
          </div>
          <p className="text-amber-950 dark:text-amber-200/90 leading-relaxed text-xs">
            O teor de sólidos do leite (<strong className="text-amber-900 dark:text-amber-300 font-mono font-bold">SLNG: {(sandiness.currentMsnf * 100).toFixed(1)}%</strong>) ultrapassa o limite seguro de saturação da água livre (<strong className="text-amber-900 dark:text-amber-300 font-mono font-bold">máx. {(sandiness.maxSafeMsnf * 100).toFixed(1)}%</strong>).
          </p>
          <p className="text-amber-800/90 dark:text-amber-300/80 text-[11px] leading-relaxed">
            Sob oscilação térmica na vitrine, a lactose pode precipitar em microcristais. Recomenda-se reduzir leite em pó ou elevar a proporção de leite integral/água.
          </p>
        </div>
      )}
    </div>
  );
};

