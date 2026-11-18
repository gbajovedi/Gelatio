import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Check,
  RotateCcw,
  Wind,
  Package,
  Plus,
  Minus
} from 'lucide-react';
import { PricingParams, saveStoredPricingParams } from '../../core/pricingStorage';
import { PricingSettings, VariegatoPhysicalDetail } from '../../types/gelato';

export interface DensityAndVolumeMetrics {
  caldaDensity: number;
  baseLiquidVolumeLiters: number;
  baseVolumeLiters: number;
  variegatoVolumeLiters: number;
  totalVolumeLiters: number;
  baseOverrunPct: number;
  effectiveOverrunPct: number;
  variegatoDetails?: VariegatoPhysicalDetail[];
}

interface ProfitSimulatorProps {
  finalCostKg: number;
  batchWeightGrams: number;
  caldaWeightGrams?: number;
  totalVariegatoGrams?: number;
  densityAndVolume?: DensityAndVolumeMetrics;
  pricingParams: PricingParams;
  pricingSettings: PricingSettings;
  onMarginSaved?: (newMargin: number) => void;
}

export type SalesFormat = 'tub500' | 'tub1000' | 'cup120' | 'cup180' | 'cuba5L' | 'custom';
export type FormatMeasureType = 'volume' | 'weight';
export type PricingSimulationMode = 'margin' | 'markup' | 'price';

interface FormatConfig {
  id: SalesFormat;
  name: string;
  title: string;
  subtitle: string;
  icon: string;
  type: FormatMeasureType;
  capacityMl?: number;
  weightGrams?: number;
  packagingCost: number;
  defaultPricePlaceholder: number;
  unitSingular: string;
  unitPlural: string;
  partialLabel: string;
  partialFullWord: string;
}

/**
 * Hook de debounce para otimização de sliders contínuos (garante 60fps no drag e previne jank em dispositivos móveis)
 */
function useDebounce<T>(value: T, delayMs: number = 50): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

const FORMAT_CONFIGS: Record<SalesFormat, FormatConfig> = {
  tub500: {
    id: 'tub500',
    name: 'Pote 500ml',
    title: 'Pote 500ml',
    subtitle: '500 ml',
    icon: '🍨',
    type: 'volume',
    capacityMl: 500,
    packagingCost: 2.50,
    defaultPricePlaceholder: 38.00,
    unitSingular: 'Pote Cheio',
    unitPlural: 'Potes Cheios',
    partialLabel: 'pote parcial',
    partialFullWord: 'cheio'
  },
  tub1000: {
    id: 'tub1000',
    name: 'Pote 1 Litro',
    title: 'Pote 1 Litro',
    subtitle: '1000 ml',
    icon: '🏺',
    type: 'volume',
    capacityMl: 1000,
    packagingCost: 3.80,
    defaultPricePlaceholder: 70.00,
    unitSingular: 'Pote Cheio',
    unitPlural: 'Potes Cheios',
    partialLabel: 'pote parcial',
    partialFullWord: 'cheio'
  },
  cup120: {
    id: 'cup120',
    name: 'Copinho 120ml',
    title: 'Copinho 120ml',
    subtitle: '1 Bola · 120 ml',
    icon: '🍦',
    type: 'volume',
    capacityMl: 120,
    packagingCost: 0.60,
    defaultPricePlaceholder: 15.00,
    unitSingular: 'Copinho Cheio',
    unitPlural: 'Copinhos Cheios',
    partialLabel: 'copinho parcial',
    partialFullWord: 'cheio'
  },
  cup180: {
    id: 'cup180',
    name: 'Copinho 180ml',
    title: 'Copinho 180ml',
    subtitle: '2 Bolas · 180 ml',
    icon: '🍧',
    type: 'volume',
    capacityMl: 180,
    packagingCost: 0.85,
    defaultPricePlaceholder: 22.00,
    unitSingular: 'Copinho Cheio',
    unitPlural: 'Copinhos Cheios',
    partialLabel: 'copinho parcial',
    partialFullWord: 'cheio'
  },
  cuba5L: {
    id: 'cuba5L',
    name: 'Cuba GN 5L',
    title: 'Cuba GN 5L',
    subtitle: '5000 ml',
    icon: '📦',
    type: 'volume',
    capacityMl: 5000,
    packagingCost: 5.00,
    defaultPricePlaceholder: 240.00,
    unitSingular: 'Cuba Cheia',
    unitPlural: 'Cubas Cheias',
    partialLabel: 'cuba parcial',
    partialFullWord: 'cheia'
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    title: 'Personalizado',
    subtitle: 'Ajuste livre',
    icon: '⚖️',
    type: 'volume',
    packagingCost: 1.00,
    defaultPricePlaceholder: 20.00,
    unitSingular: 'Unidade Cheia',
    unitPlural: 'Unidades Cheias',
    partialLabel: 'unidade parcial',
    partialFullWord: 'cheia'
  }
};

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  finalCostKg,
  batchWeightGrams,
  caldaWeightGrams,
  totalVariegatoGrams = 0,
  densityAndVolume,
  pricingParams,
  pricingSettings,
  onMarginSaved
}) => {
  // Mode: 'margin' (% margem na venda), 'markup' (% markup sobre custo) ou 'price' (preço fixo praticado)
  const [mode, setMode] = useState<PricingSimulationMode>('margin');
  const [selectedFormat, setSelectedFormat] = useState<SalesFormat>('tub500');

  // Estados dos parâmetros interativos (valores imediatos para feedback a 0ms no slider)
  const [simulatedMargin, setSimulatedMargin] = useState<number>(pricingParams.targetMargin || 50);
  const [simulatedMarkup, setSimulatedMarkup] = useState<number>(() => {
    const baseMargin = pricingParams.targetMargin || 50;
    return Math.max(10, Math.round((baseMargin / Math.max(1, 100 - baseMargin)) * 100));
  });
  const [simulatedPriceInput, setSimulatedPriceInput] = useState<string>('38.00');

  // Debounce de 50ms para suavizar cálculos matemáticos e layout derivado sem travar o drag em mobile
  const debouncedMargin = useDebounce(simulatedMargin, 50);
  const debouncedMarkup = useDebounce(simulatedMarkup, 50);

  // Feedback de salvamento como padrão global
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Calibração do Overrun
  const initialBaseOverrun = densityAndVolume?.baseOverrunPct ?? 35;
  const [userOverrun, setUserOverrun] = useState<number>(initialBaseOverrun);

  useEffect(() => {
    if (densityAndVolume?.baseOverrunPct) {
      setUserOverrun(densityAndVolume.baseOverrunPct);
    }
  }, [densityAndVolume?.baseOverrunPct]);

  // Formato Personalizado
  const [customMeasureType, setCustomMeasureType] = useState<FormatMeasureType>('volume');
  const [customVolumeInput, setCustomVolumeInput] = useState<number>(250);
  const [customWeightInput, setCustomWeightInput] = useState<number>(100);
  const [customPackCostInput, setCustomPackCostInput] = useState<number>(1.00);

  // Cálculos físicos de Calda, Overrun e Volume
  const actualCaldaWeight = caldaWeightGrams || Math.max(0, batchWeightGrams - totalVariegatoGrams);
  const caldaDensity = densityAndVolume?.caldaDensity || 1.10;

  const baseLiquidVolLiters = caldaDensity > 0 ? (actualCaldaWeight / 1000) / caldaDensity : 0;
  const baseAeratedVolLiters = baseLiquidVolLiters * (1 + (userOverrun / 100));
  const variegatoVolLiters =
    densityAndVolume?.variegatoVolumeLiters !== undefined
      ? densityAndVolume.variegatoVolumeLiters
      : (totalVariegatoGrams > 0 ? (totalVariegatoGrams / 1000) / 1.25 : 0);
  const totalBatchVolLiters = baseAeratedVolLiters + variegatoVolLiters;
  const totalBatchVolMl = totalBatchVolLiters * 1000;

  const totalLiquidVolLiters = baseLiquidVolLiters + variegatoVolLiters;
  const effectiveBatchOverrun =
    totalLiquidVolLiters > 0
      ? ((totalBatchVolLiters - totalLiquidVolLiters) / totalLiquidVolLiters) * 100
      : userOverrun;

  // Configuração do formato ativo
  const activeFormat = FORMAT_CONFIGS[selectedFormat];
  const formatPackCost =
    selectedFormat === 'tub500'
      ? pricingParams.tubPackCost
      : selectedFormat === 'custom'
      ? customPackCostInput
      : activeFormat.packagingCost;

  let unitsInBatch = 0;
  let formatWeightGrams = 0;
  let formatCapacityDisplay = '';

  if (selectedFormat === 'custom') {
    if (customMeasureType === 'volume') {
      const vol = Math.max(1, customVolumeInput);
      formatCapacityDisplay = `${vol} ml`;
      unitsInBatch = vol > 0 ? (totalBatchVolMl / vol) : 0;
      formatWeightGrams = unitsInBatch > 0 ? (batchWeightGrams / unitsInBatch) : 0;
    } else {
      const w = Math.max(1, customWeightInput);
      formatCapacityDisplay = `${w} g`;
      formatWeightGrams = w;
      unitsInBatch = w > 0 ? (batchWeightGrams / w) : 0;
    }
  } else if (activeFormat.type === 'volume' && activeFormat.capacityMl) {
    const vol = activeFormat.capacityMl;
    formatCapacityDisplay = `${vol} ml`;
    unitsInBatch = vol > 0 ? (totalBatchVolMl / vol) : 0;
    formatWeightGrams = unitsInBatch > 0 ? (batchWeightGrams / unitsInBatch) : 0;
  } else {
    const w = activeFormat.weightGrams || 100;
    formatCapacityDisplay = `${w} g`;
    formatWeightGrams = w;
    unitsInBatch = w > 0 ? (batchWeightGrams / w) : 0;
  }

  // Rateio indireto fixo por embalagem
  const weightRatio = formatWeightGrams / (pricingParams.tubWeightGrams || 500);
  const overheadPerUnit = pricingSettings.indirectOverheadPerTub * weightRatio;

  // Deduções da venda (taxas de cartão + impostos)
  const salesDeductionsRate =
    (pricingSettings.cardFeePercent + (pricingParams.salesTaxPercent || 0)) / 100;

  // Custo Direto e Custo Unitário Total
  const productCost = finalCostKg * (formatWeightGrams / 1000);
  const directCostWithPack = productCost + formatPackCost;
  const totalCostUnit = directCostWithPack + overheadPerUnit;

  // 1. Cálculo por Margem de Lucro (% sobre a venda - Divisor Sebrae c/ Debounce 50ms)
  const totalMarginAndDeductions = (debouncedMargin / 100) + salesDeductionsRate;
  const isMarginViable = totalMarginAndDeductions < 0.999;
  const maxViableMargin = Math.max(0, Math.floor((1 - salesDeductionsRate) * 1000) / 10);
  const marginDivisor = Math.max(0.001, 1 - totalMarginAndDeductions);
  const priceFromMargin =
    isMarginViable
      ? totalCostUnit / marginDivisor
      : (totalCostUnit * (1 + debouncedMargin / 100)) / Math.max(0.01, 1 - salesDeductionsRate);

  // 2. Cálculo por Markup (% sobre o custo e Fator Multiplicador c/ Debounce 50ms)
  const priceFromMarkup =
    (totalCostUnit * (1 + debouncedMarkup / 100)) / Math.max(0.01, 1 - salesDeductionsRate);

  // 3. Cálculo Reverso por Preço Fixo
  const manualPrice = parseFloat(simulatedPriceInput) || 0;
  const netRevenueFromManual = manualPrice * (1 - salesDeductionsRate);
  const marginFromPrice =
    manualPrice > 0
      ? Math.max(-100, Math.min(95, ((netRevenueFromManual - totalCostUnit) / manualPrice) * 100))
      : 0;

  // Métricas Efetivas Unificadas
  let effectivePrice = 0;
  let effectiveMargin = 0;
  let effectiveMarkup = 0;
  let effectiveFactor = 1;

  if (mode === 'margin') {
    effectivePrice = priceFromMargin;
    effectiveMargin = debouncedMargin;
    effectiveMarkup = totalCostUnit > 0 ? (((effectivePrice * (1 - salesDeductionsRate)) - totalCostUnit) / totalCostUnit) * 100 : 0;
    effectiveFactor = totalCostUnit > 0 ? effectivePrice / totalCostUnit : 1;
  } else if (mode === 'markup') {
    effectivePrice = priceFromMarkup;
    const netRev = effectivePrice * (1 - salesDeductionsRate);
    effectiveMargin = effectivePrice > 0 ? Math.max(-100, Math.min(95, ((netRev - totalCostUnit) / effectivePrice) * 100)) : 0;
    effectiveMarkup = debouncedMarkup;
    effectiveFactor = 1 + (debouncedMarkup / 100);
  } else {
    effectivePrice = manualPrice;
    effectiveMargin = marginFromPrice;
    effectiveMarkup = totalCostUnit > 0 ? (((manualPrice * (1 - salesDeductionsRate)) - totalCostUnit) / totalCostUnit) * 100 : 0;
    effectiveFactor = totalCostUnit > 0 ? manualPrice / totalCostUnit : 1;
  }

  // Lucro Líquido Unitário
  const totalDeductionsR$ = effectivePrice * salesDeductionsRate;
  const netRevenue = effectivePrice - totalDeductionsR$;
  const netProfitUnit = netRevenue - totalCostUnit;

  // Totais do Lote
  const totalBatchGrossRevenue = unitsInBatch * effectivePrice;
  const totalBatchNetProfit = unitsInBatch * netProfitUnit;

  // Decomposição dinâmica de rendimento com concordância de unidade
  const fullUnits = Math.floor(unitsInBatch);
  const remainderUnitPct = Math.round((unitsInBatch - fullUnits) * 100);
  const unitHeadline = useMemo(() => {
    const label = fullUnits === 1 ? activeFormat.unitSingular : activeFormat.unitPlural;
    return `${fullUnits} ${label}`;
  }, [fullUnits, activeFormat]);

  // Sincroniza valor ao trocar de modo
  const handleSwitchMode = (newMode: PricingSimulationMode) => {
    if (newMode === 'markup' && mode === 'margin') {
      setSimulatedMarkup(Math.max(10, Math.round(effectiveMarkup)));
    } else if (newMode === 'margin' && mode === 'markup') {
      setSimulatedMargin(Math.max(5, Math.min(85, Math.round(effectiveMargin))));
    } else if (newMode === 'price') {
      setSimulatedPriceInput(effectivePrice.toFixed(2));
    }
    setMode(newMode);
  };

  // Salvar margem padrão
  const handleSaveAsGlobalDefault = () => {
    const newMargin = Math.round(mode === 'margin' ? simulatedMargin : effectiveMargin);
    if (newMargin <= 0 || newMargin >= 100) return;

    const updated: PricingParams = {
      ...pricingParams,
      targetMargin: newMargin
    };
    saveStoredPricingParams(updated);
    setIsSaved(true);
    if (onMarginSaved) onMarginSaved(newMargin);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Cor de saúde da margem para o modo Preço Fixo
  const marginColorClass =
    effectiveMargin < 20
      ? 'text-rose-400'
      : effectiveMargin < 40
      ? 'text-amber-400'
      : effectiveMargin >= 65
      ? 'text-yellow-300'
      : 'text-emerald-400';

  const overrunAdjusted = Boolean(
    densityAndVolume?.baseOverrunPct && userOverrun !== densityAndVolume.baseOverrunPct
  );

  return (
    <div className="profit-simulator-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/80 shadow-xl space-y-3">
      {/* 1. Cabeçalho Único Enxuto: Título + Volume + Overrun Stepper + Seletor de Modo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-none whitespace-nowrap">
            Simulador de Lucro &amp; Rendimento
          </h3>
          <span
            className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 whitespace-nowrap"
            title={`Volume total aerado da batelada (${Math.round(batchWeightGrams)}g · Overrun efetivo ~${effectiveBatchOverrun.toFixed(1)}%)`}
          >
            Volume: {totalBatchVolLiters.toFixed(2)} L ({Math.round(batchWeightGrams)}g)
          </span>
        </div>

        {/* Controles à direita: Overrun + Alternador Triplo */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Calibrador Compacto de Overrun */}
          <div
            className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-purple-500/30 shadow-inner"
            title={`Overrun da calda: ${userOverrun}%${
              totalVariegatoGrams > 0 ? ` · Overrun efetivo c/ mescla: ~${effectiveBatchOverrun.toFixed(1)}%` : ''
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-purple-300 whitespace-nowrap">Overrun</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.max(10, prev - 2))}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white transition-all active:scale-95"
                title="Diminuir aeração em 2%"
                aria-label="Diminuir overrun em 2%"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-mono font-black text-white px-1.5 min-w-[36px] text-center select-none tabular-nums">
                {userOverrun}%
              </span>
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.min(70, prev + 2))}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white transition-all active:scale-95"
                title="Aumentar aeração em 2%"
                aria-label="Aumentar overrun em 2%"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {overrunAdjusted && (
              <button
                type="button"
                onClick={() => densityAndVolume?.baseOverrunPct && setUserOverrun(densityAndVolume.baseOverrunPct)}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-500/40 transition-all shrink-0"
                title="Restaurar overrun padrão estimado da receita"
                aria-label="Restaurar overrun padrão"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Alternador Triplo: Margem % | Markup | Preço Fixo */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode('margin')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                mode === 'margin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Calcular preço a partir da Margem de Lucro (% sobre a venda)"
            >
              <Sliders className="w-3 h-3" />
              <span>Margem %</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('markup')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                mode === 'markup'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Calcular preço a partir do Markup multiplicador (% sobre o custo)"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Markup</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('price')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                mode === 'price'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Informar preço fixo praticado e diagnosticar margem real"
            >
              <Percent className="w-3 h-3" />
              <span>Preço Fixo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra Segmentada Única de 6 Formatos de Envase */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          {(Object.keys(FORMAT_CONFIGS) as SalesFormat[]).map(fmt => {
            const config = FORMAT_CONFIGS[fmt];
            const isSelected = selectedFormat === fmt;

            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`py-1.5 px-2.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 select-none ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 shadow-sm font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 font-medium'
                }`}
                title={`${config.title} (${config.subtitle})`}
              >
                <span className="text-sm select-none shrink-0 leading-none">{config.icon}</span>
                <span className="text-xs leading-none truncate">{config.title}</span>
              </button>
            );
          })}
        </div>

        {/* Configuração Customizada (apenas quando Personalizado está ativo) */}
        {selectedFormat === 'custom' && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-2.5 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-bold">Unidade:</span>
              <button
                type="button"
                onClick={() => setCustomMeasureType('volume')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  customMeasureType === 'volume'
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Volume (ml)
              </button>
              <button
                type="button"
                onClick={() => setCustomMeasureType('weight')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  customMeasureType === 'weight'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Massa (g)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-amber-300 whitespace-nowrap">
                {customMeasureType === 'volume' ? 'Capacidade (ml):' : 'Peso (g):'}
              </label>
              <input
                type="number"
                min="1"
                step={customMeasureType === 'volume' ? '10' : '5'}
                value={customMeasureType === 'volume' ? (customVolumeInput || '') : (customWeightInput || '')}
                onChange={e => {
                  const val = Math.max(1, parseFloat(e.target.value) || 0);
                  if (customMeasureType === 'volume') {
                    setCustomVolumeInput(val);
                  } else {
                    setCustomWeightInput(val);
                  }
                }}
                className="w-20 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-right focus:outline-none"
                placeholder={customMeasureType === 'volume' ? '250' : '150'}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
                Embalagem (R$):
              </label>
              <input
                type="number"
                min="0"
                step="0.10"
                value={customPackCostInput === 0 ? '' : customPackCostInput}
                onChange={e => setCustomPackCostInput(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-right focus:outline-none"
                placeholder="1.00"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Fluxo Causa -> Efeito em 3 Cards Alinhados (Controle -> Unitário -> Rendimento do Lote) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* COLUNA 1 (CAUSA — 4 cols): CONTROLE DE PRECIFICAÇÃO (MARGEM / MARKUP / PREÇO FIXO) */}
        <div className="lg:col-span-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/80 flex flex-col justify-between gap-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 text-[11px]">
              {mode === 'margin' ? (
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
              ) : mode === 'markup' ? (
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {mode === 'margin' ? 'Controle de Margem' : mode === 'markup' ? 'Markup sobre Custo' : 'Preço Praticado'}
              </span>
            </span>

            {mode === 'margin' && (
              <span className="text-xl font-black font-mono text-amber-400 leading-none tabular-nums">
                {simulatedMargin}%
              </span>
            )}
            {mode === 'markup' && (
              <span className="text-xl font-black font-mono text-purple-300 leading-none tabular-nums">
                {simulatedMarkup}%
              </span>
            )}
          </div>

          {/* MODO A: MARGEM DE LUCRO (%) */}
          {mode === 'margin' && (
            <div className="space-y-2">
              <input
                type="range"
                min="15"
                max="80"
                step="1"
                value={simulatedMargin}
                onChange={e => setSimulatedMargin(parseInt(e.target.value) || 50)}
                className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer transition-all"
                aria-label="Selecionar margem de lucro na venda"
              />

              <div className="grid grid-cols-4 gap-1.5">
                {[35, 50, 60, 70].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSimulatedMargin(m)}
                    className={`py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                      simulatedMargin === m
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>

              {!isMarginViable && (
                <div className="text-[11px] text-amber-300 bg-amber-500/15 px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-center leading-tight">
                  ⚠️ Margem inviável: deduções ({(salesDeductionsRate * 100).toFixed(1)}%) + margem ({simulatedMargin}%) ≥ 100%. Teto: <strong>{maxViableMargin}%</strong>.
                </div>
              )}
            </div>
          )}

          {/* MODO B: MARKUP SOBRE O CUSTO (%) */}
          {mode === 'markup' && (
            <div className="space-y-2">
              <input
                type="range"
                min="40"
                max="300"
                step="5"
                value={simulatedMarkup}
                onChange={e => setSimulatedMarkup(parseInt(e.target.value) || 100)}
                className="w-full accent-purple-500 bg-slate-950 h-2 rounded-lg cursor-pointer transition-all"
                aria-label="Selecionar markup sobre o custo"
              />

              <div className="grid grid-cols-4 gap-1.5">
                {[100, 150, 200, 250].map(mk => (
                  <button
                    key={mk}
                    type="button"
                    onClick={() => setSimulatedMarkup(mk)}
                    className={`py-1 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                      simulatedMarkup === mk
                        ? 'bg-purple-500 text-white border-purple-400 font-black shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {mk}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODO C: PREÇO FIXO PRATICADO (R$) */}
          {mode === 'price' && (
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={simulatedPriceInput}
                  onChange={e => setSimulatedPriceInput(e.target.value)}
                  placeholder="38.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-lg font-mono font-black text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  aria-label="Preço fixo de venda em reais"
                />
              </div>
            </div>
          )}

          {/* Rodapé Único do Controle: Equivalência + Salvar Padrão */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-700/60">
            {mode === 'margin' && (
              <span>
                Markup eq.: <strong className="text-purple-300">~{effectiveMarkup.toFixed(0)}% ({effectiveFactor.toFixed(2)}×)</strong>
              </span>
            )}
            {mode === 'markup' && (
              <span>
                Margem líq.: <strong className="text-emerald-400">{effectiveMargin.toFixed(1)}%</strong> ({effectiveFactor.toFixed(2)}×)
              </span>
            )}
            {mode === 'price' && (
              <span>
                Margem: <strong className={marginColorClass}>{effectiveMargin.toFixed(1)}%</strong> · Markup <strong className="text-purple-300">~{effectiveMarkup.toFixed(0)}%</strong>
              </span>
            )}

            {mode === 'margin' && Math.round(effectiveMargin) !== pricingParams.targetMargin && (
              <button
                type="button"
                onClick={handleSaveAsGlobalDefault}
                className="text-[11px] font-sans font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 whitespace-nowrap shrink-0"
                title="Salvar esta margem como padrão para toda a loja"
              >
                {isSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Salvo!
                  </span>
                ) : (
                  <span>Salvar padrão</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* COLUNA 2 (EFEITO UNITÁRIO — 4 cols): RESULTADO POR EMBALAGEM */}
        <div className="lg:col-span-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-emerald-500/30 flex flex-col justify-between gap-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resultado por Embalagem</span>
            </span>
            <span className="text-[11px] font-mono text-slate-300 font-semibold whitespace-nowrap">
              {formatCapacityDisplay} · {Math.round(formatWeightGrams)}g
            </span>
          </div>

          {/* Preço Sugerido | Lucro Líquido Unitário */}
          <div className="grid grid-cols-2 divide-x divide-slate-700/60 items-center py-0.5">
            <div className="pr-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Preço Sugerido
              </span>
              <div className="text-2xl xl:text-[26px] font-black text-emerald-400 font-mono tabular-nums tracking-tight leading-tight mt-1">
                R$ {effectivePrice.toFixed(2)}
              </div>
            </div>

            <div className="pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Lucro Líquido
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl xl:text-[26px] font-black font-mono tabular-nums tracking-tight leading-tight ${netProfitUnit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  R$ {netProfitUnit.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/un</span>
              </div>
            </div>
          </div>

          {/* Faixa Compacta Única de Decomposição do Custo Unitário (4 micro-colunas sem quebra) */}
          <div className="bg-slate-950/75 px-2.5 py-1.5 rounded-lg border border-slate-800 grid grid-cols-4 divide-x divide-slate-800/80 items-center text-center font-mono">
            <div className="pr-1.5" title="Custo dos insumos nesta embalagem">
              <span className="flex items-center justify-center gap-1 text-[9px] uppercase font-sans font-bold text-slate-400 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>Insumos</span>
              </span>
              <strong className="text-[11px] text-slate-200 tabular-nums block mt-0.5 whitespace-nowrap">
                R$ {productCost.toFixed(2)}
              </strong>
            </div>

            <div className="px-1.5" title="Custo da embalagem">
              <span className="flex items-center justify-center gap-1 text-[9px] uppercase font-sans font-bold text-slate-400 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Emb.</span>
              </span>
              <strong className="text-[11px] text-slate-200 tabular-nums block mt-0.5 whitespace-nowrap">
                R$ {formatPackCost.toFixed(2)}
              </strong>
            </div>

            <div className="px-1.5" title="Rateio de custos fixos">
              <span className="flex items-center justify-center gap-1 text-[9px] uppercase font-sans font-bold text-slate-400 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>Fixo</span>
              </span>
              <strong className="text-[11px] text-slate-200 tabular-nums block mt-0.5 whitespace-nowrap">
                R$ {overheadPerUnit.toFixed(2)}
              </strong>
            </div>

            <div className="pl-1.5" title="Custo unitário total">
              <span className="text-[9px] uppercase font-sans font-bold text-amber-300/90 leading-none block">
                Custo
              </span>
              <strong className="text-[11px] text-amber-300 font-black tabular-nums block mt-0.5 whitespace-nowrap">
                R$ {totalCostUnit.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* COLUNA 3 (EFEITO NO LOTE — 4 cols): RENDIMENTO DO LOTE */}
        <div className="lg:col-span-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/80 flex flex-col justify-between gap-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 text-[11px]">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Rendimento do Lote</span>
            </span>
            <span className="text-[11px] font-mono text-amber-300 font-bold whitespace-nowrap tabular-nums">
              {unitsInBatch.toFixed(1)} un no lote
            </span>
          </div>

          {/* Hero Dinâmico com Concordância de Unidade */}
          <div className="py-0.5">
            <div className="text-2xl xl:text-[26px] font-black font-mono text-emerald-400 tracking-tight leading-tight">
              {unitHeadline}
            </div>
            <div className="text-[11px] text-amber-300/90 font-mono mt-0.5">
              {remainderUnitPct > 0 ? (
                <span>+ 1 {activeFormat.partialLabel} ({remainderUnitPct}% {activeFormat.partialFullWord})</span>
              ) : (
                <span>Rendimento exato sem sobra parcial</span>
              )}
            </div>
          </div>

          {/* Faturamento e Lucro no Bolso do Lote (2 Colunas Limpas sem Quebra) */}
          <div className="bg-slate-950/75 px-3 py-1.5 rounded-lg border border-slate-800 grid grid-cols-2 divide-x divide-slate-800 items-center text-center">
            <div className="pr-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block leading-none">
                Faturamento
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-white tabular-nums block mt-0.5 whitespace-nowrap">
                R$ {totalBatchGrossRevenue.toFixed(2)}
              </span>
            </div>
            <div className="pl-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block leading-none">
                Lucro no Bolso
              </span>
              <span className={`text-xs sm:text-sm font-black font-mono tabular-nums block mt-0.5 whitespace-nowrap ${totalBatchNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {totalBatchNetProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
