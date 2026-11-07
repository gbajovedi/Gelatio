import { db } from '../db/database';
import {
  ProductionBatch,
  StockItem,
  SaleTransaction,
  StockAdjustment,
  PaymentMethodType,
  StockKPIs,
  SalesDRESummary,
  AdjustmentType
} from '../types/stock';
import { Recipe, PricingSettings } from '../types/gelato';
import { PricingParams, calculateEffectiveCardFee, calculateTotalFixedCosts } from './pricingStorage';

export const STOCK_UPDATED_EVENT = 'gelato-stock-updated';

export function dispatchStockUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STOCK_UPDATED_EVENT));
  }
}

/**
 * Retorna a taxa real de maquininha (%) conforme o meio de pagamento selecionado
 */
export function getPaymentMethodFeeRate(method: PaymentMethodType, params: PricingParams): number {
  switch (method) {
    case 'pix':
      return params.cardFeePix ?? 0;
    case 'debit':
      return params.cardFeeDebit ?? 1.49;
    case 'credit_sight':
      return params.cardFeeCreditSight ?? 3.50;
    case 'credit_installment':
      return params.cardFeeCreditInstallment ?? 6.90;
    case 'cash':
    default:
      return 0;
  }
}

/**
 * Calcula o custo unitário e total de um lote de produção
 */
export function calculateBatchCosts(
  recipeCostKg: number,
  tubWeightGrams: number,
  unitsProduced: number,
  packagingCostUnit: number,
  pricingSettings: PricingSettings
) {
  // Custo do gelato no pote
  const gelatoCostPerTub = recipeCostKg * (tubWeightGrams / 1000);
  // Rateio indireto fixo (proporcional ao peso em relação a 500g)
  const weightRatio = tubWeightGrams / (pricingSettings.tubWeightGrams || 500);
  const fixedOverheadUnit = (pricingSettings.indirectOverheadPerTub || 0) * weightRatio;
  // Custo total por pote pronto
  const unitCostTotal = gelatoCostPerTub + packagingCostUnit + fixedOverheadUnit;
  const totalBatchCost = unitCostTotal * unitsProduced;

  return {
    gelatoCostPerTub,
    packagingCostUnit,
    fixedOverheadUnit,
    unitCostTotal,
    totalBatchCost
  };
}

/**
 * Calcula o preço de venda sugerido para um formato de pote qualquer
 */
export function calculateSuggestedPriceForFormat(
  unitCostTotal: number,
  pricingSettings: PricingSettings
): number {
  if (unitCostTotal <= 0) return 0;

  const totalSalesDeductions = (pricingSettings.cardFeePercent + (pricingSettings.salesTaxPercent || 0)) / 100;
  const targetMarginDecimal = (pricingSettings.targetProfitMarginPercent || 0) / 100;
  const isMarkup = pricingSettings.pricingMethod === 'markup';
  const netRevenueFactor = Math.max(0.01, 1 - totalSalesDeductions);
  const marginDivisor = 1 - (targetMarginDecimal + totalSalesDeductions);

  if (isMarkup) {
    return (unitCostTotal * (1 + targetMarginDecimal)) / netRevenueFactor;
  }
  return marginDivisor > 0
    ? unitCostTotal / marginDivisor
    : (unitCostTotal * (1 + targetMarginDecimal)) / netRevenueFactor;
}

/**
 * Registra a produção de um lote e atualiza o saldo e custo médio do estoque
 */
export async function recordProductionBatch(params: {
  recipe: Recipe;
  recipeCostKg: number;
  tubWeightGrams: number;
  unitsProduced: number;
  packagingCostUnit: number;
  pricingSettings: PricingSettings;
  customBatchCode?: string;
  notes?: string;
}): Promise<ProductionBatch> {
  const { recipe, recipeCostKg, tubWeightGrams, unitsProduced, packagingCostUnit, pricingSettings, customBatchCode, notes } = params;

  const costs = calculateBatchCosts(recipeCostKg, tubWeightGrams, unitsProduced, packagingCostUnit, pricingSettings);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const cleanRecipeName = recipe.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  const batchCode = customBatchCode?.trim() || `LOT-${dateStr}-${cleanRecipeName}`;

  // Validade padrão: +90 dias
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const newBatch: ProductionBatch = {
    id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipeId: recipe.id,
    recipeName: recipe.name,
    category: recipe.category || 'Gelatos de Leite',
    batchCode,
    producedAt: now.toISOString(),
    expiresAt,
    tubWeightGrams,
    unitsProduced,
    recipeCostKg,
    packagingCostUnit,
    fixedOverheadUnit: costs.fixedOverheadUnit,
    unitCostTotal: costs.unitCostTotal,
    totalBatchCost: costs.totalBatchCost,
    notes
  };

  const stockItemId = `${recipe.id}_${tubWeightGrams}`;
  const suggestedPrice = calculateSuggestedPriceForFormat(costs.unitCostTotal, pricingSettings);

  await db.transaction('rw', [db.productionBatches, db.stockItems], async () => {
    await db.productionBatches.put(newBatch);

    const existingStock = await db.stockItems.get(stockItemId);
    if (existingStock) {
      const prevUnits = Math.max(0, existingStock.currentUnits);
      const newUnits = prevUnits + unitsProduced;
      const newAvgCost = newUnits > 0
        ? (prevUnits * existingStock.avgCostUnit + unitsProduced * costs.unitCostTotal) / newUnits
        : costs.unitCostTotal;

      await db.stockItems.update(stockItemId, {
        currentUnits: newUnits,
        avgCostUnit: newAvgCost,
        suggestedPrice: suggestedPrice > 0 ? suggestedPrice : existingStock.suggestedPrice,
        lastProducedAt: now.toISOString()
      });
    } else {
      const newStockItem: StockItem = {
        id: stockItemId,
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category || 'Gelatos de Leite',
        tubWeightGrams,
        currentUnits: unitsProduced,
        minStockAlert: 3,
        avgCostUnit: costs.unitCostTotal,
        suggestedPrice,
        lastProducedAt: now.toISOString()
      };
      await db.stockItems.put(newStockItem);
    }
  });

  dispatchStockUpdated();
  return newBatch;
}

/**
 * Registra uma venda no PDV e dá baixa atômica no estoque do pote
 */
export async function recordSale(params: {
  stockItem: StockItem;
  unitsSold: number;
  unitPrice: number;
  paymentMethod: PaymentMethodType;
  pricingParams: PricingParams;
  notes?: string;
}): Promise<SaleTransaction> {
  const { stockItem, unitsSold, unitPrice, paymentMethod, pricingParams, notes } = params;

  if (!stockItem || !stockItem.id) {
    throw new Error('Item de estoque inválido ou ausente para registrar venda.');
  }
  if (!Number.isFinite(unitsSold) || unitsSold <= 0) {
    throw new Error('A quantidade de unidades vendidas deve ser um número maior que zero.');
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error('O preço unitário de venda deve ser maior ou igual a zero.');
  }

  const grossRevenue = unitPrice * unitsSold;
  const cardFeeRate = getPaymentMethodFeeRate(paymentMethod, pricingParams);
  const cardFeeAmount = grossRevenue * (cardFeeRate / 100);

  const salesTaxRate = pricingParams.salesTaxPercent || 0;
  const salesTaxAmount = grossRevenue * (salesTaxRate / 100);

  const netRevenue = grossRevenue - cardFeeAmount - salesTaxAmount;
  const unitCost = stockItem.avgCostUnit || 0;
  const totalCostSold = unitCost * unitsSold;
  const netProfit = netRevenue - totalCostSold;
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const transaction: SaleTransaction = {
    id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    stockItemId: stockItem.id,
    recipeId: stockItem.recipeId,
    recipeName: stockItem.recipeName,
    category: stockItem.category,
    tubWeightGrams: stockItem.tubWeightGrams,
    unitsSold,
    unitPrice,
    grossRevenue,
    paymentMethod,
    cardFeeRate,
    cardFeeAmount,
    salesTaxRate,
    salesTaxAmount,
    netRevenue,
    unitCost,
    totalCostSold,
    netProfit,
    marginPercent,
    notes
  };

  await db.transaction('rw', [db.salesTransactions, db.stockItems], async () => {
    await db.salesTransactions.put(transaction);

    // Baixa do estoque
    const current = await db.stockItems.get(stockItem.id);
    if (!current) {
      throw new Error(`Item de estoque ${stockItem.id} não localizado no banco de dados.`);
    }
    await db.stockItems.update(stockItem.id, {
      currentUnits: current.currentUnits - unitsSold
    });
  });

  dispatchStockUpdated();
  return transaction;
}

/**
 * Registra um ajuste / perda / degustação / acerto de inventário
 */
export async function recordStockAdjustment(params: {
  stockItem: StockItem;
  type: AdjustmentType;
  quantityChange: number; // Ex: -1 para perda, +2 para acerto
  notes: string;
}): Promise<StockAdjustment> {
  const { stockItem, type, quantityChange, notes } = params;

  if (!stockItem || !stockItem.id) {
    throw new Error('Item de estoque inválido ou ausente para ajuste.');
  }
  if (!Number.isFinite(quantityChange) || quantityChange === 0) {
    throw new Error('A alteração de quantidade no ajuste deve ser um número diferente de zero.');
  }

  const unitCost = stockItem.avgCostUnit || 0;
  const totalCostImpact = Math.abs(quantityChange) * unitCost;

  const adj: StockAdjustment = {
    id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    stockItemId: stockItem.id,
    recipeId: stockItem.recipeId,
    recipeName: stockItem.recipeName,
    tubWeightGrams: stockItem.tubWeightGrams,
    timestamp: new Date().toISOString(),
    type,
    quantityChange,
    unitCost,
    totalCostImpact,
    notes
  };

  await db.transaction('rw', [db.stockAdjustments, db.stockItems], async () => {
    await db.stockAdjustments.put(adj);

    const current = await db.stockItems.get(stockItem.id);
    if (current) {
      await db.stockItems.update(stockItem.id, {
        currentUnits: Math.max(0, current.currentUnits + quantityChange)
      });
    }
  });

  dispatchStockUpdated();
  return adj;
}

/**
 * Estorna uma transação de venda e devolve os potes ao estoque
 */
export async function voidSaleTransaction(transactionId: string): Promise<void> {
  await db.transaction('rw', [db.salesTransactions, db.stockItems], async () => {
    const sale = await db.salesTransactions.get(transactionId);
    if (!sale) return;

    // Devolver itens ao estoque
    const stock = await db.stockItems.get(sale.stockItemId);
    if (stock) {
      await db.stockItems.update(sale.stockItemId, {
        currentUnits: stock.currentUnits + sale.unitsSold
      });
    }

    await db.salesTransactions.delete(transactionId);
  });

  dispatchStockUpdated();
}

/**
 * Calcula os KPIs consolidados do estoque físico
 */
export function calculateStockKPIs(items: StockItem[]): StockKPIs {
  let totalTubsInStock = 0;
  let totalCapitalInvested = 0;
  let totalPotentialRevenue = 0;
  let lowStockItemsCount = 0;
  let outOfStockCount = 0;
  let flavorsInStockCount = 0;

  for (const item of items) {
    const units = Math.max(0, item.currentUnits);
    totalTubsInStock += units;
    totalCapitalInvested += units * (item.avgCostUnit || 0);
    totalPotentialRevenue += units * (item.suggestedPrice || 0);

    if (units > 0) {
      flavorsInStockCount++;
      if (units <= (item.minStockAlert || 3)) {
        lowStockItemsCount++;
      }
    } else {
      outOfStockCount++;
    }
  }

  return {
    totalTubsInStock,
    totalCapitalInvested,
    totalPotentialRevenue,
    lowStockItemsCount,
    outOfStockCount,
    flavorsInStockCount
  };
}

/**
 * Calcula o DRE Operacional a partir das vendas de um período
 */
export function calculateSalesDRE(
  sales: SaleTransaction[],
  pricingParams: PricingParams,
  daysInPeriod: number = 30
): SalesDRESummary {
  let grossRevenue = 0;
  let cardFeesTotal = 0;
  let salesTaxTotal = 0;
  let netRevenue = 0;
  let cmvTotal = 0;
  let netProfit = 0;
  let unitsSoldTotal = 0;

  for (const s of sales) {
    grossRevenue += s.grossRevenue;
    cardFeesTotal += s.cardFeeAmount;
    salesTaxTotal += s.salesTaxAmount;
    netRevenue += s.netRevenue;
    cmvTotal += s.totalCostSold;
    netProfit += s.netProfit;
    unitsSoldTotal += s.unitsSold;
  }

  const grossContributionMargin = netRevenue - cmvTotal;
  const totalMonthlyFixed = calculateTotalFixedCosts(pricingParams);
  // Rateio proporcional do custo fixo para os dias do período (base 30 dias)
  const fixedCostsPeriod = totalMonthlyFixed * (daysInPeriod / 30);
  const operatingNetProfit = grossContributionMargin - fixedCostsPeriod;
  const profitMarginPercent = grossRevenue > 0 ? (operatingNetProfit / grossRevenue) * 100 : 0;

  return {
    grossRevenue,
    cardFeesTotal,
    salesTaxTotal,
    netRevenue,
    cmvTotal,
    grossContributionMargin,
    fixedCostsPeriod,
    operatingNetProfit,
    profitMarginPercent,
    unitsSoldTotal
  };
}
