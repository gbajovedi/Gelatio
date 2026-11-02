import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  RotateCcw,
  Landmark,
  CreditCard,
  Receipt,
  PieChart,
  Sparkles,
  Zap,
  Building2,
  Users,
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  Scale,
  Trash2,
  Plus
} from 'lucide-react';
import {
  getStoredPricingParams,
  saveStoredPricingParams,
  DEFAULT_PRICING_PARAMS,
  CIELO_PRESETS,
  calculateEffectiveCardFee,
  PricingParams,
  CustomCostItem
} from '../../core/pricingStorage';

export const PricingCalculator: React.FC = () => {
  const initial = getStoredPricingParams();

  // 1. Ocupação & Utilidades
  const [rent, setRent] = useState<number>(initial.rent);
  const [electricity, setElectricity] = useState<number>(initial.electricity);
  const [water, setWater] = useState<number>(initial.water);
  const [telecom, setTelecom] = useState<number>(initial.telecom);

  // 2. Pessoal & Gestão
  const [payroll, setPayroll] = useState<number>(initial.payroll);
  const [ownerSalary, setOwnerSalary] = useState<number>(initial.ownerSalary ?? 0);
  const [accounting, setAccounting] = useState<number>(initial.accounting);
  const [software, setSoftware] = useState<number>(initial.software);

  // 3. Refrigeração, Máquinas & Sanitização
  const [equipmentMaintenance, setEquipmentMaintenance] = useState<number>(
    initial.equipmentMaintenance ?? 250
  );
  const [equipmentDepreciation, setEquipmentDepreciation] = useState<number>(
    initial.equipmentDepreciation ?? 350
  );
  const [cleaningHygiene, setCleaningHygiene] = useState<number>(initial.cleaningHygiene ?? 150);
  const [secPackaging, setSecPackaging] = useState<number>(initial.secPackaging);

  // 4. Tributos, Licenças & Proteção
  const [fixedTaxes, setFixedTaxes] = useState<number>(initial.fixedTaxes);
  const [licensesAndPermits, setLicensesAndPermits] = useState<number>(
    initial.licensesAndPermits ?? 100
  );
  const [commercialInsurance, setCommercialInsurance] = useState<number>(
    initial.commercialInsurance ?? 0
  );
  const [posRentalMonthly, setPosRentalMonthly] = useState<number>(initial.posRentalMonthly ?? 0);
  const [marketing, setMarketing] = useState<number>(initial.marketing);

  // Produção e Pote
  const [monthlyUnits, setMonthlyUnits] = useState<number>(initial.monthlyUnits);
  const [tubWeightGrams, setTubWeightGrams] = useState<number>(initial.tubWeightGrams);
  const [tubPackCost, setTubPackCost] = useState<number>(initial.tubPackCost);
  const [targetMargin, setTargetMargin] = useState<number>(initial.targetMargin);
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>(
    initial.pricingMethod || (initial.targetMargin >= 100 ? 'markup' : 'margin')
  );
  const [salesTaxPercent, setSalesTaxPercent] = useState<number>(initial.salesTaxPercent);
  const [sampleCaldaCostKg, setSampleCaldaCostKg] = useState<number>(initial.sampleCaldaCostKg);

  // Configurações Maquininha / Adquirentes
  const [useSalesMix, setUseSalesMix] = useState<boolean>(initial.useSalesMix ?? true);
  const [cieloPlan, setCieloPlan] = useState<'padrao' | 'negociado' | 'fluxo' | 'custom'>(
    initial.cieloPlan ?? 'padrao'
  );
  const [cardFeePix, setCardFeePix] = useState<number>(initial.cardFeePix ?? 0.0);
  const [cardFeeDebit, setCardFeeDebit] = useState<number>(initial.cardFeeDebit ?? 1.49);
  const [cardFeeCreditSight, setCardFeeCreditSight] = useState<number>(initial.cardFeeCreditSight ?? 4.3);
  const [cardFeeCreditInstallment, setCardFeeCreditInstallment] = useState<number>(
    initial.cardFeeCreditInstallment ?? 9.9
  );

  // Mix de Vendas (% do faturamento no balcão)
  const [mixPix, setMixPix] = useState<number>(initial.mixPix ?? 30);
  const [mixDebit, setMixDebit] = useState<number>(initial.mixDebit ?? 45);
  const [mixCreditSight, setMixCreditSight] = useState<number>(initial.mixCreditSight ?? 20);
  const [mixCreditInstallment, setMixCreditInstallment] = useState<number>(initial.mixCreditInstallment ?? 5);

  // Taxa manual (modo simples)
  const [cardFeeManual, setCardFeeManual] = useState<number>(initial.cardFee ?? 2.03);

  // 5. Custos Extras / Personalizados
  const [customCosts, setCustomCosts] = useState<CustomCostItem[]>(() => {
    if (Array.isArray(initial.customCosts)) {
      return initial.customCosts;
    }
    return [];
  });

  const handleAddCustomCost = (suggestedName?: string) => {
    const newItem: CustomCostItem = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: suggestedName || '',
      amount: 0
    };
    setCustomCosts(prev => [...prev, newItem]);
  };

  const handleUpdateCustomCost = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCustomCosts(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveCustomCost = (id: string) => {
    setCustomCosts(prev => prev.filter(item => item.id !== id));
  };

  // Objeto unificado para persistência e cálculos
  const currentParams: PricingParams = {
    rent,
    electricity,
    water,
    telecom,
    payroll,
    ownerSalary,
    accounting,
    software,
    equipmentMaintenance,
    equipmentDepreciation,
    cleaningHygiene,
    secPackaging,
    fixedTaxes,
    licensesAndPermits,
    commercialInsurance,
    posRentalMonthly,
    marketing,
    monthlyUnits,
    tubWeightGrams,
    tubPackCost,
    targetMargin,
    cardFee: cardFeeManual,
    useSalesMix,
    cieloPlan,
    cardFeePix,
    cardFeeDebit,
    cardFeeCreditSight,
    cardFeeCreditInstallment,
    mixPix,
    mixDebit,
    mixCreditSight,
    mixCreditInstallment,
    salesTaxPercent,
    sampleCaldaCostKg
  };

  const effectiveCardFee = calculateEffectiveCardFee(currentParams);
  const totalMixSum = mixPix + mixDebit + mixCreditSight + mixCreditInstallment;
  // Normalizar composição de vendas para somar exatamente 100%
  const handleNormalizeMix = () => {
    if (totalMixSum <= 0) {
      setMixPix(40);
      setMixDebit(35);
      setMixCreditSight(20);
      setMixCreditInstallment(5);
      return;
    }
    const rawPix = (mixPix / totalMixSum) * 100;
    const rawDebit = (mixDebit / totalMixSum) * 100;
    const rawCredit = (mixCreditSight / totalMixSum) * 100;

    const roundPix = Math.round(rawPix);
    const roundDebit = Math.round(rawDebit);
    const roundCredit = Math.round(rawCredit);
    const roundInstallment = Math.max(0, 100 - (roundPix + roundDebit + roundCredit));

    setMixPix(roundPix);
    setMixDebit(roundDebit);
    setMixCreditSight(roundCredit);
    setMixCreditInstallment(roundInstallment);
  };


  // Persistência automática no localStorage
  useEffect(() => {
    saveStoredPricingParams(currentParams);
  }, [
    rent,
    electricity,
    water,
    telecom,
    payroll,
    ownerSalary,
    accounting,
    software,
    equipmentMaintenance,
    equipmentDepreciation,
    cleaningHygiene,
    secPackaging,
    fixedTaxes,
    licensesAndPermits,
    commercialInsurance,
    posRentalMonthly,
    marketing,
    monthlyUnits,
    tubWeightGrams,
    tubPackCost,
    targetMargin,
    cardFeeManual,
    useSalesMix,
    cieloPlan,
    cardFeePix,
    cardFeeDebit,
    cardFeeCreditSight,
    cardFeeCreditInstallment,
    mixPix,
    mixDebit,
    mixCreditSight,
    mixCreditInstallment,
    salesTaxPercent,
    sampleCaldaCostKg
  ]);

  // Aplicar Preset de Maquininha
  const applyCieloPreset = (plan: 'padrao' | 'negociado' | 'fluxo') => {
    const p = CIELO_PRESETS[plan];
    setCieloPlan(plan);
    setCardFeePix(p.cardFeePix);
    setCardFeeDebit(p.cardFeeDebit);
    setCardFeeCreditSight(p.cardFeeCreditSight);
    setCardFeeCreditInstallment(p.cardFeeCreditInstallment);
    setPosRentalMonthly(p.posRentalMonthly);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar todos os custos fixos para os padrões recomendados da gelateria?')) {
      const def = DEFAULT_PRICING_PARAMS;
      setRent(def.rent);
      setElectricity(def.electricity);
      setWater(def.water);
      setTelecom(def.telecom);
      setPayroll(def.payroll);
      setOwnerSalary(def.ownerSalary);
      setAccounting(def.accounting);
      setSoftware(def.software);
      setEquipmentMaintenance(def.equipmentMaintenance);
      setEquipmentDepreciation(def.equipmentDepreciation);
      setCleaningHygiene(def.cleaningHygiene);
      setSecPackaging(def.secPackaging);
      setFixedTaxes(def.fixedTaxes);
      setLicensesAndPermits(def.licensesAndPermits);
      setCommercialInsurance(def.commercialInsurance);
      setPosRentalMonthly(def.posRentalMonthly);
      setMarketing(def.marketing);
      setMonthlyUnits(def.monthlyUnits);
      setTubWeightGrams(def.tubWeightGrams);
      setTubPackCost(def.tubPackCost);
      setTargetMargin(def.targetMargin);
      setPricingMethod(def.pricingMethod || 'margin');
      setCardFeeManual(def.cardFee);
      setUseSalesMix(def.useSalesMix);
      setCieloPlan(def.cieloPlan);
      setCardFeePix(def.cardFeePix);
      setCardFeeDebit(def.cardFeeDebit);
      setCardFeeCreditSight(def.cardFeeCreditSight);
      setCardFeeCreditInstallment(def.cardFeeCreditInstallment);
      setMixPix(def.mixPix);
      setMixDebit(def.mixDebit);
      setMixCreditSight(def.mixCreditSight);
      setMixCreditInstallment(def.mixCreditInstallment);
      setSalesTaxPercent(def.salesTaxPercent);
      setSampleCaldaCostKg(def.sampleCaldaCostKg);
      saveStoredPricingParams(def);
    }
  };

  // Subtotais por Grupo Lógico (1 a 5)
  const subtotalOccupancy = rent + electricity + water + telecom;
  const subtotalPersonnel = payroll + ownerSalary + accounting + software;
  const subtotalEquipment = equipmentMaintenance + equipmentDepreciation + cleaningHygiene + secPackaging;
  const subtotalLegal = fixedTaxes + licensesAndPermits + commercialInsurance + posRentalMonthly + marketing;
  const subtotalCustom = customCosts.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const totalFixedCosts = subtotalOccupancy + subtotalPersonnel + subtotalEquipment + subtotalLegal + subtotalCustom;
  const overheadPerUnit = monthlyUnits > 0 ? totalFixedCosts / monthlyUnits : 0;

  // Percentuais por grupo para barra de distribuição
  const pctOccupancy = totalFixedCosts > 0 ? (subtotalOccupancy / totalFixedCosts) * 100 : 0;
  const pctPersonnel = totalFixedCosts > 0 ? (subtotalPersonnel / totalFixedCosts) * 100 : 0;
  const pctEquipment = totalFixedCosts > 0 ? (subtotalEquipment / totalFixedCosts) * 100 : 0;
  const pctLegal = totalFixedCosts > 0 ? (subtotalLegal / totalFixedCosts) * 100 : 0;
  const pctCustom = totalFixedCosts > 0 ? (subtotalCustom / totalFixedCosts) * 100 : 0;

  // Cálculos do Pote e Markup
  const activeFeePercent = useSalesMix ? effectiveCardFee : cardFeeManual;
  const productCostInTub = sampleCaldaCostKg * (tubWeightGrams / 1000);
  const directCostPerTub = productCostInTub + tubPackCost;
  const totalCostWithOverhead = directCostPerTub + overheadPerUnit;

  const totalSalesDeductionsPercent = activeFeePercent + salesTaxPercent;
  const totalDeductionsAndMarginPercent = targetMargin + totalSalesDeductionsPercent;
  const marginDivisor = (100 - totalDeductionsAndMarginPercent) / 100;

  // Preço de Venda Sugerido:
  // Se marginDivisor > 0 e totalDeductionsAndMarginPercent < 100: fórmula Sebrae por divisor
  // Se targetMargin >= 100 ou total >= 100: markup multiplicador sobre o custo total (evita zerar preço)
  const suggestedTubPrice =
    totalCostWithOverhead <= 0
      ? 0
      : marginDivisor > 0 && totalDeductionsAndMarginPercent < 100
      ? totalCostWithOverhead / marginDivisor
      : (totalCostWithOverhead * (1 + targetMargin / 100)) / Math.max(0.01, (100 - totalSalesDeductionsPercent) / 100);

  const cardFeeValue = suggestedTubPrice * (activeFeePercent / 100);
  const taxValue = suggestedTubPrice * (salesTaxPercent / 100);
  const netProfit = suggestedTubPrice - cardFeeValue - taxValue - totalCostWithOverhead;

  // Ponto de Equilíbrio (Break-Even em Potes por Mês)
  // Receita Líquida por Unidade (após taxas de cartão e impostos variáveis sobre a venda)
  const netRevenuePerUnit = suggestedTubPrice - cardFeeValue - taxValue;
  // Margem de Contribuição Unitária (MCU) = Receita Líquida - Custos Diretos Variáveis (Gelato + Pote)
  const unitContributionMargin = netRevenuePerUnit - directCostPerTub;
  // Ponto de Equilíbrio em Unidades = Custos Fixos Totais / Margem de Contribuição Unitária
  const breakEvenUnits =
    unitContributionMargin > 0 && totalFixedCosts > 0
      ? Math.ceil(totalFixedCosts / unitContributionMargin)
      : 0;
  const breakEvenRevenue = breakEvenUnits * suggestedTubPrice;
  const safetyMarginUnits = monthlyUnits - breakEvenUnits;

  // Grupos de Custo com cores coordenadas para a barra e legenda
  const costGroups = [
    {
      key: 'occupancy',
      name: 'Ocupação',
      fullName: '1. Ocupação & Utilidades',
      amount: subtotalOccupancy,
      pct: pctOccupancy,
      colorBg: 'bg-amber-400',
      colorText: 'text-amber-300',
      colorBorder: 'border-amber-400/50',
      colorDot: 'bg-amber-400 shadow-amber-400/50'
    },
    {
      key: 'personnel',
      name: 'Pessoal',
      fullName: '2. Pessoal & Gestão',
      amount: subtotalPersonnel,
      pct: pctPersonnel,
      colorBg: 'bg-cyan-400',
      colorText: 'text-cyan-300',
      colorBorder: 'border-cyan-400/50',
      colorDot: 'bg-cyan-400 shadow-cyan-400/50'
    },
    {
      key: 'equipment',
      name: 'Máquinas',
      fullName: '3. Refrigeração & Máquinas',
      amount: subtotalEquipment,
      pct: pctEquipment,
      colorBg: 'bg-emerald-400',
      colorText: 'text-emerald-300',
      colorBorder: 'border-emerald-400/50',
      colorDot: 'bg-emerald-400 shadow-emerald-400/50'
    },
    {
      key: 'legal',
      name: 'Tributos',
      fullName: '4. Tributos & Licenças',
      amount: subtotalLegal,
      pct: pctLegal,
      colorBg: 'bg-rose-400',
      colorText: 'text-rose-300',
      colorBorder: 'border-rose-400/50',
      colorDot: 'bg-rose-400 shadow-rose-400/50'
    },
    {
      key: 'custom',
      name: 'Extras',
      fullName: '5. Custos Extras / Personalizados',
      amount: subtotalCustom,
      pct: pctCustom,
      colorBg: 'bg-purple-400',
      colorText: 'text-purple-300',
      colorBorder: 'border-purple-400/50',
      colorDot: 'bg-purple-400 shadow-purple-400/50'
    }
  ];

  // Comparativo por Modalidade para o mesmo pote
  const paymentScenarios = [
    {
      name: 'Pix',
      rate: cardFeePix,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      name: 'Débito',
      rate: cardFeeDebit,
      color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
      badge: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      name: 'Crédito 1x',
      rate: cardFeeCreditSight,
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    {
      name: 'Parcelado',
      rate: cardFeeCreditInstallment,
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
      badge: 'bg-rose-500/20 text-rose-300'
    }
  ].map(s => {
    const feeVal = suggestedTubPrice * (s.rate / 100);
    const profit = suggestedTubPrice - taxValue - feeVal - totalCostWithOverhead;
    const marginPct =
      suggestedTubPrice > 0
        ? (profit / suggestedTubPrice) * 100
        : 0;
    return {
      ...s,
      feeVal,
      profit,
      marginPct
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Gestão Financeira & Engenharia de Preços</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Simulador de rateio fixo avançado para gelaterias, taxas de cartão/adquirentes (Pix/Débito/Crédito) e markup de venda.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
          title="Restaurar valores iniciais recomendados"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Custos Fixos Mensais com 4 Grupos Temáticos */}
        <div className="lg:col-span-6 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Custos Fixos Mensais</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              5 Grupos de Custo
            </span>
          </div>

          {/* 1. GRUPO: OCUPAÇÃO & UTILIDADES */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                1. Ocupação & Utilidades
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalOccupancy.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Aluguel do Espaço:</label>
                <input
                  type="number"
                  min="0"
                  value={rent || ''}
                  onChange={e => setRent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Energia Elétrica (Freezers 24h):</label>
                <input
                  type="number"
                  min="0"
                  value={electricity || ''}
                  onChange={e => setElectricity(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Água & Esgoto:</label>
                <input
                  type="number"
                  min="0"
                  value={water || ''}
                  onChange={e => setWater(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Internet & Telecom:</label>
                <input
                  type="number"
                  min="0"
                  value={telecom || ''}
                  onChange={e => setTelecom(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 2. GRUPO: PESSOAL & GESTÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                2. Pessoal & Gestão
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalPersonnel.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Folha da Equipe (CLT/Extra):</label>
                <input
                  type="number"
                  min="0"
                  value={payroll || ''}
                  onChange={e => setPayroll(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-cyan-300 font-bold block">Pró-Labore (Gelatiere):</label>
                  <span className="text-[9px] text-cyan-400 font-semibold bg-cyan-950/60 px-1 rounded">Dono</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={ownerSalary || ''}
                  onChange={e => setOwnerSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                  title="Salário mensal retirado pelo dono/mestre gelatiere"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Contabilidade & Honorários:</label>
                <input
                  type="number"
                  min="0"
                  value={accounting || ''}
                  onChange={e => setAccounting(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Software, PDV & Cardápio:</label>
                <input
                  type="number"
                  min="0"
                  value={software || ''}
                  onChange={e => setSoftware(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 3. GRUPO: REFRIGERAÇÃO, MÁQUINAS & SANITIZAÇÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-emerald-400" />
                3. Refrigeração, Máquinas & Sanitização
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalEquipment.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Manutenção preventiva de compressores, gás e filtros">
                  Manutenção Refrigeração:
                </label>
                <input
                  type="number"
                  min="0"
                  value={equipmentMaintenance || ''}
                  onChange={e => setEquipmentMaintenance(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Fundo mensal para substituição futura de mantecadora e pasteurizador">
                  Depreciação de Maquinário:
                </label>
                <input
                  type="number"
                  min="0"
                  value={equipmentDepreciation || ''}
                  onChange={e => setEquipmentDepreciation(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Químicos CIP, sanitizantes de pasteurizadora, álcool 70% e luvas">
                  Higiene & Sanitizantes CIP:
                </label>
                <input
                  type="number"
                  min="0"
                  value={cleaningHygiene || ''}
                  onChange={e => setCleaningHygiene(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Sacolas, guardanapos, colherinhas descartáveis">
                  Embalagens Secundárias:
                </label>
                <input
                  type="number"
                  min="0"
                  value={secPackaging || ''}
                  onChange={e => setSecPackaging(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 4. GRUPO: TRIBUTOS, LICENÇAS & PROTEÇÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                4. Tributos, Licenças & Proteção
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalLegal.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-amber-300 font-bold block mb-0.5">Impostos Fixos (DAS MEI):</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={fixedTaxes || ''}
                  onChange={e => setFixedTaxes(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Alvará, laudo dos bombeiros, dedetização trimestral rateada e RT">
                  Alvarás, Laudos & RT:
                </label>
                <input
                  type="number"
                  min="0"
                  value={licensesAndPermits || ''}
                  onChange={e => setLicensesAndPermits(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Seguro contra queima de compressores e perda de caldas congeladas">
                  Seguro / Perda de Estoque:
                </label>
                <input
                  type="number"
                  min="0"
                  value={commercialInsurance || ''}
                  onChange={e => setCommercialInsurance(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Marketing & Redes Sociais:</label>
                <input
                  type="number"
                  min="0"
                  value={marketing || ''}
                  onChange={e => setMarketing(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 text-[11px]">Aluguel Maquininha (R$/mês):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                  min="0"
                    step="10"
                    value={posRentalMonthly || ''}
                    onChange={e => setPosRentalMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white font-mono font-bold text-right"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setPosRentalMonthly(posRentalMonthly > 0 ? 0 : 99.9)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-semibold"
                  >
                    {posRentalMonthly > 0 ? 'Isento' : 'R$ 99,90'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. GRUPO: CUSTOS EXTRAS & PERSONALIZADOS */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                5. Custos Extras & Personalizados
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-300">
                  R$ {subtotalCustom.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddCustomCost()}
                  className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Cadastrar um novo custo fixo personalizado"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {customCosts.length === 0 ? (
              <div className="text-center py-2.5 px-3 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400">
                  Nenhum custo extra cadastrado. Adicione despesas específicas da sua operação (consultorias, financiamentos, segurança, etc.).
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Sugestões:</span>
                  {[
                    'Taxa de Resíduos Sólidos',
                    'Consultoria Sanitária / RT',
                    'Financiamento / Maquinário',
                    'Segurança & Alarme 24h',
                    'Lavanderia & Uniformes'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddCustomCost(sug)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition-all cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  {customCosts.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => handleUpdateCustomCost(item.id, 'name', e.target.value)}
                        placeholder="Nome do custo (ex: Segurança Noturna)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-medium focus:border-purple-400 focus:outline-none"
                      />
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={item.amount || ''}
                          onChange={e => handleUpdateCustomCost(item.id, 'amount', Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-700 rounded pl-6 pr-2 py-1 text-xs text-white font-mono font-bold text-right focus:border-purple-400 focus:outline-none"
                        />
                        <span className="absolute left-2 top-1 text-[10px] text-slate-500 pointer-events-none font-bold">R$</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomCost(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                        title="Remover custo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleAddCustomCost()}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar mais um custo</span>
                  </button>
                  <span className="text-slate-500 text-[10px]">
                    {customCosts.length} {customCosts.length === 1 ? 'item extra' : 'itens extras'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* NOVO CARD DASHBOARD: TOTAL CUSTOS FIXOS, PRODUÇÃO & RATEIO */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/40 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black text-white tracking-tight">
                  Resumo de Custos Fixos & Rateio Unitário
                </h4>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Estrutura de Rateio
              </span>
            </div>

            {/* Grid de 3 Indicadores Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Total Custos Fixos */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Custos Fixos:
                </span>
                <div>
                  <div className="text-lg sm:text-xl font-black text-white font-mono">
                    R$ {totalFixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Soma dos 5 grupos / mês
                  </span>
                </div>
              </div>

              {/* 2. Volume de Produção / Venda Mensal */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Produção / Venda:
                </label>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={monthlyUnits || ''}
                      onChange={e => setMonthlyUnits(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-lg p-1.5 text-base text-white font-mono font-bold pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      potes/mês
                    </span>
                  </div>

                  {/* Atalhos rápidos de volume */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {[250, 500, 1000, 2500, 5000].map(vol => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setMonthlyUnits(vol)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                          monthlyUnits === vol
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                        }`}
                      >
                        {vol >= 1000 ? `${vol / 1000}k` : vol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Rateio Fixo / Unidade */}
              <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-3 rounded-xl border border-amber-500/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  Rateio Fixo / Unidade:
                </span>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    R$ {overheadPerUnit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-amber-400/80 block mt-0.5">
                    Absorvido por cada pote
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Distribuição de Custos com Legenda de Cores */}
            {totalFixedCosts > 0 && (
              <div className="pt-2.5 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-amber-400" />
                    <span>Distribuição dos Custos Fixos (% do Total):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total: R$ {totalFixedCosts.toFixed(2)}
                  </span>
                </div>

                {/* Barra Segmentada de Cores */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-950 p-0.5 border border-slate-800 shadow-inner">
                  {costGroups.map(g =>
                    g.pct > 0 ? (
                      <div
                        key={g.key}
                        style={{ width: `${g.pct}%` }}
                        className={`${g.colorBg} h-full first:rounded-l-full last:rounded-r-full transition-all`}
                        title={`${g.fullName}: R$ ${g.amount.toFixed(2)} (${g.pct.toFixed(1)}%)`}
                      />
                    ) : null
                  )}
                </div>

                {/* Legenda de Cores com Indicadores Visuais Redondos */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {costGroups.map(g => (
                    <div
                      key={g.key}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                        g.amount > 0
                          ? `bg-slate-950/80 ${g.colorBorder} ${g.colorText}`
                          : 'bg-slate-950/30 border-slate-800/80 text-slate-500 opacity-40'
                      }`}
                      title={`${g.fullName}: R$ ${g.amount.toFixed(2)} (${g.pct.toFixed(1)}%)`}
                    >
                      <span className={`w-2 h-2 rounded-full ${g.colorDot} shrink-0`} />
                      <span>{g.name}:</span>
                      <span className="font-mono font-black">{g.pct.toFixed(0)}%</span>
                      {g.amount > 0 && (
                        <span className="font-mono text-slate-400 text-[9px] font-normal">
                          (R$ {g.amount.toFixed(0)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicador Detalhado de Ponto de Equilíbrio (Break-Even) */}
            {breakEvenUnits > 0 && (
              <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">⚖️</span>
                    <span className="font-bold text-white text-xs">
                      Ponto de Equilíbrio Operacional (Break-Even):
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {breakEvenUnits.toLocaleString('pt-BR')} potes/mês
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (R$ {breakEvenRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>

                {/* Explicação da Margem de Contribuição e Comparativo */}
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-slate-400">
                    <span>
                      Margem de Contribuição (MCU):{' '}
                      <strong className="text-amber-300 font-mono">
                        R$ {unitContributionMargin.toFixed(2)}/pote
                      </strong>{' '}
                      <span className="text-[10px]">
                        (Preço R$ {suggestedTubPrice.toFixed(2)} - Custos Diretos R$ {directCostPerTub.toFixed(2)} - Taxas R$ {(cardFeeValue + taxValue).toFixed(2)})
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      R$ {totalFixedCosts.toFixed(0)} fixos ÷ R$ {unitContributionMargin.toFixed(2)} margem
                    </span>
                  </div>

                  {targetMargin === 0 ? (
                    <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[10px] flex items-center gap-1.5">
                      <span>ℹ️</span>
                      <span>
                        Com <strong>margem de 0%</strong>, o preço cobre estritamente o custo com rateio. O equilíbrio é exatamente a sua meta de <strong>{monthlyUnits} potes</strong>.
                      </span>
                    </div>
                  ) : safetyMarginUnits > 0 ? (
                    <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-[10px] flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1">
                        <span>✓</span>
                        <span>
                          <strong>Margem de Segurança:</strong> +{safetyMarginUnits} potes ({Math.round((safetyMarginUnits / monthlyUnits) * 100)}% acima do equilíbrio).
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-400">
                        Lucro a partir do pote {breakEvenUnits + 1}!
                      </span>
                    </div>
                  ) : safetyMarginUnits === 0 ? (
                    <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-[10px] flex items-center gap-1.5">
                      <span>⚖️</span>
                      <span>
                        Sua produção planejada de <strong>{monthlyUnits} potes</strong> coincide exatamente com o ponto de equilíbrio operacional.
                      </span>
                    </div>
                  ) : (
                    <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[10px] flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>
                        <strong>Déficit de Produção:</strong> A meta de {monthlyUnits} potes está abaixo do necessário. Faltam {Math.abs(safetyMarginUnits)} potes para não ter prejuízo.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Markup, Terminals & Pricing */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white">Simulador de Formação de Preço</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Fórmula de Markup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Custo da Calda (R$/Kg):</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sampleCaldaCostKg || ''}
                  onChange={e => setSampleCaldaCostKg(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Peso do Pote (g):</label>
                <input
                  type="number"
                  min="0"
                  value={tubWeightGrams || ''}
                  onChange={e => setTubWeightGrams(parseFloat(e.target.value) || 500)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Embalagem Direta (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={tubPackCost || ''}
                  onChange={e => setTubPackCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Margem Desejada (%):</label>
                <input
                  type="number"
                  min="0"
                  value={targetMargin || ''}
                  onChange={e => setTargetMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-black text-amber-300"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* MÓDULO MAQUININHA / MEIOS DE PAGAMENTO */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      Maquininha & Taxas de Pagamento
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Configure as taxas reais da sua maquininha e o mix do balcão
                    </span>
                  </div>
                </div>

                {/* Alternância de Modo (Ponderado vs Manual) */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setUseSalesMix(true)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      useSalesMix
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mix Ponderado
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSalesMix(false)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      !useSalesMix
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Taxa Manual
                  </button>
                </div>
              </div>

              {useSalesMix ? (
                <div className="space-y-3 pt-1">
                  {/* Botões de Presets de Maquininha (visíveis apenas no modo Mix Ponderado) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Planos / Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => applyCieloPreset('padrao')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        cieloPlan === 'padrao'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                      title={CIELO_PRESETS.padrao.description}
                    >
                      ⭐ D+1 Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCieloPreset('negociado')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        cieloPlan === 'negociado'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                      title={CIELO_PRESETS.negociado.description}
                    >
                      💼 Negociado (&gt;15k)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCieloPreset('fluxo')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        cieloPlan === 'fluxo'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                      title={CIELO_PRESETS.fluxo.description}
                    >
                      ⏱️ D+30 (No Fluxo)
                    </button>
                  </div>
                  {/* Grid das 4 modalidades de pagamento */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* 1. Pix */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-400">Pix</span>
                        <span className="text-[10px] text-slate-400">Imediato</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={cardFeePix !== undefined && cardFeePix !== null ? cardFeePix : ''}
                          placeholder="0.00"
                          onChange={e => {
                            setCardFeePix(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mixPix !== undefined && mixPix !== null ? mixPix : ''}
                          placeholder="0"
                          onChange={e => setMixPix(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-full bg-slate-900 border rounded p-1 text-sm font-mono font-bold text-emerald-300 transition-colors ${
                            totalMixSum > 100 ? 'border-rose-500/80 bg-rose-950/20 text-rose-300' : 'border-slate-700'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 2. Débito */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-400">Débito</span>
                        <span className="text-[10px] text-slate-400">D+1</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={cardFeeDebit !== undefined && cardFeeDebit !== null ? cardFeeDebit : ''}
                          placeholder="0.00"
                          onChange={e => {
                            setCardFeeDebit(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mixDebit !== undefined && mixDebit !== null ? mixDebit : ''}
                          placeholder="0"
                          onChange={e => setMixDebit(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-full bg-slate-900 border rounded p-1 text-sm font-mono font-bold text-cyan-300 transition-colors ${
                            totalMixSum > 100 ? 'border-rose-500/80 bg-rose-950/20 text-rose-300' : 'border-slate-700'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. Crédito à Vista */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-400">Crédito 1x</span>
                        <span className="text-[10px] text-slate-400">À Vista</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={cardFeeCreditSight !== undefined && cardFeeCreditSight !== null ? cardFeeCreditSight : ''}
                          placeholder="0.00"
                          onChange={e => {
                            setCardFeeCreditSight(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mixCreditSight !== undefined && mixCreditSight !== null ? mixCreditSight : ''}
                          placeholder="0"
                          onChange={e => setMixCreditSight(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-full bg-slate-900 border rounded p-1 text-sm font-mono font-bold text-amber-300 transition-colors ${
                            totalMixSum > 100 ? 'border-rose-500/80 bg-rose-950/20 text-rose-300' : 'border-slate-700'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 4. Crédito Parcelado */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-400">Parcelado</span>
                        <span className="text-[10px] text-slate-400">2x-6x</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={cardFeeCreditInstallment !== undefined && cardFeeCreditInstallment !== null ? cardFeeCreditInstallment : ''}
                          placeholder="0.00"
                          onChange={e => {
                            setCardFeeCreditInstallment(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mixCreditInstallment !== undefined && mixCreditInstallment !== null ? mixCreditInstallment : ''}
                          placeholder="0"
                          onChange={e => setMixCreditInstallment(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-full bg-slate-900 border rounded p-1 text-sm font-mono font-bold text-rose-300 transition-colors ${
                            totalMixSum > 100 ? 'border-rose-500/80 bg-rose-950/20 text-rose-300' : 'border-slate-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aviso de Segurança de Excesso de 100% */}
                  {totalMixSum > 100 && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-300">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold text-rose-200">Aviso de Segurança: Composição das vendas em {totalMixSum}%</span>
                          <span className="block text-[11px] text-rose-300/85 mt-0.5">
                            A soma dos canais de venda não pode ultrapassar 100% (excesso de +{totalMixSum - 100}%).
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleNormalizeMix}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-lg text-xs whitespace-nowrap transition-all shadow-md active:scale-95 self-start sm:self-auto shrink-0"
                      >
                        Ajustar para 100%
                      </button>
                    </div>
                  )}

                  {/* Aviso de Composição Incompleta */}
                  {totalMixSum < 100 && totalMixSum > 0 && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">ℹ️</span>
                        <span>
                          Composição atual soma <strong>{totalMixSum}%</strong> (faltam <strong>{100 - totalMixSum}%</strong> para completar 100%).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleNormalizeMix}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-all active:scale-95 self-start sm:self-auto shrink-0"
                      >
                        Completar para 100%
                      </button>
                    </div>
                  )}

                  {/* Barra Visual do Mix de Vendas */}
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-medium gap-1">
                      <span className="flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400">Composição das Vendas:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            totalMixSum === 100
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : totalMixSum > 100
                              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {totalMixSum === 100
                            ? '100% ✓ Equilibrado'
                            : totalMixSum > 100
                            ? `${totalMixSum}% ⚠️ Excesso de +${totalMixSum - 100}%`
                            : `${totalMixSum}% (Faltam ${100 - totalMixSum}%)`}
                        </span>
                      </span>
                      <span className="text-white font-mono font-bold text-[11px]">
                        Pix {mixPix}% | Déb {mixDebit}% | Créd {mixCreditSight}% | Parc {mixCreditInstallment}%
                      </span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full bg-slate-950 flex overflow-hidden border transition-colors ${
                      totalMixSum > 100 ? 'border-rose-500 ring-1 ring-rose-500/40' : 'border-slate-800'
                    }`}>
                      <div
                        style={{ width: `${totalMixSum > 0 ? (mixPix / Math.max(100, totalMixSum)) * 100 : 0}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Pix: ${mixPix}%`}
                      />
                      <div
                        style={{ width: `${totalMixSum > 0 ? (mixDebit / Math.max(100, totalMixSum)) * 100 : 0}%` }}
                        className="bg-cyan-500 h-full transition-all"
                        title={`Débito: ${mixDebit}%`}
                      />
                      <div
                        style={{ width: `${totalMixSum > 0 ? (mixCreditSight / Math.max(100, totalMixSum)) * 100 : 0}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Crédito: ${mixCreditSight}%`}
                      />
                      <div
                        style={{ width: `${totalMixSum > 0 ? (mixCreditInstallment / Math.max(100, totalMixSum)) * 100 : 0}%` }}
                        className="bg-rose-500 h-full transition-all"
                        title={`Parcelado: ${mixCreditInstallment}%`}
                      />
                    </div>
                  </div>

                  {/* Destaque da Taxa Média Efetiva */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    totalMixSum > 100
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : totalMixSum === 100
                      ? 'bg-emerald-950/40 border-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-750'
                  }`}>
                    <div>
                      <span className={`text-xs font-bold block ${
                        totalMixSum > 100 ? 'text-rose-300' : 'text-emerald-300'
                      }`}>
                        Taxa Média Efetiva da Maquininha:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {totalMixSum > 100
                          ? `⚠️ Ponderada com base normalizada (Aviso: soma atual em ${totalMixSum}% precisa de ajuste)`
                          : 'Ponderada pelo seu volume real de Pix, Débito e Crédito'}
                      </span>
                    </div>
                    <span className={`text-lg font-black font-mono ${
                      totalMixSum > 100 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {effectiveCardFee.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : (
                /* Modo Taxa Manual Única */
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <label className="text-white font-bold block text-xs">Taxa Única Fixa de Venda (%):</label>
                    <span className="text-[11px] text-slate-400">Informe uma taxa média única para todas as vendas.</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                  min="0"
                      step="0.1"
                      value={cardFeeManual || ''}
                      onChange={e => setCardFeeManual(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 bg-slate-950 border border-amber-500/60 rounded-lg p-1.5 text-sm font-mono font-bold text-amber-300 text-right pr-6"
                      placeholder="0.00"
                    />
                    <span className="absolute right-2 top-2 text-slate-500 font-bold text-xs">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Impostos sobre a Venda */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-white font-bold block text-xs sm:text-sm flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                    <span>Impostos sobre Venda (% do Faturamento):</span>
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    Alíquota do Simples Nacional ou regime tributário (se MEI, use 0%).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="90"
                      value={salesTaxPercent || ''}
                      onChange={e => setSalesTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 bg-slate-950 border-2 border-cyan-500/60 focus:border-cyan-400 focus:outline-none rounded-lg pl-3 pr-6 py-1.5 text-sm text-cyan-300 font-mono font-black text-right"
                      placeholder="0.00"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-500 font-bold text-xs pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              {/* Botões de Atalhos Rápidos Impostos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos:</span>
                {[
                  { label: 'MEI (0%)', val: 0 },
                  { label: 'Simples Comércio 4.0%', val: 4.0 },
                  { label: 'Simples Indústria 4.5%', val: 4.5 },
                  { label: 'Simples Faixa 2 (6.8%)', val: 6.8 },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSalesTaxPercent(p.val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      salesTaxPercent === p.val
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Demonstrativo de Custos do Pote */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Custo do Gelato ({tubWeightGrams}g):</span>
                <span className="font-mono font-bold">R$ {productCostInTub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Custo Direto (Gelato + Embalagem):</span>
                <span className="font-mono font-bold">R$ {directCostPerTub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Custo Fixo Rateado (17 categorias):</span>
                <span className="font-mono font-bold">R$ {overheadPerUnit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-white pt-2 border-t border-slate-800 text-base">
                <span>Custo Total do Pote com Rateio:</span>
                <span className="font-mono text-amber-300">R$ {totalCostWithOverhead.toFixed(2)}</span>
              </div>
            </div>

            {/* Preço de Venda Sugerido */}
            <div className="pricing-card-highlight p-4 sm:p-5 bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/50 rounded-xl space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Preço de Venda Sugerido (Pote {tubWeightGrams}g):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">
                    Taxa Efetiva: {activeFeePercent.toFixed(2)}%
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40">
                    Imposto: {salesTaxPercent}%
                  </span>
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                R$ {suggestedTubPrice.toFixed(2)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 pt-2.5 border-t border-emerald-900/60 font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px]">Taxa Média Maquininha:</span>
                  <strong className="font-mono text-slate-200">R$ {cardFeeValue.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Imposto s/ Venda:</span>
                  <strong className="font-mono text-cyan-300">R$ {taxValue.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Lucro Líquido Real:</span>
                  <strong className="font-mono text-emerald-300 font-black">R$ {netProfit.toFixed(2)}</strong>
                </div>
              </div>

              {/* Bloco de Ponto de Equilíbrio Integrado ao Preço */}
              {breakEvenUnits > 0 && (
                <div className="pt-2.5 border-t border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span>⚖️</span>
                    <span>Ponto de Equilíbrio Operacional:</span>
                    <strong className="text-emerald-300 font-mono font-black text-xs">
                      {breakEvenUnits} potes/mês
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (R$ {breakEvenRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Margem Contribuição: <span className="text-amber-300 font-bold">R$ {unitContributionMargin.toFixed(2)}/pote</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MATRIZ COMPARATIVA DE LUCRO POR MEIO DE PAGAMENTO */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Comparativo de Lucro por Meio de Pagamento
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Para o Pote a R$ {suggestedTubPrice.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Veja quanto sobra líquido no caixa conforme a forma como o cliente paga o mesmo gelato:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {paymentScenarios.map(s => (
                <div key={s.name} className={`p-3 rounded-xl border ${s.color} space-y-1.5 flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-white text-xs">{s.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.badge}`}>
                        {s.rate}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Taxa: <strong className="font-mono text-slate-200">R$ {s.feeVal.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lucro no Caixa:</span>
                    <span className="text-base font-black font-mono text-white block">
                      R$ {s.profit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      Margem: {s.marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <strong className="text-amber-300 block mb-0.5">Estratégia de Desconto no Pix:</strong>
                Ao vender no Pix você economiza{' '}
                <strong className="text-emerald-300 font-mono">
                  R$ {(paymentScenarios[2].feeVal - paymentScenarios[0].feeVal).toFixed(2)}
                </strong>{' '}
                por pote em comparação com o cartão de crédito 1x. Você pode conceder esse valor como desconto à vista sem reduzir seu lucro planejado!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
