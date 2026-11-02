import React, { useState, useMemo, useEffect } from 'react';
import { StockItem, PaymentMethodType, SaleTransaction } from '../../types/stock';
import { PricingParams } from '../../core/pricingStorage';
import { recordSale, voidSaleTransaction, getPaymentMethodFeeRate } from '../../core/stockService';
import { db } from '../../db/database';
import {
  ShoppingCart,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  TrendingUp,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Search,
  History,
  Trash2
} from 'lucide-react';

interface PosSalesScreenProps {
  stockItems: StockItem[];
  pricingParams: PricingParams;
  onSaleCompleted: () => void;
  preSelectedStockItem?: StockItem | null;
  onClearPreSelected?: () => void;
}

export const PosSalesScreen: React.FC<PosSalesScreenProps> = ({
  stockItems,
  pricingParams,
  onSaleCompleted,
  preSelectedStockItem,
  onClearPreSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>(
    preSelectedStockItem?.id || (stockItems[0]?.id ?? '')
  );

  useEffect(() => {
    if (preSelectedStockItem) {
      setSelectedStockItemId(preSelectedStockItem.id);
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedStockItem]);

  const selectedStockItem = useMemo(() => {
    return stockItems.find(i => i.id === selectedStockItemId) || stockItems[0];
  }, [stockItems, selectedStockItemId]);

  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todaySales, setTodaySales] = useState<SaleTransaction[]>([]);

  // Atualizar preço padrão ao trocar de item
  useEffect(() => {
    if (selectedStockItem) {
      setCustomPrice(selectedStockItem.suggestedPrice > 0 ? selectedStockItem.suggestedPrice.toFixed(2) : '20.00');
    }
  }, [selectedStockItem]);

  // Carregar histórico de vendas de hoje
  const loadTodaySales = async () => {
    try {
      const sales = await db.salesTransactions.toArray();
      const todayStr = new Date().toISOString().slice(0, 10);
      const filtered = sales.filter(s => s.timestamp.startsWith(todayStr));
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTodaySales(filtered);
    } catch (e) {
      console.warn('Erro ao carregar vendas do dia:', e);
    }
  };

  useEffect(() => {
    loadTodaySales();
  }, []);

  // Filtro de sabores para a grade de seleção rápida
  const availableItems = useMemo(() => {
    return stockItems.filter(i => {
      const match = i.recipeName.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return match;
    });
  }, [stockItems, searchTerm]);

  // Cálculos financeiros em tempo real para a venda em tela
  const unitPrice = parseFloat(customPrice) || 0;
  const grossRevenue = unitPrice * quantity;
  const cardFeeRate = getPaymentMethodFeeRate(paymentMethod, pricingParams);
  const cardFeeAmount = grossRevenue * (cardFeeRate / 100);

  const salesTaxRate = pricingParams.salesTaxPercent || 0;
  const salesTaxAmount = grossRevenue * (salesTaxRate / 100);

  const netRevenue = grossRevenue - cardFeeAmount - salesTaxAmount;
  const unitCost = selectedStockItem?.avgCostUnit || 0;
  const totalCostSold = unitCost * quantity;
  const netProfit = netRevenue - totalCostSold;
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  // Totais do dia acumulados
  const todayTotals = useMemo(() => {
    let gross = 0;
    let profit = 0;
    let units = 0;
    for (const s of todaySales) {
      gross += s.grossRevenue;
      profit += s.netProfit;
      units += s.unitsSold;
    }
    return { gross, profit, units };
  }, [todaySales]);

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem || quantity <= 0 || unitPrice <= 0) return;

    if (selectedStockItem.currentUnits < quantity) {
      const confirmNegative = window.confirm(
        `Atenção: O estoque atual deste sabor é de ${selectedStockItem.currentUnits} potes. Deseja confirmar a venda de ${quantity} potes mesmo assim (o saldo ficará negativo até a próxima produção)?`
      );
      if (!confirmNegative) return;
    }

    setIsSubmitting(true);
    try {
      await recordSale({
        stockItem: selectedStockItem,
        unitsSold: quantity,
        unitPrice,
        paymentMethod,
        pricingParams,
        notes: notes.trim() || undefined
      });

      setQuantity(1);
      setNotes('');
      await loadTodaySales();
      onSaleCompleted();
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
      alert('Falha ao registrar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidSale = async (saleId: string) => {
    const confirmVoid = window.confirm('Deseja estornar esta venda? Os potes vendidos serão devolvidos ao estoque.');
    if (!confirmVoid) return;

    try {
      await voidSaleTransaction(saleId);
      await loadTodaySales();
      onSaleCompleted();
    } catch (err) {
      console.error('Erro ao estornar venda:', err);
      alert('Falha ao estornar venda.');
    }
  };

  const paymentOptions: { id: PaymentMethodType; label: string; icon: any; fee: number; color: string }[] = [
    { id: 'pix', label: 'Pix', icon: QrCode, fee: pricingParams.cardFeePix ?? 0, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { id: 'debit', label: 'Débito', icon: CreditCard, fee: pricingParams.cardFeeDebit ?? 1.49, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    { id: 'credit_sight', label: 'Crédito 1x', icon: CreditCard, fee: pricingParams.cardFeeCreditSight ?? 3.50, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { id: 'credit_installment', label: 'Parcelado', icon: CreditCard, fee: pricingParams.cardFeeCreditInstallment ?? 6.90, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    { id: 'cash', label: 'Dinheiro', icon: Banknote, fee: 0, color: 'text-green-400 border-green-500/40 bg-green-500/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Barra de Totais do Dia */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <div>
            <h3 className="text-sm font-bold text-white">Frente de Caixa (PDV Balcão)</h3>
            <span className="text-slate-400 text-[11px]">Vendas e baixas imediatas do estoque congelado</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Potes Vendidos Hoje:</span>
            <strong className="text-sm text-white font-mono">{todayTotals.units} potes</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Faturamento Hoje:</span>
            <strong className="text-sm text-cyan-300 font-mono">
              R$ {todayTotals.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-emerald-400 block font-bold">Lucro Líquido Hoje:</span>
            <strong className="text-sm text-emerald-400 font-mono font-black">
              R$ {todayTotals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Catálogo de Potes Rápidos */}
        <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Selecione o Sabor para a Venda</span>
            </h4>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar sabor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {availableItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhum sabor cadastrado no estoque. Registre uma produção primeiro!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {availableItems.map(item => {
                const isSelected = selectedStockItemId === item.id;
                const isOut = item.currentUnits <= 0;
                const isLow = item.currentUnits > 0 && item.currentUnits <= (item.minStockAlert || 3);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedStockItemId(item.id);
                      setCustomPrice(item.suggestedPrice.toFixed(2));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
                        : 'bg-slate-900/90 border-slate-700/70 hover:border-slate-600 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                          {item.tubWeightGrams}g
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isOut ? 'text-rose-400 bg-rose-500/20' : isLow ? 'text-amber-400 bg-amber-500/20' : 'text-emerald-400 bg-emerald-500/20'
                        }`}>
                          {item.currentUnits} potes
                        </span>
                      </div>
                      <span className="font-bold text-white text-xs block leading-tight line-clamp-2">
                        {item.recipeName}
                      </span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Preço Sug.:</span>
                      <strong className="text-xs font-mono text-emerald-400 font-bold">
                        R$ {item.suggestedPrice.toFixed(2)}
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Lado Direito: Checkout do Balcão */}
        <div className="lg:col-span-5 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Checkout da Venda</span>
            </h4>
            <span className="text-xs text-slate-400">
              Confirme quantidade, preço e meio de pagamento
            </span>
          </div>

          {selectedStockItem ? (
            <form onSubmit={handleConfirmSale} className="space-y-4 text-xs">
              {/* Item Selecionado */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Sabor Escolhido:</span>
                <strong className="text-sm text-amber-300 block font-bold">
                  {selectedStockItem.recipeName}
                </strong>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-850">
                  <span>Pote: {selectedStockItem.tubWeightGrams}g</span>
                  <span>Estoque no Freezer: <strong className="text-white">{selectedStockItem.currentUnits} un</strong></span>
                </div>
              </div>

              {/* Quantidade e Preço Unitário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Quantidade de Potes:</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-black transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-center text-sm font-mono font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-black transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço Unitário (R$):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-lg p-2 text-sm font-mono font-black text-emerald-400"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Meios de Pagamento */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Forma de Pagamento:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${opt.color} ring-2 ring-current font-black shadow-md`
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-0.5" />
                        <span className="block text-[11px] font-bold">{opt.label}</span>
                        <span className="text-[10px] opacity-75 font-mono block">
                          {opt.fee > 0 ? `-${opt.fee}%` : 'Sem taxa'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalhamento do Lucro Líquido Real em Tempo Real */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Valor Bruto a Cobrar:</span>
                  <strong className="text-white font-mono text-sm">
                    R$ {grossRevenue.toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Taxa da Maquininha ({cardFeeRate}%):</span>
                  <span className="font-mono text-rose-300">-R$ {cardFeeAmount.toFixed(2)}</span>
                </div>
                {salesTaxRate > 0 && (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Impostos ({salesTaxRate}%):</span>
                    <span className="font-mono text-cyan-300">-R$ {salesTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Custo dos Potes (CMV):</span>
                  <span className="font-mono text-slate-300">-R$ {totalCostSold.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-emerald-400 block text-xs">
                      Lucro Líquido Real no Caixa:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Margem líquida de <strong>{marginPercent.toFixed(1)}%</strong>
                    </span>
                  </div>
                  <strong className="text-lg font-black font-mono text-emerald-400">
                    R$ {netProfit.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Botão de Finalizar Venda */}
              <button
                type="submit"
                disabled={isSubmitting || unitPrice <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 text-slate-950" />
                <span>Confirmar Venda & Baixar Estoque</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Selecione um sabor ao lado para iniciar a venda.
            </div>
          )}
        </div>
      </div>

      {/* Histórico das Vendas de Hoje */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Vendas Realizadas Hoje</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {todaySales.length} transações
          </span>
        </div>

        {todaySales.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Nenhuma venda registrada hoje ainda. Lance sua primeira venda no PDV acima!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Sabor</th>
                  <th className="py-2.5 px-3">Formato</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3">Pagamento</th>
                  <th className="py-2.5 px-3 text-right">Valor Bruto</th>
                  <th className="py-2.5 px-3 text-right">Taxa Cartão</th>
                  <th className="py-2.5 px-3 text-right">Lucro Real</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {todaySales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-750 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(s.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {s.recipeName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                        {s.tubWeightGrams}g
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                      {s.unitsSold}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-750 text-slate-300 uppercase">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      R$ {s.grossRevenue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 text-[11px]">
                      -R$ {s.cardFeeAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      R$ {s.netProfit.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleVoidSale(s.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Estornar venda e devolver pote ao estoque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
