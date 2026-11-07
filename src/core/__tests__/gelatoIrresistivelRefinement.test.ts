import { describe, it, expect } from 'vitest';
import initialRecipes from '../../data/recipes.json';
import initialIngredients from '../../data/ingredients.json';
import initialPreparations from '../../data/preparations.json';
import { Recipe, Ingredient, Preparation } from '../../types/gelato';

describe('Auditoria e Refinamento do Compêndio Gelato Irresistível', () => {
  const recipes = initialRecipes as Recipe[];
  const ingredients = initialIngredients as Ingredient[];
  const preparations = initialPreparations as Preparation[];

  it('deve conter as 40 receitas oficiais cadastradas de rec_189 a rec_228 com sufixo oficial', () => {
    const irrestistivelRecipes = recipes.filter(r => r.name.includes('(Gelato Irresistível)'));
    expect(irrestistivelRecipes.length).toBe(40);

    for (let i = 189; i <= 228; i++) {
      const rec = recipes.find(r => r.id === `rec_${i}`);
      expect(rec).toBeDefined();
      expect(rec!.name).toContain('(Gelato Irresistível)');
      expect(rec!.preparationSteps).toBeDefined();
      expect(rec!.preparationSteps!.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('todas as 40 receitas devem fechar a calda base em rigorosamente 1.000g', () => {
    const irrestistivelRecipes = recipes.filter(r => r.name.includes('(Gelato Irresistível)'));
    for (const rec of irrestistivelRecipes) {
      const sumCalda = rec.ingredients.reduce((acc, curr) => acc + curr.grams, 0);
      expect(sumCalda).toBe(1000);
      expect(rec.totalGrams).toBe(1000);
    }
  });

  it('deve conter os 13 novos pré-preparos e variegatos cadastrados em preparations.json', () => {
    const expectedPreps = [
      'prep_gir_geleia_padrao',
      'prep_gir_geleia_amora',
      'prep_gir_geleia_figo',
      'prep_gir_geleia_mirtilo',
      'prep_gir_arroz_doce',
      'prep_gir_caramelo_flor_de_sal',
      'prep_gir_calda_caramelo_salgado',
      'prep_gir_crocante_gergelim_preto',
      'prep_gir_avelas_tostadas',
      'prep_gir_torrone_cubos',
      'prep_gir_flocagem_chocolate_meio_amargo',
      'prep_gir_flocagem_chocolate_branco',
      'prep_gir_rocambole_cubos'
    ];

    for (const prepId of expectedPreps) {
      const prep = preparations.find(p => p.id === prepId);
      expect(prep).toBeDefined();
      expect(prep!.preparationSteps).toBeDefined();
      expect(prep!.preparationSteps!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('deve conter os novos insumos com parâmetros bromatológicos corretos em ingredients.json', () => {
    const expectedIngIds = [
      'ing_219', 'ing_220', 'ing_221', 'ing_222', 'ing_223', 'ing_224',
      'ing_225', 'ing_226', 'ing_227', 'ing_228'
    ];

    for (const ingId of expectedIngIds) {
      const ing = ingredients.find(i => i.id === ingId);
      expect(ing).toBeDefined();
      expect(ing!.pac).toBeGreaterThanOrEqual(0);
      expect(ing!.totalSolids + ing!.water).toBeCloseTo(1.0, 2);
    }
  });

  it('deve garantir anonimização estrita sem menção a autores proibidos no catálogo ou testes', () => {
    const forbiddenPattern = /(breno|lerner|brenolerner)/i;
    const allJsonString = JSON.stringify(recipes) + JSON.stringify(ingredients) + JSON.stringify(preparations);
    expect(allJsonString).not.toMatch(forbiddenPattern);
  });
});
