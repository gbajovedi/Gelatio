import React, { useState } from 'react';
import { BatchAnalysis, NutrientValidation } from '../../types/gelato';
import { VitrineSimulator } from './VitrineSimulator';
import { CustosCard, CategoryCostItem } from './CustosCard';
import {
  CheckCircle2,
  AlertCircle,
  ThermometerSnowflake,
  Check,
  AlertTriangle,
  Store,
  Package,
  Snowflake,
  Wind,
  ShieldCheck,
  Info,
  FlaskConical
} from 'lucide-react';

interface NutrientBarsProps {
  analysis: BatchAnalysis;
  categoryCostBreakdown?: CategoryCostItem[];
  hasVariegatos?: boolean;
  variant?: 'all' | 'intelligence' | 'parameters';
  columns?: 1 | 2 | 4;
}

interface NutrientMeta {
  label: string;
  icon: string;
  unit: string;
  isPercent: boolean;
  barGradient: string;
  glowColor: string;
  accentText: string;
  description: string;
}

const NUTRIENT_METAS: Record<string, NutrientMeta> = {
  sugars: {
    label: 'Açúcares',
    icon: '🍬',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-amber-300',
    description: 'Doçura e controle do congelamento'
  },
  fat: {
    label: 'Gorduras',
    icon: '🧈',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-yellow-300',
    description: 'Cremosidade e textura na boca'
  },
  msnf: {
    label: 'SLNG (Leite)',
    icon: '🥛',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-sky-300',
    description: 'Proteínas lácteas e retenção de água'
  },
  otherSolids: {
    label: 'Outros Sólidos',
    icon: '🌾',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-orange-300',
    description: 'Fibras, amidos e cacau'
  },
  totalSolids: {
    label: 'Sólidos Totais',
    icon: '🧱',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-emerald-300',
    description: 'Estrutura seca total da calda'
  },
  water: {
    label: 'Água',
    icon: '💧',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-cyan-300',
    description: 'Solvente base congelável'
  },
  pod: {
    label: 'POD (Poder Adoçante)',
    icon: '🍯',
    unit: '',
    isPercent: false,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-rose-300',
    description: 'Sensação gustativa de dulçor'
  },
  pac: {
    label: 'PAC (Anticongelante)',
    icon: '❄️',
    unit: '',
    isPercent: false,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-indigo-300',
    description: 'Espatulabilidade e dureza a -12°C'
  },
  protein: {
    label: 'Proteína',
    icon: '⚡',
    unit: '%',
    isPercent: true,
    barGradient: 'from-emerald-400 to-teal-400',
    glowColor: 'shadow-emerald-500/20',
    accentText: 'text-purple-300',
    description: 'Aporte de proteína do leite/vegetal'
  }
};

export const NutrientBars: React.FC<NutrientBarsProps> = ({
  analysis,
  categoryCostBreakdown = [],
  hasVariegatos = false,
  variant = 'all',
  columns = 4
}) => {
  const { validations, isBalanced, servingTemperature } = analysis;
  const [thermalMode, setThermalMode] = useState<'vitrine' | 'freezer'>('vitrine');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const corvitto = analysis.corvittoMetrics;
  const sandiness = analysis.sandinessRisk;
  const emulsion = analysis.emulsionMetrics;

  // Contagem e conformidade dos parâmetros físico-químicos
  const nutrientKeys: (keyof typeof validations)[] = [
    'sugars',
    'fat',
    'msnf',
    'otherSolids',
    'totalSolids',
    'water',
    'pod',
    'pac'
  ];
  if (validations.protein && validations.protein.max > 0) {
    nutrientKeys.push('protein');
  }
  const totalNutrients = nutrientKeys.length;
  const okNutrients = nutrientKeys.filter(k => validations[k]?.status === 'Ok').length;
  const allNutrientsOk = okNutrients === totalNutrients;

  // Texture and scoopability assessment based on Cryoscopic Serving Temperature
  const pacValue = analysis.totals.pac;
  let textureVerdict = {
    title: 'Espatulabilidade Ideal',
    desc: 'Ponto de vitrine equilibrado (-11.5°C a -13.2°C: ~75% de água congelada)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  if (servingTemperature > -11.0) {
    textureVerdict = {
      title: 'Consistência Firme / Dureza Elevada',
      desc: 'Pouca água congelada a -12°C; requer vitrine mais amena ou elevar açúcares/PAC',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  } else if (servingTemperature < -13.5) {
    textureVerdict = {
      title: 'Massa Macia',
      desc: 'Maior poder anticongelante; consistência mais suave e aveludada a -12°C',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  }

  let freezerVerdictBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (corvitto?.freezerStatus === 'duro') {
    freezerVerdictBadge = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  } else if (corvitto?.freezerStatus === 'firme') {
    freezerVerdictBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (corvitto?.freezerStatus === 'colher') {
    freezerVerdictBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (corvitto?.freezerStatus === 'muito_macio') {
    freezerVerdictBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }

  const renderCardHeaderTooltip = (
    key: string,
    meta: NutrientMeta,
    valItem: NutrientValidation,
    displayVal: string
  ) => {
    let icon = <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 transition-colors" />;
    let tooltipTitle = meta.label;
    let tooltipBody = meta.description;
    let tooltipExtra: React.ReactNode = null;
    let isAlert = false;

    if (key === 'msnf' && sandiness) {
      if (sandiness.isAtRisk) {
        isAlert = true;
        icon = (
          <span className="p-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </span>
        );
        tooltipTitle = 'Alerta de Arenosidade (SLNG vs Água Livre)';
        tooltipBody = `O teor de SLNG (${displayVal}%) excede o limite seguro de ${(sandiness.maxSafeMsnf * 100).toFixed(1)}% para a água disponível. Sob oscilação térmica na vitrine, a lactose pode precipitar em microcristais.`;
        tooltipExtra = (
          <div className="mt-2 pt-1.5 border-t border-amber-500/30 text-[11px] text-amber-300 font-medium">
            <strong>Ação recomendada:</strong> Reduza leite em pó ou eleve a proporção de leite integral/água.
          </div>
        );
      } else if (valItem.val > 0.03) {
        icon = (
          <span className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center" title="Protegido contra arenosidade">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        );
        tooltipTitle = 'Proteção Anti-Arenosidade';
        tooltipBody = `SLNG (${displayVal}%) está seguro dentro do teto seguro de ${(sandiness.maxSafeMsnf * 100).toFixed(1)}% para a água disponível. A lactose permanecerá estável em solução.`;
      }
    } else if (key === 'fat' && emulsion && emulsion.status !== 'sorbet') {
      icon = (
        <span className="text-purple-400/90 hover:text-purple-300 transition-colors flex items-center" title="Razão Lipídica (Método Italiano)">
          <Wind className="w-3.5 h-3.5" />
        </span>
      );
      tooltipTitle = 'Razão Lipídica (Gordura : SLNG)';
      tooltipBody = `Proporção atual de ${emulsion.fatMsnfRatio} : 1 (faixa ideal: 0.75 a 1.25). Estimativa de aeração calculada em ~${emulsion.overrunEstimatePct}% de ar.`;
      tooltipExtra = (
        <div className="mt-2 pt-1.5 border-t border-purple-500/30 text-[11px] text-purple-300">
          Consulte o card <em>Emulsão & Overrun</em> logo acima para o diagnóstico completo e gráfico de aeração.
        </div>
      );
    } else if (key === 'pac' && corvitto) {
      icon = (
        <span className="text-cyan-400/90 hover:text-cyan-300 transition-colors flex items-center" title="PAC na Água Livre (Crioscopia Padrão)">
          <Snowflake className="w-3.5 h-3.5" />
        </span>
      );
      tooltipTitle = 'PAC na Água Livre (Crioscopia Padrão)';
      tooltipBody = `Índice de ${corvitto.pacWater} PAC por kg de água pura disponível. Diagnóstico atual: ${corvitto.freezerLabel}.`;
      tooltipExtra = (
        <div className="mt-2 pt-1.5 border-t border-cyan-500/30 text-[11px] text-cyan-300">
          Alterne para a aba <em>Pote Freezer (-18°C)</em> no painel acima para calibrar receitas de entrega/delivery.
        </div>
      );
    }

    const isRightCol = key === 'pac' || key === 'otherSolids';

    return (
      <div className="relative inline-flex items-center group/tip">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTooltip(prev => prev === key ? null : key);
          }}
          className="cursor-pointer focus:outline-none flex items-center p-0.5 rounded transition-transform active:scale-95"
          title={tooltipTitle}
          aria-label={tooltipTitle}
        >
          {icon}
        </button>

        {/* Floating Tooltip Dropdown */}
        <div
          onMouseLeave={() => setActiveTooltip(null)}
          className={`absolute top-full mt-2 ${
            isRightCol ? 'right-0' : 'left-0'
          } ${
            activeTooltip === key
              ? 'opacity-100 pointer-events-auto scale-100'
              : 'opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto scale-95 group-hover/tip:scale-100'
          } transition-all duration-200 z-50 w-64 max-w-[calc(100vw-3rem)] p-3 rounded-xl bg-slate-950/95 border ${
            isAlert ? 'border-amber-500/60 shadow-amber-950/50' : 'border-slate-700/80 shadow-slate-950/70'
          } shadow-2xl backdrop-blur-md text-left text-xs leading-relaxed`}
        >
          {/* Arrow Pointer */}
          <div
            className={`absolute -top-1.5 w-3 h-3 rotate-45 bg-slate-950 border-l border-t ${
              isAlert ? 'border-amber-500/60' : 'border-slate-700/80'
            } ${isRightCol ? 'right-2.5' : 'left-2.5'}`}
          />

          <div className={`font-bold flex items-center gap-1.5 mb-1 ${
            isAlert ? 'text-amber-300' : 'text-slate-200'
          }`}>
            {isAlert && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span>{tooltipTitle}</span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">{tooltipBody}</p>
          {tooltipExtra}
        </div>
      </div>
    );
  };

  const renderBulletCard = (key: string, valItem: NutrientValidation) => {
    const meta = NUTRIENT_METAS[key] || {
      label: key,
      icon: '📊',
      unit: '%',
      isPercent: true,
      barGradient: 'from-emerald-400 to-teal-400',
      glowColor: 'shadow-emerald-500/20',
      accentText: 'text-white',
      description: ''
    };

    const { val, min, max, status } = valItem;
    const isPercent = meta.isPercent;
    const unit = meta.unit;
    const displayVal = isPercent ? (val * 100).toFixed(1) : val.toFixed(0);
    const displayMin = isPercent ? (min * 100).toFixed(1) : min.toFixed(0);
    const displayMax = isPercent ? (max * 100).toFixed(1) : max.toFixed(0);
    const midVal = (min + max) / 2;
    const displayMid = isPercent ? (midVal * 100).toFixed(1) : midVal.toFixed(0);

    // Janela de Escala Adaptativa (Adaptive Focus Window)
    // Para métricas com base elevada (Água, Sólidos, PAC, POD, etc.), expande a visualização
    // do alvo para ocupar ~40% da largura da barra, eliminando o espaço vazio e garantindo alta visibilidade.
    const span = Math.max(max - min, 0);
    const isZeroBaseline = min === 0 || min < span * 0.5;

    let trackMin = 0;
    let trackMax = 1;

    if (isZeroBaseline || span === 0) {
      trackMin = 0;
      trackMax = Math.max(max * 1.35, val * 1.15, 0.01);
    } else {
      // Faixa alvo ocupa ~40% do comprimento da barra por padrão
      const idealPadding = span * 0.75;
      trackMin = Math.max(0, Math.min(min - idealPadding, val - span * 0.2));
      trackMax = Math.max(max + idealPadding, val + span * 0.2);
    }

    const totalRange = Math.max(trackMax - trackMin, 0.001);
    const progressPct = Math.min(Math.max(((val - trackMin) / totalRange) * 100, 0), 100);
    const minMarkerPct = Math.min(Math.max(((min - trackMin) / totalRange) * 100, 0), 100);
    const maxMarkerPct = Math.min(Math.max(((max - trackMin) / totalRange) * 100, 0), 100);
    const bandWidthPct = Math.max(maxMarkerPct - minMarkerPct, span === 0 ? 0 : 2);

    // Delta calculation
    let deltaStr = '';
    if (status === 'Baixo') {
      const delta = Math.max(0, min - val);
      deltaStr = `${isPercent ? (delta * 100).toFixed(1) : delta.toFixed(0)}${unit}`;
    } else if (status === 'Alto') {
      const delta = Math.max(0, val - max);
      deltaStr = `${isPercent ? (delta * 100).toFixed(1) : delta.toFixed(0)}${unit}`;
    }

    // Color definitions
    let cardBorder = 'border-slate-700/80 hover:border-slate-600 bg-slate-900/90';
    let valColor = 'text-white';

    if (status === 'Baixo') {
      cardBorder = 'border-amber-500/50 bg-amber-950/20';
      valColor = 'text-amber-300';
    } else if (status === 'Alto') {
      cardBorder = 'border-rose-500/50 bg-rose-950/20';
      valColor = 'text-rose-300';
    }

    return (
      <div
        key={key}
        className={`px-4 py-3 rounded-xl border ${cardBorder} transition-all flex flex-col justify-center gap-2.5 shadow-md relative bg-slate-900/90 hover:border-slate-600`}
      >
        {/* Linha 1: Título, Valor em Destaque e Badge de Status */}
        <div className="flex items-center justify-between gap-2">
          {/* Identificação com Ícone e Tooltip */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm select-none shrink-0">{meta.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate" title={meta.label}>
              {meta.label}
            </span>
            {renderCardHeaderTooltip(key, meta, valItem, displayVal)}
          </div>

          {/* Grupo Valor + Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-baseline gap-0.5">
              <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${valColor}`}>
                {displayVal}
              </span>
              <span className="text-xs font-bold text-slate-400">{unit}</span>
            </div>

            {/* Status Pill Compacta */}
            {status === 'Ok' ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1 whitespace-nowrap">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span className="hidden sm:inline">No Alvo</span>
                <span className="sm:hidden">OK</span>
              </span>
            ) : status === 'Baixo' ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 animate-pulse whitespace-nowrap">
                <span>↓ -{deltaStr}</span>
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full border font-bold bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1 animate-pulse whitespace-nowrap">
                <span>↑ +{deltaStr}</span>
              </span>
            )}
          </div>
        </div>

        {/* Linha 2: Régua Horizontal Inlined (Mínimo - Barra de Progresso - Máximo) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0 min-w-[38px] text-right" title={`Mínimo: ${displayMin}${unit}`}>
            {displayMin}{unit}
          </span>

          <div className="nutrient-progress-track relative flex-1 h-2.5 bg-slate-950/90 rounded-full border border-slate-800 shadow-inner flex items-center">
            {/* 1. Faixa Colorida: Intervalo Recomendado [Mínimo -> Máximo] */}
            {(span > 0 || max > 0) && (
              <div
                className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 bg-gradient-to-r ${meta.barGradient} shadow-md opacity-90`}
                style={{
                  left: `${minMarkerPct}%`,
                  width: `${bandWidthPct}%`
                }}
                title={`Faixa Recomendada: ${displayMin} a ${displayMax}${unit}`}
              >
                {/* Delimitadores discretos nas pontas da faixa */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/60 rounded-l" />
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/60 rounded-r" />

                {/* Centro de referência da faixa (Alvo Médio Ideal) */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] -translate-x-1/2 left-1/2 bg-white/65 pointer-events-none"
                  title={`Centro da Faixa (Alvo Ideal): ${displayMid}${unit}`}
                />
              </div>
            )}

            {/* 2. Marcador Vertical Bem Visível (Agulha de Alta Precisão) no Valor Calculado */}
            <div
              className={`absolute top-[-3px] bottom-[-3px] w-[3.5px] rounded-full z-20 transition-all duration-300 pointer-events-none ${
                status === 'Ok'
                  ? 'nutrient-needle-ok bg-white shadow-[0_0_6px_rgba(255,255,255,1),0_0_10px_rgba(52,211,153,0.9)] ring-1 ring-emerald-400'
                  : status === 'Baixo'
                  ? 'nutrient-needle-warn bg-amber-300 shadow-[0_0_8px_rgba(245,158,11,1)] ring-1 ring-amber-400 animate-pulse'
                  : 'nutrient-needle-err bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,1)] ring-1 ring-rose-500 animate-pulse'
              }`}
              style={{ left: `calc(${progressPct}% - 1.75px)` }}
              title={`Valor Calculado: ${displayVal}${unit}`}
            />
          </div>

          <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0 min-w-[38px] text-left" title={`Máximo: ${displayMax}${unit}`}>
            {displayMax}{unit}
          </span>
        </div>
      </div>
    );
  };

  const renderIntelligence = () => (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl border shadow-xl transition-all ${
        isBalanced
          ? 'bg-slate-800/95 border-emerald-500/40'
          : 'bg-slate-800/95 border-amber-500/40'
      }`}
    >
      {/* Header Status & Smart Dashboard Cards (Compact Architecture) */}
      <div className="space-y-2.5">
        {/* Slim Balance Status Ribbon */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                isBalanced
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
              {isBalanced ? 'Receita Perfeitamente Balanceada' : 'Ajustes Recomendados na Fórmula'}
            </h3>

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border leading-none ${
                isBalanced
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isBalanced ? 'Equilibrado' : 'Revisar Metas'}
            </span>

            <span className="hidden lg:inline text-slate-600 select-none text-xs">•</span>
            <p className="text-[11px] sm:text-xs text-slate-300 truncate max-w-full">
              {isBalanced
                ? 'Todos os parâmetros bromatológicos e térmicos estão calibrados para o estilo selecionado.'
                : 'Alguns parâmetros estão fora da faixa técnica. Ajuste os pesos na calda.'}
            </p>
          </div>
        </div>

        {/* Compact 2x2 Intelligence Grid: Row 1 (Térmico + Overrun) | Row 2 (Simulador + Custos) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch">
          {/* CARD 1: Comportamento Térmico de Serviço */}
          <div className="bg-slate-900/95 px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-md flex flex-col justify-between gap-2 h-full">
            {/* Header Compacto com Toggle Segmentado */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-200">
                  Cenário Térmico de Serviço
                </span>
              </div>

              <div className="inline-flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 gap-0.5">
                <button
                  type="button"
                  onClick={() => setThermalMode('vitrine')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    thermalMode === 'vitrine'
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                  title="Ponto de espatulabilidade para vitrine comercial ventilada (-11°C a -13°C)"
                >
                  <Store className="w-3 h-3" />
                  <span>Vitrine (-12°C)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThermalMode('freezer')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    thermalMode === 'freezer'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                  title="Diagnóstico Crioscópico para potes de delivery / freezer doméstico (-18°C)"
                >
                  <Package className="w-3 h-3" />
                  <span>Freezer (-18°C)</span>
                </button>
              </div>
            </div>

            {/* Corpo Inline de Métricas Térmicas */}
            {thermalMode === 'vitrine' ? (
              <div className="flex items-center gap-2.5 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center shrink-0">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black font-mono text-cyan-300 tracking-tight leading-none">
                        {servingTemperature} °C
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono font-medium">
                        (PAC: {Math.round(pacValue)})
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold leading-none whitespace-nowrap ${textureVerdict.badgeColor}`}>
                      {textureVerdict.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1" title={textureVerdict.desc}>
                    {textureVerdict.desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
                  <Snowflake className="w-4 h-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black font-mono text-amber-300 tracking-tight leading-none">
                        {corvitto?.pacWater}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        PAC Água Livre
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold leading-none whitespace-nowrap ${freezerVerdictBadge}`}>
                      {corvitto?.freezerLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1">
                    {corvitto?.neededPacForFreezer && corvitto.neededPacForFreezer > 0
                      ? `+${corvitto.neededPacForFreezer} PAC necessários para ponto de colher a -18°C`
                      : 'Ponto de colher imediato direto do freezer (-18°C)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Emulsão & Overrun (Aeração) — COMPACTO E SEMPRE VISÍVEL */}
          <div className="emulsao-overrun-card bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 px-3.5 py-2.5 rounded-xl border border-purple-500/30 shadow-md flex flex-col justify-between gap-2 h-full">
            {/* Header Compacto */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-purple-300 min-w-0">
                <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[11px] uppercase font-bold tracking-wider text-purple-200 truncate">
                  Emulsão & Overrun (Método Italiano)
                </span>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold leading-none shadow-sm whitespace-nowrap ${
                  emulsion?.status === 'ideal'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : emulsion?.status === 'gorduroso'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : emulsion?.status === 'magro'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}
                title={emulsion?.advice}
              >
                {emulsion?.statusLabel}
              </span>
            </div>

            {/* Corpo Inline: Overrun + Razão Lipídica */}
            <div className="flex items-center justify-between gap-3 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-purple-500/15">
              {/* Bloco de Overrun */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <Wind className="w-3.5 h-3.5 text-purple-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block leading-none">
                    Overrun Estimado
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-black font-mono text-purple-200 tracking-tight leading-none">
                      ~{emulsion?.overrunEstimatePct}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium truncate">
                      ({emulsion?.overrunRange})
                    </span>
                  </div>
                </div>
              </div>

              {/* Divisor vertical sutil */}
              <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

              {/* Bloco de Razão Lipídica */}
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5 leading-none">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                    Gordura : SLNG
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">
                    ({emulsion?.status === 'sorbet' ? 'Base Água' : 'Alvo 0.75–1.25'})
                  </span>
                </div>
                <span className="text-base sm:text-lg font-black font-mono text-white block mt-0.5 tracking-tight leading-none">
                  {emulsion?.status === 'sorbet' ? 'Sorbet' : `${emulsion?.fatMsnfRatio} : 1`}
                </span>
              </div>
            </div>

            {/* Mini-Gauge Compacto de Nível de Aeração */}
            <div className="space-y-1">
              <div className="nutrient-progress-track relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex items-center">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-purple-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.min(100, Math.max(6, (((emulsion?.overrunEstimatePct || 32) - 18) / 28) * 100))}%`
                  }}
                />
                {/* Marcador de referência aos 32% (Clássico Italiano) */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white/85 shadow-[0_0_4px_rgba(255,255,255,0.9)] z-10 pointer-events-none -translate-x-1/2"
                  style={{ left: '50%' }}
                  title="Alvo Clássico Italiano: 32% de overrun (Centro da Escala: 18% a 46%)"
                />
              </div>
              <div className="relative flex items-center justify-between text-[10px] text-slate-400 font-medium font-sans leading-none">
                <span>Denso (18%)</span>
                <span className="text-purple-300 font-bold whitespace-nowrap">
                  Clássico (~32%)
                </span>
                <span>Aerado (46%)</span>
              </div>
            </div>
          </div>

          {/* ROW 2 - CARD 3: Simulador Térmico da Vitrine */}
          <VitrineSimulator
            waterPct={validations.water.val}
            pac={validations.pac.val}
            totalSolids={validations.totalSolids.val}
            caldaWeightGrams={analysis.caldaWeight}
          />

          {/* ROW 2 - CARD 4: Custos */}
          <CustosCard
            costing={analysis.costing}
            caldaWeight={analysis.caldaWeight}
            totalsCost={analysis.totals.cost}
            categoryCostBreakdown={categoryCostBreakdown}
            hasVariegatos={hasVariegatos}
          />
        </div>
      </div>
    </div>
  );

  const renderParameters = () => (
    <div
      className={`p-5 rounded-2xl border shadow-xl transition-all ${
        allNutrientsOk
          ? 'bg-slate-800/95 border-emerald-500/40'
          : 'bg-slate-800/95 border-amber-500/40'
      }`}
    >
      <div className="space-y-4">
        {/* Header Banner: Parâmetros Físico-Químicos */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              allNutrientsOk
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            <FlaskConical className={`w-7 h-7 ${allNutrientsOk ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Parâmetros Físico-Químicos
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border flex items-center gap-1 ${
                  allNutrientsOk
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {allNutrientsOk ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span>{okNutrients}/{totalNutrients} No Alvo</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{okNutrients}/{totalNutrients} No Alvo</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {allNutrientsOk
                ? 'Todos os parâmetros bromatológicos e moleculares (sólidos, água, gorduras, POD e PAC) estão em conformidade.'
                : 'Monitore as faixas técnicas de açúcares, gorduras, sólidos, água e balanço molecular (POD e PAC):'}
            </p>
          </div>
        </div>

        {/* Alerta de Arenosidade (SLNG vs Água Livre) - Apenas quando necessário */}
        {sandiness?.isAtRisk && (
          <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/50 text-xs text-amber-200 shadow-md space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm">Alerta de Arenosidade (SLNG vs Água Livre)</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed text-xs">
              O teor de sólidos do leite (<strong className="text-amber-300 font-mono font-bold">SLNG: {(sandiness.currentMsnf * 100).toFixed(1)}%</strong>) ultrapassa o limite seguro de saturação da água livre (<strong className="text-amber-300 font-mono font-bold">máx. {(sandiness.maxSafeMsnf * 100).toFixed(1)}%</strong>).
            </p>
            <p className="text-amber-300/80 text-[11px] leading-relaxed">
              Sob oscilação térmica na vitrine, a lactose pode precipitar em microcristais. Recomenda-se reduzir leite em pó ou elevar a proporção de leite integral/água.
            </p>
          </div>
        )}

        {/* Grid dos Cards de Nutrientes */}
        <div className={columns === 1 ? 'grid grid-cols-1 gap-3.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'}>
          {renderBulletCard('sugars', validations.sugars)}
          {renderBulletCard('fat', validations.fat)}
          {renderBulletCard('msnf', validations.msnf)}
          {renderBulletCard('otherSolids', validations.otherSolids)}
          {renderBulletCard('totalSolids', validations.totalSolids)}
          {renderBulletCard('water', validations.water)}
          {renderBulletCard('pod', validations.pod)}
          {renderBulletCard('pac', validations.pac)}
          {columns === 1 && validations.protein && validations.protein.max > 0 && renderBulletCard('protein', validations.protein)}
        </div>

        {columns !== 1 && validations.protein && validations.protein.max > 0 && (
          <div className="pt-1">
            {renderBulletCard('protein', validations.protein)}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'intelligence') {
    return renderIntelligence();
  }

  if (variant === 'parameters') {
    return renderParameters();
  }

  return (
    <div className="space-y-6">
      {renderIntelligence()}
      {renderParameters()}
    </div>
  );
};
