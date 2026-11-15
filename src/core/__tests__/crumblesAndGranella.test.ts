import { describe, it, expect } from 'vitest';
import initialPreparations from '../../data/preparations.json';
import initialIngredients from '../../data/ingredients.json';
import { calculatePreparationNutrients } from '../preparationSync';
import { Preparation, Ingredient } from '../../types/gelato';

describe('Crumbles category rename and Granella de Pistache recipe', () => {
  it('should have zero preparations with category "Inclusões Crocantes"', () => {
    const preps = initialPreparations as Preparation[];
    const oldCatPreps = preps.filter(p => (p.category as string) === 'Inclusões Crocantes');
    expect(oldCatPreps.length).toBe(0);
  });

  it('should have preparations under category "Crumbles"', () => {
    const preps = initialPreparations as Preparation[];
    const crumbles = preps.filter(p => p.category === 'Crumbles');
    expect(crumbles.length).toBeGreaterThanOrEqual(22);
  });

  it('should have "prep_granella_crocante_pistache" configured with exact 80g proportions and steps', () => {
    const preps = initialPreparations as Preparation[];
    const granella = preps.find(p => p.id === 'prep_granella_crocante_pistache');

    expect(granella).toBeDefined();
    if (!granella) return;

    expect(granella.category).toBe('Crumbles');
    expect(granella.name).toContain('Granella Crocante de Pistache');

    // Check ingredients
    const pistache = granella.ingredients.find(i => i.name.toLowerCase().includes('pistache'));
    const acucar = granella.ingredients.find(i => i.name.toLowerCase().includes('açúcar'));
    const agua = granella.ingredients.find(i => i.name.toLowerCase().includes('água'));
    const sal = granella.ingredients.find(i => i.name.trim().toLowerCase() === 'sal');

    expect(pistache).toBeDefined();
    expect(acucar).toBeDefined();
    expect(agua).toBeDefined();
    expect(sal).toBeDefined();

    expect(pistache?.grams).toBe(80);
    expect(acucar?.grams).toBe(28);
    expect(agua?.grams).toBe(16);
    expect(sal?.grams).toBe(1.2);

    // Verify proportions relative to 80g of pistachio:
    // Açúcar: 35% -> 80 * 0.35 = 28g
    // Água: 20% -> 80 * 0.20 = 16g
    // Sal: 1.5% -> 80 * 0.015 = 1.2g
    expect(acucar!.grams / pistache!.grams).toBeCloseTo(0.35, 4);
    expect(agua!.grams / pistache!.grams).toBeCloseTo(0.20, 4);
    expect(sal!.grams / pistache!.grams).toBeCloseTo(0.015, 4);

    // Check preparation steps
    expect(granella.preparationSteps).toBeDefined();
    expect(granella.preparationSteps!.length).toBeGreaterThanOrEqual(6);

    const stepOrders = granella.preparationSteps!.map(s => s.order);
    expect(stepOrders).toEqual([1, 2, 3, 4, 5, 6]);

    // Check step content covers required technical phases
    const allStepText = granella.preparationSteps!.map(s => s.description).join(' ');
    expect(allStepText).toContain('140°C');
    expect(allStepText).toContain('150°C');
    expect(allStepText).toContain('clorofila');
    expect(allStepText).toContain('extração');
    expect(allStepText).toContain('peneira');
    expect(allStepText).toContain('manteiga de cacau');
    expect(allStepText).toContain('hidrofóbica');
  });

  it('should calculate valid nutrients and allergens for Granella de Pistache', () => {
    const preps = initialPreparations as Preparation[];
    const granella = preps.find(p => p.id === 'prep_granella_crocante_pistache')!;
    const profile = calculatePreparationNutrients(granella, initialIngredients as Ingredient[]);

    expect(profile.totalGrams).toBeCloseTo(125.2, 1);
    expect(profile.fat).toBeGreaterThan(0.2);
    expect(profile.sugars).toBeGreaterThan(0.2);
    expect(profile.hasAllergen).toBe(true);
    expect(profile.allergenDetails).toContain('Castanhas & Nozes');
    expect(profile.costKg).toBeGreaterThan(0);
  });

  it('should not contain any forbidden author or brand names in granella', () => {
    const preps = initialPreparations as Preparation[];
    const granella = preps.find(p => p.id === 'prep_granella_crocante_pistache')!;
    const forbidden = /pennisi|morrone|palatrone|gelatiere famoso/i;
    expect(forbidden.test(JSON.stringify(granella))).toBe(false);
  });
});
