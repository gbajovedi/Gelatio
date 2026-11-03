import { describe, it, expect } from 'vitest';
import { calculateStockKPIs, calculateSalesDRE } from '../stockService';
import { StockItem, SaleTransaction } from '../../types/stock';
import { PricingParams, DEFAULT_PRICING_PARAMS } from '../pricingStorage';

describe('Stock & POS Financial Services', () => {
  it('calcula KPIs de estoque corretamente', () => {
    const mockStock: StockItem[] = [
      {
        id: 'rec1_500g',
        recipeId: 'rec1',
        recipeName: 'Pistache',
        category: 'Gelatos de Leite',
        tubWeightGrams: 500,
        currentUnits: 10,
        minStockAlert: 2,
        avgCostUnit: 15.00,
        suggestedPrice: 35.00
      },
      {
        id: 'rec2_500g',
        recipeId: 'rec2',
        recipeName: 'Morango',
        category: 'Sorbets de Frutas',
        tubWeightGrams: 500,
        currentUnits: 0,
        minStockAlert: 3,
        avgCostUnit: 8.00,
        suggestedPrice: 25.00
      }
    ];

    const kpis = calculateStockKPIs(mockStock);

    expect(kpis.totalTubsInStock).toBe(10);
    expect(kpis.totalCapitalInvested).toBeCloseTo(150.00, 2); // 10 * 15.00
    expect(kpis.totalPotentialRevenue).toBeCloseTo(350.00, 2); // 10 * 35.00
    expect(kpis.outOfStockCount).toBe(1);
    expect(kpis.flavorsInStockCount).toBe(1);
  });

  it('calcula DRE de vendas com dedução de taxas de cartão e impostos', () => {
    const mockSales: SaleTransaction[] = [
      {
        id: 'sale_1',
        timestamp: new Date().toISOString(),
        stockItemId: 'rec1_500g',
        recipeId: 'rec1',
        recipeName: 'Pistache',
        category: 'Gelatos de Leite',
        tubWeightGrams: 500,
        unitsSold: 2,
        unitPrice: 35.00,
        grossRevenue: 70.00,
        paymentMethod: 'credit_sight',
        cardFeeRate: 3.0,
        cardFeeAmount: 2.10,
        salesTaxRate: 5.0,
        salesTaxAmount: 3.50,
        netRevenue: 64.40,
        unitCost: 15.00,
        totalCostSold: 30.00,
        netProfit: 34.40,
        marginPercent: 49.1
      }
    ];

    const zeroFixedParams: PricingParams = {
      ...DEFAULT_PRICING_PARAMS,
      rent: 0,
      electricity: 0,
      water: 0,
      telecom: 0,
      payroll: 0,
      ownerSalary: 0,
      accounting: 0,
      software: 0,
      equipmentMaintenance: 0,
      equipmentDepreciation: 0,
      cleaningHygiene: 0,
      secPackaging: 0,
      fixedTaxes: 0,
      licensesAndPermits: 0,
      commercialInsurance: 0,
      posRentalMonthly: 0,
      marketing: 0,
      customCosts: []
    };

    const dre = calculateSalesDRE(mockSales, zeroFixedParams, 30);

    expect(dre.grossRevenue).toBeCloseTo(70.00, 2);
    expect(dre.cardFeesTotal).toBeCloseTo(2.10, 2);
    expect(dre.salesTaxTotal).toBeCloseTo(3.50, 2);
    expect(dre.netRevenue).toBeCloseTo(64.40, 2);
    expect(dre.cmvTotal).toBeCloseTo(30.00, 2);
    expect(dre.grossContributionMargin).toBeCloseTo(34.40, 2);
    expect(dre.operatingNetProfit).toBeCloseTo(34.40, 2);
    expect(dre.unitsSoldTotal).toBe(2);
  });
});
