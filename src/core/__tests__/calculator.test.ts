import { describe, it, expect } from 'vitest';
import {
  calculateBatchAnalysis,
  resolveVariegatoDensity,
  isNeutroIngredient,
  roundIngredientGrams,
  DEFAULT_PRICING
} from '../calculator';
import { RecipeItem, VariegatoItem, Ingredient, StyleStandard } from '../../types/gelato';

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

  it('calcula densidade e aeração individual de variegatos (Mixer vs Direto)', () => {
    // 1. Nutella com mixer (+20% ar)
    const nutellaMixer: VariegatoItem = {
      name: 'Variegato de Nutella',
      grams: 350,
      processMethod: 'mixer'
    };
    const resMixer = resolveVariegatoDensity(nutellaMixer);
    expect(resMixer.method).toBe('mixer');
    expect(resMixer.overrun).toBe(20);
    // 1.28 / 1.20 = 1.067
    expect(resMixer.density).toBeCloseTo(1.067, 2);

    // 2. Nutella pura sem mixer
    const nutellaPura: VariegatoItem = {
      name: 'Variegato de Nutella',
      grams: 350,
      processMethod: 'direct'
    };
    const resPura = resolveVariegatoDensity(nutellaPura);
    expect(resPura.method).toBe('direct');
    expect(resPura.overrun).toBe(0);
    expect(resPura.density).toBe(1.28);

    // 3. Geleia de frutas
    const geleia: VariegatoItem = {
      name: 'Geleia de Frutas Vermelhas',
      grams: 250
    };
    const resGeleia = resolveVariegatoDensity(geleia);
    expect(resGeleia.density).toBe(1.31);
    expect(resGeleia.overrun).toBe(0);

    // 4. Densidade customizada explícita
    const custom: VariegatoItem = {
      name: 'Ganache Especial',
      grams: 200,
      density: 1.05
    };
    const resCustom = resolveVariegatoDensity(custom);
    expect(resCustom.density).toBe(1.05);
  });

  it('expande o volume total do lote com variegato passado no mixer', () => {
    const items: RecipeItem[] = [
      { name: 'Leite Integral Tipo A', grams: 1950 },
      { name: 'Creme de Leite 35%', grams: 540 },
      { name: 'Açúcar', grams: 390 },
      { name: 'Dextrose', grams: 120 }
    ]; // 3000g de calda

    const variegatosMixer: VariegatoItem[] = [
      { name: 'Variegato de Nutella', grams: 350, processMethod: 'mixer' }
    ];

    const variegatosPuro: VariegatoItem[] = [
      { name: 'Variegato de Nutella', grams: 350, processMethod: 'direct' }
    ];

    const analysisMixer = calculateBatchAnalysis(items, variegatosMixer, mockStyle, ingMap, DEFAULT_PRICING);
    const analysisPuro = calculateBatchAnalysis(items, variegatosPuro, mockStyle, ingMap, DEFAULT_PRICING);

    expect(analysisMixer.densityAndVolume).toBeDefined();
    expect(analysisPuro.densityAndVolume).toBeDefined();

    if (analysisMixer.densityAndVolume && analysisPuro.densityAndVolume) {
      // O volume da Nutella no mixer (~0.328L) deve ser maior que da Nutella pura (~0.273L)
      expect(analysisMixer.densityAndVolume.variegatoVolumeLiters).toBeGreaterThan(
        analysisPuro.densityAndVolume.variegatoVolumeLiters
      );
      // Volume total com mixer é maior
      expect(analysisMixer.densityAndVolume.totalVolumeLiters).toBeGreaterThan(
        analysisPuro.densityAndVolume.totalVolumeLiters
      );
      // Detalhes individuais gravados
      expect(analysisMixer.densityAndVolume.variegatoDetails).toHaveLength(1);
      expect(analysisMixer.densityAndVolume.variegatoDetails![0].processMethod).toBe('mixer');
    }
  });

  describe('Neutro Protection & Rounded Values System', () => {
    it('corretamente identifica ingredientes da classe Neutro/Estabilizante', () => {
      // Por nome
      expect(isNeutroIngredient('Neutro')).toBe(true);
      expect(isNeutroIngredient('Neutro 5')).toBe(true);
      expect(isNeutroIngredient('Neutro Fabbri')).toBe(true);
      expect(isNeutroIngredient('Liga Neutra Speciale')).toBe(true);
      expect(isNeutroIngredient('NEUTRO CREMA')).toBe(true);

      // Por categoria
      expect(isNeutroIngredient('Goma Tara', 'Neutros, Gomas & Fibras')).toBe(true);
      expect(isNeutroIngredient('Alfarroba', 'Neutros & Fibras')).toBe(true);
      expect(isNeutroIngredient('Insumo X', 'Neutros e Estabilizantes')).toBe(true);

      // Insumos não-neutros devem retornar false
      expect(isNeutroIngredient('Leite Integral', 'Lácteos Líquidos')).toBe(false);
      expect(isNeutroIngredient('Açúcar', 'Açúcares')).toBe(false);
      expect(isNeutroIngredient('Creme de Leite 35%', 'Gorduras')).toBe(false);
      expect(isNeutroIngredient('Nutella', 'Pastas & Oleaginosas')).toBe(false);
    });

    it('NUNCA permite arredondar o ingrediente Neutro (preserva 1 casa decimal)', () => {
      // Neutro com valores decimais: NUNCA deve virar inteiro mesmo com showRounded = true
      expect(roundIngredientGrams(16.8, true, true)).toBe(16.8);
      expect(roundIngredientGrams(16.8, true, false)).toBe(16.8);
      expect(roundIngredientGrams(3.54, true, true)).toBe(3.5);
      expect(roundIngredientGrams(5.0, true, true)).toBe(5.0);
      expect(roundIngredientGrams(4.26, true, true)).toBe(4.3);
    });

    it('arredonda ingredientes não-neutros para inteiros quando showRounded = true', () => {
      // Insumos normais em lote escalado (ex: 2489.1g -> 2489g, 602.4g -> 602g, 160.7g -> 161g)
      expect(roundIngredientGrams(2489.1, false, true)).toBe(2489);
      expect(roundIngredientGrams(602.4, false, true)).toBe(602);
      expect(roundIngredientGrams(160.7, false, true)).toBe(161);
      expect(roundIngredientGrams(120.5, false, true)).toBe(121);

      // Quando showRounded = false, preserva 1 casa decimal
      expect(roundIngredientGrams(2489.1, false, false)).toBe(2489.1);
      expect(roundIngredientGrams(602.4, false, false)).toBe(602.4);
      expect(roundIngredientGrams(160.7, false, false)).toBe(160.7);
    });
  });
});
