import { describe, it, expect } from 'vitest';
import {
  PREPARATION_TEMPLATES,
  VARIEGATO_STEP_TEMPLATE,
  instantiateTemplateSteps,
  suggestPreparationTemplate
} from '../preparationTemplates';
import { Recipe } from '../../types/gelato';

describe('preparationTemplates', () => {
  it('deve conter exatamente 6 estilos canônicos (3 profissionais e 3 caseiros)', () => {
    expect(PREPARATION_TEMPLATES).toHaveLength(6);

    const proTemplates = PREPARATION_TEMPLATES.filter(t => !t.id.includes('caseiro'));
    const homeTemplates = PREPARATION_TEMPLATES.filter(t => t.id.includes('caseiro'));

    expect(proTemplates).toHaveLength(3);
    expect(homeTemplates).toHaveLength(3);

    expect(proTemplates.map(t => t.id)).toEqual([
      'processo_quente_tradicional',
      'gelato_frutas_pos_pasteurizacao',
      'processo_frio_sorbet'
    ]);

    expect(homeTemplates.map(t => t.id)).toEqual([
      'gelato_caseiro_tradicional',
      'gelato_caseiro_frutas',
      'processo_frio_caseiro'
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
    const proMilkRecipe: Recipe = {
      id: '1',
      name: 'Fior di Latte',
      category: 'Gelatos de Leite',
      targetStyle: 'Gelatos de Leite',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proMilkRecipe).id).toBe('processo_quente_tradicional');

    const proFruitRecipe: Recipe = {
      id: '2',
      name: 'Gelato de Morango com Leite',
      category: 'Gelatos de Fruta',
      targetStyle: 'Gelatos de Fruta',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proFruitRecipe).id).toBe('gelato_frutas_pos_pasteurizacao');

    const proSorbetRecipe: Recipe = {
      id: '3',
      name: 'Sorbet de Limão Siciliano',
      category: 'Sorbets Base Água',
      targetStyle: 'Sorbets',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(proSorbetRecipe).id).toBe('processo_frio_sorbet');

    const homeMilkRecipe: Recipe = {
      id: '4',
      name: 'Gelato Caseiro de Baunilha (EOS)',
      category: 'Gelatos Caseiros',
      targetStyle: 'Gelatos de Leite',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeMilkRecipe).id).toBe('gelato_caseiro_tradicional');

    const homeFruitRecipe: Recipe = {
      id: '5',
      name: 'Gelato Caseiro de Morango',
      category: 'Gelatos de Fruta',
      targetStyle: 'Gelatos de Fruta',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeFruitRecipe).id).toBe('gelato_caseiro_frutas');

    const homeSorbetRecipe: Recipe = {
      id: '6',
      name: 'Sorbet Caseiro de Manga (EOS003)',
      category: 'Sorbets',
      targetStyle: 'Sorbets',
      ingredients: [],
      totalGrams: 1000
    };
    expect(suggestPreparationTemplate(homeSorbetRecipe).id).toBe('processo_frio_caseiro');
  });
});
