import { describe, it, expect } from 'vitest';
import initialPreparations from '../../data/preparations.json';
import initialRecipes from '../../data/recipes.json';
import { Recipe, Preparation } from '../../types/gelato';

describe('Refinamento de Receitas e Pré-Preparos: Compêndio Gelato Base de Leite', () => {
  const preparations = initialPreparations as Preparation[];
  const recipes = initialRecipes as Recipe[];

  describe('1. Pré-preparos e Variegatos cadastrados', () => {
    it('deve conter no mínimo 23 pré-preparos/variegatos no total', () => {
      expect(preparations.length).toBeGreaterThanOrEqual(23);
    });

    const expectedNewPreps = [
      'prep_chocolate_flocagem',
      'prep_gostosuras_cookies_brownie',
      'prep_chocolate_branco_assado',
      'prep_suco_maracuja_reduzido',
      'prep_pure_banana_assada',
      'prep_leite_coco_fresco_artesanal',
      'prep_sucrilhos_crocantes_selados'
    ];

    expectedNewPreps.forEach(id => {
      it(`deve conter o novo pré-preparo/variegato '${id}' com passos estruturados`, () => {
        const prep = preparations.find(p => p.id === id);
        expect(prep).toBeDefined();
        expect(prep?.name.length).toBeGreaterThan(0);
        expect(prep?.ingredients.length).toBeGreaterThan(0);
        expect(prep?.preparationSteps).toBeDefined();
        expect(prep?.preparationSteps?.length).toBeGreaterThanOrEqual(3);
        
        // Verificar que cada passo possui id, order, title, description
        prep?.preparationSteps?.forEach((step, idx) => {
          expect(step.order).toBe(idx + 1);
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
        });
      });
    });
  });

  describe('2. Auditoria Físico-Química e Separação de Calda vs. Variegatos vs. Infusões', () => {
    const targetRecipeIds = [
      'rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5', 'rec_6', 'rec_7', 'rec_8',
      'rec_9', 'rec_10', 'rec_11', 'rec_12', 'rec_13', 'rec_14', 'rec_15',
      'rec_17', 'rec_18', 'rec_19', 'rec_60', 'rec_61', 'rec_62', 'rec_63', 'rec_109'
    ];

    it('todas as 23 receitas auditadas devem existir e possuir passos de preparo customizados', () => {
      targetRecipeIds.forEach(id => {
        const r = recipes.find(rec => rec.id === id);
        expect(r).toBeDefined();
        expect(r?.preparationSteps).toBeDefined();
        expect(r?.preparationSteps?.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('rec_5 (Crema di Santa Fina) NÃO deve ter raspa de limão na calda líquida (deve estar estritamente no modo de preparo)', () => {
      const r5 = recipes.find(rec => rec.id === 'rec_5');
      expect(r5).toBeDefined();
      const hasLemonZestInCalda = r5?.ingredients.some(i => i.name.toLowerCase().includes('raspa'));
      expect(hasLemonZestInCalda).toBe(false);
      expect(r5?.totalGrams).toBe(1000);

      // Verificar que as instruções de infusão e coagem estão presentes nos passos
      const stepTexts = r5?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts).toMatch(/grãos de café/i);
      expect(stepTexts).toMatch(/raspas/i);
      expect(stepTexts).toMatch(/coagem|peneira/i);
    });

    it('rec_2 (Café Bianco Flocado) deve conter variegato de chocolate de flocagem e infusão coada no modo de preparo', () => {
      const r2 = recipes.find(rec => rec.id === 'rec_2');
      expect(r2).toBeDefined();
      expect(r2?.variegatos).toBeDefined();
      expect(r2?.variegatos?.length).toBe(1);
      expect(r2?.variegatos?.[0].name).toContain('Chocolate para Flocagem');
      expect(r2?.variegatos?.[0].grams).toBe(80);

      // Não deve ter grãos de café na calda líquida
      const hasCoffeeBeansInCalda = r2?.ingredients.some(i => i.name.toLowerCase().includes('grão'));
      expect(hasCoffeeBeansInCalda).toBe(false);

      // Passo de infusão e filtragem
      const stepTexts = r2?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts).toMatch(/grãos de café/i);
      expect(stepTexts).toMatch(/coando e descartando|peneira/i);
      expect(stepTexts).toMatch(/flocagem/i);
    });

    it('rec_3 (Chocolate com Gostosuras) deve conter 240g de variegato de cookies & brownies sem poluir a calda', () => {
      const r3 = recipes.find(rec => rec.id === 'rec_3');
      expect(r3).toBeDefined();
      expect(r3?.variegatos).toBeDefined();
      expect(r3?.variegatos?.[0].name).toContain('Gostosuras de Confeitaria');
      expect(r3?.variegatos?.[0].grams).toBe(240);
      expect(r3?.totalGrams).toBe(1000);

      const stepTexts = r3?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts).toMatch(/15 minutos/i);
      expect(stepTexts).toMatch(/dobrar/i);
    });

    it('rec_9 (Cream Cheese) e rec_60 (Pudim) devem conter seus respectivos variegatos cadastrados', () => {
      const r9 = recipes.find(rec => rec.id === 'rec_9');
      expect(r9?.variegatos?.[0].name).toContain('Doce de Leite');
      expect(r9?.variegatos?.[0].grams).toBe(250);

      const r60 = recipes.find(rec => rec.id === 'rec_60');
      expect(r60?.variegatos?.[0].name).toContain('Caramelo');
      expect(r60?.variegatos?.[0].grams).toBe(150);
    });

    it('rec_12 (Chocolate Branco Assado) deve detalhar a técnica de caramelização no forno nos passos', () => {
      const r12 = recipes.find(rec => rec.id === 'rec_12');
      const stepTexts = r12?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts).toMatch(/160°C/);
      expect(stepTexts).toMatch(/15 minutos/);
      expect(stepTexts).toMatch(/silicone|silpat/i);
    });

    it('rec_14 (Milho) deve detalhar o cozimento a 84°C por 20 minutos para gelatinizar o amido', () => {
      const r14 = recipes.find(rec => rec.id === 'rec_14');
      const stepTexts = r14?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts).toMatch(/84°C/);
      expect(stepTexts).toMatch(/20 minutos/);
      expect(stepTexts).toMatch(/amido/i);
    });

    it('rec_13 (Iogurte) e rec_61 (Maracujá) devem instruir a adição a frio dos ácidos para não talhar a calda', () => {
      const r13 = recipes.find(rec => rec.id === 'rec_13');
      const stepTexts13 = r13?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts13).toMatch(/NÃO adicionar o iogurte/i);
      expect(stepTexts13).toMatch(/4°C/);

      const r61 = recipes.find(rec => rec.id === 'rec_61');
      const stepTexts61 = r61?.preparationSteps?.map(s => s.description).join(' ') || '';
      expect(stepTexts61).toMatch(/reduz/i);
      expect(stepTexts61).toMatch(/175g/);
    });
  });

  describe('3. Diretriz de Anonimização Absoluta', () => {
    it('não deve conter nenhuma menção isolada a nome próprio ou autor informal nos pré-preparos', () => {
      const prepsJson = JSON.stringify(preparations);
      const matches = [...prepsJson.matchAll(/\blulo\b/gi)];
      expect(matches.length).toBe(0);
    });

    it('não deve conter nenhuma menção isolada a nome próprio ou autor informal nas receitas', () => {
      const recsJson = JSON.stringify(recipes);
      const matches = [...recsJson.matchAll(/\blulo\b/gi)];
      expect(matches.length).toBe(0);
    });
  });
});
