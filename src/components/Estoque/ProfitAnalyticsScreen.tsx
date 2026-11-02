import React, { useState, useMemo, useEffect } from 'react';
import { SaleTransaction } from '../../types/stock';
import { PricingParams } from '../../core/pricingStorage';
import { calculateSalesDRE } from '../../core/stockService';
import { db } from '../../db/database';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Sparkles,
  Scale,
  Award,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface ProfitAnalyticsScreenProps {
  pricingParams: PricingParams;
}

type PeriodType = 'today' | '7days' | 'month' | 'all';

export const ProfitAnalyticsScreen: React.FC<ProfitAnalyticsScreenProps> = ({ pricingParams }) => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const allSales = await db.salesTransactions.toArray();
      setSales(allSales);
    } catch (e) {
      console.warn('Erro ao carregar vendas para DRE:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Filtragem de vendas conforme o período selecionado
  const { filteredSales, daysInPeriod } = useMemo(() => {
    const now = new Date();
    let days = 30;
    let cutoff = new Date(0);

    if (period === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      days = 1;
    } else if (period === '7days') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      days = 7;
    } else if (period === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      days = 30;
    } else {
      days = 90; // All time
    }

    const filtered = sales.filter(s => new Date(s.timestamp) >= cutoff);
    return { filteredSales: filtered, daysInPeriod: days };
  }, [sales, period]);

  // Cálculo do DRE
  const dre = useMemo(() => {
    return calculateSalesDRE(filteredSales, pricingParams, daysInPeriod);
  }, [filteredSales, pricingParams, daysInPeriod]);

  // Ranking Curva ABC de Sabores
  const flavorStats = useMemo(() => {
    const map = new Map<string, {
      recipeName: string;
      category: string;
      unitsSold: number;
      grossRevenue: number;
      netProfit: number;
    }>();

    for (const s of filteredSales) {
      const existing = map.get(s.recipeName) || {
        recipeName: s.recipeName,
        category: s.category || 'Gelatos',
        unitsSold: 0,
        grossRevenue: 0,
        netProfit: 0
      };
      existing.unitsSold += s.unitsSold;
      existing.grossRevenue += s.grossRevenue;
      existing.netProfit += s.netProfit;
      map.set(s.recipeName, existing);
    }

    const list = Array.from(map.values());
    // Ordenado por lucro líquido
    const byProfit = [...list].sort((a, b) => b.netProfit - a.netProfit);
    // Ordenado por volume
    const byVolume = [...list].sort((a, b) => b.unitsSold - a.unitsSold);

    return { byProfit, byVolume };
  }, [filteredSales]);

  // Mix de Pagamento Realizado
  const paymentMix = useMemo(() => {
    const mix = {
      pix: 0,
      debit: 0,
      credit_sight: 0,
      credit_installment: 0,
      cash: 0
    };
    let total = 0;
    for (const s of filteredSales) {
      if (mix[s.paymentMethod] !== undefined) {
        mix[s.paymentMethod] += s.grossRevenue;
        total += s.grossRevenue;
      }
    }
    return {
      pixPct: total > 0 ? (mix.pix / total) * 100 : 0,
      debitPct: total > 0 ? (mix.debit / total) * 100 : 0,
      creditSightPct: total > 0 ? (mix.credit_sight / total) * 100 : 0,
      creditInstallmentPct: total > 0 ? (mix.credit_installment / total) * 100 : 0,
      cashPct: total > 0 ? (mix.cash / total) * 100 : 0,
      total
    };
  }, [filteredSales]);

  // Ponto de Equilíbrio (Break-Even)
  // Puxar a meta de potes da aba de precificação
  const monthlyBreakEvenTarget = useMemo(() => {
    // Estimativa proporcional para o período
    const target = pricingParams.monthlyUnits || 4000;
    return period === 'month' ? target : Math.round(target * (daysInPeriod / 30));
  }, [pricingParams.monthlyUnits, period, daysInPeriod]);

  const breakEvenProgressPct = monthlyBreakEvenTarget > 0
    ? Math.min(100, Math.round((dre.unitsSoldTotal / monthlyBreakEvenTarget) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Período */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Demonstrativo de Resultados & Lucro Real</h3>
            <span className="text-slate-400 text-[11px]">
              DRE gerencial confrontando vendas reais com custos de produção e rateio fixo
            </span>
          </div>
        </div>

        {/* Botões de Período */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7days', label: '7 Dias' },
            { id: 'month', label: 'Este Mês' },
            { id: 'all', label: 'Histórico Total' },
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as PeriodType)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: DRE Estruturado & Ponto de Equilíbrio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DRE Operacional da Gelateria */}
        <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>DRE da Operação de Gelatos</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {dre.unitsSoldTotal} potes vendidos
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Faturamento Bruto */}
            <div className="flex justify-between items-center text-slate-200 py-1">
              <span className="font-bold flex items-center gap-1.5">
                <span className="text-emerald-400 font-black">(+)</span>
                <span>Faturamento Bruto de Vendas:</span>
              </span>
              <strong className="text-base font-black font-mono text-white">
                R$ {dre.grossRevenue.toFixed(2)}
              </strong>
            </div>

            {/* 2. Deduções (Cartão + Impostos) */}
            <div className="flex justify-between items-center text-slate-400 pl-4 border-l-2 border-rose-500/40">
              <span>(-) Taxas de Meios de Pagamento (Pix/Cartão):</span>
              <span className="font-mono text-rose-300">-R$ {dre.cardFeesTotal.toFixed(2)}</span>
            </div>

            {dre.salesTaxTotal > 0 && (
              <div className="flex justify-between items-center text-slate-400 pl-4 border-l-2 border-cyan-500/40">
                <span>(-) Impostos sobre Venda (Simples/DAS):</span>
                <span className="font-mono text-cyan-300">-R$ {dre.salesTaxTotal.toFixed(2)}</span>
              </div>
            )}

            {/* 3. Receita Líquida */}
            <div className="flex justify-between items-center text-slate-300 py-1.5 px-3 bg-slate-900 rounded-lg border border-slate-800 font-bold">
              <span>(=) Receita Líquida Operacional:</span>
              <span className="font-mono text-white">R$ {dre.netRevenue.toFixed(2)}</span>
            </div>

            {/* 4. CMV (Custo dos Produtos Vendidos) */}
            <div className="flex justify-between items-center text-slate-400 pl-4 border-l-2 border-amber-500/40">
              <div>
                <span className="block font-semibold">(-) CMV (Gelato + Embalagens dos Potes):</span>
                <span className="text-[10px] text-slate-500">Custo direto da calda balanceada e potes</span>
              </div>
              <span className="font-mono text-amber-300 font-bold">-R$ {dre.cmvTotal.toFixed(2)}</span>
            </div>

            {/* 5. Margem de Contribuição */}
            <div className="flex justify-between items-center text-slate-200 py-1.5 px-3 bg-slate-900/90 rounded-lg border border-slate-750 font-bold">
              <div>
                <span>(=) Margem de Contribuição Bruta:</span>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Sobra para pagar os custos fixos
                </span>
              </div>
              <span className="font-mono text-amber-300 font-bold">R$ {dre.grossContributionMargin.toFixed(2)}</span>
            </div>

            {/* 6. Custos Fixos Rateados do Período */}
            <div className="flex justify-between items-center text-slate-400 pl-4 border-l-2 border-slate-600">
              <div>
                <span className="block font-semibold">(-) Custos Fixos Operacionais Rateados:</span>
                <span className="text-[10px] text-slate-500">Aluguel, energia, salários, manutenção da câmara</span>
              </div>
              <span className="font-mono text-slate-300">-R$ {dre.fixedCostsPeriod.toFixed(2)}</span>
            </div>

            {/* 7. Lucro Líquido Real */}
            <div className={`p-4 rounded-xl border flex items-center justify-between mt-3 ${
              dre.operatingNetProfit >= 0
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-rose-950/40 border-rose-500/50'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  (=) Lucro Líquido Real da Operação:
                </span>
                <span className={`text-[11px] font-bold ${
                  dre.operatingNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  Margem Líquida Real: {dre.profitMarginPercent.toFixed(1)}% do faturamento
                </span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black font-mono ${
                  dre.operatingNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  R$ {dre.operatingNetProfit.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  saldo líquido em caixa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Termômetro do Ponto de Equilíbrio & Mix de Vendas */}
        <div className="lg:col-span-5 space-y-4">
          {/* Termômetro de Break-Even */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Ponto de Equilíbrio no Período</span>
              </h4>
              <span className="text-xs font-mono font-bold text-amber-300">
                {breakEvenProgressPct}% da meta
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Meta estimada com base na aba de Precificação para cobrir 100% dos custos fixos da gelateria:
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-emerald-400">{dre.unitsSoldTotal} potes vendidos</span>
                <span className="text-slate-400">Meta: {monthlyBreakEvenTarget} potes</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${breakEvenProgressPct}%` }}
                  className={`h-full transition-all duration-500 ${
                    breakEvenProgressPct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  }`}
                />
              </div>
              <span className="text-[11px] text-slate-400 block pt-0.5">
                {breakEvenProgressPct >= 100 ? (
                  <strong className="text-emerald-400">✓ Ponto de equilíbrio atingido! Vendas adicionais geram lucro puro.</strong>
                ) : (
                  <span>Faltam <strong>{Math.max(0, monthlyBreakEvenTarget - dre.unitsSoldTotal)} potes</strong> para zerar custos fixos.</span>
                )}
              </span>
            </div>
          </div>

          {/* Distribuição por Meio de Pagamento */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <span>Composição dos Pagamentos</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                R$ {paymentMix.total.toFixed(0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Pix', pct: paymentMix.pixPct, color: 'bg-emerald-500' },
                { label: 'Débito', pct: paymentMix.debitPct, color: 'bg-cyan-500' },
                { label: 'Crédito 1x', pct: paymentMix.creditSightPct, color: 'bg-amber-500' },
                { label: 'Parcelado', pct: paymentMix.creditInstallmentPct, color: 'bg-rose-500' },
                { label: 'Dinheiro', pct: paymentMix.cashPct, color: 'bg-green-400' },
              ].filter(p => p.pct > 0).map(p => (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold">{p.label}:</span>
                    <strong className="text-white font-mono">{p.pct.toFixed(1)}%</strong>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div style={{ width: `${p.pct}%` }} className={`h-full ${p.color}`} />
                  </div>
                </div>
              ))}

              {paymentMix.total === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">
                  Sem vendas registradas neste período.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ranking Curva ABC de Sabores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mais Vendidos em Volume */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Sabores Mais Vendidos (Volume)</span>
            </h4>
            <span className="text-xs text-slate-400">Potes</span>
          </div>

          {flavorStats.byVolume.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Nenhuma venda registrada no período.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {flavorStats.byVolume.slice(0, 5).map((item, idx) => (
                <div key={item.recipeName} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold font-mono text-[11px] text-amber-300">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-white block">{item.recipeName}</strong>
                      <span className="text-[10px] text-slate-500">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-amber-300 font-mono text-sm block">
                      {item.unitsSold} potes
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">
                      R$ {item.grossRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mais Lucrativos em Reais */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Top Sabores Mais Lucrativos (R$ Líquido)</span>
            </h4>
            <span className="text-xs text-slate-400">Rentabilidade</span>
          </div>

          {flavorStats.byProfit.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Nenhuma venda registrada no período.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {flavorStats.byProfit.slice(0, 5).map((item, idx) => (
                <div key={item.recipeName} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold font-mono text-[11px] text-emerald-400">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-white block">{item.recipeName}</strong>
                      <span className="text-[10px] text-slate-500">{item.unitsSold} potes vendidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-emerald-400 font-mono text-sm block">
                      R$ {item.netProfit.toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      lucro limpo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
