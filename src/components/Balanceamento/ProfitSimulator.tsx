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
    defaultPricePlaceholder: 38.00
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
    defaultPricePlaceholder: 70.00
  },
  cup120: {
    id: 'cup120',
    name: 'Copinho 120ml',
    title: 'Copinho 120ml',
    subtitle: '1 Bola • 120 ml',
    icon: '🍦',
    type: 'volume',
    capacityMl: 120,
    packagingCost: 0.60,
    defaultPricePlaceholder: 15.00
  },
  cup180: {
    id: 'cup180',
    name: 'Copinho 180ml',
    title: 'Copinho 180ml',
    subtitle: '2 Bolas • 180 ml',
    icon: '🍧',
    type: 'volume',
    capacityMl: 180,
    packagingCost: 0.85,
    defaultPricePlaceholder: 22.00
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
    defaultPricePlaceholder: 240.00
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    title: 'Personalizado',
    subtitle: 'Ajuste livre',
    icon: '⚖️',
    type: 'volume',
    packagingCost: 1.00,
    defaultPricePlaceholder: 20.00
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

  // Decomposição de rendimento: Potes cheios + fração
  const fullUnits = Math.floor(unitsInBatch);
  const remainderUnitPct = Math.round((unitsInBatch - fullUnits) * 100);

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

  // Status de saúde comercial
  let marginHealth = {
    label: 'Margem Saudável & Equilibrada',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    icon: '✨'
  };

  if (effectiveMargin < 20) {
    marginHealth = {
      label: 'Margem Crítica (Risco de Prejuízo)',
      color: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: '⚠️'
    };
  } else if (effectiveMargin < 40) {
    marginHealth = {
      label: 'Margem Promocional (Alto Giro)',
      color: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      icon: '⚡'
    };
  } else if (effectiveMargin >= 65) {
    marginHealth = {
      label: 'Super Lucratividade (Linha Premium)',
      color: 'text-yellow-300',
      badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
      icon: '💎'
    };
  }

  return (
    <div className="profit-simulator-card p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl space-y-4">
      
      {/* 1. Header Compacto com Aeração e Alternador de Modo (Margem / Markup / Preço) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white flex items-center gap-2 truncate">
              <span>Simulador de Lucro & Rendimento por Volume</span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Precificação executiva, markup e rendimento operacional com base no overrun.
            </p>
          </div>
        </div>

        {/* Controles de Aeração e Seletor Triplo de Modo */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Calibrador de Overrun */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-purple-500/30 shadow-inner">
            <div className="flex items-center gap-1 text-purple-300">
              <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">Overrun:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.max(10, prev - 2))}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                title="Diminuir aeração em 2%"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-black text-white px-1.5 min-w-[32px] text-center select-none">
                {userOverrun}%
              </span>
              <button
                type="button"
                onClick={() => setUserOverrun(prev => Math.min(70, prev + 2))}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                title="Aumentar aeração em 2%"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={!densityAndVolume?.baseOverrunPct || userOverrun === densityAndVolume.baseOverrunPct}
              onClick={() => densityAndVolume?.baseOverrunPct && setUserOverrun(densityAndVolume.baseOverrunPct)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all shrink-0 ${
                densityAndVolume?.baseOverrunPct && userOverrun !== densityAndVolume.baseOverrunPct
                  ? 'bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 hover:text-white border border-purple-500/40 cursor-pointer shadow-sm'
                  : 'opacity-0 pointer-events-none'
              }`}
              title="Restaurar aeração padrão do estilo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alternador Triplo: Margem % | Markup % | Preço Fixo R$ */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode('margin')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
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

      {/* 2. Formato de Envase e Venda em Barra Compacta (Pills Horizontais) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-[11px]">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Formato de Envase e Venda:</span>
          </span>
          <span className="text-[11px] text-purple-300 font-mono">
            Volume Total: <strong className="text-white">{totalBatchVolLiters.toFixed(2)} L</strong> ({Math.round(batchWeightGrams)}g)
          </span>
        </div>

        {/* Grade Compacta de 6 Opções */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(FORMAT_CONFIGS) as SalesFormat[]).map(fmt => {
            const config = FORMAT_CONFIGS[fmt];
            const isSelected = selectedFormat === fmt;
            const subtitleText = config.subtitle;

            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 relative ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-lg select-none shrink-0">{config.icon}</span>
                <div className="text-left min-w-0">
                  <span className="text-xs font-bold leading-tight block truncate">
                    {config.title}
                  </span>
                  {subtitleText && (
                    <span
                      className={`text-[10px] font-mono leading-none block truncate ${
                        isSelected ? 'text-amber-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {subtitleText}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Configuração Customizada (se ativo) */}
        {selectedFormat === 'custom' && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 space-y-2.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-bold">Unidade de Medida:</span>
              <button
                type="button"
                onClick={() => setCustomMeasureType('volume')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
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
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  customMeasureType === 'weight'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Massa (g)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  {customMeasureType === 'volume' ? '📐 Capacidade (ml)' : '⚖️ Peso Unitário (g)'}
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
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300"
                  placeholder={customMeasureType === 'volume' ? '250' : '150'}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  📦 Custo Embalagem (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={customPackCostInput === 0 ? '' : customPackCostInput}
                  onChange={e => setCustomPackCostInput(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                  placeholder="1.00"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cockpit Executivo em 3 Colunas Equilibradas (Desktop Grid 1x3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
        
        {/* COLUNA 1: RENDIMENTO OPERACIONAL DA BATELADA (HERO MÁXIMO) */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-between space-y-3 shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Rendimento da Produção</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {totalBatchVolLiters.toFixed(2)} L
              </span>
            </div>

            {/* Destaque Gigante dos Potes Cheios */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-center space-y-1 my-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Envase Projetado:
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight leading-none py-0.5">
                {fullUnits} Potes Cheios
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-medium">
                {remainderUnitPct > 0 ? (
                  <span>+ 1 pote parcial ({remainderUnitPct}% cheio) • <strong>{unitsInBatch.toFixed(1)} un</strong></span>
                ) : (
                  <span>Total exato de <strong>{unitsInBatch.toFixed(1)} unidades</strong></span>
                )}
              </div>
            </div>

            {/* Faturamento e Lucro do Lote */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] uppercase text-slate-400 block font-sans font-bold">
                  Faturamento
                </span>
                <span className="text-sm sm:text-base font-black text-white block">
                  R$ {totalBatchGrossRevenue.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {unitsInBatch.toFixed(1)} un × R$ {effectivePrice.toFixed(2)}
                </span>
              </div>

              <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30 space-y-0.5">
                <span className="text-[10px] uppercase text-emerald-300 block font-sans font-bold">
                  Lucro no Bolso ⭐
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-400 block">
                  R$ {totalBatchNetProfit.toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-400/70 block">
                  Livre de custos e insumos
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé: Overrun Efetivo */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-purple-400" />
              <span>Overrun Efetivo:</span>
            </span>
            <span className="text-purple-300 font-mono font-bold">
              ~{effectiveBatchOverrun.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* COLUNA 2: RESULTADO UNITÁRIO POR EMBALAGEM */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 flex flex-col justify-between space-y-3 shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/30 text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 text-[11px]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resultado por Embalagem</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${marginHealth.badge}`}>
                {marginHealth.icon} {effectiveMargin.toFixed(0)}% Margem
              </span>
            </div>

            {/* Preço de Venda e Lucro Unitário */}
            <div className="grid grid-cols-2 gap-2.5 py-1.5 items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Preço Sugerido
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                  R$ {effectivePrice.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {formatCapacityDisplay} ({Math.round(formatWeightGrams)}g)
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Lucro Líquido
                </span>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5 ${netProfitUnit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  R$ {netProfitUnit.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  por unidade vendida
                </span>
              </div>
            </div>

            {/* Micro-Decomposição Sintética de Custos */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-[11px] font-mono mt-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Insumos ({Math.round(formatWeightGrams)}g):</span>
                </span>
                <strong>R$ {productCost.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Embalagem:</span>
                </span>
                <strong>R$ {formatPackCost.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Rateio Fixo:</span>
                </span>
                <strong>R$ {overheadPerUnit.toFixed(2)}</strong>
              </div>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between font-bold text-white">
                <span>Custo Unitário Total:</span>
                <strong className="text-amber-300">R$ {totalCostUnit.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Rodapé: Relação Margem vs Markup */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Markup: <strong className="text-purple-300">~{effectiveMarkup.toFixed(0)}% ({effectiveFactor.toFixed(2)}×)</strong></span>
            <span>Margem: <strong className="text-emerald-400">{effectiveMargin.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* COLUNA 3: CONTROLE DE PRECIFICAÇÃO (SLIDER & PRESETS) */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-between space-y-3 shadow-md">
          <div>
            {/* Header do Card com o Modo Atual */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-[11px]">
                {mode === 'margin' ? (
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                ) : mode === 'markup' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {mode === 'margin' ? 'Margem Alvo' : mode === 'markup' ? 'Markup sobre Custo' : 'Preço Praticado'}
                </span>
              </span>

              <span className="text-xs font-mono font-bold text-amber-300">
                {mode === 'margin' ? `${simulatedMargin}%` : mode === 'markup' ? `${simulatedMarkup}% (${effectiveFactor.toFixed(2)}×)` : `R$ ${effectivePrice.toFixed(2)}`}
              </span>
            </div>

            {/* MODO A: MARGEM DE LUCRO (%) */}
            {mode === 'margin' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Margem na Venda:</span>
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {simulatedMargin}%
                  </span>
                </div>

                <input
                  type="range"
                  min="15"
                  max="80"
                  step="1"
                  value={simulatedMargin}
                  onChange={e => setSimulatedMargin(parseInt(e.target.value) || 50)}
                  className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer transition-all"
                />

                <div className="flex items-center justify-between gap-1">
                  {[35, 50, 60, 70].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSimulatedMargin(m)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        simulatedMargin === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-center">
                  Markup equivalente: <strong className="text-purple-300">~{effectiveMarkup.toFixed(0)}% ({effectiveFactor.toFixed(2)}×)</strong>
                </div>

                {!isMarginViable && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/15 p-2 rounded-lg border border-amber-500/30 text-center leading-tight">
                    ⚠️ Margem inviável: deduções ({(salesDeductionsRate * 100).toFixed(1)}%) + margem ({simulatedMargin}%) somam ≥ 100%. Teto viável: <strong>{maxViableMargin}%</strong>. Calculado provisoriamente via Markup.
                  </div>
                )}
              </div>
            )}

            {/* MODO B: MARKUP SOBRE O CUSTO (%) */}
            {mode === 'markup' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Markup sobre Custo:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-purple-300">
                      {simulatedMarkup}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ({effectiveFactor.toFixed(2)}× custo)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="40"
                  max="300"
                  step="5"
                  value={simulatedMarkup}
                  onChange={e => setSimulatedMarkup(parseInt(e.target.value) || 100)}
                  className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer transition-all"
                />

                <div className="flex items-center justify-between gap-1">
                  {[100, 150, 200, 250].map(mk => (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => setSimulatedMarkup(mk)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                        simulatedMarkup === mk
                          ? 'bg-purple-500 text-white border-purple-400 font-black shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mk}%
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-center">
                  Margem líquida equivalente: <strong className="text-emerald-400">{effectiveMargin.toFixed(1)}%</strong>
                </div>
              </div>
            )}

            {/* MODO C: PREÇO FIXO PRATICADO (R$) */}
            {mode === 'price' && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-slate-400 block">Preço de Balcão:</span>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono font-bold text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={simulatedPriceInput}
                    onChange={e => setSimulatedPriceInput(e.target.value)}
                    placeholder="38.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xl font-mono font-black text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans">Margem:</span>
                    <strong className={marginHealth.color}>{effectiveMargin.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans">Markup:</span>
                    <strong className="text-purple-300">~{effectiveMarkup.toFixed(0)}% ({effectiveFactor.toFixed(2)}×)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Salvar Margem como Padrão da Loja */}
          {mode === 'margin' && Math.round(effectiveMargin) !== pricingParams.targetMargin && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAsGlobalDefault}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                title="Salvar esta margem como padrão para toda a loja"
              >
                {isSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Salvo como padrão da loja!
                  </span>
                ) : (
                  <span>Salvar margem como padrão</span>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
