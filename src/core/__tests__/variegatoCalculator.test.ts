import { describe, it, expect } from 'vitest';
import {
  calculateVariegatoBatchAnalysis,
  getIngredientBrix,
  isHydrocolloidIngredient,
  isSucroseIngredient,
  calculateEstimatedAw,
  evaluateThermalStatus,
  evaluateRheologyStatus
} from '../variegatoCalculator';
import { VARIEGATO_STYLES } from '../variegatoStyles';
import { Ingredient } from '../../types/gelato';
import { VariegatoItemRow } from '../../types/variegato';

describe('Variegato Balancer Calculator Engine', () => {
  // Mock ingredients map
  const mockIngredients = new Map<string, Ingredient>([
    [
      'polpa de morango',
      {
        id: 'ing_morango',
        name: 'Polpa de Morango',
        category: 'Frutas',
        costKg: 20.0,
        sugars: 0.08,
        fat: 0.003,
        msnf: 0,
        otherSolids: 0.02,
        totalSolids: 0.103,
        water: 0.897,
        pod: 0.08,
        pac: 0.08,
        protein: 0.007,
        hasAllergen: false
      }
    ],
    [
      'açúcar refinado',
      {
        id: 'ing_sacarose',
        name: 'Açúcar refinado',
        category: 'Açúcares',
        costKg: 4.5,
        sugars: 1.0,
        fat: 0,
        msnf: 0,
        otherSolids: 0,
        totalSolids: 1.0,
        water: 0,
        pod: 1.0,
        pac: 1.0,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'xarope de glicose 40 de',
      {
        id: 'ing_glicose',
        name: 'Xarope de Glicose 40 DE',
        category: 'Açúcares',
        costKg: 12.0,
        sugars: 0.42,
        fat: 0,
        msnf: 0,
        otherSolids: 0.40,
        totalSolids: 0.82,
        water: 0.18,
        pod: 0.45,
        pac: 0.80,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'dextrose',
      {
        id: 'ing_dextrose',
        name: 'Dextrose',
        category: 'Açúcares',
        costKg: 15.0,
        sugars: 1.0,
        fat: 0,
        msnf: 0,
        otherSolids: 0,
        totalSolids: 0.92,
        water: 0.08,
        pod: 0.74,
        pac: 1.90,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'pectina lm',
      {
        id: 'ing_pectina',
        name: 'Pectina LM',
        category: 'Neutros, Gomas & Fibras',
        costKg: 120.0,
        sugars: 0,
        fat: 0,
        msnf: 0,
        otherSolids: 0.90,
        totalSolids: 0.90,
        water: 0.10,
        pod: 0,
        pac: 0,
        protein: 0,
        hasAllergen: false
      }
    ],
    [
      'pasta de avelã',
      {
        id: 'ing_avela',
        name: 'Pasta de Avelã',
        category: 'Pastas & Oleaginosas',
        costKg: 90.0,
        sugars: 0.05,
        fat: 0.62,
        msnf: 0,
        otherSolids: 0.30,
        totalSolids: 0.97,
        water: 0.03,
        pod: 0.05,
        pac: 0.05,
        protein: 0.14,
        hasAllergen: true,
        allergenDetails: ['avelã']
      }
    ]
  ]);

  it('correctly detects hydrocolloids and sucrose ingredients', () => {
    expect(isHydrocolloidIngredient('Pectina LM')).toBe(true);
    expect(isHydrocolloidIngredient('Goma Xantana')).toBe(true);
    expect(isHydrocolloidIngredient('Ágar-Ágar')).toBe(true);
    expect(isHydrocolloidIngredient('Açúcar refinado')).toBe(false);

    expect(isSucroseIngredient('Açúcar refinado')).toBe(true);
    expect(isSucroseIngredient('Açúcar demerara')).toBe(true);
    expect(isSucroseIngredient('Sacarose')).toBe(true);
    expect(isSucroseIngredient('Xarope de Glicose 40 DE')).toBe(false);
    expect(isSucroseIngredient('Dextrose')).toBe(false);
  });

  it('calculates intrinsic Brix of ingredients correctly', () => {
    const morangoRow: VariegatoItemRow = { name: 'Polpa de Morango', grams: 500 };
    const brixMorango = getIngredientBrix(morangoRow, mockIngredients.get('polpa de morango'));
    // totalSolids (0.103) - fat (0.003) = 0.10 => 10 Brix
    expect(brixMorango).toBe(10);

    const sugarRow: VariegatoItemRow = { name: 'Açúcar refinado', grams: 300 };
    const brixSugar = getIngredientBrix(sugarRow, mockIngredients.get('açúcar refinado'));
    expect(brixSugar).toBe(100);

    const customRow: VariegatoItemRow = { name: 'Polpa de Maracujá', grams: 500, customBrix: 14.5 };
    expect(getIngredientBrix(customRow)).toBe(14.5);
  });

  it('calculates Norrish water activity (aw) within realistic thermodynamic boundaries', () => {
    const aw65 = calculateEstimatedAw(65);
    const aw70 = calculateEstimatedAw(70);
    const aw75 = calculateEstimatedAw(75);

    expect(aw65).toBeLessThan(0.85);
    expect(aw65).toBeGreaterThan(0.70);
    expect(aw70).toBeLessThan(aw65);
    expect(aw75).toBeLessThan(aw70);
  });

  it('computes thermal status accurately for Vitrine (-12°C) and Freezer (-18°C)', () => {
    // Vitrine (-12°C)
    const vitrineIdeal = evaluateThermalStatus(560, 'vitrine');
    expect(vitrineIdeal.status).toBe('ideal');
    expect(vitrineIdeal.targetTemp).toBe(-12);

    const vitrineTooHard = evaluateThermalStatus(400, 'vitrine');
    expect(vitrineTooHard.status).toBe('freezing_risk');

    const vitrineTooSoft = evaluateThermalStatus(720, 'vitrine');
    expect(vitrineTooSoft.status).toBe('too_fluid');

    // Freezer (-18°C)
    const freezerIdeal = evaluateThermalStatus(620, 'freezer');
    expect(freezerIdeal.status).toBe('ideal');
    expect(freezerIdeal.targetTemp).toBe(-18);

    const freezerTooHard = evaluateThermalStatus(500, 'freezer');
    expect(freezerTooHard.status).toBe('freezing_risk');
  });

  it('computes rheology status and viscosities across 3 levels', () => {
    const l1 = evaluateRheologyStatus(1, 0.25);
    const l2 = evaluateRheologyStatus(2, 0.55);
    const l3 = evaluateRheologyStatus(3, 0.80);

    expect(l1.profile).toBe('fluid');
    expect(l2.profile).toBe('balanced');
    expect(l3.profile).toBe('structured');

    expect(l1.estimatedCps).toBeLessThan(l2.estimatedCps);
    expect(l2.estimatedCps).toBeLessThan(l3.estimatedCps);
  });

  it('calculates mass balance, final target scale weight, and evaporation loss', () => {
    // Formulando Geleia de Morango para Gelato:
    // 600g Morango (10° Brix = 60g sólidos)
    // 250g Açúcar refinado (100° Brix = 250g sólidos)
    // 150g Glicose 40 DE (82° Brix = 123g sólidos)
    // 6g Pectina LM (90° Brix = 5.4g sólidos)
    // Total peso inicial = 1006g
    // Total sólidos solúveis = 60 + 250 + 123 + 5.4 = 438.4g
    // Brix Alvo = 68° Brix
    // Peso Final Alvo = 438.4 / 0.68 = 644.7g
    // Evaporação = 1006 - 644.7 = 361.3g de água

    const items: VariegatoItemRow[] = [
      { name: 'Polpa de Morango', grams: 600 },
      { name: 'Açúcar refinado', grams: 250 },
      { name: 'Xarope de Glicose 40 DE', grams: 150 },
      { name: 'Pectina LM', grams: 6 }
    ];

    const result = calculateVariegatoBatchAnalysis(
      items,
      68, // Target Brix
      2,  // Rheology Level 2
      'vitrine',
      VARIEGATO_STYLES.fruta_gelificada,
      mockIngredients,
      15
    );

    expect(result.initialWeightGrams).toBe(1006);
    expect(result.totalSolubleSolidsGrams).toBeCloseTo(438.4, 1);
    expect(result.finalWeightGrams).toBeCloseTo(644.7, 1);
    expect(result.waterEvaporatedGrams).toBeCloseTo(361.3, 1);
    expect(result.cookingState).toBe('active_reduction');

    // Concentração pós-cocção
    expect(result.percentages.brix).toBeCloseTo(68.0, 1);
    // Pectina no peso final: 6g / 644.7g = ~0.93%
    expect(result.percentages.hydrocolloids).toBeCloseTo(0.93, 2);

    // Açúcares e Sacarose Ratio:
    // Açúcar morango (600*0.08=48g) + Açúcar refinado (250g) + Glicose (150*0.42=63g) = 361g
    // Sacarose total = 250g
    // Sacarose ratio = 250 / 361 = ~69.25% (> 60%, triggers alert)
    expect(result.percentages.sucroseRatio).toBeGreaterThan(60);
    expect(result.alerts.crystallizationRisk).toBe(true);
    expect(result.alerts.messages.length).toBeGreaterThan(0);

    // Custo real por kg pronto
    // Custo insumos = 600g*20 + 250g*4.5 + 150g*12 + 6g*120
    // = 12.00 + 1.125 + 1.80 + 0.72 = R$ 15.645
    // Custo por kg pronto = 15.645 / 0.6447 kg = ~R$ 24.27/kg
    expect(result.costing.finalCostKg).toBeGreaterThan(result.costing.initialCost);
    expect(result.costing.finalCostKg).toBeCloseTo(24.27, 0);

    // Balança de Cocção: Instruções devem conter o peso final em destaque
    const scaleStep = result.cookingInstructions.find(s => s.includes('Cocção & Redução na Balança'));
    expect(scaleStep).toBeDefined();
    expect(scaleStep).toContain('645g');
  });

  it('correctly balances an anti-crystallization formulation with dextrose/glucose', () => {
    // Balanceando para reduzir sacarose abaixo de 60%:
    // 600g Morango (48g açúcar)
    // 160g Açúcar refinado (160g sacarose)
    // 180g Xarope de Glicose (75.6g açúcares)
    // 60g Dextrose (60g açúcares)
    // 6g Pectina LM
    // Total açúcares = 48 + 160 + 75.6 + 60 = 343.6g
    // Sacarose = 160g => 160 / 343.6 = 46.5% (< 60%!)
    const balancedItems: VariegatoItemRow[] = [
      { name: 'Polpa de Morango', grams: 600 },
      { name: 'Açúcar refinado', grams: 160 },
      { name: 'Xarope de Glicose 40 DE', grams: 180 },
      { name: 'Dextrose', grams: 60 },
      { name: 'Pectina LM', grams: 6 }
    ];

    const result = calculateVariegatoBatchAnalysis(
      balancedItems,
      68,
      2,
      'vitrine',
      VARIEGATO_STYLES.fruta_gelificada,
      mockIngredients
    );

    expect(result.percentages.sucroseRatio).toBeLessThan(60);
    expect(result.alerts.crystallizationRisk).toBe(false);
  });

  it('handles cold mix (e.g. Cremino de Avelã / Trufado) without evaporation loss', () => {
    const coldItems: VariegatoItemRow[] = [
      { name: 'Pasta de Avelã', grams: 700 },
      { name: 'Açúcar refinado', grams: 300 }
    ];

    const result = calculateVariegatoBatchAnalysis(
      coldItems,
      65,
      3,
      'vitrine',
      VARIEGATO_STYLES.creme_trufado,
      mockIngredients
    );

    expect(result.cookingState).toBe('cold');
    expect(result.waterEvaporatedGrams).toBe(0);
    expect(result.finalWeightGrams).toBe(1000);
    expect(result.cookingInstructions[0]).toContain('Homogeneização a Frio');
  });
});
