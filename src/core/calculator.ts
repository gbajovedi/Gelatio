import {
  Ingredient,
  StyleStandard,
  RecipeItem,
  VariegatoItem,
  VariegatoPhysicalDetail,
  BatchAnalysis,
  NutrientValidation,
  PricingSettings,
  SandinessRisk,
  CorvittoMetrics,
  EmulsionMetrics
} from '../types/gelato';

export const DEFAULT_PRICING: PricingSettings = {
  tubWeightGrams: 500,
  tubPackagingCost: 1.50,
  indirectOverheadPerTub: 5.40,
  targetProfitMarginPercent: 40,
  cardFeePercent: 3.5,
  salesTaxPercent: 0
};

export const STORAGE_KEY_SHOW_ROUNDED = 'gelato_show_rounded_values';

/**
 * Identifica se um ingrediente é da classe Neutro / Estabilizante / Emulsionante.
 * Na tradição do gelato artesanal, os neutros atuam em dosagens microcríticas
 * (3.0g a 5.0g por kg de calda). Portanto, o ingrediente Neutro NUNCA deve
 * ter seus decimais arredondados para número inteiro na bancada de balanceamento.
 */
export function isNeutroIngredient(name?: string, category?: string): boolean {
  const n = (name || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();
  return (
    n.includes('neutro') ||
    n.includes('liga neutra') ||
    c.includes('neutro') ||
    c === 'neutros, gomas & fibras' ||
    c === 'neutros & fibras'
  );
}

/**
 * Aplica arredondamento em um valor em gramas respeitando a regra sagrada:
 * O ingrediente Neutro NUNCA é arredondado para número inteiro (mantém 1 casa decimal).
 */
export function roundIngredientGrams(
  grams: number,
  isNeutro: boolean,
  showRounded: boolean
): number {
  if (isNeutro) {
    return Math.round(grams * 10) / 10;
  }
  return showRounded ? Math.round(grams) : Math.round(grams * 10) / 10;
}

/**
 * Extrai os alérgenos regulamentares (RDC Anvisa) de um insumo ou mescla,
 * priorizando os detalhes específicos de alérgenos cadastrados (`allergenDetails`)
 * e realizando inferência inteligente caso não estejam preenchidos.
 */
export function extractItemAllergens(
  name: string,
  ing?: Ingredient
): { allergens: string[]; hasLactose: boolean; hasGluten: boolean } {
  const allergens: string[] = [];
  let hasLactose = false;
  let hasGluten = false;

  const normalizeAllergen = (a: string): string => {
    const clean = a.trim();
    if (/leite|lactose/i.test(clean)) return 'LEITE';
    if (/castanha|noz|avelã|pistache|amêndoa|macadâmia/i.test(clean)) return 'CASTANHAS & NOZES';
    if (/glúten|trigo|cevada|aveia|centeio/i.test(clean)) return 'TRIGO / GLÚTEN';
    if (/ovo/i.test(clean)) return 'OVOS';
    if (/soja/i.test(clean)) return 'SOJA';
    if (/amendoim/i.test(clean)) return 'AMENDOIM';
    return clean.toUpperCase();
  };

  // 1. Prioridade máxima: detalhes de alérgenos cadastrados no insumo (ex: Nutella -> Leite, Castanhas & Nozes, Soja)
  if (ing?.allergenDetails && ing.allergenDetails.length > 0) {
    for (const d of ing.allergenDetails) {
      allergens.push(normalizeAllergen(d));
      if (/leite|lactose/i.test(d)) hasLactose = true;
      if (/glúten|trigo|aveia|cevada/i.test(d)) hasGluten = true;
    }
  }

  // 2. Inferência bromatológica e textual complementar
  const textToScan = `${name} ${ing?.category || ''}`.toLowerCase();

  // Presença de lactose / laticínios
  if (ing && (ing.msnf > 0 || ing.category === 'Laticínios')) {
    hasLactose = true;
    allergens.push('LEITE');
  } else if (/leite|creme|queijo|iogurte|lactose|manteiga|soro|ricota|mascarpone/i.test(textToScan)) {
    hasLactose = true;
    allergens.push('LEITE');
  }

  // Glúten / Trigo
  if (/(trigo|croissant|biscoff|biscoito|panettone|aveia|sucrilhos|ovomaltine|malte|cevada|centeio|glúten)/i.test(textToScan)) {
    hasGluten = true;
    allergens.push('TRIGO / GLÚTEN');
  }

  // Nutella específica (Avelã / Nozes, Leite, Soja) caso não haja detalhes cadastrados
  if (/nutella/i.test(textToScan)) {
    allergens.push('LEITE', 'CASTANHAS & NOZES', 'SOJA');
    hasLactose = true;
  }

  // Soja
  if (/soja|lecitina de soja/i.test(textToScan)) {
    allergens.push('SOJA');
  }

  // Ovos
  if (/ovo|gema|clara/i.test(textToScan) || ing?.category === 'Ovos & Proteínas') {
    allergens.push('OVOS');
  }

  // Amendoim
  if (/amendoim/i.test(textToScan)) {
    allergens.push('AMENDOIM');
  }

  // Castanhas e Nozes em geral
  if (/avelã|castanha|nozes|noz|pistache|amêndoa|macadâmia|pecã/i.test(textToScan) || ing?.category === 'Pastas & Oleaginosas') {
    if (/avelã|castanha|nozes|noz|pistache|amêndoa|macadâmia|pecã/i.test(textToScan)) {
      allergens.push('CASTANHAS & NOZES');
    }
  }

  // Se o insumo tiver a flag hasAllergen = true mas nenhuma categoria acima pegou, preservar alerta
  if (ing?.hasAllergen && allergens.length === 0) {
    if (ing.category === 'Laticínios') {
      allergens.push('LEITE');
      hasLactose = true;
    } else if (ing.category === 'Pastas & Oleaginosas') {
      allergens.push('CASTANHAS & NOZES');
    } else {
      allergens.push(ing.name.toUpperCase());
    }
  }

  return {
    allergens: Array.from(new Set(allergens)),
    hasLactose,
    hasGluten
  };
}

/**
 * Determina a densidade aparente (kg/L ou g/ml), o overrun de processo e o método para um variegato.
 * Suporta:
 * 1. Valores diretos informados pelo gelatiere (density / overrun / processMethod).
 * 2. Reconhecimento de preparo com Mixer (ex: Nutella após mixer incorpora ~20% de ar, densidade cai de 1.28 para ~1.07 kg/L).
 * 3. Cálculo estendido de Richmond se o ingrediente possui composição (Gordura, Sólidos, Água).
 * 4. Presets gastronômicos inteligentes por categoria/nome.
 */
export function resolveVariegatoDensity(
  item: VariegatoItem,
  ing?: Ingredient
): { density: number; overrun: number; method: 'mixer' | 'direct' | 'custom' } {
  const nameLower = (item.name || '').toLowerCase().trim();
  const hasMixerKeyword = /(mixer|aerad|batid|emulsionad|mousse|chantilly)/i.test(nameLower);
  const isMixerMethod = item.processMethod === 'mixer' || hasMixerKeyword;

  // 1. Se o gelatiere forneceu densidade explícita customizada
  if (item.density && item.density > 0) {
    const ov = item.overrun !== undefined ? item.overrun : (isMixerMethod ? 20 : 0);
    return {
      density: Math.round(item.density * 1000) / 1000,
      overrun: ov,
      method: item.processMethod || (item.density ? 'custom' : 'direct')
    };
  }

  // 2. Determinar a densidade base não aerada (d0)
  let d0 = 1.25;

  if (ing && (ing.fat > 0 || ing.totalSolids > 0 || ing.water > 0)) {
    // Cálculo por composição nutricional (Fórmula de Richmond estendida)
    const fatTerm = (ing.fat * 100) / 0.93;
    const nonFatSolidsTerm = Math.max(0, ((ing.totalSolids - ing.fat) * 100) / 1.58);
    const waterTerm = (ing.water * 100) / 1.00;
    const denom = fatTerm + nonFatSolidsTerm + waterTerm;
    if (denom > 0) {
      d0 = Math.max(0.95, Math.min(1.45, 100 / denom));
    }
  } else if (ing && ing.density && ing.density > 0) {
    d0 = ing.density;
  } else {
    // Presets gastronômicos calibrados por categoria
    if (/(nutella|gianduia|avelã|avela|amendoim|pistache|crema|pasta|cacau|chocolate)/i.test(nameLower)) {
      d0 = 1.28;
    } else if (/(geleia|calda|amarena|morango|frutas|fruta|damasco|framboesa|mirtilo|maracujá|maracuja)/i.test(nameLower)) {
      d0 = 1.31;
    } else if (/(caramelo|doce de leite|dulce|toffee)/i.test(nameLower)) {
      d0 = 1.35;
    } else if (/(ganache|trufa|brigadeiro)/i.test(nameLower)) {
      d0 = 1.22;
    } else if (/(crocante|biscoito|cookie|brownie|castanha|nozes)/i.test(nameLower)) {
      d0 = 0.85;
    } else {
      d0 = 1.25;
    }
  }

  // 3. Determinar o Overrun de processo (aeração mecânica por mixer ou batedeira)
  let ov = 0;
  let method: 'mixer' | 'direct' | 'custom' = 'direct';

  if (item.overrun !== undefined) {
    ov = Math.max(0, item.overrun);
    method = item.processMethod || (ov > 0 ? 'mixer' : 'direct');
  } else if (isMixerMethod) {
    ov = 20; // 20% de aeração padrão comprovada pelo teste de bancada com mixer
    method = 'mixer';
  } else if (/(ganache batida|mousse)/i.test(nameLower)) {
    ov = 30;
    method = 'mixer';
  } else if (ing && ing.overrun !== undefined) {
    ov = Math.max(0, ing.overrun);
    method = ov > 0 ? 'mixer' : 'direct';
  }

  // 4. Calcular densidade aparente final
  const effectiveDensity = ov > 0 ? d0 / (1 + ov / 100) : d0;

  return {
    density: Math.round(effectiveDensity * 1000) / 1000,
    overrun: Math.round(ov * 10) / 10,
    method
  };
}

export function calculateBatchAnalysis(
  items: RecipeItem[],
  variegatos: VariegatoItem[] = [],
  style: StyleStandard,
  ingredientsMap: Map<string, Ingredient>,
  pricing: PricingSettings = DEFAULT_PRICING
): BatchAnalysis {
  let totalCaldaGrams = 0;
  let totalCost = 0;
  let totalSugars = 0;
  let totalFat = 0;
  let totalMsnf = 0;
  let totalOtherSolids = 0;
  let totalSolids = 0;
  let totalWater = 0;
  let totalPod = 0;
  let totalPac = 0;
  let totalProtein = 0;

  const allergenItems: string[] = [];
  let containsGluten = false;
  let containsLactose = false;

  for (const item of items) {
    if (!item.name || item.grams <= 0) continue;
    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
    const g = item.grams;
    totalCaldaGrams += g;

    if (ing) {
      totalSugars += g * ing.sugars;
      totalFat += g * ing.fat;
      totalMsnf += g * ing.msnf;
      totalOtherSolids += g * ing.otherSolids;
      totalSolids += g * ing.totalSolids;
      totalWater += g * ing.water;
      totalPod += g * ing.pod;
      totalPac += g * ing.pac;
      totalProtein += g * ing.protein;
      totalCost += (g * ing.costKg) / 1000;
    }

    // Extração padronizada de alérgenos da calda base
    const allergenData = extractItemAllergens(item.name, ing);
    allergenItems.push(...allergenData.allergens);
    if (allergenData.hasLactose) containsLactose = true;
    if (allergenData.hasGluten) containsGluten = true;
  }

  const safeWeight = totalCaldaGrams > 0 ? totalCaldaGrams : 1000;
  const scale = 1000 / safeWeight;

  // Normalized percentages (0 to 1) and relative POD/PAC (per 1000g)
  const pctSugars = totalCaldaGrams > 0 ? totalSugars / totalCaldaGrams : 0;
  const pctFat = totalCaldaGrams > 0 ? totalFat / totalCaldaGrams : 0;
  const pctMsnf = totalCaldaGrams > 0 ? totalMsnf / totalCaldaGrams : 0;
  const pctOtherSolids = totalCaldaGrams > 0 ? totalOtherSolids / totalCaldaGrams : 0;
  const pctTotalSolids = totalCaldaGrams > 0 ? totalSolids / totalCaldaGrams : 0;
  const pctWater = totalCaldaGrams > 0 ? totalWater / totalCaldaGrams : 0;
  const relPod = totalCaldaGrams > 0 ? (totalPod * 1000) / totalCaldaGrams : 0;
  const relPac = totalCaldaGrams > 0 ? (totalPac * 1000) / totalCaldaGrams : 0;
  const pctProtein = totalCaldaGrams > 0 ? totalProtein / totalCaldaGrams : 0;

  // Validation function
  const validate = (val: number, min: number, max: number, isPercent = true): NutrientValidation => {
    // Tolerância para arredondamento
    const factor = isPercent ? 10000 : 10;
    const v = Math.round(val * factor) / factor;
    const mi = Math.round(min * factor) / factor;
    const ma = Math.round(max * factor) / factor;

    let status: 'Ok' | 'Baixo' | 'Alto' = 'Ok';
    if (v < mi) status = 'Baixo';
    else if (v > ma) status = 'Alto';
    return { val, min, max, status };
  };

  const validations = {
    sugars: validate(pctSugars, style.min.sugars, style.max.sugars),
    fat: validate(pctFat, style.min.fat, style.max.fat),
    msnf: validate(pctMsnf, style.min.msnf, style.max.msnf),
    otherSolids: validate(pctOtherSolids, style.min.otherSolids, style.max.otherSolids),
    totalSolids: validate(pctTotalSolids, style.min.totalSolids, style.max.totalSolids),
    water: validate(pctWater, style.min.water, style.max.water),
    pod: validate(relPod, style.min.pod, style.max.pod, false),
    pac: validate(relPac, style.min.pac, style.max.pac, false),
    protein: (style.max.protein > 0 && style.name === 'Gelatos Proteicos')
      ? validate(pctProtein, style.min.protein, style.max.protein)
      : { val: pctProtein, min: 0, max: 0, status: 'Ok' as const }
  };

  const isBalanced = Object.values(validations).every(v => v.status === 'Ok');

  // Temperatura de Serviço / Vitrine (°C) - Modelo Crioscópico de Espatulabilidade (Leighton / Corvitto)
  // Ponto de equilíbrio térmico onde ~75% a 78% da água está congelada em microcristais e ~22% a 25% permanece líquida para espatulabilidade perfeita.
  let servingTemperature = -12.0;
  if (relPac > 0 && pctWater > 0.15) {
    const deltaSugars = (relPac / (pctWater * 1000)) * 28.5;
    const deltaMsnfSalts = pctMsnf * 10.0;
    const deltaFatHardening = (pctFat * 100) * 0.05;
    const calculatedTemp = -(deltaSugars + deltaMsnfSalts - deltaFatHardening);
    servingTemperature = Math.max(-18.0, Math.min(-8.0, calculatedTemp));
  }

  // 1. Risco de Arenosidade Dinâmico (Fórmula de Caviezel)
  // SLNG máximo seguro para o volume de água disponível: SLNG_máx = pctWater / 6
  const maxSafeMsnf = pctWater > 0 ? (pctWater / 6) : 0.105;
  const isSandinessAtRisk = pctMsnf > 0.02 && (pctMsnf > (maxSafeMsnf + 0.002));
  const sandinessRisk: SandinessRisk = {
    maxSafeMsnf,
    currentMsnf: pctMsnf,
    isAtRisk: isSandinessAtRisk,
    excessPct: Math.max(0, pctMsnf - maxSafeMsnf)
  };

  // 2. Diagnóstico Corvitto de PAC na Água Livre (PAC en agua libre)
  // PAC por kg de água pura = relPac / pctWater
  const pacWater = pctWater > 0.1 ? Math.round(relPac / pctWater) : Math.round(relPac);

  let vitrineStatus: 'firme' | 'ideal' | 'macio' = 'ideal';
  let vitrineLabel = 'Ideal p/ Vitrine (-12°C)';
  if (pacWater < 380) {
    vitrineStatus = 'firme';
    vitrineLabel = 'Firme na Vitrine (-12°C)';
  } else if (pacWater > 425) {
    vitrineStatus = 'macio';
    vitrineLabel = 'Macia / Fusão Rápida';
  }

  let freezerStatus: 'duro' | 'firme' | 'colher' | 'muito_macio' = 'firme';
  let freezerLabel = 'Firme (-18°C) — aguardar ~10min';
  let freezerAdvice = 'Para consumo em casa (-18°C), retire do freezer 10 a 15 minutos antes de servir.';
  const idealFreezerPacWater = 460;
  const targetRelPacForFreezer = Math.round(idealFreezerPacWater * pctWater);
  const neededPacForFreezer = Math.max(0, targetRelPacForFreezer - Math.round(relPac));

  if (pacWater < 420) {
    freezerStatus = 'duro';
    freezerLabel = 'Rígido (-18°C) — aguardar 15min';
    freezerAdvice = `Para ponto de colher imediato no freezer doméstico (-18°C), eleve +${neededPacForFreezer} de PAC (ex: substitua ~${Math.round(neededPacForFreezer * 0.55)}g de sacarose por dextrose).`;
  } else if (pacWater >= 420 && pacWater < 450) {
    freezerStatus = 'firme';
    freezerLabel = 'Firme (-18°C) — aguardar ~10min';
    freezerAdvice = `Fórmula de vitrine padrão. Para ponto de colher imediato no freezer (-18°C), adicione +${neededPacForFreezer} de PAC.`;
  } else if (pacWater >= 450 && pacWater <= 490) {
    freezerStatus = 'colher';
    freezerLabel = 'Ponto de Colher Direto (-18°C)';
    freezerAdvice = 'Calda perfeitamente equilibrada para consumo doméstico imediato direto do freezer!';
  } else {
    freezerStatus = 'muito_macio';
    freezerLabel = 'Muito Macio (-18°C)';
    freezerAdvice = 'PAC na água muito elevado para freezer doméstico; risco de derretimento acelerado.';
  }

  const corvittoMetrics: CorvittoMetrics = {
    pacWater,
    vitrineStatus,
    vitrineLabel,
    freezerStatus,
    freezerLabel,
    freezerAdvice,
    neededPacForFreezer
  };

  // 3. Razão de Emulsão e Overrun Estimado (Padrão Carpigiani)
  // Relação lipídica/proteica: Gordura : SLNG (alvo clássico artesanal: 0.75:1 a 1.25:1)
  const hasEmulsifier = items.some(it => /gema|ovo|lecitina|emulsificante|mono.*diglicer/i.test(it.name));
  let emulsionMetrics: EmulsionMetrics;

  if (pctMsnf < 0.015 && pctFat < 0.02) {
    // Sorbets de frutas (base água)
    const baseOverrun = Math.round(18 + Math.min(7, pctOtherSolids * 100));
    emulsionMetrics = {
      fatMsnfRatio: 0,
      status: 'sorbet',
      statusLabel: 'Base Água (Sorbet)',
      overrunEstimatePct: baseOverrun,
      overrunRange: `${baseOverrun - 3}% a ${baseOverrun + 3}%`,
      advice: 'Overrun clássico de sorbet artesanal (18% a 25%), conferindo densidade refrescante e pureza de sabor da fruta.'
    };
  } else {
    const rawRatio = pctMsnf > 0.005 ? (pctFat / pctMsnf) : (pctFat * 10);
    const fatMsnfRatio = Math.round(rawRatio * 100) / 100;

    if (fatMsnfRatio >= 0.75 && fatMsnfRatio <= 1.25) {
      const baseOverrun = Math.round(32 + (hasEmulsifier ? 4 : 0) - (pctTotalSolids > 0.41 ? 3 : 0));
      emulsionMetrics = {
        fatMsnfRatio,
        status: 'ideal',
        statusLabel: 'Emulsão Equilibrada (Método Italiano)',
        overrunEstimatePct: baseOverrun,
        overrunRange: `${baseOverrun - 3}% a ${baseOverrun + 3}%`,
        advice: 'Excelente equilíbrio entre lipídios e proteínas lácteas (0.75:1 a 1.25:1). Formação estável de glóbulos com textura aveludada e aeração sedosa.'
      };
    } else if (fatMsnfRatio > 1.25) {
      const baseOverrun = Math.round(26 - (fatMsnfRatio > 1.6 ? 4 : 0) + (hasEmulsifier ? 3 : 0));
      emulsionMetrics = {
        fatMsnfRatio,
        status: 'gorduroso',
        statusLabel: 'Sobrecarga Lipídica',
        overrunEstimatePct: Math.max(18, baseOverrun),
        overrunRange: `${Math.max(18, baseOverrun) - 3}% a ${Math.max(18, baseOverrun) + 3}%`,
        advice: 'Gordura elevada em relação às proteínas lácteas. Risco de coalescência lipídica ("manteigamento") e redução de aeração. Recomenda-se elevar SLNG ou adicionar gema/lecitina.'
      };
    } else {
      const baseOverrun = Math.round(36 + (pctMsnf > 0.11 ? 4 : 0));
      emulsionMetrics = {
        fatMsnfRatio,
        status: 'magro',
        statusLabel: 'Calda Magra / Aeração Rápida',
        overrunEstimatePct: Math.min(42, baseOverrun),
        overrunRange: `${Math.min(42, baseOverrun) - 3}% a ${Math.min(42, baseOverrun) + 3}%`,
        advice: 'Calda magra com pouca gordura protetora. O batimento incorpora ar rápido com fusão acelerada na boca.'
      };
    }
  }

  // Post-Production (Variegatos / Mesclas) & Costing
  let totalVariegatoGrams = 0;
  let totalVariegatoCost = 0;

  for (const v of variegatos) {
    if (!v.name || v.grams <= 0) continue;
    totalVariegatoGrams += v.grams;
    const ing = ingredientsMap.get(v.name.toLowerCase().trim());
    const costKg = v.costKg ?? (ing ? ing.costKg : 0);
    totalVariegatoCost += (v.grams * costKg) / 1000;

    // Extração padronizada de alérgenos da mescla / pós-produção
    const allergenData = extractItemAllergens(v.name, ing);
    allergenItems.push(...allergenData.allergens);
    if (allergenData.hasLactose) containsLactose = true;
    if (allergenData.hasGluten) containsGluten = true;
  }

  // Allergens Label (Consolidado: Calda Base + Mesclas Pós-Produção)
  let allergensLabel = "";
  if (allergenItems.length > 0) {
    const ALLERGEN_ORDER = ['LEITE', 'SOJA', 'OVOS', 'AMENDOIM', 'CASTANHAS & NOZES', 'TRIGO / GLÚTEN'];
    const uniqueList = Array.from(new Set(allergenItems));
    uniqueList.sort((a, b) => {
      const idxA = ALLERGEN_ORDER.indexOf(a);
      const idxB = ALLERGEN_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    allergensLabel = `CONTÉM: ${uniqueList.join(', ')}.`;
  } else {
    allergensLabel = "NÃO CONTÉM ALERGÊNICOS DIRETOS.";
  }
  allergensLabel += containsLactose ? " CONTÉM LACTOSE." : " NÃO CONTÉM LACTOSE.";
  allergensLabel += containsGluten ? " CONTÉM GLÚTEN." : " NÃO CONTÉM GLÚTEN.";

  const finalWeightGrams = totalCaldaGrams + totalVariegatoGrams;
  const totalBatchCost = totalCost + totalVariegatoCost;
  const caldaCostKg = totalCaldaGrams > 0 ? (totalCost / (totalCaldaGrams / 1000)) : 0;
  const finalCostKg = finalWeightGrams > 0 ? (totalBatchCost / (finalWeightGrams / 1000)) : caldaCostKg;
  const scoopCost60g = finalCostKg * 0.06;

  // 4. Densidade da Calda e Volumes Físicos (Fórmula de Richmond / Goff & Hartel)
  // Densidade teórica da calda líquida (g/ml ou kg/L)
  const fatTerm = (pctFat * 100) / 0.93;
  const nonFatSolidsTerm = Math.max(0, ((pctTotalSolids - pctFat) * 100) / 1.58);
  const waterTerm = (pctWater * 100) / 1.00;
  const denominator = fatTerm + nonFatSolidsTerm + waterTerm;
  const rawCaldaDensity = denominator > 0 ? (100 / denominator) : 1.10;
  const caldaDensity = Math.max(1.05, Math.min(1.18, rawCaldaDensity));

  // Overrun da calda base (padrão Carpigiani previsto)
  const baseOverrunPct = emulsionMetrics?.overrunEstimatePct || 32;

  // Volume da calda líquida (L)
  const baseLiquidVolumeLiters = caldaDensity > 0 ? ((totalCaldaGrams / 1000) / caldaDensity) : 0;
  // Volume da calda batida com ar (L)
  const baseVolumeLiters = baseLiquidVolumeLiters * (1 + (baseOverrunPct / 100));

  // Variegatos e Mesclas: Cálculo individualizado por matriz físico-química e aeração de mixer
  const variegatoDetails: VariegatoPhysicalDetail[] = [];
  let totalVariegatoVolumeLiters = 0;
  let totalVariegatoLiquidVolumeLiters = 0;

  for (const v of variegatos) {
    if (!v.grams || v.grams <= 0) continue;
    const ing = ingredientsMap.get((v.name || '').toLowerCase().trim());
    const physical = resolveVariegatoDensity(v, ing);
    const volAeratedLiters = physical.density > 0 ? ((v.grams / 1000) / physical.density) : 0;

    // Volume base não aerado (líquido/pastoso puro)
    const baseDensity = physical.overrun > 0 ? physical.density * (1 + (physical.overrun / 100)) : physical.density;
    const volLiquidLiters = baseDensity > 0 ? ((v.grams / 1000) / baseDensity) : volAeratedLiters;

    totalVariegatoVolumeLiters += volAeratedLiters;
    totalVariegatoLiquidVolumeLiters += volLiquidLiters;

    variegatoDetails.push({
      name: v.name,
      grams: v.grams,
      density: physical.density,
      overrun: physical.overrun,
      volumeLiters: Math.round(volAeratedLiters * 1000) / 1000,
      processMethod: physical.method
    });
  }

  // Volume total consolidado e Overrun aparente do produto final
  const totalVolumeLiters = baseVolumeLiters + totalVariegatoVolumeLiters;
  const totalLiquidVolumeLiters = baseLiquidVolumeLiters + totalVariegatoLiquidVolumeLiters;
  const effectiveOverrunPct =
    totalLiquidVolumeLiters > 0
      ? ((totalVolumeLiters - totalLiquidVolumeLiters) / totalLiquidVolumeLiters) * 100
      : baseOverrunPct;

  const densityAndVolume = {
    caldaDensity: Math.round(caldaDensity * 1000) / 1000,
    baseLiquidVolumeLiters: Math.round(baseLiquidVolumeLiters * 1000) / 1000,
    baseVolumeLiters: Math.round(baseVolumeLiters * 1000) / 1000,
    variegatoVolumeLiters: Math.round(totalVariegatoVolumeLiters * 1000) / 1000,
    totalVolumeLiters: Math.round(totalVolumeLiters * 1000) / 1000,
    baseOverrunPct: Math.round(baseOverrunPct),
    effectiveOverrunPct: Math.round(effectiveOverrunPct * 10) / 10,
    variegatoDetails
  };

  // Tub Suggested Price
  // Margem sobre venda: TotalCost / (1 - (Deduções + Margem))
  // Markup sobre custo: [ TotalCost * (1 + Markup) ] / (1 - Deduções)
  const tubProductCost = finalCostKg * (pricing.tubWeightGrams / 1000);
  const directCostWithPack = tubProductCost + pricing.tubPackagingCost;
  const totalCostWithOverhead = directCostWithPack + pricing.indirectOverheadPerTub;
  const totalSalesDeductions = (pricing.cardFeePercent + (pricing.salesTaxPercent || 0)) / 100;
  const targetMarginDecimal = (pricing.targetProfitMarginPercent || 0) / 100;
  const isMarkup = pricing.pricingMethod === 'markup';
  const totalDeductionsAndMargin = targetMarginDecimal + totalSalesDeductions;
  const marginDivisor = 1 - totalDeductionsAndMargin;
  const netRevenueFactor = Math.max(0.01, 1 - totalSalesDeductions);

  const suggestedPrice500g =
    totalCostWithOverhead <= 0
      ? 0
      : isMarkup
      ? (totalCostWithOverhead * (1 + targetMarginDecimal)) / netRevenueFactor
      : marginDivisor > 0 && totalDeductionsAndMargin < 1
      ? totalCostWithOverhead / marginDivisor
      : (totalCostWithOverhead * (1 + targetMarginDecimal)) / netRevenueFactor;
  const variegatoRatioPercent = finalWeightGrams > 0 ? (totalVariegatoGrams / finalWeightGrams) * 100 : 0;

  return {
    caldaWeight: totalCaldaGrams,
    batchScaleRatio: scale,
    totals: {
      sugars: totalSugars,
      fat: totalFat,
      msnf: totalMsnf,
      otherSolids: totalOtherSolids,
      totalSolids: totalSolids,
      water: totalWater,
      pod: totalPod,
      pac: totalPac,
      protein: totalProtein,
      cost: totalCost
    },
    percentages: {
      sugars: pctSugars,
      fat: pctFat,
      msnf: pctMsnf,
      otherSolids: pctOtherSolids,
      totalSolids: pctTotalSolids,
      water: pctWater,
      pod: relPod,
      pac: relPac,
      protein: pctProtein
    },
    validations,
    isBalanced,
    servingTemperature: Math.round(servingTemperature * 10) / 10,
    sandinessRisk,
    corvittoMetrics,
    emulsionMetrics,
    densityAndVolume,
    allergensLabel,
    costing: {
      caldaCostKg: Math.round(caldaCostKg * 100) / 100,
      totalBatchCost: Math.round(totalBatchCost * 100) / 100,
      finalWeightGrams,
      finalCostKg: Math.round(finalCostKg * 100) / 100,
      scoopCost60g: Math.round(scoopCost60g * 100) / 100,
      suggestedPrice500g: Math.round(suggestedPrice500g * 100) / 100,
      variegatoRatioPercent: Math.round(variegatoRatioPercent * 10) / 10,
      totalVariegatoGrams,
      totalVariegatoCost: Math.round(totalVariegatoCost * 100) / 100
    }
  };
}

