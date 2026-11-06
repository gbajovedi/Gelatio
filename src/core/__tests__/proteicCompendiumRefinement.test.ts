import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import { Recipe, Preparation } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Gelatos Proteicos', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];

  it('deve conter no mínimo 42 pré-preparos cadastrados no catálogo oficial', () => {
    expect(preparations.length).toBeGreaterThanOrEqual(42);
  });

  it('deve conter os 3 novos pré-preparos e variegatos funcionais com etapas detalhadas', () => {
    const expectedPrepIds = [
      'prep_cookie_proteico_amendoim',
      'prep_crumble_proteico_aveia',
      'prep_pure_frutas_vermelhas_inativado'
    ];

    for (const prepId of expectedPrepIds) {
      const prep = preparations.find(p => p.id === prepId);
      expect(prep, `Pré-preparo ${prepId} não encontrado`).toBeDefined();
      expect(prep!.name.length).toBeGreaterThan(0);
      expect(prep!.preparationSteps).toBeDefined();
      expect(prep!.preparationSteps!.length).toBeGreaterThanOrEqual(4);

      const totalYield = prep!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(totalYield).toBeGreaterThan(0);

      prep!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      });
    }
  });

  it('deve garantir que 100% das 12 receitas proteicas possuam batelada exata de 1000g', () => {
    const proteicIds = [
      'rec_166', 'rec_167', 'rec_168', 'rec_169', 'rec_170', 'rec_171',
      'rec_172', 'rec_173', 'rec_174', 'rec_175', 'rec_176', 'rec_177'
    ];

    for (const id of proteicIds) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();
      expect(rec!.totalGrams).toBe(1000);

      const sum = rec!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(sum, `Soma dos ingredientes de ${rec!.name} deve ser 1000g`).toBe(1000);
    }
  });

  it('deve garantir que as 12 receitas proteicas possuam 6 passos de preparo especializados', () => {
    const proteicIds = [
      'rec_166', 'rec_167', 'rec_168', 'rec_169', 'rec_170', 'rec_171',
      'rec_172', 'rec_173', 'rec_174', 'rec_175', 'rec_176', 'rec_177'
    ];

    for (const id of proteicIds) {
      const rec = recipes.find(r => r.id === id);
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

  it('deve conter protocolo térmico de incorporação do Whey Protein fora do calor nas linhas baunilha, chocolate e oleaginosas', () => {
    const targetIds = [
      'rec_166', 'rec_167', 'rec_168',
      'rec_169', 'rec_170', 'rec_171',
      'rec_172', 'rec_173', 'rec_174'
    ];

    for (const id of targetIds) {
      const rec = recipes.find(r => r.id === id);
      const allText = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();

      // Deve orientar a adição sem ferver / fora do calor / off-heat / mixer
      const hasWheyOffHeat = allText.includes('whey') && (allText.includes('calor') || allText.includes('fogo') || allText.includes('off-heat'));
      expect(hasWheyOffHeat, `Receita ${rec!.name} deve orientar adição do whey fora do calor`).toBe(true);

      // Deve orientar temperatura de serviço a -12°C
      const mentionsServiceTemp = allText.includes('-12°c');
      expect(mentionsServiceTemp, `Receita ${rec!.name} deve mencionar serviço a -12°C`).toBe(true);
    }
  });

  it('deve conter protocolo de inativação enzimática de frutas nas receitas proteicas de frutas ao leite', () => {
    const fruitIds = ['rec_175', 'rec_176', 'rec_177'];

    for (const id of fruitIds) {
      const rec = recipes.find(r => r.id === id);
      const allText = rec!.preparationSteps!.map(s => s.description).join(' ').toLowerCase();

      const mentionsInactivation = allText.includes('inativar') || allText.includes('inativação') || allText.includes('sinérise');
      expect(mentionsInactivation, `Receita ${rec!.name} deve orientar protocolo de inativação enzimática`).toBe(true);
    }
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
