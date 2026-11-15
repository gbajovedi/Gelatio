import { describe, it, expect } from 'vitest';
import initialIngredients from '../../data/ingredients.json';
import initialRecipes from '../../data/recipes.json';
import initialPreparations from '../../data/preparations.json';
import { getInitialPreparationSteps, parseInstructionsToSteps } from '../preparationStepMigration';
import { calculatePreparationNutrients } from '../preparationSync';
import { Preparation, Ingredient, Recipe } from '../../types/gelato';

describe('PrePreparos crash diagnosis', () => {
  it('should run getInitialPreparationSteps on all preparations without throwing', () => {
    for (const prep of initialPreparations as Preparation[]) {
      expect(() => {
        const steps = getInitialPreparationSteps(prep);
        expect(Array.isArray(steps)).toBe(true);
      }).not.toThrow();
    }
  });

  it('should run calculatePreparationNutrients on all preparations without throwing', () => {
    for (const prep of initialPreparations as Preparation[]) {
      expect(() => {
        const profile = calculatePreparationNutrients(prep, initialIngredients as Ingredient[]);
        expect(profile).toBeDefined();
        expect(typeof profile.costKg).toBe('number');
        expect(isNaN(profile.costKg)).toBe(false);
      }).not.toThrow();
    }
  });

  it('should test filtering logic with empty search, category filters and method filters', () => {
    const preparations = initialPreparations as Preparation[];
    const categories = ['Todas', 'Pré-preparo', 'Variegato', 'Caldas', 'Creminos', 'Crumbles'] as const;
    const methods = ['todos', 'com_preparo', 'sem_preparo'] as const;

    for (const catFilter of categories) {
      for (const methodFilter of methods) {
        const filtered = preparations.filter(p => {
          const matchCat = catFilter === 'Todas' || p.category === catFilter;
          const matchSearch =
            '' === '' ||
            p.name.toLowerCase().includes(''.toLowerCase()) ||
            p.ingredients.some(i => i.name.toLowerCase().includes(''.toLowerCase()));

          const cardSteps = getInitialPreparationSteps(p);
          const hasStructuredSteps = cardSteps.length > 0;
          const hasTextOnly = !hasStructuredSteps && !!p.instructions && p.instructions.trim().length > 0;
          const hasMethod = hasStructuredSteps || hasTextOnly;

          const matchMethod =
            methodFilter === 'todos' ||
            (methodFilter === 'com_preparo' && hasMethod) ||
            (methodFilter === 'sem_preparo' && !hasMethod);

          return matchCat && matchSearch && matchMethod;
        });

        expect(Array.isArray(filtered)).toBe(true);
      }
    }
  });

  it('deve garantir a remoção definitiva das 9 bases obsoletas do banco de pré-preparos', () => {
    const preparations = initialPreparations as Preparation[];
    const removedBaseIds = [
      'prep_base_bianca_caramelo_salgado_cgu',
      'prep_base_bianca_cgu',
      'prep_base_cioccolato_cgu',
      'prep_base_de_gua',
      'prep_base_de_leite',
      'prep_base_de_leite_creme_de_leite_17_uht_',
      'prep_base_de_leite_fior_di_latte_',
      'prep_base_gialla_cgu',
      'prep_calda_base_agua_universal'
    ];

    for (const baseId of removedBaseIds) {
      expect(preparations.find(p => p.id === baseId)).toBeUndefined();
    }

    // Caldas Carpigiani também removidas
    const removedCaldaIds = [
      'prep_calda_caramelo_salgado_mou_cgu',
      'prep_sciroppo_stabilizzato_50_cgu',
      'prep_sciroppo_zucchero_70_cgu'
    ];
    for (const caldaId of removedCaldaIds) {
      expect(preparations.find(p => p.id === caldaId)).toBeUndefined();
    }
    expect(preparations.length).toBe(79);

    // Insumos legados vinculados às bases autorais e caldas também devem ter sido saneados
    const ingredients = initialIngredients as Ingredient[];
    const removedIngIds = ['ing_24', 'ing_25', 'ing_26', 'ing_27', 'ing_268'];
    for (const ingId of removedIngIds) {
      expect(ingredients.find(i => i.id === ingId)).toBeUndefined();
    }
  });
});
