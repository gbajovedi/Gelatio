import { describe, it, expect } from 'vitest';
import allRecipes from '../../data/recipes.json';
import allPreparations from '../../data/preparations.json';
import allIngredients from '../../data/ingredients.json';
import { Recipe, Preparation, Ingredient, PreparationStep } from '../../types/gelato';

describe('Auditoria Técnica e Refinamento do Compêndio Profissional Addolcire', () => {
  const recipes = allRecipes as Recipe[];
  const preparations = allPreparations as Preparation[];
  const ingredients = allIngredients as Ingredient[];

  it('deve conter no mínimo 39 pré-preparos cadastrados no catálogo oficial', () => {
    expect(preparations.length).toBeGreaterThanOrEqual(39);
  });

  it('deve conter os 16 novos pré-preparos e variegatos do compêndio com modo de preparo estruturado', () => {
    const expectedPrepIds = [
      'prep_geleia_frutas_vermelhas',
      'prep_caramelo_toffee_salgado',
      'prep_cremino_gianduia',
      'prep_castanha_peca_caramelizada_selada',
      'prep_crumble_tradicional',
      'prep_crumble_especiarias',
      'prep_cremino_pistache',
      'prep_cremino_chocolate',
      'prep_variegato_nutella_fluido',
      'prep_variegato_ovomaltine_crocante',
      'prep_variegato_tiramisu_biscoito',
      'prep_brownie_funcional',
      'prep_geleia_damasco_seco',
      'prep_geleia_laranja',
      'prep_leite_aveia_artesanal',
      'prep_casquinha_artesanal_gelato'
    ];

    for (const prepId of expectedPrepIds) {
      const prep = preparations.find(p => p.id === prepId);
      expect(prep, `Pré-preparo ${prepId} não encontrado`).toBeDefined();
      expect(prep!.name.length).toBeGreaterThan(0);
      expect(prep!.preparationSteps, `Passos não definidos para ${prepId}`).toBeDefined();
      expect(prep!.preparationSteps!.length, `Passos vazios para ${prepId}`).toBeGreaterThanOrEqual(2);

      const totalYield = prep!.ingredients.reduce((acc, i) => acc + i.grams, 0);
      expect(totalYield).toBeGreaterThan(0);

      prep!.preparationSteps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      });
    }
  });

  it('deve cadastrar o insumo Manjericão Fresco com propriedades físico-químicas adequadas', () => {
    const manjericao = ingredients.find(i => i.id === 'ing_218' || i.name === 'Manjericão Fresco');
    expect(manjericao).toBeDefined();
    expect(manjericao!.name).toBe('Manjericão Fresco');
    expect(manjericao!.water).toBe(0.92);
    expect(manjericao!.fat).toBe(0);
  });

  it('deve atualizar rec_142 com Manjericão Fresco substituindo Hortelã e passos artesanais', () => {
    const rec142 = recipes.find(r => r.id === 'rec_142');
    expect(rec142).toBeDefined();
    expect(rec142!.name).toBe('Sorbet de Morango e Manjericão (Addolcire)');

    const hasManjericao = rec142!.ingredients.some(i => i.name === 'Manjericão Fresco' && i.grams === 6);
    expect(hasManjericao).toBe(true);

    const hasHortela = rec142!.ingredients.some(i => i.name.toLowerCase().includes('hortelã'));
    expect(hasHortela).toBe(false);

    expect(rec142!.preparationSteps).toBeDefined();
    expect(rec142!.preparationSteps!.length).toBeGreaterThanOrEqual(6);
    const mentionsManjericao = rec142!.preparationSteps!.some(s => s.description.toLowerCase().includes('manjericão'));
    expect(mentionsManjericao).toBe(true);
  });

  it('deve cadastrar a nova receita rec_178 (Whey com Brownie) no catálogo proteico com passos e variegato', () => {
    const rec178 = recipes.find(r => r.id === 'rec_178');
    expect(rec178).toBeDefined();
    expect(rec178!.name).toBe('Gelato de Whey Protein com Brownie (Addolcire)');
    expect(rec178!.category).toBe('Gelatos Proteicos');
    expect(rec178!.targetStyle).toBe('Gelatos Proteicos');
    expect(rec178!.totalGrams).toBe(939);

    // Insumos da calda
    const hasWhey = rec178!.ingredients.some(i => i.name.toLowerCase().includes('whey'));
    expect(hasWhey).toBe(true);

    // Variegato
    expect(rec178!.variegatos).toBeDefined();
    expect(rec178!.variegatos!.length).toBe(1);
    expect(rec178!.variegatos![0].name).toBe('Brownie Funcional para Gelato');
    expect(rec178!.variegatos![0].grams).toBe(150);

    // Passos de preparo
    expect(rec178!.preparationSteps).toBeDefined();
    expect(rec178!.preparationSteps!.length).toBe(7);
    expect(rec178!.preparationSteps![6].category).toBe('mesclagem');

    // Instrução técnica crucial: adição do whey a frio após maturação
    const mentionsWheyCold = rec178!.preparationSteps!.some(
      s => s.description.toLowerCase().includes('whey') && s.description.toLowerCase().includes('frio')
    );
    expect(mentionsWheyCold).toBe(true);
  });

  it('deve garantir que as 23 receitas que necessitam de mescla pós-produtiva possuam variegatos e passo de mesclagem', () => {
    const targetIdsWithVariegatos = [
      'rec_22', 'rec_23', 'rec_24', 'rec_25', 'rec_26', 'rec_27', 'rec_28',
      'rec_35', 'rec_36', 'rec_37', 'rec_39', 'rec_41', 'rec_45', 'rec_47',
      'rec_52', 'rec_53', 'rec_54', 'rec_55', 'rec_56', 'rec_66', 'rec_68',
      'rec_112', 'rec_178'
    ];

    for (const id of targetIdsWithVariegatos) {
      const rec = recipes.find(r => r.id === id);
      expect(rec, `Receita ${id} não encontrada`).toBeDefined();
      expect(rec!.variegatos, `Receita ${id} (${rec!.name}) sem variegatos`).toBeDefined();
      expect(rec!.variegatos!.length, `Receita ${id} (${rec!.name}) com variegatos vazio`).toBeGreaterThanOrEqual(1);

      // Total de passos >= 7 e último passo é mesclagem
      expect(rec!.preparationSteps, `Receita ${id} sem preparationSteps`).toBeDefined();
      expect(rec!.preparationSteps!.length, `Receita ${id} deve ter ao menos 7 passos`).toBeGreaterThanOrEqual(7);
      const lastStep = rec!.preparationSteps![rec!.preparationSteps!.length - 1];
      expect(lastStep.category).toBe('mesclagem');
    }
  });

  it('deve garantir integridade físico-química: nenhum variegato deve estar na lista de ingredientes da calda', () => {
    for (const rec of recipes) {
      if (rec.variegatos && rec.variegatos.length > 0) {
        for (const v of rec.variegatos) {
          const foundInCalda = rec.ingredients.some(i => i.name.toLowerCase() === v.name.toLowerCase());
          expect(foundInCalda, `Variegato "${v.name}" duplicado na calda de ${rec.name}`).toBe(false);
        }
      }
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
