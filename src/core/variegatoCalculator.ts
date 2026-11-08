import { Ingredient, PricingSettings } from '../types/gelato';
import {
  VariegatoItemRow,
  VariegatoRheologyLevel,
  VariegatoThermalApplication,
  VariegatoStyleStandard,
  VariegatoAnalysis,
  VariegatoAnalysisPercentages,
  VariegatoThermalStatus,
  VariegatoRheologyStatus,
  VariegatoCostingAnalysis,
  VariegatoAlerts,
  VariegatoCookingState
} from '../types/variegato';
import { extractItemAllergens, DEFAULT_PRICING } from './calculator';

/**
 * Identifica se um ingrediente atua como agente hidrocolóide / espessante / geleificante
 */
export function isHydrocolloidIngredient(name: string, category?: string): boolean {
  const n = (name || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();
  return (
    c.includes('neutro') ||
    c.includes('goma') ||
    c.includes('fibra') ||
    n.includes('pectina') ||
    n.includes('goma') ||
    n.includes('xantana') ||
    n.includes('garrofin') ||
    n.includes('locust') ||
    n.includes('guar') ||
    n.includes('ágar') ||
    n.includes('agar') ||
    n.includes('carragenina') ||
    n.includes('amido') ||
    n.includes('gelatina') ||
    n.includes('alginato') ||
    n.includes('tapioca')
  );
}

/**
 * Identifica se o ingrediente é sacarose pura ou predominante
 */
export function isSucroseIngredient(name: string): boolean {
  const n = (name || '').toLowerCase().trim();
  if (
    n.includes('glicose') ||
    n.includes('glucose') ||
    n.includes('dextrose') ||
    n.includes('frutose') ||
    n.includes('maltodextrina') ||
    n.includes('mel') ||
    n.includes('poliol') ||
    n.includes('eritritol') ||
    n.includes('xilitol') ||
    n.includes('sorbitol')
  ) {
    return false;
  }
  return n.includes('açúcar') || n.includes('acucar') || n.includes('sacarose');
}

/**
 * Calcula o Brix inicial intrínseco de um ingrediente com base em seus sólidos solúveis
 */
export function getIngredientBrix(item: VariegatoItemRow, ing?: Ingredient): number {
  if (item.customBrix !== undefined && item.customBrix >= 0) {
    return item.customBrix;
  }
  if (!ing) return 0;

  // Fracionamento de matéria seca solúvel (açúcares + outros sólidos + MSNF solúvel)
  // Matéria gorda insolúvel não entra no Brix aquoso
  const nonFatSolids = Math.max(0, ing.totalSolids - ing.fat);
  return Math.round(nonFatSolids * 1000) / 10;
}

/**
 * Estima a Atividade de Água (aw) teórica com base no Brix pós-cocção
 * Polinômio de Norrish calibrado para soluções concentradas de açúcares/frutas
 */
export function calculateEstimatedAw(brix: number): number {
  if (brix <= 0) return 0.99;
  if (brix >= 85) return 0.50;
  // Curva de Norrish calibrada: aw ~ 1.0 - (0.0032 * Brix) - (0.000015 * Brix^2)
  const aw = 1.0 - (0.0032 * brix) - (0.000015 * Math.pow(brix, 2));
  return Math.max(0.35, Math.min(0.99, Math.round(aw * 1000) / 1000));
}

/**
 * Analisa a performance térmica (-12°C Vitrine vs -18°C Freezer) e plasticidade
 */
export function evaluateThermalStatus(
  pacValue: number,
  application: VariegatoThermalApplication
): VariegatoThermalStatus {
  if (application === 'vitrine') {
    // Alvo Vitrine (-12°C): 480 a 650 PAC
    if (pacValue < 460) {
      return {
        application,
        targetTemp: -12,
        pacValue,
        status: 'freezing_risk',
        label: 'Risco de Congelamento Vítreo',
        description: 'PAC insuficiente para vitrine (-12°C). A mescla ficará excessivamente rígida e quebradiça ao contato com a espátula.'
      };
    }
    if (pacValue > 680) {
      return {
        application,
        targetTemp: -12,
        pacValue,
        status: 'too_fluid',
        label: 'Excesso de Fluidez',
        description: 'PAC muito elevado. A mescla escorrerá pelas laterais da cuba e sangrará para o fundo da vitrine.'
      };
    }
    return {
      application,
      targetTemp: -12,
      pacValue,
      status: 'ideal',
      label: 'Plasticidade Ideal',
      description: 'Maleabilidade perfeita a -12°C. Mantém consistência aveludada e corta com facilidade sem sangrar.'
    };
  } else {
    // Alvo Freezer de Pote (-18°C): 550 a 750 PAC
    if (pacValue < 540) {
      return {
        application,
        targetTemp: -18,
        pacValue,
        status: 'freezing_risk',
        label: 'Risco de Congelamento Vítreo',
        description: 'PAC insuficiente para freezer (-18°C). No pote para consumo direto em casa, a mescla congelará em bloco.'
      };
    }
    if (pacValue > 780) {
      return {
        application,
        targetTemp: -18,
        pacValue,
        status: 'too_fluid',
        label: 'Excesso de Fluidez',
        description: 'PAC muito alto para freezer. A mescla não congelará adequadamente e vazará ao abrir a tampa do pote.'
      };
    }
    return {
      application,
      targetTemp: -18,
      pacValue,
      status: 'ideal',
      label: 'Plasticidade Ideal',
      description: 'Colherabilidade impecável a -18°C. Permite ao consumidor degustar o pote diretamente do freezer.'
    };
  }
}

/**
 * Avalia o nível de reologia e viscosidade estimada
 */
export function evaluateRheologyStatus(
  level: VariegatoRheologyLevel,
  hydrocolloidsPct: number
): VariegatoRheologyStatus {
  switch (level) {
    case 1:
      return {
        profile: 'fluid',
        level: 1,
        label: 'Fluido / Fio Contínuo',
        description: 'Escorre suavemente entre as camadas do gelato, preenchendo todos os vazios sem resistência.',
        estimatedCps: Math.round(1800 + hydrocolloidsPct * 4000),
        recommendedTexturizer: 'Pectina LM: 0.20% a 0.35% (ou Goma Xantana 0.10%)'
      };
    case 3:
      return {
        profile: 'structured',
        level: 3,
        label: 'Estruturado / Gel Firme',
        description: 'Permanece exatamente onde é aplicado, formando faixas ou nós bem definidos que não decantam nem migram.',
        estimatedCps: Math.round(9500 + hydrocolloidsPct * 8000),
        recommendedTexturizer: 'Pectina LM: 0.70% a 0.90% + Citrato de Sódio (ou Ágar 0.30%)'
      };
    case 2:
    default:
      return {
        profile: 'balanced',
        level: 2,
        label: 'Pastoso Equilibrado',
        description: 'Mantém corpo e elasticidade ao puxar com a espátula. Não decanta no fundo nem escorre nas paredes.',
        estimatedCps: Math.round(4800 + hydrocolloidsPct * 6000),
        recommendedTexturizer: 'Pectina LM: 0.45% a 0.65% + 0.10% Citrato de Sódio'
      };
  }
}

/**
 * Gera passos operacionais técnicos e dinâmicos para a cocção e balanceamento do lote
 */
export function generateVariegatoCookingInstructions(
  items: VariegatoItemRow[],
  finalWeightGrams: number,
  targetBrix: number,
  hasReduction: boolean,
  ingredientsMap: Map<string, Ingredient>
): string[] {
  const steps: string[] = [];

  let hasPectin = false;
  let hasAcid = false;
  let hasGlucose = false;
  let totalPectinGrams = 0;

  for (const it of items) {
    const name = it.name.toLowerCase();
    const ing = ingredientsMap.get(name);
    if (isHydrocolloidIngredient(it.name, ing?.category)) {
      hasPectin = true;
      totalPectinGrams += it.grams;
    }
    if (name.includes('ácido') || name.includes('acido') || name.includes('limão') || name.includes('limao')) {
      hasAcid = true;
    }
    if (name.includes('glicose') || name.includes('glucose') || name.includes('dextrose')) {
      hasGlucose = true;
    }
  }

  if (!hasReduction) {
    steps.push('Homogeneização a Frio: Pese todos os insumos e processe com mixer de alta rotação (3.000 a 5.000 rpm) até obter emulsão homogênea.');
    steps.push('Estabilização e Maturação: Transfira para recipiente hermético e mantenha em repouso sob refrigeração (4°C) por no mínimo 4 horas antes do uso na mesclagem.');
    return steps;
  }

  // Processo Térmico Ativo
  if (hasPectin && totalPectinGrams > 0) {
    const drySugarPremix = Math.round(totalPectinGrams * 5);
    steps.push(
      `Dispersão da Pectina: Pese ${totalPectinGrams.toFixed(1)}g do agente hidrocolóide e misture a seco com aprox. ${drySugarPremix}g de sacarose da receita para garantir hidratação homogênea sem grumos.`
    );
    steps.push(
      'Aquecimento Térmico Inicial: Aqueça a fruta/polpa líquida em panela de fundo triplo até atingir 40°C a 45°C. Verta a mistura de pectina e sacarose em forma de chuva sob agitação vigorosa com fouet.'
    );
  } else {
    steps.push('Mistura Inicial: Coloque a fruta ou base líquida na panela de fundo triplo e inicie o aquecimento suave sob agitação constante.');
  }

  if (hasGlucose) {
    steps.push(
      'Adição dos Açúcares e Glicose: Atingidos 60°C, adicione o restante da sacarose e o xarope de glicose pré-aquecido para facilitar a dissolução completa.'
    );
  } else {
    steps.push('Adição dos Açúcares: Aos 60°C, incorpore o restante dos açúcares sob mexedura constante para evitar caramelização no fundo.');
  }

  steps.push(
    `Cocção & Redução na Balança: Mantenha fervura controlada sob agitação constante até que a panela com a mescla atinja exatamente ${Math.round(finalWeightGrams)}g na balança (atingindo ${targetBrix.toFixed(1)}° Brix).`
  );

  if (hasAcid) {
    steps.push(
      'Acidificação de Fechamento: Com o fogo desligado e a panela entre 80°C e 85°C, verta a solução ácida diluída para ativar a gelificação sem despolimerizar a pectina.'
    );
  }

  steps.push(
    'Choque Térmico e Maturação: Transfira imediatamente para banho-maria invertido com água e gelo até baixar de 10°C. Maturação obrigatória em câmara fria (4°C) por 12h para consolidação reológica.'
  );

  return steps;
}

/**
 * Executa a análise bromatológica, balanço de massa, reologia e custos de um variegato
 */
export function calculateVariegatoBatchAnalysis(
  items: VariegatoItemRow[],
  targetBrix: number,
  rheologyLevel: VariegatoRheologyLevel,
  thermalApp: VariegatoThermalApplication,
  style: VariegatoStyleStandard,
  ingredientsMap: Map<string, Ingredient>,
  dosagePercent: number = 15,
  pricing: PricingSettings = DEFAULT_PRICING
): VariegatoAnalysis {
  let initialWeightGrams = 0;
  let totalCost = 0;
  let totalSugarsGrams = 0;
  let totalFatGrams = 0;
  let totalHydrocolloidsGrams = 0;
  let totalSucroseGrams = 0;
  let totalPacPoints = 0;
  let totalSolubleSolidsGrams = 0;
  let totalRawSolidsGrams = 0;
  let totalWaterInBatchGrams = 0;

  for (const item of items) {
    if (!item.name || item.grams <= 0) continue;
    const ing = ingredientsMap.get(item.name.toLowerCase().trim());
    const g = item.grams;
    initialWeightGrams += g;

    // Brix de cada insumo
    const itemBrix = getIngredientBrix(item, ing);
    totalSolubleSolidsGrams += g * (itemBrix / 100);

    if (ing) {
      totalRawSolidsGrams += g * ing.totalSolids;
      totalSugarsGrams += g * ing.sugars;
      totalFatGrams += g * ing.fat;
      totalCost += (g * ing.costKg) / 1000;
      totalWaterInBatchGrams += g * ing.water;

      const pacFactor = item.customPac !== undefined ? item.customPac : ing.pac;
      totalPacPoints += g * pacFactor;

      if (isHydrocolloidIngredient(item.name, ing.category)) {
        totalHydrocolloidsGrams += g;
      }
      if (isSucroseIngredient(item.name)) {
        totalSucroseGrams += g * ing.sugars;
      }
    } else {
      // Ingrediente sem ficha bromatológica cadastrada (estimativa conservadora)
      totalRawSolidsGrams += g * (itemBrix / 100);
      totalSugarsGrams += g * (itemBrix / 100);
      totalWaterInBatchGrams += g * Math.max(0, 1 - (itemBrix / 100));
      if (isSucroseIngredient(item.name)) {
        totalSucroseGrams += g * (itemBrix / 100);
      }
      if (isHydrocolloidIngredient(item.name)) {
        totalHydrocolloidsGrams += g;
      }
      totalPacPoints += g * 1.0;
    }
  }

  // 1. Balanço de massa e peso final alvo após evaporação
  const safeTargetBrix = Math.max(10, Math.min(95, targetBrix || style.defaultBrixTarget));
  let finalWeightGrams = initialWeightGrams;
  let cookingState: VariegatoCookingState = 'cold';
  let waterEvaporatedGrams = 0;
  let waterEvaporationPercent = 0;

  // Pastas de base lipídica (cremes trufados/creminos) ou formulações com baixíssima água (<8%)
  // não passam por cocção evaporativa (evaporar água inexistente calcinaria a gordura)
  const isFatBasedOrColdStyle = style.id === 'creme_trufado' || totalWaterInBatchGrams < (initialWeightGrams * 0.08);

  if (initialWeightGrams > 0 && totalSolubleSolidsGrams > 0 && !isFatBasedOrColdStyle) {
    const theoreticalWeight = totalSolubleSolidsGrams / (safeTargetBrix / 100);
    const potentialEvaporation = initialWeightGrams - theoreticalWeight;

    // A evaporação não pode exceder 95% da água fisicamente presente no tacho
    if (potentialEvaporation > 0 && potentialEvaporation <= totalWaterInBatchGrams * 0.95) {
      cookingState = 'active_reduction';
      finalWeightGrams = theoreticalWeight;
      waterEvaporatedGrams = potentialEvaporation;
      waterEvaporationPercent = (waterEvaporatedGrams / initialWeightGrams) * 100;
    } else {
      cookingState = 'cold';
      finalWeightGrams = initialWeightGrams;
      waterEvaporatedGrams = 0;
      waterEvaporationPercent = 0;
    }
  } else {
    cookingState = 'cold';
    finalWeightGrams = initialWeightGrams;
    waterEvaporatedGrams = 0;
    waterEvaporationPercent = 0;
  }

  const safeFinalWeight = finalWeightGrams > 0 ? finalWeightGrams : (initialWeightGrams || 1000);

  // 2. Porcentagens concentradas na formulação final
  const finalBrix = (totalSolubleSolidsGrams / safeFinalWeight) * 100;
  const finalPac = (totalPacPoints / safeFinalWeight) * 1000;
  const finalSugars = (totalSugarsGrams / safeFinalWeight) * 100;
  const finalFat = (totalFatGrams / safeFinalWeight) * 100;
  const finalHydrocolloids = (totalHydrocolloidsGrams / safeFinalWeight) * 100;
  const sucroseRatio = totalSugarsGrams > 0 ? (totalSucroseGrams / totalSugarsGrams) * 100 : 0;
  const finalWater = Math.max(0, 100 - (totalRawSolidsGrams / safeFinalWeight) * 100);
  const estimatedAw = calculateEstimatedAw(finalBrix);

  const percentages: VariegatoAnalysisPercentages = {
    brix: Math.round(finalBrix * 10) / 10,
    pac: Math.round(finalPac),
    sugars: Math.round(finalSugars * 10) / 10,
    fat: Math.round(finalFat * 10) / 10,
    hydrocolloids: Math.round(finalHydrocolloids * 100) / 100,
    sucroseRatio: Math.round(sucroseRatio * 10) / 10,
    water: Math.round(finalWater * 10) / 10,
    estimatedAw
  };

  // 3. Status Térmico e Reológico
  const thermalStatus = evaluateThermalStatus(percentages.pac, thermalApp);
  const rheologyStatus = evaluateRheologyStatus(rheologyLevel, percentages.hydrocolloids);

  // 4. Custos e Rendimento
  const finalWeightKg = safeFinalWeight / 1000;
  const finalCostKg = finalWeightKg > 0 ? totalCost / finalWeightKg : 0;
  const safeDosage = Math.max(5, Math.min(50, dosagePercent || 15));
  
  // Porção de vitrine (60g de gelato mesclado -> x% é mescla)
  const mesclaGramsInScoop = 60 * (safeDosage / 100);
  const additionalCostPerScoop = (mesclaGramsInScoop * finalCostKg) / 1000;

  // Pote de 500ml (~350g gelato ou padrão 60g de variegato adicionado na montagem)
  const mesclaGramsInPint = 350 * (safeDosage / 100);
  const additionalCostPerPint = (mesclaGramsInPint * finalCostKg) / 1000;

  const costing: VariegatoCostingAnalysis = {
    initialCost: Math.round(totalCost * 100) / 100,
    finalCostKg: Math.round(finalCostKg * 100) / 100,
    dosagePercent: safeDosage,
    additionalCostPerScoop: Math.round(additionalCostPerScoop * 1000) / 1000,
    additionalCostPerPint: Math.round(additionalCostPerPint * 100) / 100
  };

  // 5. Alertas Reológicos e de Cristalização
  const alertMessages: string[] = [];
  const crystallizationRisk = sucroseRatio > 60.0 && percentages.brix > 55.0;
  const lowBrixRisk = percentages.brix < 58.0 && cookingState === 'active_reduction';
  const highSucroseRisk = sucroseRatio > 60.0;
  const excessFluidityRisk = thermalStatus.status === 'too_fluid';

  if (crystallizationRisk) {
    alertMessages.push(
      `Alerta de Cristalização: A sacarose representa ${sucroseRatio.toFixed(1)}% dos açúcares (limite seguro: ≤ 60%). Risco iminente de pedras de açúcar vítreas a frio. Substitua parte por glucose DE ou dextrose.`
    );
  }
  if (lowBrixRisk) {
    alertMessages.push(
      `Alerta de Água Livre: Brix em ${percentages.brix.toFixed(1)}° está abaixo do mínimo (58°). Risco de formação de cristais pontiagudos de gelo na vitrine.`
    );
  }
  if (excessFluidityRisk) {
    alertMessages.push(
      `Alerta de Escorrimento: PAC concentrado em ${percentages.pac} excede a tolerância do ponto térmico (${thermalApp === 'vitrine' ? '-12°C' : '-18°C'}). A mescla perderá sustentação.`
    );
  }

  const alerts: VariegatoAlerts = {
    crystallizationRisk,
    lowBrixRisk,
    highSucroseRisk,
    excessFluidityRisk,
    messages: alertMessages
  };

  // 6. Instruções de cocção dinâmicas
  const cookingInstructions = generateVariegatoCookingInstructions(
    items,
    finalWeightGrams,
    safeTargetBrix,
    cookingState === 'active_reduction',
    ingredientsMap
  );

  return {
    initialWeightGrams: Math.round(initialWeightGrams * 10) / 10,
    finalWeightGrams: Math.round(finalWeightGrams * 10) / 10,
    waterEvaporatedGrams: Math.round(waterEvaporatedGrams * 10) / 10,
    waterEvaporationPercent: Math.round(waterEvaporationPercent * 10) / 10,
    totalSolubleSolidsGrams: Math.round(totalSolubleSolidsGrams * 10) / 10,
    targetBrix: safeTargetBrix,
    cookingState,
    percentages,
    thermalStatus,
    rheologyStatus,
    costing,
    alerts,
    cookingInstructions
  };
}
