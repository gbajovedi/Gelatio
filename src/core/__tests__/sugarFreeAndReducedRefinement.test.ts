import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import { Recipe, Preparation } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Gelatos Sem Adição de Açúcar e com Redução de Açúcar', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];

  it('deve conter no mínimo 45 pré-preparos cadastrados no catálogo oficial', () => {
    expect(preparations.length).toBeGreaterThanOrEqual(45);
  });

  it('deve conter os 3 novos pré-preparos/variegatos técnicos com etapas estruturadas', () => {
    const expectedPrepIds = [
      'prep_leite_pistache_artesanal',
      'prep_coco_ralado_fresco_variegato',
      'prep_polpa_maracuja_reduzida'
    ];

    for (const prepId of expectedPrepIds) {
      const prep = preparations.find(p => p.id === prepId);
      expect(prep, `Pré-preparo ${prepId} não encontrado`).toBeDefined();
      expect(prep!.name.length).toBeGreaterThan(0);
      expect(prep!.preparationSteps).toBeDefined();
      expect(prep!.preparationSteps!.length).toBeGreaterThanOrEqual(3);

      const totalYield = prep!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(totalYield).toBeGreaterThan(0);

      prep!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.category).toBeDefined();
      });
    }
  });

  it('deve garantir que o catálogo oficial contenha exatamente 159 receitas', () => {
    expect(recipes.length).toBe(159);
  });

  it('deve cadastrar as 10 novas receitas com Açúcar de Maçã com batelada de 1000g e passos artesanais', () => {
    const newSugarReducedIds = [
      'rec_179', 'rec_180', 'rec_181', 'rec_182', 'rec_183',
      'rec_184', 'rec_185', 'rec_186', 'rec_187', 'rec_188'
    ];

    for (const id of newSugarReducedIds) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();
      expect(rec!.name.includes('(Redução de Açúcar)')).toBe(true);
      expect(rec!.totalGrams).toBe(1000);

      const sum = rec!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(sum, `Soma dos ingredientes de ${rec!.name} deve ser 1000g`).toBe(1000);

      // Deve conter Açúcar de Maçã
      const hasAppleSugar = rec!.ingredients.some(i => i.name.toLowerCase().includes('maçã'));
      expect(hasAppleSugar, `Receita ${rec!.name} deve conter Açúcar de Maçã`).toBe(true);

      // Passos estruturados
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

  it('deve garantir que as 22 receitas existentes sem açúcar (rec_144 a rec_165) tenham passos refinados', () => {
    for (let num = 144; num <= 165; num++) {
      const id = `rec_${num}`;
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();
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

  it('deve conter cuidados físico-químicos especializados nas receitas zero', () => {
    // 1. Chocolate com gema de ovo (rec_148 e rec_149): aquecimento brando até 80°C
    for (const id of ['rec_148', 'rec_149']) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
      expect(text.includes('80°c') && text.includes('gema'), `Receita ${rec!.name} deve conter controle de 80°C da gema`).toBe(true);
    }

    // 2. Iogurte (rec_160 e rec_161): iogurte adicionado a frio / não vai ao fogo
    for (const id of ['rec_160', 'rec_161']) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
      expect(text.includes('frio') && text.includes('iogurte'), `Receita ${rec!.name} deve orientar adição a frio do iogurte`).toBe(true);
    }

    // 3. Cacau com Laranja Vegano (rec_162 e rec_163): raspas de laranja como infusão coada
    for (const id of ['rec_162', 'rec_163']) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
      expect(text.includes('laranja') && (text.includes('infusão') || text.includes('filtrar')), `Receita ${rec!.name} deve conter infusão e filtragem de raspas`).toBe(true);
      // Nenhuma raspa de laranja na lista de ingredientes da calda líquida
      const hasZestInIngredients = rec!.ingredients.some(i => i.name.toLowerCase().includes('raspa'));
      expect(hasZestInIngredients, `Receita ${rec!.name} não deve ter raspas como ingrediente líquido da calda`).toBe(false);
    }

    // 4. Gelatos de Coco (rec_152 a rec_155): variegatos com coco ralado crocante e passo 7 de mesclagem
    for (const id of ['rec_152', 'rec_153', 'rec_154', 'rec_155']) {
      const rec = recipes.find(r => r.id === id);
      expect(rec!.variegatos).toBeDefined();
      expect(rec!.variegatos!.length).toBeGreaterThanOrEqual(1);
      expect(rec!.variegatos![0].name).toBe('Coco Ralado Fresco Crocante');
      expect(rec!.preparationSteps!.length).toBe(7);
      expect(rec!.preparationSteps![6].category).toBe('mesclagem');
    }

    // 5. Pistache (rec_156 a rec_159): pasta pura 100% adicionada a frio pós-descanso
    for (const id of ['rec_156', 'rec_157', 'rec_158', 'rec_159']) {
      const rec = recipes.find(r => r.id === id);
      const text = rec!.preparationSteps!.map(s => `${s.title} ${s.description}`).join(' ').toLowerCase();
      expect(text.includes('pistache') && (text.includes('frio') || text.includes('descansar')), `Receita ${rec!.name} deve orientar adição da pasta após descanso`).toBe(true);
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

