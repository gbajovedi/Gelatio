import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Preparation } from '../../types/gelato';
import { getInitialPreparationSteps } from '../preparationStepMigration';
import { isNeutroIngredient, roundIngredientGrams } from '../calculator';

const STORAGE_EXPANDED_INGREDIENTS = 'gelatio_preparations_expanded_ingredients';

describe('Pré-preparos: Persistência de Expansão de Ingredientes & Métricas', () => {
  let memoryStorage: Record<string, string> = {};

  beforeEach(() => {
    memoryStorage = {};

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => memoryStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        memoryStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete memoryStorage[key];
      }),
      clear: vi.fn(() => {
        memoryStorage = {};
      }),
      key: vi.fn((index: number) => Object.keys(memoryStorage)[index] || null),
      length: 0
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve ter todos os cards contraídos por padrão quando não há nada no localStorage', () => {
    const raw = localStorage.getItem(STORAGE_EXPANDED_INGREDIENTS);
    expect(raw).toBeNull();
    const state: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    expect(state['prep_pudim']).toBeUndefined();
    expect(!!state['prep_pudim']).toBe(false);
  });

  it('deve salvar e recuperar o estado de expansão individual ao alternar', () => {
    const initial: Record<string, boolean> = {};
    initial['prep_pudim'] = true;
    localStorage.setItem(STORAGE_EXPANDED_INGREDIENTS, JSON.stringify(initial));

    const restored: Record<string, boolean> = JSON.parse(
      localStorage.getItem(STORAGE_EXPANDED_INGREDIENTS) || '{}'
    );
    expect(restored['prep_pudim']).toBe(true);
    expect(!!restored['prep_cocada']).toBe(false);
  });

  it('deve calcular corretamente proporções percentuais e peso total da batelada', () => {
    const samplePrep: Preparation = {
      id: 'test_prep',
      name: 'Calda de Frutas Vermelhas',
      category: 'Variegato',
      instructions: 'Cozinhar tudo até engrossar',
      ingredients: [
        { name: 'Frutas Vermelhas', grams: 500 },
        { name: 'Açúcar Cristal', grams: 300 },
        { name: 'Água', grams: 200 }
      ]
    };

    const totalGrams = samplePrep.ingredients.reduce((acc, curr) => acc + curr.grams, 0);
    expect(totalGrams).toBe(1000);

    const percentages = samplePrep.ingredients.map(ing => ({
      name: ing.name,
      percentage: ((ing.grams / totalGrams) * 100).toFixed(1)
    }));

    expect(percentages[0].percentage).toBe('50.0');
    expect(percentages[1].percentage).toBe('30.0');
    expect(percentages[2].percentage).toBe('20.0');
  });

  it('deve fornecer passos estruturados para o modal mesmo se originados de instructions', () => {
    const prepWithTextOnly: Preparation = {
      id: 'text_prep',
      name: 'Geleia Simples',
      category: 'Variegato',
      instructions: '1. Fervura: Misturar os ingredientes e ferver a 100°C por 10 min.\n2. Resfriamento: Esfriar na geladeira por 2h a 4°C.',
      ingredients: [{ name: 'Morango', grams: 400 }]
    };

    const steps = getInitialPreparationSteps(prepWithTextOnly);
    expect(steps.length).toBe(2);
    expect(steps[0].title).toBe('Fervura');
    expect(steps[0].temperature).toBe('100°C');
    expect(steps[0].duration).toBe('10 min');
    expect(steps[1].title).toBe('Resfriamento');
    expect(steps[1].temperature).toBe('4°C');
    expect(steps[1].duration).toBe('2h');
  });

  it('deve categorizar status do preparo entre estruturado, texto livre e pendente', () => {
    const prepSteps: Preparation = {
      id: 'p1',
      name: 'P1',
      category: 'Variegato',
      instructions: '',
      preparationSteps: [{ id: 's1', title: 'Cozimento', description: 'desc', category: 'aquecimento', order: 1 }],
      ingredients: []
    };
    const prepText: Preparation = {
      id: 'p2',
      name: 'P2',
      category: 'Pré-preparo',
      instructions: 'Misturar bem todos os ingredientes secos.',
      ingredients: []
    };
    const prepPending: Preparation = {
      id: 'p3',
      name: 'P3',
      category: 'Pré-preparo',
      instructions: '',
      ingredients: []
    };

    expect(getInitialPreparationSteps(prepSteps).length).toBe(1);
    expect(prepSteps.preparationSteps!.length > 0).toBe(true);

    expect(prepText.instructions.trim().length > 0).toBe(true);
    expect(prepPending.instructions.trim().length === 0).toBe(true);
  });

  it('deve calcular corretamente o vínculo de uso de pré-preparos em receitas', () => {
    const prepName = 'Geleia Artesanal de Morango';
    const mockRecipes = [
      {
        id: 'r1',
        name: 'Gelato Cheesecake',
        ingredients: [{ name: 'Leite', grams: 600 }],
        variegatos: [{ name: 'Geleia Artesanal de Morango', grams: 150 }]
      },
      {
        id: 'r2',
        name: 'Gelato Iogurte com Frutas',
        ingredients: [{ name: 'Geleia Artesanal de Morango', grams: 100 }],
        variegatos: []
      },
      {
        id: 'r3',
        name: 'Gelato Pistache',
        ingredients: [{ name: 'Pistache', grams: 100 }],
        variegatos: []
      }
    ];

    const matched = mockRecipes.filter(r =>
      r.ingredients.some(i => i.name.toLowerCase() === prepName.toLowerCase()) ||
      r.variegatos?.some(v => v.name.toLowerCase() === prepName.toLowerCase())
    );

    expect(matched.length).toBe(2);
    expect(matched.map(m => m.name)).toEqual(['Gelato Cheesecake', 'Gelato Iogurte com Frutas']);
  });

  it('deve filtrar conjuntamente por categoria e status de modo de preparo', () => {
    const list: Preparation[] = [
      {
        id: 'p1',
        name: 'Base de Água',
        category: 'Pré-preparo',
        instructions: '',
        ingredients: []
      },
      {
        id: 'p2',
        name: 'Brownie Funcional',
        category: 'Pré-preparo',
        instructions: 'Assar a 180°C',
        ingredients: []
      },
      {
        id: 'p3',
        name: 'Variegato Morango',
        category: 'Variegato',
        instructions: 'Ferver e reduzir',
        ingredients: []
      },
      {
        id: 'p4',
        name: 'Variegato Sem Modo',
        category: 'Variegato',
        instructions: '',
        ingredients: []
      }
    ];

    const filterFn = (cat: 'Todas' | 'Pré-preparo' | 'Variegato', method: 'todos' | 'com_preparo' | 'sem_preparo') => {
      return list.filter(p => {
        const matchCat = cat === 'Todas' || p.category === cat;
        const steps = getInitialPreparationSteps(p);
        const hasMethod = steps.length > 0 || (!!p.instructions && p.instructions.trim().length > 0);
        const matchMethod =
          method === 'todos' ||
          (method === 'com_preparo' && hasMethod) ||
          (method === 'sem_preparo' && !hasMethod);
        return matchCat && matchMethod;
      });
    };

    // Pré-preparo + Sem Preparo
    const pendingBases = filterFn('Pré-preparo', 'sem_preparo');
    expect(pendingBases.map(p => p.id)).toEqual(['p1']);

    // Variegato + Com Preparo
    const readyVariegatos = filterFn('Variegato', 'com_preparo');
    expect(readyVariegatos.map(p => p.id)).toEqual(['p3']);

    // Todas + Sem Preparo
    const allPending = filterFn('Todas', 'sem_preparo');
    expect(allPending.map(p => p.id)).toEqual(['p1', 'p4']);
  });

  describe('Modo Cozinha: Escalonamento de Lote, Custos e Checklist de Pesagem', () => {
    it('deve calcular corretamente o escalonamento proporcional do lote e custo proporcional', () => {
      const samplePrep: Preparation = {
        id: 'prep_doce_leite',
        name: 'Doce de Leite Artesanal',
        category: 'Pré-preparo',
        instructions: 'Cozinhar lentamente',
        ingredients: [
          { name: 'Leite Integral', grams: 800 },
          { name: 'Açúcar Cristal', grams: 200 }
        ]
      };

      const baseWeight = samplePrep.ingredients.reduce((acc, curr) => acc + curr.grams, 0);
      expect(baseWeight).toBe(1000);

      // Escala para lote alvo de 2.500 g (2,5 kg)
      const targetBatchGrams = 2500;
      const scaleRatio = targetBatchGrams / baseWeight;
      expect(scaleRatio).toBe(2.5);

      const scaledIngredients = samplePrep.ingredients.map(ing => ({
        name: ing.name,
        grams: ing.grams * scaleRatio
      }));

      expect(scaledIngredients[0].grams).toBe(2000);
      expect(scaledIngredients[1].grams).toBe(500);

      // Custo: supondo custo de R$ 15,00/kg
      const costKg = 15.0;
      const totalBatchCost = (targetBatchGrams * costKg) / 1000;
      expect(totalBatchCost).toBe(37.5);
    });

    it('deve preservar 1 casa decimal para insumos neutros/estabilizantes mesmo com valores arredondados', () => {
      const isNeutro = isNeutroIngredient('Neutro para Gelato', 'Neutros e Estabilizantes');
      expect(isNeutro).toBe(true);

      // Formulação com 5 g em 1.000 g -> em lote de 750 g = 3.75 g
      const scaledRaw = 3.75;
      const roundedVal = roundIngredientGrams(scaledRaw, isNeutro, true);
      // Como é neutro, mesmo com showRounded=true, deve preservar 1 casa decimal (3.8)
      expect(roundedVal).toBe(3.8);

      // Insumo normal (não neutro) com showRounded=true deve arredondar para inteiro
      const normalVal = roundIngredientGrams(125.4, false, true);
      expect(normalVal).toBe(125);
    });

    it('deve alternar e resetar itens do checklist de pesagem de bancada', () => {
      let checkedState: Record<string, boolean> = {};

      const toggleCheck = (name: string) => {
        checkedState = { ...checkedState, [name]: !checkedState[name] };
      };

      const resetChecks = () => {
        checkedState = {};
      };

      toggleCheck('Leite Integral');
      expect(checkedState['Leite Integral']).toBe(true);
      expect(checkedState['Açúcar']).toBeFalsy();

      toggleCheck('Açúcar');
      expect(checkedState['Leite Integral']).toBe(true);
      expect(checkedState['Açúcar']).toBe(true);

      toggleCheck('Leite Integral');
      expect(checkedState['Leite Integral']).toBe(false);
      expect(checkedState['Açúcar']).toBe(true);

      resetChecks();
      expect(Object.keys(checkedState).length).toBe(0);
    });

    it('deve calcular múltiplos ergonômicos da receita base para preparos com pesos artesanais variados', () => {
      // Exemplo real: Pudim com 2.110 g
      const pudimPrep: Preparation = {
        id: 'prep_pudim',
        name: 'Pudim',
        category: 'Pré-preparo',
        instructions: 'Assar em banho-maria',
        ingredients: [
          { name: 'Ovo Galinha', grams: 350 },
          { name: 'Leite Condensado', grams: 800 },
          { name: 'Leite Integral', grams: 800 },
          { name: 'Açúcar', grams: 160 }
        ]
      };

      const baseWeight = pudimPrep.ingredients.reduce((acc, curr) => acc + curr.grams, 0);
      expect(baseWeight).toBe(2110);

      const multipliers = [0.5, 1, 1.5, 2, 3, 4, 5];

      // Verificando os pesos calculados para cada multiplicador
      const calculatedWeights = multipliers.map(m => Math.round(baseWeight * m));
      expect(calculatedWeights).toEqual([1055, 2110, 3165, 4220, 6330, 8440, 10550]);

      // Verificando pesagem de meia receita (0.5x)
      const halfScaleRatio = 1055 / baseWeight;
      const halfOvos = pudimPrep.ingredients.find(i => i.name === 'Ovo Galinha')!.grams * halfScaleRatio;
      expect(halfOvos).toBe(175); // exatamente metade de 350g

      // Verificando pesagem de dobro (2x)
      const doubleScaleRatio = 4220 / baseWeight;
      const doubleLeiteCond = pudimPrep.ingredients.find(i => i.name === 'Leite Condensado')!.grams * doubleScaleRatio;
      expect(doubleLeiteCond).toBe(1600); // 800 * 2 = 1600g (2 latas de 800g)
    });
  });
});
