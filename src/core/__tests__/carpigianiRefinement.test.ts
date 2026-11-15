import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import allIngredients from '../../data/ingredients.json';
import { Recipe, Preparation, Ingredient } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Carpigiani Gelato University (Fase 8)', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];
  const ingredients = allIngredients as Ingredient[];

  it('deve garantir a remoção definitiva de todas as caldas e xaropes da Carpigiani do banco de preparações', () => {
    const removedPrepIds = [
      'prep_sciroppo_zucchero_70_cgu',
      'prep_sciroppo_stabilizzato_50_cgu',
      'prep_calda_caramelo_salgado_mou_cgu'
    ];

    for (const prepId of removedPrepIds) {
      expect(preparations.find(p => p.id === prepId), `Pré-preparo ${prepId} não deveria mais constar`).toBeUndefined();
    }

    // Validação da remoção das 4 bases CGU de pré-preparos obsoletas
    const removedBases = [
      'prep_base_bianca_cgu',
      'prep_base_gialla_cgu',
      'prep_base_cioccolato_cgu',
      'prep_base_bianca_caramelo_salgado_cgu'
    ];
    for (const baseId of removedBases) {
      expect(preparations.find(p => p.id === baseId)).toBeUndefined();
    }

    // Nenhuma preparação remanescente deve carregar a tag (Carpigiani)
    const anyCarpigianiPrep = preparations.filter(p => p.name.includes('(Carpigiani)'));
    expect(anyCarpigianiPrep.length).toBe(0);
    expect(preparations.length).toBe(79);
  });

  it('deve garantir a remoção definitiva das 6 receitas Carpigiani do catálogo de receitas e banco de dados', () => {
    const removedRecIds = [
      'rec_229', 'rec_230', 'rec_231', 'rec_232', 'rec_233', 'rec_234'
    ];

    for (const id of removedRecIds) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não deveria mais constar no catálogo`).toBeUndefined();
    }

    const anyCarpigianiRecipe = recipes.filter(r => r.name.includes('(Carpigiani)'));
    expect(anyCarpigianiRecipe.length).toBe(0);
    expect(recipes.length).toBe(200);
  });

  it('deve garantir a remoção dos insumos órfãos e validar insumos canônicos restantes', () => {
    // Insumos órfãos removidos
    const removedIngIds = ['ing_266', 'ing_267', 'ing_268', 'ing_269'];
    for (const ingId of removedIngIds) {
      expect(ingredients.find(i => i.id === ingId)).toBeUndefined();
    }

    // Insumos ativos canônicos calibrados com preços válidos
    const mascarpone = ingredients.find(i => i.id === 'ing_120')!;
    expect(mascarpone.costKg).toBe(115.0);

    const citricAcid = ingredients.find(i => i.id === 'ing_265')!;
    expect(citricAcid.costKg).toBe(32.0);
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
