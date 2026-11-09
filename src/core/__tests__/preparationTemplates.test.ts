import { describe, it, expect } from 'vitest';
import {
  PREPARATION_TEMPLATES,
  VARIEGATO_STEP_TEMPLATE,
  instantiateTemplateSteps,
  suggestPreparationTemplate
} from '../preparationTemplates';
import { Recipe } from '../../types/gelato';
import allRecipes from '../../data/recipes.json';

describe('preparationTemplates', () => {
  it('deve conter exatamente 14 estilos canônicos (7 profissionais e 7 caseiros)', () => {
    expect(PREPARATION_TEMPLATES).toHaveLength(14);

    const proTemplates = PREPARATION_TEMPLATES.filter(t => !t.id.includes('caseiro'));
    const homeTemplates = PREPARATION_TEMPLATES.filter(t => t.id.includes('caseiro'));

    expect(proTemplates).toHaveLength(7);
    expect(homeTemplates).toHaveLength(7);

    expect(proTemplates.map(t => t.id)).toEqual([
      'processo_quente_tradicional',
      'gelato_frutas_pos_pasteurizacao',
      'processo_frio_sorbet',
      'gelato_alcoolico_profissional',
      'gelato_proteico_profissional',
      'gelato_chocolate_cacau_profissional',
      'gelato_crema_gemas_profissional'
    ]);

    expect(homeTemplates.map(t => t.id)).toEqual([
      'gelato_caseiro_tradicional',
      'gelato_caseiro_frutas',
      'processo_frio_caseiro',
      'gelato_caseiro_alcoolico',
      'gelato_caseiro_proteico',
      'gelato_chocolate_cacau_caseiro',
      'gelato_crema_gemas_caseiro'
    ]);
  });

  it('deve definir o template de mesclagem/variegato com categoria mesclagem', () => {
    expect(VARIEGATO_STEP_TEMPLATE.category).toBe('mesclagem');
    expect(VARIEGATO_STEP_TEMPLATE.title).toContain('Mesclagem');
  });

  it('deve instanciar passos sem mesclagem quando includeVariegato for falso', () => {
    const tpl = PREPARATION_TEMPLATES[0];
    const steps = instantiateTemplateSteps(tpl, false);

    expect(steps).toHaveLength(tpl.steps.length);
    expect(steps.some(s => s.category === 'mesclagem')).toBe(false);
    expect(steps[0].id).toBeDefined();
    expect(steps[0].order).toBe(1);
    expect(steps[steps.length - 1].order).toBe(steps.length);
  });

  it('deve instanciar passos com mesclagem acoplada no final quando includeVariegato for verdadeiro', () => {
    const tpl = PREPARATION_TEMPLATES[0];
    const steps = instantiateTemplateSteps(tpl, true);

    expect(steps).toHaveLength(tpl.steps.length + 1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.category).toBe('mesclagem');
    expect(lastStep.order).toBe(steps.length);
    expect(lastStep.title).toBe(VARIEGATO_STEP_TEMPLATE.title);
  });

  it('deve sugerir o modelo adequado de acordo com a receita e contexto profissional vs caseiro', () => {
    const homeMilkRecipe: Recipe = {
      id: '1',
      name: 'Fior di Latte',
      category: 'Gelatos de Leite',
      targetStyle: 'Gelatos de Leite',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeMilkRecipe).id).toBe('gelato_caseiro_tradicional');

    const homeFruitRecipe: Recipe = {
      id: '2',
      name: 'Gelato de Morango com Leite',
      category: 'Gelatos de Leite com Fruta',
      targetStyle: 'Gelatos de Leite com Fruta',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeFruitRecipe).id).toBe('gelato_caseiro_frutas');

    const homeSorbetRecipe: Recipe = {
      id: '3',
      name: 'Sorbet de Limão Siciliano',
      category: 'Sorbets Cítricos',
      targetStyle: 'Sorbets',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeSorbetRecipe).id).toBe('processo_frio_caseiro');

    const homeAlcoholRecipe: Recipe = {
      id: '4',
      name: 'Gelato de Licor de Amaretto',
      category: 'Gelatos Alcoólicos',
      targetStyle: 'Gelatos Alcoólicos',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeAlcoholRecipe).id).toBe('gelato_caseiro_alcoolico');

    const homeProteicRecipe: Recipe = {
      id: '5',
      name: 'Gelato de Baunilha Proteico (Whey)',
      category: 'Gelatos Proteicos',
      targetStyle: 'Gelatos Proteicos',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeProteicRecipe).id).toBe('gelato_caseiro_proteico');

    const proAlcoholRecipe: Recipe = {
      id: '6',
      name: 'Gelato Profissional de Whisky',
      category: 'Gelatos Alcoólicos',
      targetStyle: 'Gelatos Alcoólicos',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proAlcoholRecipe).id).toBe('gelato_alcoolico_profissional');

    const proProteicRecipe: Recipe = {
      id: '7',
      name: 'Gelato Profissional Proteico',
      category: 'Gelatos Proteicos',
      targetStyle: 'Gelatos Proteicos',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proProteicRecipe).id).toBe('gelato_proteico_profissional');

    const homeChocoRecipe: Recipe = {
      id: '8',
      name: 'Gelato de Chocolate Amargo',
      category: 'Gelatos de Leite com Chocolate',
      targetStyle: 'Gelatos de Leite com Chocolate',
      ingredients: [{ name: 'Chocolate 70%', grams: 150 }],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeChocoRecipe).id).toBe('gelato_chocolate_cacau_caseiro');

    const homeEggRecipe: Recipe = {
      id: '9',
      name: 'Gelato de Crema Tradicional',
      category: 'Gelatos de Leite',
      targetStyle: 'Gelatos de Leite',
      ingredients: [{ name: 'Gema de ovo', grams: 80 }],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeEggRecipe).id).toBe('gelato_crema_gemas_caseiro');

    const proChocoRecipe: Recipe = {
      id: '10',
      name: 'Gelato Profissional de Cacau Intenso',
      category: 'Gelatos de Leite com Chocolate',
      targetStyle: 'Gelatos de Leite com Chocolate',
      ingredients: [{ name: 'Cacau em Pó 100%', grams: 60 }],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proChocoRecipe).id).toBe('gelato_chocolate_cacau_profissional');

    const proEggRecipe: Recipe = {
      id: '11',
      name: 'Gelato Profissional Crema Zabaione',
      category: 'Gelatos de Leite',
      targetStyle: 'Gelatos de Leite',
      ingredients: [{ name: 'Gema de ovo', grams: 100 }],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proEggRecipe).id).toBe('gelato_crema_gemas_profissional');
  });

  it('deve garantir que 100% das receitas do catálogo possuem preparationSteps válidos', () => {
    expect(allRecipes.length).toBeGreaterThanOrEqual(159);

    for (const recipe of allRecipes as Recipe[]) {
      expect(recipe.preparationSteps, `Receita ${recipe.id} (${recipe.name}) sem preparationSteps`).toBeDefined();
      expect(recipe.preparationSteps!.length, `Receita ${recipe.id} com lista vazia de passos`).toBeGreaterThanOrEqual(6);

      recipe.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.category).toBeDefined();
      });
    }

    // Verificar receitas emblemáticas com mesclagem acoplada (Passo 7)
    const pudim = (allRecipes as Recipe[]).find(r => r.id === 'rec_60');
    expect(pudim).toBeDefined();
    expect(pudim!.preparationSteps!.length).toBe(7);
    expect(pudim!.preparationSteps![6].category).toBe('mesclagem');

    const amarena = (allRecipes as Recipe[]).find(r => r.id === 'rec_22');
    expect(amarena).toBeDefined();
    expect(amarena!.preparationSteps!.length).toBe(7);
    expect(amarena!.preparationSteps![6].category).toBe('mesclagem');
  });
});
