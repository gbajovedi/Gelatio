import { Recipe, Ingredient } from '../types/gelato';
import { extractItemAllergens } from './calculator';

export interface NutritionalItemValue {
  name: string;
  unit: string;
  per100g: number;
  perPortion: number;
  dailyValuePct?: number; // %VD com base na porção
  indent?: boolean; // Para subitens (ex: Açúcares totais, Açúcares adicionados, Gorduras saturadas)
}

export interface AnvisaNutritionalData {
  portionGrams: number;
  portionHousehold: string; // Ex: "1 bola" ou "60 g"
  servingsPerContainer: number; // Porções por embalagem
  containerWeightGrams: number;
  items: NutritionalItemValue[];
  frontOfPack: {
    hasAny: boolean;
    count: number;
    highAddedSugars: boolean;
    highSaturatedFat: boolean;
    highSodium: boolean;
    values: {
      addedSugars100g: number;
      saturatedFat100g: number;
      sodium100g: number;
    };
    thresholds: {
      addedSugars100g: number;
      saturatedFat100g: number;
      sodium100g: number;
    };
  };
  allergens: {
    list: string[];
    hasLactose: boolean;
    hasGluten: boolean;
    fullDeclaration: string;
  };
}

/**
 * Fatores de referência da ANVISA (Instrução Normativa IN nº 75/2020)
 * Baseados em uma dieta de 2.000 kcal ou 8.400 kJ.
 */
const ANVISA_DAILY_VALUES: Record<string, number> = {
  energyKcal: 2000,
  energyKj: 8400,
  carbohydrates: 300, // g
  addedSugars: 50, // g
  protein: 50, // g
  totalFat: 65, // g
  saturatedFat: 20, // g
  dietaryFiber: 25, // g
  sodium: 2000 // mg
};

/**
 * Limites da Rotulagem Frontal (FOP - Lupa ANVISA) para alimentos sólidos/semissólidos por 100g
 * Conforme RDC nº 429/2020 e Instrução Normativa IN nº 75/2020.
 */
export const ANVISA_FOP_LIMITS = {
  addedSugarsGramsPer100g: 15,
  saturatedFatGramsPer100g: 6,
  sodiumMgPer100g: 600
};

/**
 * Localiza um insumo no mapa ou por busca normalizada
 */
function findIngredient(
  name: string,
  ingMap: Map<string, Ingredient>,
  ingredients: Ingredient[]
): Ingredient | undefined {
  const clean = name.toLowerCase().trim();
  if (ingMap.has(clean)) return ingMap.get(clean);

  // Normalização sem pontuação
  const normalized = clean.replace(/[-_()]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const ing of ingredients) {
    const ingNorm = ing.name.toLowerCase().replace(/[-_()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (ingNorm === normalized) return ing;
  }

  // Fallback: busca por inclusão
  for (const ing of ingredients) {
    const ingLower = ing.name.toLowerCase().trim();
    if (ingLower.includes(clean) || clean.includes(ingLower)) return ing;
  }

  return undefined;
}

/**
 * Calcula a tabela nutricional completa no padrão ANVISA (RDC 429/2020 e IN 75/2020)
 */
export function calculateAnvisaNutrition(
  recipe: Recipe,
  ingredients: Ingredient[],
  portionGrams: number = 60,
  containerWeightGrams: number = 500
): AnvisaNutritionalData {
  const ingMap = new Map<string, Ingredient>();
  ingredients.forEach(i => ingMap.set(i.name.toLowerCase().trim(), i));

  let totalRecipeWeight = 0;
  let totalIngredientSugars = 0;
  let totalFat = 0;
  let totalProtein = 0;
  let totalMsnf = 0;
  let totalOtherSolids = 0;
  let totalFiber = 0;
  let totalSodiumMg = 0;
  let totalSaturatedFat = 0;
  let intrinsicFruitSugars = 0;

  // Alérgenos acumulados
  const detectedAllergens = new Set<string>();
  let hasLactose = false;
  let hasGluten = false;

  // Unifica calda base e variegatos/mesclas para a tabela nutricional completa
  const allItems = [
    ...(recipe.ingredients || []),
    ...(recipe.variegatos || [])
  ];

  allItems.forEach(item => {
    const g = item.grams || 0;
    if (g <= 0) return;
    totalRecipeWeight += g;

    const ing = findIngredient(item.name, ingMap, ingredients);

    // Extração padronizada de alérgenos via helper bromatológico
    const itemAllergens = extractItemAllergens(item.name, ing);
    itemAllergens.allergens.forEach(a => detectedAllergens.add(a));
    if (itemAllergens.hasLactose) hasLactose = true;
    if (itemAllergens.hasGluten) hasGluten = true;

    if (!ing) return;

    const ingSugars = (ing.sugars || 0) * g;
    const ingFat = (ing.fat || 0) * g;
    const ingProtein = (ing.protein || 0) * g;
    const ingMsnf = (ing.msnf || 0) * g;
    const ingOtherSolids = (ing.otherSolids || 0) * g;

    totalIngredientSugars += ingSugars;
    totalFat += ingFat;
    totalProtein += ingProtein;
    totalMsnf += ingMsnf;
    totalOtherSolids += ingOtherSolids;

    const cat = (ing.category || '').toLowerCase();
    const name = (ing.name || '').toLowerCase();

    // 1. Fator de gordura saturada conforme a fonte lipídica
    let satRatio = 0.60; // Padrão
    if (name.includes('coco') || cat.includes('coco')) {
      satRatio = 0.90;
    } else if (name.includes('cacau') || name.includes('chocolate') || cat.includes('cacau')) {
      satRatio = 0.60;
    } else if (
      cat.includes('castanha') ||
      cat.includes('oleaginosa') ||
      name.includes('pistache') ||
      name.includes('avelã') ||
      name.includes('avela') ||
      name.includes('amendoim') ||
      name.includes('noz')
    ) {
      satRatio = 0.12;
    } else if (
      cat.includes('leite') ||
      name.includes('leite') ||
      name.includes('creme') ||
      name.includes('nata') ||
      name.includes('manteiga')
    ) {
      satRatio = 0.65;
    }
    totalSaturatedFat += ingFat * satRatio;

    // 2. Fibras alimentares e açúcares intrínsecos de frutas intactas
    if (cat.includes('fruta') || cat.includes('polpa')) {
      totalFiber += g * 0.02; // Média 2% fibras em polpas de frutas
      intrinsicFruitSugars += ingSugars; // Frutas intactas não contam como açúcar adicionado pela ANVISA
    } else if (name.includes('cacau')) {
      totalFiber += g * 0.30; // Cacau em pó 100% tem ~30% fibras solúveis/insolúveis
    } else if (name.includes('inulina') || name.includes('polidextrose') || name.includes('fibra')) {
      totalFiber += g * 0.90;
    }

    // 3. Sódio regulamentar
    if (name.includes('sal') || name.includes('cloreto')) {
      totalSodiumMg += g * 390; // 1g de sal refinado = ~390mg de sódio
    } else if (name.includes('leite em pó') || name.includes('leite em po')) {
      totalSodiumMg += (g / 100) * 550; // Leite em pó desnatado = ~550mg Na / 100g
    } else if (cat.includes('leite') || name.includes('leite') || name.includes('creme')) {
      totalSodiumMg += (g / 100) * 50; // Leite bovino integral / creme = ~50mg Na / 100g
    } else {
      totalSodiumMg += (g / 100) * 5; // Traços naturais em outros alimentos
    }
  });

  if (totalRecipeWeight <= 0) {
    totalRecipeWeight = 1000;
  }

  // Lactose do leite (O SNGL contém ~52% de lactose)
  const lactoseGrams = totalMsnf * 0.52;

  // Açúcares adicionados: açúcares derivados de adoçantes e insumos adicionados (exclui açúcares intrínsecos de frutas intactas e lactose)
  const totalAddedSugars = Math.max(0, totalIngredientSugars - intrinsicFruitSugars);

  // Açúcares totais: soma de açúcares adicionados + lactose + açúcares naturais de frutas
  const totalSugars = totalAddedSugars + lactoseGrams + intrinsicFruitSugars;

  // Carboidratos totais (Açúcares + outros carboidratos sólidos como amidos, fibras solúveis e maltodextrinas)
  const totalCarbs = Math.max(totalSugars, totalSugars + (totalOtherSolids * 0.7));

  // Escala para 100g
  const scale100 = 100 / totalRecipeWeight;
  // Escala para a porção
  const scalePortion = portionGrams / totalRecipeWeight;

  // Valores por 100g
  const carbs100 = totalCarbs * scale100;
  const sugars100 = totalSugars * scale100;
  const addedSugars100 = totalAddedSugars * scale100;
  const protein100 = totalProtein * scale100;
  const fat100 = totalFat * scale100;
  const satFat100 = totalSaturatedFat * scale100;
  const transFat100 = 0; // Gelato artesanal autêntico
  const fiber100 = totalFiber * scale100;
  const sodium100 = totalSodiumMg * scale100;
  const energyKcal100 = (carbs100 * 4) + (protein100 * 4) + (fat100 * 9) + (fiber100 * 2);
  const energyKj100 = energyKcal100 * 4.184;

  // Valores por Porção
  const carbsPortion = totalCarbs * scalePortion;
  const sugarsPortion = totalSugars * scalePortion;
  const addedSugarsPortion = totalAddedSugars * scalePortion;
  const proteinPortion = totalProtein * scalePortion;
  const fatPortion = totalFat * scalePortion;
  const satFatPortion = totalSaturatedFat * scalePortion;
  const transFatPortion = 0;
  const fiberPortion = totalFiber * scalePortion;
  const sodiumPortion = totalSodiumMg * scalePortion;
  const energyKcalPortion = (carbsPortion * 4) + (proteinPortion * 4) + (fatPortion * 9) + (fiberPortion * 2);
  const energyKjPortion = energyKcalPortion * 4.184;

  // Porções por embalagem
  const servingsPerContainer = Math.max(1, Math.round(containerWeightGrams / portionGrams));

  // Verificação da Rotulagem Frontal (Lupa ANVISA - limites por 100g)
  const highAddedSugars = addedSugars100 >= ANVISA_FOP_LIMITS.addedSugarsGramsPer100g;
  const highSaturatedFat = satFat100 >= ANVISA_FOP_LIMITS.saturatedFatGramsPer100g;
  const highSodium = sodium100 >= ANVISA_FOP_LIMITS.sodiumMgPer100g;

  let fopCount = 0;
  if (highAddedSugars) fopCount++;
  if (highSaturatedFat) fopCount++;
  if (highSodium) fopCount++;

  // Construção dos itens da tabela
  const items: NutritionalItemValue[] = [
    {
      name: 'Valor energético',
      unit: 'kcal',
      per100g: Math.round(energyKcal100),
      perPortion: Math.round(energyKcalPortion),
      dailyValuePct: Math.round((energyKcalPortion / ANVISA_DAILY_VALUES.energyKcal) * 100)
    },
    {
      name: 'Carboidratos',
      unit: 'g',
      per100g: +carbs100.toFixed(1),
      perPortion: +carbsPortion.toFixed(1),
      dailyValuePct: Math.round((carbsPortion / ANVISA_DAILY_VALUES.carbohydrates) * 100)
    },
    {
      name: 'Açúcares totais',
      unit: 'g',
      per100g: +sugars100.toFixed(1),
      perPortion: +sugarsPortion.toFixed(1),
      dailyValuePct: undefined, // ANVISA não possui %VD para açúcares totais
      indent: true
    },
    {
      name: 'Açúcares adicionados',
      unit: 'g',
      per100g: +addedSugars100.toFixed(1),
      perPortion: +addedSugarsPortion.toFixed(1),
      dailyValuePct: Math.round((addedSugarsPortion / ANVISA_DAILY_VALUES.addedSugars) * 100),
      indent: true
    },
    {
      name: 'Proteínas',
      unit: 'g',
      per100g: +protein100.toFixed(1),
      perPortion: +proteinPortion.toFixed(1),
      dailyValuePct: Math.round((proteinPortion / ANVISA_DAILY_VALUES.protein) * 100)
    },
    {
      name: 'Gorduras totais',
      unit: 'g',
      per100g: +fat100.toFixed(1),
      perPortion: +fatPortion.toFixed(1),
      dailyValuePct: Math.round((fatPortion / ANVISA_DAILY_VALUES.totalFat) * 100)
    },
    {
      name: 'Gorduras saturadas',
      unit: 'g',
      per100g: +satFat100.toFixed(1),
      perPortion: +satFatPortion.toFixed(1),
      dailyValuePct: Math.round((satFatPortion / ANVISA_DAILY_VALUES.saturatedFat) * 100),
      indent: true
    },
    {
      name: 'Gorduras trans',
      unit: 'g',
      per100g: 0,
      perPortion: 0,
      dailyValuePct: undefined, // ANVISA não possui %VD para gorduras trans
      indent: true
    },
    {
      name: 'Fibras alimentares',
      unit: 'g',
      per100g: +fiber100.toFixed(1),
      perPortion: +fiberPortion.toFixed(1),
      dailyValuePct: Math.round((fiberPortion / ANVISA_DAILY_VALUES.dietaryFiber) * 100)
    },
    {
      name: 'Sódio',
      unit: 'mg',
      per100g: Math.round(sodium100),
      perPortion: Math.round(sodiumPortion),
      dailyValuePct: Math.round((sodiumPortion / ANVISA_DAILY_VALUES.sodium) * 100)
    }
  ];

  // Declaração de Alérgenos conforme RDC 727/2022
  const allergenList = Array.from(detectedAllergens);
  let declaration = '';
  if (allergenList.length > 0) {
    declaration += `ALÉRGICOS: CONTÉM ${allergenList.join(', ')} E DERIVADOS.`;
  } else {
    declaration += 'NÃO CONTÉM ALERGÊNICOS DIRETOS.';
  }

  declaration += hasLactose ? ' CONTÉM LACTOSE.' : ' NÃO CONTÉM LACTOSE.';
  declaration += hasGluten ? ' CONTÉM GLÚTEN.' : ' NÃO CONTÉM GLÚTEN.';

  return {
    portionGrams,
    portionHousehold: `${portionGrams} g (${portionGrams === 60 ? '1 bola' : portionGrams === 120 ? '2 bolas' : 'porção'})`,
    servingsPerContainer,
    containerWeightGrams,
    items,
    frontOfPack: {
      hasAny: fopCount > 0,
      count: fopCount,
      highAddedSugars,
      highSaturatedFat,
      highSodium,
      values: {
        addedSugars100g: +addedSugars100.toFixed(1),
        saturatedFat100g: +satFat100.toFixed(1),
        sodium100g: Math.round(sodium100)
      },
      thresholds: {
        addedSugars100g: ANVISA_FOP_LIMITS.addedSugarsGramsPer100g,
        saturatedFat100g: ANVISA_FOP_LIMITS.saturatedFatGramsPer100g,
        sodium100g: ANVISA_FOP_LIMITS.sodiumMgPer100g
      }
    },
    allergens: {
      list: allergenList,
      hasLactose,
      hasGluten,
      fullDeclaration: declaration
    }
  };
}
