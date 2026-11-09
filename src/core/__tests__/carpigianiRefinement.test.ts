import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import allIngredients from '../../data/ingredients.json';
import { Recipe, Preparation, Ingredient } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Carpigiani Gelato University (Fase 8)', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];
  const ingredients = allIngredients as Ingredient[];

  it('deve conter as 7 novas bases, xaropes e caldas canônicas CGU com passos estruturados e tag (Carpigiani)', () => {
    const expectedPrepIds = [
      'prep_base_bianca_cgu',
      'prep_base_gialla_cgu',
      'prep_base_cioccolato_cgu',
      'prep_sciroppo_zucchero_70_cgu',
      'prep_sciroppo_stabilizzato_50_cgu',
      'prep_base_bianca_caramelo_salgado_cgu',
      'prep_calda_caramelo_salgado_mou_cgu'
    ];

    for (const prepId of expectedPrepIds) {
      const prep = preparations.find(p => p.id === prepId);
      expect(prep, `Pré-preparo ${prepId} não encontrado`).toBeDefined();
      expect(prep!.name.includes('(Carpigiani)'), `Nome de ${prep!.name} deve conter (Carpigiani)`).toBe(true);
      const totalYield = prep!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(totalYield).toBeGreaterThan(0);
      expect(['Pré-preparo', 'Caldas']).toContain(prep!.category);
      expect(prep!.preparationSteps).toBeDefined();
      expect(prep!.preparationSteps!.length).toBeGreaterThanOrEqual(3);

      prep!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.category).toBeDefined();
      });
    }
  });

  it('deve cadastrar as 6 receitas internacionais Carpigiani com batelada de 1.000g, passos estruturados e tag (Carpigiani)', () => {
    const expectedRecIds = [
      'rec_229', 'rec_230', 'rec_231', 'rec_232', 'rec_233', 'rec_234'
    ];

    for (const id of expectedRecIds) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();
      expect(rec!.name.includes('(Carpigiani)'), `Receita ${rec!.name} deve conter (Carpigiani)`).toBe(true);
      expect(rec!.totalGrams).toBe(1000);

      const sum = rec!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(sum, `Soma dos ingredientes de ${rec!.name} deve ser exatamente 1.000g`).toBe(1000);

      expect(rec!.preparationSteps).toBeDefined();
      expect(rec!.preparationSteps!.length).toBe(6);

      rec!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.category).toBeDefined();
      });
    }
  });

  it('deve conter ingredientes específicos e proporções canônicas de cada formulação Carpigiani', () => {
    // 1. Yogurt Gelato (rec_229)
    const rec229 = recipes.find(r => r.id === 'rec_229')!;
    expect(rec229.ingredients.some(i => i.name.toLowerCase().includes('iogurte') && i.grams === 540)).toBe(true);
    expect(rec229.ingredients.some(i => i.name.toLowerCase().includes('base bianca') && i.grams === 270)).toBe(true);
    expect(rec229.ingredients.some(i => i.name.toLowerCase().includes('cítrico'))).toBe(true);

    // 2. Frozen Yogurt (rec_230)
    const rec230 = recipes.find(r => r.id === 'rec_230')!;
    expect(rec230.ingredients.some(i => i.name.toLowerCase().includes('iogurte') && i.grams === 777)).toBe(true);

    // 3. Cheesecake New York (rec_231)
    const rec231 = recipes.find(r => r.id === 'rec_231')!;
    expect(rec231.ingredients.some(i => i.name.toLowerCase().includes('cream cheese') && i.grams === 250)).toBe(true);
    expect(rec231.ingredients.some(i => i.name.toLowerCase().includes('base bianca') && i.grams === 506)).toBe(true);

    // 4. Snickers / Amendoim (rec_232)
    const rec232 = recipes.find(r => r.id === 'rec_232')!;
    expect(rec232.ingredients.some(i => i.name.toLowerCase().includes('amendoim') && i.grams === 80)).toBe(true);
    expect(rec232.ingredients.some(i => i.name.toLowerCase().includes('base bianca') && i.grams === 761)).toBe(true);

    // 5. Crème Caramel (rec_233)
    const rec233 = recipes.find(r => r.id === 'rec_233')!;
    expect(rec233.ingredients.some(i => i.name.toLowerCase().includes('mascarpone') && i.grams === 110)).toBe(true);

    // 6. Caramelo Salgado Mou (rec_234)
    const rec234 = recipes.find(r => r.id === 'rec_234')!;
    expect(rec234.ingredients.some(i => i.name.toLowerCase().includes('caramelo salgado') && i.grams === 700)).toBe(true);
    expect(rec234.ingredients.some(i => i.name.toLowerCase().includes('mou') && i.grams === 300)).toBe(true);
  });

  it('deve garantir que os insumos canônicos e semi-acabados estejam calibrados com preços válidos', () => {
    const mascarpone = ingredients.find(i => i.id === 'ing_120')!;
    expect(mascarpone.costKg).toBe(115.0);

    const citricAcid = ingredients.find(i => i.id === 'ing_265')!;
    expect(citricAcid.costKg).toBe(32.0);

    const baseBianca = ingredients.find(i => i.id === 'ing_266')!;
    expect(baseBianca.costKg).toBe(14.5);
    expect(baseBianca.pac).toBeCloseTo(0.233, 2);
  });

  it('deve assegurar anonimização estrita e ausência de nomes pessoais de autores', () => {
    const forbiddenAuthorRegex = /\b(mantovani|nani|lulo)\b/i;

    for (const rec of recipes) {
      const jsonStr = JSON.stringify(rec);
      expect(forbiddenAuthorRegex.test(jsonStr), `Autor encontrado na receita ${rec.id}`).toBe(false);
    }

    for (const prep of preparations) {
      const jsonStr = JSON.stringify(prep);
      expect(forbiddenAuthorRegex.test(jsonStr), `Autor encontrado no pré-preparo ${prep.id}`).toBe(false);
    }
  });
});
