import { describe, it, expect } from 'vitest';
import initialIngredients from '../../data/ingredients.json';
import initialRecipes from '../../data/recipes.json';
import initialPreparations from '../../data/preparations.json';
import { Ingredient, Recipe, Preparation } from '../../types/gelato';

describe('Auditoria Canônica e Saneamento Físico-Químico dos Insumos (Padrão Brasileiro)', () => {
  const ingredients = initialIngredients as Ingredient[];
  const recipes = initialRecipes as Recipe[];
  const preparations = initialPreparations as Preparation[];

  it('deve conter 236 insumos oficiais cadastrados no catálogo técnico de ingredients.json', () => {
    expect(ingredients.length).toBe(236);
  });

  it('deve validar o Leite Condensado Tradicional (ing_95) conforme padrão brasileiro MAPA IN 47 / TACO', () => {
    const ing95 = ingredients.find(i => i.id === 'ing_95');
    expect(ing95).toBeDefined();
    expect(ing95!.name).toBe('Leite Condensado');
    expect(ing95!.sugars).toBe(0.44);
    expect(ing95!.fat).toBe(0.08);
    expect(ing95!.msnf).toBe(0.21);
    expect(ing95!.totalSolids).toBe(0.73);
    expect(ing95!.water).toBe(0.27);
    expect(ing95!.pac).toBe(0.55);
    expect(ing95!.pod).toBe(0.45);
    expect(ing95!.protein).toBeCloseTo(0.077, 3);
  });

  it('deve validar o Leite Condensado Desnatado (ing_96) como produto adoçado do mercado brasileiro (Moça Light)', () => {
    const ing96 = ingredients.find(i => i.id === 'ing_96');
    expect(ing96).toBeDefined();
    expect(ing96!.name).toBe('Leite Condensado Desnatado');
    expect(ing96!.fat).toBe(0.0);
    expect(ing96!.sugars).toBe(0.48);
    expect(ing96!.msnf).toBe(0.24);
    expect(ing96!.totalSolids).toBe(0.72);
    expect(ing96!.water).toBe(0.28);
    expect(ing96!.pac).toBe(0.61);
    expect(ing96!.pod).toBe(0.50);
    expect(ing96!.protein).toBeCloseTo(0.095, 3);
  });

  it('deve conter o novo Leite Condensado Semidesnatado 6% (ing_244) padrão de varejo nacional', () => {
    const ing244 = ingredients.find(i => i.id === 'ing_244');
    expect(ing244).toBeDefined();
    expect(ing244!.name).toBe('Leite Condensado Semidesnatado (6% Gordura)');
    expect(ing244!.category).toBe('Laticínios');
    expect(ing244!.fat).toBe(0.06);
    expect(ing244!.sugars).toBe(0.45);
    expect(ing244!.msnf).toBe(0.215);
    expect(ing244!.totalSolids).toBe(0.725);
    expect(ing244!.water).toBe(0.275);
    expect(ing244!.pac).toBe(0.57);
    expect(ing244!.pod).toBe(0.47);
  });

  it('deve conter o Leite Desnatado Concentrado sem Açúcar Industrial (ing_245) devidamente desambiguado', () => {
    const ing245 = ingredients.find(i => i.id === 'ing_245');
    expect(ing245).toBeDefined();
    expect(ing245!.name).toBe('Leite Desnatado Concentrado sem Açúcar (Industrial)');
    expect(ing245!.fat).toBe(0.0);
    expect(ing245!.sugars).toBe(0.0);
    expect(ing245!.msnf).toBe(0.30);
    expect(ing245!.totalSolids).toBe(0.30);
    expect(ing245!.water).toBe(0.70);
    expect(ing245!.protein).toBeCloseTo(0.111, 3);
  });

  it('deve conter os insumos técnicos adicionais (Alulose, Xaropes de Milho, WPI, etc.)', () => {
    const expectedNewItems = [
      { id: 'ing_234', name: 'Creme de Leite 18% (Light)', category: 'Laticínios', fat: 0.18, msnf: 0.0731, hasAllergen: true },
      { id: 'ing_235', name: 'Creme Plástico (Plastic Cream 80% Gordura)', category: 'Laticínios', fat: 0.80, msnf: 0.018, hasAllergen: true },
      { id: 'ing_236', name: 'Leite Evaporado a Granel', category: 'Laticínios', fat: 0.10, msnf: 0.23, hasAllergen: true },
      { id: 'ing_237', name: 'Soro de Leite em Pó Doce', category: 'Laticínios', fat: 0.0, msnf: 0.93, hasAllergen: true },
      { id: 'ing_238', name: 'Whey Protein Isolado (WPI 90%)', category: 'Ovos & Proteínas', protein: 0.90, hasAllergen: true },
      { id: 'ing_239', name: 'Xarope de Milho 30 DE Líquido', category: 'Açúcares', sugars: 0.36, pac: 0.60, pod: 0.25, hasAllergen: false },
      { id: 'ing_240', name: 'Xarope de Milho 62 DE Líquido', category: 'Açúcares', sugars: 0.68, pac: 1.20, pod: 0.65, hasAllergen: false },
      { id: 'ing_241', name: 'Alulose', category: 'Açúcares', sugars: 1.0, pac: 1.90, pod: 0.70, hasAllergen: false },
      { id: 'ing_242', name: 'Pasta Concentrada de Frutas', category: 'Frutas & Polpas', sugars: 0.70, pac: 1.40, pod: 1.0, hasAllergen: false },
      { id: 'ing_243', name: 'Massa de Cacau 100% (Chocolate 100% Puro)', category: 'Chocolates & Cacau', fat: 0.53, totalSolids: 1.0, hasAllergen: false }
    ];

    for (const exp of expectedNewItems) {
      const ing = ingredients.find(i => i.id === exp.id);
      expect(ing, `Insumo ${exp.id} (${exp.name}) não encontrado`).toBeDefined();
      expect(ing!.name).toBe(exp.name);
      expect(ing!.category).toBe(exp.category);
      expect(ing!.hasAllergen).toBe(exp.hasAllergen);
      if (exp.fat !== undefined) expect(ing!.fat).toBeCloseTo(exp.fat, 3);
      if (exp.msnf !== undefined) expect(ing!.msnf).toBeCloseTo(exp.msnf, 3);
      if (exp.protein !== undefined) expect(ing!.protein).toBeCloseTo(exp.protein, 3);
      if (exp.sugars !== undefined) expect(ing!.sugars).toBeCloseTo(exp.sugars, 3);
      if (exp.pac !== undefined) expect(ing!.pac).toBeCloseTo(exp.pac, 3);
      if (exp.pod !== undefined) expect(ing!.pod).toBeCloseTo(exp.pod, 3);
      expect(ing!.totalSolids + ing!.water).toBeCloseTo(1.0, 2);
    }
  });

  it('deve validar a calibração brasileira de Manteiga (ing_116) e Creme Fresco 35% (ing_55)', () => {
    const manteiga = ingredients.find(i => i.id === 'ing_116');
    expect(manteiga).toBeDefined();
    expect(manteiga!.fat).toBe(0.84);
    expect(manteiga!.totalSolids).toBe(0.845);
    expect(manteiga!.water).toBe(0.155);

    const creme35 = ingredients.find(i => i.id === 'ing_55');
    expect(creme35).toBeDefined();
    expect(creme35!.fat).toBe(0.35);
    expect(creme35!.msnf).toBe(0.058);
    expect(creme35!.totalSolids).toBe(0.408);
    expect(creme35!.water).toBe(0.592);
  });

  it('deve validar que 100% dos insumos do catálogo respeitam a conservação da massa (ST + Água = 1.0)', () => {
    for (const ing of ingredients) {
      const sum = ing.totalSolids + ing.water;
      expect(sum, `Insumo ${ing.id} (${ing.name}) com soma ST+Água incoerente (${sum})`).toBeCloseTo(1.0, 2);
    }
  });

  it('deve assegurar anonimização estrita e ausência de nomes de autores em todo o banco de dados', () => {
    const forbiddenAuthorsRegex = /\b(mantovani|nani|lulo|breno|lerner)\b/i;
    const allData = JSON.stringify(ingredients) + JSON.stringify(recipes) + JSON.stringify(preparations);
    expect(forbiddenAuthorsRegex.test(allData)).toBe(false);
  });
});
