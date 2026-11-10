import { Ingredient } from '../types/gelato';
import {
  VariegatoItemRow,
  VariegatoRheologyLevel,
  VariegatoRheologyGuidance,
  VariegatoThermalStatus,
  VariegatoThermalGuidance,
  VariegatoStyleStandard,
  VariegatoStyleId,
  VariegatoAnalysisPercentages
} from '../types/variegato';

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
    n.includes('neutro') ||
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

export interface RheologyHydrocolloidRange {
  minPct: number;
  maxPct: number;
  midPct: number;
  label: string;
}

/**
 * Retorna as faixas ideais de hidrocolóides (%) para cada nível de reologia,
 * considerando a matriz física do estilo (frutas vs. caramelo lácteo vs. cremes gordurosos).
 */
export function getHydrocolloidRangeForRheology(
  level: VariegatoRheologyLevel,
  styleId: VariegatoStyleId,
  fatPct: number = 0
): RheologyHydrocolloidRange {
  // Cremes trufados / base gordurosa não dependem de pectina/hidrocolóides
  if (styleId === 'creme_trufado' || fatPct >= 18) {
    return {
      minPct: 0.0,
      maxPct: 0.4,
      midPct: 0.0,
      label: level === 1 ? 'Fluido' : level === 3 ? 'Firme' : 'Pastoso'
    };
  }

  // Caramelo / Toffee possui corpo pelos açúcares concentrados + gordura láctea
  if (styleId === 'caramelo_toffee') {
    if (level === 1) {
      return { minPct: 0.0, maxPct: 0.2, midPct: 0.1, label: 'Fluido / Calda' };
    }
    if (level === 3) {
      return { minPct: 0.45, maxPct: 0.75, midPct: 0.6, label: 'Toffee Firme' };
    }
    return { minPct: 0.15, maxPct: 0.45, midPct: 0.3, label: 'Toffee Equilibrado' };
  }

  // Frutas, Caldas e Bases Aquosas (fruta_suave, fruta_gelificada, custom)
  switch (level) {
    case 1:
      return {
        minPct: 0.15,
        maxPct: 0.4,
        midPct: 0.28,
        label: 'Fluido / Fio Contínuo'
      };
    case 3:
      return {
        minPct: 0.85,
        maxPct: 1.3,
        midPct: 1.05,
        label: 'Estruturado / Gel Firme'
      };
    case 2:
    default:
      return {
        minPct: 0.4,
        maxPct: 0.85,
        midPct: 0.62,
        label: 'Pastoso Equilibrado'
      };
  }
}

/**
 * Gera orientação prescritiva completa em gramas e passos práticos para atingir
 * a consistência reológica escolhida pelo usuário.
 */
export function evaluateRheologyGuidance(
  items: VariegatoItemRow[],
  level: VariegatoRheologyLevel,
  style: VariegatoStyleStandard,
  percentages: VariegatoAnalysisPercentages,
  finalWeightGrams: number,
  ingredientsMap: Map<string, Ingredient>
): VariegatoRheologyGuidance {
  const safeWeight = finalWeightGrams > 0 ? finalWeightGrams : 1000;
  const range = getHydrocolloidRangeForRheology(level, style.id, percentages.fat);

  // Localizar hidrocolóides existentes na formulação
  let currentGrams = 0;
  let existingHydrocolloidName: string | null = null;
  let hasDairy = false;
  let hasAcid = false;

  for (const item of items) {
    if (!item.name || item.grams <= 0) continue;
    const n = item.name.toLowerCase().trim();
    const ing = ingredientsMap.get(n);

    if (isHydrocolloidIngredient(item.name, ing?.category)) {
      currentGrams += item.grams;
      if (!existingHydrocolloidName) {
        existingHydrocolloidName = item.name;
      }
    }

    if (
      n.includes('leite') ||
      n.includes('creme') ||
      n.includes('manteiga') ||
      n.includes('iogurte') ||
      n.includes('queijo')
    ) {
      hasDairy = true;
    }

    if (
      n.includes('ácido') ||
      n.includes('acido') ||
      n.includes('limão') ||
      n.includes('limao') ||
      n.includes('lima') ||
      n.includes('vinagre') ||
      n.includes('maracujá') ||
      n.includes('maracuja')
    ) {
      hasAcid = true;
    }
  }

  const currentPct = percentages.hydrocolloids;
  const isFatBasedExempt = style.id === 'creme_trufado' || percentages.fat >= 18;

  const targetGramsMin = Math.round(((range.minPct / 100) * safeWeight) * 10) / 10;
  const targetGramsMax = Math.round(((range.maxPct / 100) * safeWeight) * 10) / 10;
  const targetGramsMid = Math.round(((range.midPct / 100) * safeWeight) * 10) / 10;

  // Caso especial: Cremes trufados / base gordurosa
  if (isFatBasedExempt) {
    let fatHeadline = 'Reologia controlada por Lipídeos';
    let fatInstruction =
      'Cremes trufados não utilizam pectina para espessar; sua textura vem da cristalização das gorduras (manteiga de cacau/óleos).';

    if (level === 1) {
      fatHeadline = 'Ajuste de Fluidez Lipídica';
      fatInstruction =
        'Para tornar o creme trufado mais fluido a frio (-12°C), aumente óleo vegetal neutro (girassol/coco fracionado) ou creme de leite em +30g a +50g.';
    } else if (level === 3) {
      fatHeadline = 'Ajuste de Firmeza Lipídica';
      fatInstruction =
        'Para firmar o creme em fitas definidas, aumente chocolate 70%/manteiga de cacau (+30g a +60g) ou pasta pura de oleaginosas e reduza óleos líquidos.';
    }

    return {
      targetLevel: level,
      targetLabel: range.label,
      targetMinPct: range.minPct,
      targetMaxPct: range.maxPct,
      targetMidPct: range.midPct,
      currentHydrocolloidGrams: Math.round(currentGrams * 10) / 10,
      currentHydrocolloidPct: currentPct,
      finalWeightGrams: Math.round(safeWeight * 10) / 10,
      isFatBasedExempt: true,
      status: 'aligned',
      deltaGrams: 0,
      suggestedActionName: 'Manteiga de Cacau / Óleo Vegetal',
      suggestedActionGrams: 0,
      targetGramsMin: 0,
      targetGramsMax: 0,
      alternativeTip: 'Em bases trufadas, ajuste a proporção de gorduras sólidas vs. líquidas.',
      acidActivationNeeded: false,
      acidGramsRecommended: 0,
      headline: fatHeadline,
      actionInstruction: fatInstruction
    };
  }

  // Determinar o ingrediente sugerido mais adequado para este estilo/cenário
  const defaultAgent =
    style.id === 'caramelo_toffee' || hasDairy
      ? 'Neutro'
      : 'Pectina Cítrica / LM';

  const suggestedActionName = existingHydrocolloidName || defaultAgent;

  const alternativeTip =
    style.id === 'caramelo_toffee' || hasDairy
      ? 'Dica: Em bases com lácteos, o Neutro (ou Goma Xantana a 0,15%) evita talhamento.'
      : level === 1
      ? 'Alternativa: Goma Xantana (0,10% a 0,15%) hidrata a frio sem precisar ferver.'
      : level === 3
      ? 'Alternativa: Ágar-Ágar (0,30%) para gel firme de corte ou Neutro reforçado.'
      : 'Dica: Misture a Pectina a seco com 5x o peso em açúcar antes de aquecer a fruta.';

  // Avaliar status (abaixo, alinhado, acima) com tolerância de 0.02%
  let status: 'below' | 'aligned' | 'above' = 'aligned';
  let deltaGrams = 0;

  if (currentPct < range.minPct - 0.01) {
    status = 'below';
    deltaGrams = Math.max(0.5, Math.round((targetGramsMid - currentGrams) * 10) / 10);
  } else if (currentPct > range.maxPct + 0.01) {
    status = 'above';
    deltaGrams = -Math.max(0.5, Math.round((currentGrams - targetGramsMid) * 10) / 10);
  }

  const absDelta = Math.abs(deltaGrams);
  const finalSuggestedGrams = Math.max(0, Math.round((currentGrams + deltaGrams) * 10) / 10);

  // Checar necessidade de ativação ácida para gelificação de pectina
  const usesPectin = suggestedActionName.toLowerCase().includes('pectin');
  const acidActivationNeeded =
    usesPectin &&
    !hasDairy &&
    style.id !== 'caramelo_toffee' &&
    !hasAcid &&
    (level >= 2 || currentGrams > 0);
  const acidGramsRecommended = acidActivationNeeded
    ? Math.max(2, Math.round((safeWeight * 0.005) * 10) / 10)
    : 0;

  let headline = '';
  let actionInstruction = '';

  if (status === 'below') {
    headline =
      currentGrams === 0
        ? `Sem espessantes — adicione +${absDelta.toFixed(1)} g`
        : `Muito ralo p/ ${range.label} — faltam +${absDelta.toFixed(1)} g`;

    actionInstruction = existingHydrocolloidName
      ? `Aumente "${existingHydrocolloidName}" em +${absDelta.toFixed(1)} g (de ${currentGrams.toFixed(1)} g para ${finalSuggestedGrams.toFixed(1)} g) para atingir a faixa ideal de ${range.minPct.toFixed(2)}%–${range.maxPct.toFixed(2)}% neste lote de ${Math.round(safeWeight)} g.`
      : `Adicione ${absDelta.toFixed(1)} g de "${suggestedActionName}" à receita (meta: ${targetGramsMin.toFixed(1)} g a ${targetGramsMax.toFixed(1)} g para ${Math.round(safeWeight)} g finais).`;
  } else if (status === 'above') {
    headline = `Excesso de espessante — reduza ${absDelta.toFixed(1)} g`;
    actionInstruction = existingHydrocolloidName
      ? `Sua mescla tem ${currentPct.toFixed(2)}% de hidrocolóides (máx. ${range.maxPct.toFixed(2)}% para ${range.label}). Reduza "${existingHydrocolloidName}" em ${absDelta.toFixed(1)} g (de ${currentGrams.toFixed(1)} g para ${finalSuggestedGrams.toFixed(1)} g) para evitar textura borrachosa.`
      : `Reduza os espessantes em ${absDelta.toFixed(1)} g para que a calda volte ao perfil ${range.label}.`;
  } else {
    headline = `Calibrado para ${range.label}`;
    actionInstruction = `Excelente! A dosagem atual (${currentGrams.toFixed(1)} g / ${currentPct.toFixed(2)}%) está dentro da faixa recomendada (${targetGramsMin.toFixed(1)} g a ${targetGramsMax.toFixed(1)} g) para obter a textura ${range.label.toLowerCase()}.`;
  }

  return {
    targetLevel: level,
    targetLabel: range.label,
    targetMinPct: range.minPct,
    targetMaxPct: range.maxPct,
    targetMidPct: range.midPct,
    currentHydrocolloidGrams: Math.round(currentGrams * 10) / 10,
    currentHydrocolloidPct: currentPct,
    finalWeightGrams: Math.round(safeWeight * 10) / 10,
    isFatBasedExempt: false,
    status,
    deltaGrams,
    suggestedActionName,
    suggestedActionGrams: finalSuggestedGrams,
    targetGramsMin,
    targetGramsMax,
    alternativeTip,
    acidActivationNeeded,
    acidGramsRecommended,
    headline,
    actionInstruction
  };
}

/**
 * Gera orientação prática de açúcares para corrigir desvios térmicos (PAC baixo ou alto)
 */
export function evaluateThermalGuidance(
  thermalStatus: VariegatoThermalStatus,
  finalWeightGrams: number
): VariegatoThermalGuidance {
  const safeWeight = finalWeightGrams > 0 ? finalWeightGrams : 1000;
  const appLabel = thermalStatus.application === 'vitrine' ? 'Vitrine (-12°C)' : 'Freezer (-18°C)';

  if (thermalStatus.status === 'freezing_risk') {
    // PAC alvo médio ~520 (vitrine) ou ~620 (freezer)
    const targetPac = thermalStatus.application === 'vitrine' ? 520 : 620;
    const pacGap = Math.max(40, targetPac - thermalStatus.pacValue);
    // Dextrose tem PAC ~1.9 vs Sacarose 1.0 (ganho líquido ~0.9 por g substituído)
    const swapGrams = Math.min(
      120,
      Math.max(15, Math.round(((pacGap * (safeWeight / 1000)) / 0.9) / 5) * 5)
    );

    return {
      status: 'freezing_risk',
      headline: `PAC baixo p/ ${appLabel} — risco de endurecer`,
      actionInstruction: `Para amaciar a mescla a ${thermalStatus.targetTemp}°C sem alterar o Brix, substitua cerca de ${swapGrams} g de Açúcar (ou Glucose) por ${swapGrams} g de Dextrose.`
    };
  }

  if (thermalStatus.status === 'too_fluid') {
    const targetPac = thermalStatus.application === 'vitrine' ? 600 : 700;
    const pacExcess = Math.max(40, thermalStatus.pacValue - targetPac);
    // Trocar Dextrose (PAC 1.8) por Glucose em pó 28-30 DE (PAC 0.48) ou Líquida (PAC 0.75) reduz PAC significativamente
    const swapGrams = Math.min(
      120,
      Math.max(15, Math.round(((pacExcess * (safeWeight / 1000)) / 1.1) / 5) * 5)
    );

    return {
      status: 'too_fluid',
      headline: `PAC elevado p/ ${appLabel} — risco de escorrer`,
      actionInstruction: `Para conter o escorrimento a ${thermalStatus.targetTemp}°C, substitua cerca de ${swapGrams} g de Dextrose (ou Açúcar) por ${swapGrams} g de Glucose em pó (28-30 DE) ou Glucose Líquida.`
    };
  }

  return {
    status: 'ideal',
    headline: `Plasticidade ideal p/ ${appLabel}`,
    actionInstruction: `O balanço de açúcares anticongelantes (PAC ${thermalStatus.pacValue}) mantém a mescla macia e estável a ${thermalStatus.targetTemp}°C.`
  };
}
