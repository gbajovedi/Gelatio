import { describe, it, expect } from 'vitest';
import {
  isHydrocolloidIngredient,
  getHydrocolloidRangeForRheology,
  evaluateRheologyGuidance,
  evaluateThermalGuidance
} from '../variegatoAdvisor';
import { calculateVariegatoBatchAnalysis, evaluateThermalStatus } from '../variegatoCalculator';
import { VARIEGATO_STYLES } from '../variegatoStyles';
import { Ingredient } from '../../types/gelato';
import { VariegatoItemRow } from '../../types/variegato';

describe('Variegato Advisor Prescriptive Engine', () => {
  const mockIngredients = new Map<string, Ingredient>([
    [
      'morango',
      {
        id: 'ing_126',
        name: 'Morango',
        category: 'Frutas & Polpas',
        costKg: 25,
        sugars: 0.05,
        fat: 0,
        msnf: 0,
        otherSolids: 0.04,
        totalSolids: 0.09,
        water: 0.91,
        pod: 0.096,
        pac: 0.116,
        protein: 0.01,
        hasAllergen: false
      }
    ],
    [
      'açúcar',
      {
        id: 'ing_16',
        name: 'Açúcar',
        category: 'Açúcares',
        costKg: 4,
        sugars: 1,
        fat: 0,
        msnf: 0,
        otherSolids: 0,
        totalSolids: 1,
        water: 0,
        pod: 1,
        pac: 1,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'glucose em pó (28-30 de)',
      {
        id: 'ing_195',
        name: 'Glucose em pó (28-30 DE)',
        category: 'Açúcares',
        costKg: 38,
        sugars: 0.95,
        fat: 0,
        msnf: 0,
        otherSolids: 0,
        totalSolids: 0.95,
        water: 0.05,
        pod: 0.28,
        pac: 0.48,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'dextrose',
      {
        id: 'ing_8',
        name: 'Dextrose',
        category: 'Açúcares',
        costKg: 32,
        sugars: 0.92,
        fat: 0,
        msnf: 0,
        otherSolids: 0,
        totalSolids: 0.92,
        water: 0.08,
        pod: 0.74,
        pac: 1.8,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'pectina cítrica / lm',
      {
        id: 'ing_246',
        name: 'Pectina Cítrica / LM',
        category: 'Neutros & Fibras',
        costKg: 280,
        sugars: 0,
        fat: 0,
        msnf: 0,
        otherSolids: 0.9,
        totalSolids: 0.9,
        water: 0.1,
        pod: 0,
        pac: 0,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'neutro',
      {
        id: 'ing_129',
        name: 'Neutro',
        category: 'Neutros, Gomas & Fibras',
        costKg: 200,
        sugars: 0,
        fat: 0,
        msnf: 0,
        otherSolids: 0.95,
        totalSolids: 0.95,
        water: 0.05,
        pod: 0,
        pac: 0,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'suco de limão',
      {
        id: 'ing_160',
        name: 'Suco de Limão',
        category: 'Frutas & Polpas',
        costKg: 13,
        sugars: 0.022,
        fat: 0,
        msnf: 0,
        otherSolids: 0.058,
        totalSolids: 0.08,
        water: 0.92,
        pod: 0.03,
        pac: 0.035,
        protein: 0.003,
        hasAllergen: false
      }
    ],
    [
      'creme de leite 35%',
      {
        id: 'ing_55',
        name: 'Creme de Leite 35%',
        category: 'Laticínios',
        costKg: 30,
        sugars: 0.04,
        fat: 0.35,
        msnf: 0.058,
        otherSolids: 0,
        totalSolids: 0.448,
        water: 0.552,
        pod: 0.03,
        pac: 0.04,
        protein: 0.02,
        hasAllergen: true
      }
    ],
    [
      'pasta de avelã s/ açúcar',
      {
        id: 'ing_avela',
        name: 'Pasta de Avelã s/ açúcar',
        category: 'Pastas & Oleaginosas',
        costKg: 140,
        sugars: 0.04,
        fat: 0.62,
        msnf: 0,
        otherSolids: 0.31,
        totalSolids: 0.97,
        water: 0.03,
        pod: 0.04,
        pac: 0.05,
        protein: 0.14,
        hasAllergen: true
      }
    ]
  ]);

  it('detects Neutro, Pectin and Gums as hydrocolloids even without category', () => {
    expect(isHydrocolloidIngredient('Neutro')).toBe(true);
    expect(isHydrocolloidIngredient('Pectina Cítrica / LM')).toBe(true);
    expect(isHydrocolloidIngredient('Pectina LM')).toBe(true);
    expect(isHydrocolloidIngredient('Goma Xantana')).toBe(true);
    expect(isHydrocolloidIngredient('Ágar-Ágar')).toBe(true);
    expect(isHydrocolloidIngredient('Açúcar')).toBe(false);
    expect(isHydrocolloidIngredient('Morango')).toBe(false);
    expect(isHydrocolloidIngredient('Suco de Limão')).toBe(false);
  });

  it('provides distinct hydrocolloid ranges per rheology level and matrix style', () => {
    const f1 = getHydrocolloidRangeForRheology(1, 'fruta_gelificada', 0);
    const f2 = getHydrocolloidRangeForRheology(2, 'fruta_gelificada', 0);
    const f3 = getHydrocolloidRangeForRheology(3, 'fruta_gelificada', 0);

    expect(f1.minPct).toBeLessThan(f2.minPct);
    expect(f2.minPct).toBeLessThan(f3.minPct);
    expect(f1.maxPct).toBeLessThan(f3.maxPct);

    const c2 = getHydrocolloidRangeForRheology(2, 'caramelo_toffee', 10);
    expect(c2.minPct).toBeLessThan(f2.minPct);
  });

  it('prescribes exact grams and acid activation when fruit recipe has 0% hydrocolloid', () => {
    const baseItems: VariegatoItemRow[] = [
      { name: 'Morango', grams: 600 },
      { name: 'Açúcar', grams: 160 },
      { name: 'Glucose em pó (28-30 DE)', grams: 180 },
      { name: 'Dextrose', grams: 20 }
    ];

    const a1 = calculateVariegatoBatchAnalysis(
      baseItems,
      68,
      1,
      'vitrine',
      VARIEGATO_STYLES.fruta_suave,
      mockIngredients
    );
    const a2 = calculateVariegatoBatchAnalysis(
      baseItems,
      68,
      2,
      'vitrine',
      VARIEGATO_STYLES.fruta_gelificada,
      mockIngredients
    );
    const a3 = calculateVariegatoBatchAnalysis(
      baseItems,
      68,
      3,
      'vitrine',
      VARIEGATO_STYLES.fruta_gelificada,
      mockIngredients
    );

    expect(a1.rheologyGuidance.status).toBe('below');
    expect(a2.rheologyGuidance.status).toBe('below');
    expect(a3.rheologyGuidance.status).toBe('below');

    expect(a1.rheologyGuidance.deltaGrams).toBeGreaterThan(0);
    expect(a2.rheologyGuidance.deltaGrams).toBeGreaterThan(a1.rheologyGuidance.deltaGrams);
    expect(a3.rheologyGuidance.deltaGrams).toBeGreaterThan(a2.rheologyGuidance.deltaGrams);

    expect(a2.rheologyGuidance.suggestedActionName).toBe('Pectina Cítrica / LM');
    expect(a2.rheologyGuidance.acidActivationNeeded).toBe(true);
    expect(a2.rheologyGuidance.acidGramsRecommended).toBeGreaterThan(0);
    expect(a2.rheologyGuidance.actionInstruction).toContain('Adicione');
  });

  it('clears acid activation alert when Suco de Limão is present', () => {
    const itemsWithAcid: VariegatoItemRow[] = [
      { name: 'Morango', grams: 600 },
      { name: 'Açúcar', grams: 160 },
      { name: 'Glucose em pó (28-30 DE)', grams: 180 },
      { name: 'Dextrose', grams: 20 },
      { name: 'Pectina Cítrica / LM', grams: 4 },
      { name: 'Suco de Limão', grams: 10 }
    ];

    const analysis = calculateVariegatoBatchAnalysis(
      itemsWithAcid,
      68,
      2,
      'vitrine',
      VARIEGATO_STYLES.fruta_gelificada,
      mockIngredients
    );

    expect(analysis.rheologyGuidance.status).toBe('aligned');
    expect(analysis.rheologyGuidance.deltaGrams).toBe(0);
    expect(analysis.rheologyGuidance.acidActivationNeeded).toBe(false);
  });

  it('uses existing hydrocolloid name for updates and advises reduction when overdosed', () => {
    const heavyPectinItems: VariegatoItemRow[] = [
      { name: 'Morango', grams: 600 },
      { name: 'Açúcar', grams: 160 },
      { name: 'Glucose em pó (28-30 DE)', grams: 180 },
      { name: 'Pectina LM', grams: 15 },
      { name: 'Suco de Limão', grams: 10 }
    ];

    const analysisL1 = calculateVariegatoBatchAnalysis(
      heavyPectinItems,
      68,
      1,
      'vitrine',
      VARIEGATO_STYLES.fruta_suave,
      mockIngredients
    );

    expect(analysisL1.rheologyGuidance.status).toBe('above');
    expect(analysisL1.rheologyGuidance.deltaGrams).toBeLessThan(0);
    expect(analysisL1.rheologyGuidance.suggestedActionName).toBe('Pectina LM');
    expect(analysisL1.rheologyGuidance.suggestedActionGrams).toBeLessThan(15);
    expect(analysisL1.rheologyGuidance.headline).toContain('reduza');
  });

  it('recommends Neutro and suppresses lemon acid recommendation on dairy / toffee matrices', () => {
    const toffeeItems: VariegatoItemRow[] = [
      { name: 'Açúcar', grams: 280 },
      { name: 'Creme de Leite 35%', grams: 350 },
      { name: 'Glucose em pó (28-30 DE)', grams: 150 }
    ];

    const guidance = evaluateRheologyGuidance(
      toffeeItems,
      3,
      VARIEGATO_STYLES.caramelo_toffee,
      {
        brix: 75,
        pac: 500,
        pacOnWater: 250,
        pod: 50,
        sugars: 65,
        fat: 15,
        hydrocolloids: 0,
        sucroseRatio: 55,
        water: 20,
        estimatedAw: 0.67
      },
      800,
      mockIngredients
    );

    expect(guidance.status).toBe('below');
    expect(guidance.suggestedActionName).toBe('Neutro');
    expect(guidance.acidActivationNeeded).toBe(false);
  });

  it('exempts fat-based cremes (creme_trufado / >=18% fat) from hydrocolloid errors and gives lipid guidance', () => {
    const trufadoItems: VariegatoItemRow[] = [
      { name: 'Pasta de Avelã s/ açúcar', grams: 700 },
      { name: 'Açúcar', grams: 300 }
    ];

    const analysisL1 = calculateVariegatoBatchAnalysis(
      trufadoItems,
      65,
      1,
      'vitrine',
      VARIEGATO_STYLES.creme_trufado,
      mockIngredients
    );

    expect(analysisL1.rheologyGuidance.isFatBasedExempt).toBe(true);
    expect(analysisL1.rheologyGuidance.status).toBe('aligned');
    expect(analysisL1.rheologyGuidance.actionInstruction).toContain('óleo vegetal');
  });

  it('generates prescriptive sugar swap grams for freezing_risk and too_fluid thermal states', () => {
    const freezing = evaluateThermalStatus(380, 'vitrine', 140);
    const freezingGuide = evaluateThermalGuidance(freezing, 700);
    expect(freezingGuide.status).toBe('freezing_risk');
    expect(freezingGuide.actionInstruction).toContain('Dextrose');
    expect(freezingGuide.actionInstruction).toMatch(/\d+ g/);

    const fluid = evaluateThermalStatus(760, 'vitrine', 420);
    const fluidGuide = evaluateThermalGuidance(fluid, 700);
    expect(fluidGuide.status).toBe('too_fluid');
    expect(fluidGuide.actionInstruction).toContain('Glucose');
    expect(fluidGuide.actionInstruction).toMatch(/\d+ g/);

    const ideal = evaluateThermalStatus(560, 'vitrine', 230);
    const idealGuide = evaluateThermalGuidance(ideal, 700);
    expect(idealGuide.status).toBe('ideal');
  });
});
