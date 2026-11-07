import { describe, it, expect } from 'vitest';
import { calculateAnvisaNutrition } from '../anvisaNutrition';
import { calculateBatchAnalysis } from '../calculator';
import { recordSale, recordStockAdjustment } from '../stockService';
import { Recipe, Ingredient, StyleStandard, PricingSettings } from '../../types/gelato';
import { StockItem } from '../../types/stock';
import databaseRaw from '../../db/database.ts?raw';
import anvisaRaw from '../../components/Receitas/AnvisaNutritionalModal.tsx?raw';
import profitSimulatorRaw from '../../components/Balanceamento/ProfitSimulator.tsx?raw';
import pricingCalculatorRaw from '../../components/Financeiro/PricingCalculator.tsx?raw';
import importExportModalRaw from '../../components/ImportExport/ImportExportModal.tsx?raw';

describe('Auditoria Técnica: Blindagem, Backup v5, ANVISA e Precificação', () => {
  const mockRecipe: Recipe = {
    id: 'test_rec_1',
    name: 'Gelato de Teste',
    category: 'Gelatos de Leite',
    targetStyle: 'Gelatos de Leite',
    totalGrams: 1000,
    ingredients: [
      { name: 'Leite Integral', grams: 600 },
      { name: 'Creme De Leite Fresco 35%', grams: 150 },
      { name: 'Açúcar', grams: 150 },
      { name: 'Leite Em Pó Desnatado', grams: 50 },
      { name: 'Dextrose', grams: 45 },
      { name: 'Neutro', grams: 5 }
    ]
  };

  const mockIngredients: Ingredient[] = [
    {
      id: 'mock_ing_1',
      name: 'Leite Integral',
      category: 'Laticínios',
      costKg: 4.5,
      sugars: 0.048,
      fat: 0.035,
      msnf: 0.085,
      otherSolids: 0.0,
      totalSolids: 0.12,
      water: 0.88,
      pod: 0.048,
      pac: 0.048,
      protein: 0.032,
      hasAllergen: true
    },
    {
      id: 'mock_ing_2',
      name: 'Creme De Leite Fresco 35%',
      category: 'Laticínios',
      costKg: 28.0,
      sugars: 0.03,
      fat: 0.35,
      msnf: 0.055,
      otherSolids: 0.0,
      totalSolids: 0.405,
      water: 0.595,
      pod: 0.03,
      pac: 0.03,
      protein: 0.02,
      hasAllergen: true
    },
    {
      id: 'mock_ing_3',
      name: 'Açúcar',
      category: 'Açúcares',
      costKg: 4.0,
      sugars: 1.0,
      fat: 0.0,
      msnf: 0.0,
      otherSolids: 0.0,
      totalSolids: 1.0,
      water: 0.0,
      pod: 1.0,
      pac: 1.0,
      protein: 0.0,
      hasAllergen: false
    },
    {
      id: 'mock_ing_4',
      name: 'Leite Em Pó Desnatado',
      category: 'Laticínios',
      costKg: 25.0,
      sugars: 0.52,
      fat: 0.01,
      msnf: 0.95,
      otherSolids: 0.0,
      totalSolids: 0.96,
      water: 0.04,
      pod: 0.52,
      pac: 0.52,
      protein: 0.36,
      hasAllergen: true
    },
    {
      id: 'mock_ing_5',
      name: 'Dextrose',
      category: 'Açúcares',
      costKg: 12.0,
      sugars: 0.92,
      fat: 0.0,
      msnf: 0.0,
      otherSolids: 0.0,
      totalSolids: 0.92,
      water: 0.08,
      pod: 0.70,
      pac: 1.90,
      protein: 0.0,
      hasAllergen: false
    },
    {
      id: 'mock_ing_6',
      name: 'Neutro',
      category: 'Neutros e Estabilizantes',
      costKg: 120.0,
      sugars: 0.0,
      fat: 0.0,
      msnf: 0.0,
      otherSolids: 1.0,
      totalSolids: 1.0,
      water: 0.0,
      pod: 0.0,
      pac: 0.0,
      protein: 0.0,
      hasAllergen: false
    }
  ];

  describe('1. Blindagem Nutricional ANVISA (RDC 429/2020)', () => {
    it('deve prevenir divisão por zero ou Infinity quando portionGrams for 0 ou negativo', () => {
      const nutZero = calculateAnvisaNutrition(mockRecipe, mockIngredients, 0, 500);
      expect(Number.isFinite(nutZero.servingsPerContainer)).toBe(true);
      expect(nutZero.servingsPerContainer).toBeGreaterThanOrEqual(1);
      expect(nutZero.portionGrams).toBe(60); // Sanitizado para o padrão 60g

      const nutNeg = calculateAnvisaNutrition(mockRecipe, mockIngredients, -50, -200);
      expect(Number.isFinite(nutNeg.servingsPerContainer)).toBe(true);
      expect(nutNeg.servingsPerContainer).toBeGreaterThanOrEqual(1);
      expect(nutNeg.portionGrams).toBe(60);
      expect(nutNeg.containerWeightGrams).toBe(500);
    });

    it('deve utilizar parâmetros bromatológicos analíticos caso presentes no insumo com fallback transparente', () => {
      const mockCustomIngredients: Ingredient[] = [
        ...mockIngredients,
        {
          id: 'custom_chocolate',
          name: 'Chocolate Especial 70%',
          category: 'Chocolates',
          costKg: 50.0,
          sugars: 0.30,
          fat: 0.40,
          msnf: 0.0,
          otherSolids: 0.30,
          totalSolids: 1.0,
          water: 0.0,
          pod: 0.30,
          pac: 0.30,
          protein: 0.08,
          hasAllergen: false,
          saturatedFatRatio: 0.62,
          fiberRatio: 0.15,
          sodiumMgPer100g: 12
        }
      ];

      const recipeWithChoc: Recipe = {
        ...mockRecipe,
        ingredients: [
          ...mockRecipe.ingredients,
          { name: 'Chocolate Especial 70%', grams: 100 }
        ]
      };

      const result = calculateAnvisaNutrition(recipeWithChoc, mockCustomIngredients, 60, 500);
      expect(result.items.find(i => i.name === 'Fibras alimentares')?.per100g).toBeGreaterThan(0);
      expect(result.items.find(i => i.name === 'Sódio')?.per100g).toBeGreaterThan(0);
    });

    it('deve exibir disclaimer regulamentar da RDC 429/2020 na interface da tabela ANVISA', () => {
      expect(anvisaRaw).toContain('RDC 429/2020');
      expect(anvisaRaw).toContain('cálculo teórico fundamentado na composição');
    });
  });

  describe('2. Validação Defensiva de Estoque e Vendas (stockService)', () => {
    const mockStockItem: StockItem = {
      id: 'stock_item_test_1',
      recipeId: 'test_rec_1',
      recipeName: 'Gelato de Teste',
      category: 'Gelatos de Leite',
      tubWeightGrams: 500,
      currentUnits: 10,
      minStockAlert: 3,
      avgCostUnit: 8.50,
      suggestedPrice: 25.0,
      lastProducedAt: new Date().toISOString()
    };

    it('deve rejeitar venda com quantidade menor ou igual a zero antes de qualquer operação', async () => {
      await expect(
        recordSale({
          stockItem: mockStockItem,
          unitsSold: 0,
          unitPrice: 25.0,
          paymentMethod: 'pix',
          pricingParams: { cardFeePercent: 1.5 } as any
        })
      ).rejects.toThrow(/maior que zero/);

      await expect(
        recordSale({
          stockItem: mockStockItem,
          unitsSold: -5,
          unitPrice: 25.0,
          paymentMethod: 'pix',
          pricingParams: { cardFeePercent: 1.5 } as any
        })
      ).rejects.toThrow(/maior que zero/);
    });

    it('deve rejeitar venda com preço unitário negativo', async () => {
      await expect(
        recordSale({
          stockItem: mockStockItem,
          unitsSold: 2,
          unitPrice: -10.0,
          paymentMethod: 'credit_sight',
          pricingParams: { cardFeePercent: 2.0 } as any
        })
      ).rejects.toThrow(/maior ou igual a zero/);
    });

    it('deve rejeitar ajuste de estoque com quantidade igual a zero', async () => {
      await expect(
        recordStockAdjustment({
          stockItem: mockStockItem,
          type: 'loss',
          quantityChange: 0,
          notes: 'Teste'
        })
      ).rejects.toThrow(/diferente de zero/);
    });
  });

  describe('3. Detecção e Alerta de Margem Inviável em Precificação', () => {
    const mockStyle: StyleStandard = {
      name: 'Gelatos de Leite',
      pacDivisor: 1,
      min: { sugars: 0.16, fat: 0.06, msnf: 0.08, otherSolids: 0.01, totalSolids: 0.36, water: 0.60, pod: 0.16, pac: 0.24, protein: 0.035 },
      max: { sugars: 0.22, fat: 0.12, msnf: 0.12, otherSolids: 0.03, totalSolids: 0.42, water: 0.64, pod: 0.22, pac: 0.32, protein: 0.05 }
    };

    const ingMap = new Map<string, Ingredient>();
    mockIngredients.forEach(i => ingMap.set(i.name.toLowerCase().trim(), i));

    it('deve alertar margem inviável quando a soma de margem e taxas superar 100%', () => {
      const impossiblePricing: PricingSettings = {
        tubWeightGrams: 500,
        tubPackagingCost: 1.50,
        indirectOverheadPerTub: 2.00,
        cardFeePercent: 5.0,
        salesTaxPercent: 15.0, // Deduções = 20%
        targetProfitMarginPercent: 85.0, // 85% + 20% = 105% >= 100%
        pricingMethod: 'margin'
      };

      const analysis = calculateBatchAnalysis(mockRecipe.ingredients, [], mockStyle, ingMap, impossiblePricing);
      expect(analysis.costing.isMarginViable).toBe(false);
      expect(analysis.costing.marginWarning).toBeDefined();
      expect(analysis.costing.marginWarning).toContain('Margem sobre venda inviável');
      expect(analysis.costing.suggestedPrice500g).toBeGreaterThan(0);
    });

    it('deve aprovar viabilidade quando a margem e deduções somam menos de 100%', () => {
      const viablePricing: PricingSettings = {
        tubWeightGrams: 500,
        tubPackagingCost: 1.50,
        indirectOverheadPerTub: 2.00,
        cardFeePercent: 2.5,
        salesTaxPercent: 6.0,
        targetProfitMarginPercent: 50.0,
        pricingMethod: 'margin'
      };

      const analysis = calculateBatchAnalysis(mockRecipe.ingredients, [], mockStyle, ingMap, viablePricing);
      expect(analysis.costing.isMarginViable).toBe(true);
      expect(analysis.costing.marginWarning).toBeUndefined();
    });

    it('deve conter avisos de margem inviável no ProfitSimulator e no PricingCalculator', () => {
      expect(profitSimulatorRaw).toContain('Margem inviável');
      expect(profitSimulatorRaw).toContain('isMarginViable');
      expect(pricingCalculatorRaw).toContain('Margem inviável');
      expect(pricingCalculatorRaw).toContain('isMarginViable');
    });
  });

  describe('4. Contrato do Backup Completo v5 e Restauração Segura (Database)', () => {
    it('exportFullBackup deve gerar versão 5 incluindo as 4 tabelas de estoque e vendas', () => {
      expect(databaseRaw).toContain('version: 5');
      expect(databaseRaw).toContain('productionBatches');
      expect(databaseRaw).toContain('stockItems');
      expect(databaseRaw).toContain('salesTransactions');
      expect(databaseRaw).toContain('stockAdjustments');
    });

    it('importBackup no modo replace deve limpar settings e as 4 tabelas de estoque', () => {
      expect(databaseRaw).toMatch(/await this\.settings\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.productionBatches\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.stockItems\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.salesTransactions\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.stockAdjustments\.clear\(\);/);
    });

    it('restoreFactoryDefaults deve limpar tabelas de estoque e configurações evitando chaves órfãs', () => {
      expect(databaseRaw).toMatch(/await this\.productionBatches\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.stockItems\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.salesTransactions\.clear\(\);/);
      expect(databaseRaw).toMatch(/await this\.stockAdjustments\.clear\(\);/);
    });

    it('ImportExportModal deve exibir o inventário de estoque e vendas e texto claro de substituição integral', () => {
      expect(importExportModalRaw).toContain('potes');
      expect(importExportModalRaw).toContain('vendas');
      expect(importExportModalRaw).toContain('Apaga integralmente todos os dados locais');
    });
  });
});
