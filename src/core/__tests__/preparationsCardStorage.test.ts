import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Preparation } from '../../types/gelato';
import { getInitialPreparationSteps } from '../preparationStepMigration';

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
});
