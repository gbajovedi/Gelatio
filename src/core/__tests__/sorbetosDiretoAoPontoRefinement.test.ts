import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import { Recipe, Preparation } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Sorbetos & Gelatos Veganos', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];

  it('deve conter no mínimo 46 pré-preparos cadastrados no catálogo oficial', () => {
    expect(preparations.length).toBeGreaterThanOrEqual(46);
  });

  it('deve conter o novo pré-preparo Caramelo Artesanal de Maracujá com etapas estruturadas', () => {
    const prep = preparations.find(p => p.id === 'prep_caramelo_maracuja');
    expect(prep, 'Pré-preparo prep_caramelo_maracuja não encontrado').toBeDefined();
    expect(prep!.name).toBe('Caramelo Artesanal de Maracujá para Gelato (Direto ao Ponto)');
    expect(prep!.category).toBe('Variegato');
    expect(prep!.preparationSteps).toBeDefined();
    expect(prep!.preparationSteps!.length).toBe(4);

    const totalYield = prep!.ingredients.reduce((acc, i) => acc + i.grams, 0);
    expect(totalYield).toBeGreaterThan(0);

    prep!.preparationSteps!.forEach((step, idx) => {
      expect(step.order).toBe(idx + 1);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
      expect(step.category).toBeDefined();
    });
  });

  it('deve calibrar a batelada exata das 19 receitas de sorbetos e veganos', () => {
    const targetIds = [
      'rec_71', 'rec_72', 'rec_73', 'rec_74', 'rec_75', 'rec_76', 'rec_77', 'rec_78', 'rec_79', 'rec_80',
      'rec_99', 'rec_100', 'rec_101', 'rec_102', 'rec_103', 'rec_104', 'rec_105',
      'rec_110'
    ];

    for (const id of targetIds) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();

      const expectedWeight = id === 'rec_80' ? 1100 : 1000;
      expect(rec!.totalGrams).toBe(expectedWeight);

      const sum = rec!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(sum, `Soma dos ingredientes de ${rec!.name} deve ser ${expectedWeight}g`).toBe(expectedWeight);

      // Passos estruturados
      expect(rec!.preparationSteps).toBeDefined();
      expect(rec!.preparationSteps!.length).toBeGreaterThanOrEqual(6);
      rec!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.category).toBeDefined();
      });
    }
  });

  it('deve conter o protocolo de pasteurização seletiva a 75°C-80°C e fruta a frio nos sorbets', () => {
    const fruitSorbetIds = ['rec_71', 'rec_73', 'rec_74', 'rec_75', 'rec_76', 'rec_77', 'rec_79'];

    for (const id of fruitSorbetIds) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();

      expect(text.includes('75°c') || text.includes('80°c'), `Receita ${rec!.name} deve aquecer a base a 75°C-80°C`).toBe(true);
      expect(text.includes('frio') || text.includes('4°c'), `Receita ${rec!.name} deve orientar adição da fruta a frio`).toBe(true);
    }
  });

  it('deve vincular o Caramelo de Maracujá como variegato no Sorbet de Manga com Maracujá (rec_72)', () => {
    const rec72 = recipes.find(r => r.id === 'rec_72');
    expect(rec72).toBeDefined();
    expect(rec72!.variegatos).toBeDefined();
    expect(rec72!.variegatos!.length).toBe(1);
    expect(rec72!.variegatos![0].name).toBe('Caramelo Artesanal de Maracujá para Gelato (Direto ao Ponto)');
    expect(rec72!.variegatos![0].grams).toBe(120);

    expect(rec72!.preparationSteps!.length).toBe(7);
    expect(rec72!.preparationSteps![6].category).toBe('mesclagem');
  });

  it('deve conter infusão aromática de raspas de mexerica no rec_78', () => {
    const rec78 = recipes.find(r => r.id === 'rec_78');
    const text = rec78!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
    expect(text.includes('raspas') && text.includes('mexerica'), 'rec_78 deve conter raspas de mexerica nos passos').toBe(true);
  });

  it('deve conter emulsão lipídica a quente nos gelatos veganos (rec_99 a rec_105)', () => {
    const veganIds = ['rec_99', 'rec_100', 'rec_101', 'rec_102', 'rec_103', 'rec_104', 'rec_105'];

    for (const id of veganIds) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
      expect((text.includes('85°c') || text.includes('90°c')) && text.includes('mixer'), `Receita ${rec!.name} deve emulsionar a quente (85°C–90°C) no mixer`).toBe(true);
    }
  });

  it('deve conter incorporação a frio de cachaça e limão no Sorbet de Caipirinha (rec_110)', () => {
    const rec110 = recipes.find(r => r.id === 'rec_110');
    const text = rec110!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
    expect(text.includes('cachaça') && (text.includes('frio') || text.includes('gelada')), 'rec_110 deve adicionar cachaça a frio').toBe(true);
  });

  it('deve garantir total anonimização de autores nas receitas e pré-preparos', () => {
    const forbiddenAuthorRegex = /\b(mantovani|nani|lulo)\b/i;

    for (const rec of recipes) {
      const jsonStr = JSON.stringify(rec);
      expect(forbiddenAuthorRegex.test(jsonStr), `Autor encontrado na receita ${rec.id} (${rec.name})`).toBe(false);
    }

    for (const prep of preparations) {
      const jsonStr = JSON.stringify(prep);
      expect(forbiddenAuthorRegex.test(jsonStr), `Autor encontrado no pré-preparo ${prep.id} (${prep.name})`).toBe(false);
    }
  });
});

