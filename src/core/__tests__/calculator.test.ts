import { describe, it, expect } from 'vitest';
import { calculateBatchAnalysis, DEFAULT_PRICING } from '../calculator';
import { RecipeItem, Ingredient, StyleStandard } from '../../types/gelato';

describe('Calculator Core Engine', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 'ing_leite',
      name: 'Leite Integral Tipo A',
      category: 'Lácteos Líquidos',
      water: 0.88,
      fat: 0.035,
      msnf: 0.085,
      sugars: 0,
      otherSolids: 0,
      totalSolids: 0.12,
      protein: 0.032,
      pac: 1.0,
      pod: 0,
      costKg: 5.50,
      hasAllergen: true
    },
    {
      id: 'ing_creme',
      name: 'Creme de Leite 35%',
      category: 'Gorduras',
      water: 0.59,
      fat: 0.35,
      msnf: 0.06,
      sugars: 0,
      otherSolids: 0,
      totalSolids: 0.41,
      protein: 0.02,
      pac: 0.7,
      pod: 0,
      costKg: 28.00,
      hasAllergen: true
    },
    {
      id: 'ing_sacarose',
      name: 'Açúcar',
      category: 'Açúcares',
      water: 0,
      fat: 0,
      msnf: 0,
      sugars: 1.0,
      otherSolids: 0,
      totalSolids: 1.0,
      protein: 0,
      pac: 1.0,
      pod: 1.0,
      costKg: 4.20,
      hasAllergen: false
    },
    {
      id: 'ing_dextrose',
      name: 'Dextrose',
      category: 'Açúcares',
      water: 0.08,
      fat: 0,
      msnf: 0,
      sugars: 0.92,
      otherSolids: 0,
      totalSolids: 0.92,
      protein: 0,
      pac: 1.9,
      pod: 0.7,
      costKg: 12.00,
      hasAllergen: false
    }
  ];

  const ingMap = new Map<string, Ingredient>();
  mockIngredients.forEach(i => ingMap.set(i.name.toLowerCase().trim(), i));

  const mockStyle: StyleStandard = {
    name: 'Gelatos de Leite',
    pacDivisor: 1,
    min: {
      fat: 0.06,
      sugars: 0.16,
      msnf: 0.08,
      otherSolids: 0,
      totalSolids: 0.36,
      water: 0.58,
      pac: 24,
      pod: 16,
      protein: 0.02
    },
    max: {
      fat: 0.10,
      sugars: 0.22,
      msnf: 0.11,
      otherSolids: 0.04,
      totalSolids: 0.42,
      water: 0.64,
      pac: 28,
      pod: 22,
      protein: 0.05
    }
  };

  it('calcula métricas físico-químicas de uma receita base de Fior di Latte', () => {
    const items: RecipeItem[] = [
      { name: 'Leite Integral Tipo A', grams: 650 },
      { name: 'Creme de Leite 35%', grams: 180 },
      { name: 'Açúcar', grams: 130 },
      { name: 'Dextrose', grams: 40 }
    ];

    const analysis = calculateBatchAnalysis(items, [], mockStyle, ingMap, DEFAULT_PRICING);

    expect(analysis.caldaWeight).toBe(1000);
    expect(analysis.percentages.fat).toBeGreaterThan(0.08); // > 8% gordura
    expect(analysis.percentages.fat).toBeLessThan(0.10);    // < 10% gordura
    expect(analysis.percentages.sugars).toBeGreaterThan(0.15); // > 15% açúcares
    expect(analysis.percentages.pac).toBeGreaterThan(15);
    expect(analysis.percentages.pod).toBeGreaterThan(10);
    expect(analysis.percentages.water).toBeGreaterThan(0.60);
    expect(analysis.percentages.totalSolids).toBeCloseTo(1 - analysis.percentages.water, 2);
  });

  it('calcula o teto de Caviezel para prevenção de arenosidade', () => {
    const items: RecipeItem[] = [
      { name: 'Leite Integral Tipo A', grams: 700 },
      { name: 'Açúcar', grams: 200 }
    ];

    const analysis = calculateBatchAnalysis(items, [], mockStyle, ingMap, DEFAULT_PRICING);

    expect(analysis.sandinessRisk).toBeDefined();
    if (analysis.sandinessRisk) {
      expect(analysis.sandinessRisk.maxSafeMsnf).toBeGreaterThan(0);
      expect(typeof analysis.sandinessRisk.isAtRisk).toBe('boolean');
    }
  });
});
