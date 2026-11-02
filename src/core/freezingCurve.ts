/**
 * Motor Físico-Químico da Curva de Congelamento & Dureza do Gelato
 * Baseado na termodinâmica de soluções de açúcares (Goff & Hartel, Caviezel e Carpigiani University).
 */

export interface FreezingPointSample {
  tempC: number;
  icePercent: number; // % de água congelada em relação à água total
  liquidPercent: number; // % de água líquida (fase xarope)
  hardnessIndex: number; // 0 a 100
}

export interface FreezingStateResult {
  tempC: number;
  icePercent: number; // % de água congelada
  liquidPercent: number; // % de água na fase xarope
  frozenWaterGrams: number; // g de gelo no lote
  liquidWaterGrams: number; // g de água líquida no lote
  hardnessIndex: number; // 0 a 100
  status: 'too_soft' | 'soft' | 'ideal' | 'firm' | 'hard';
  statusLabel: string;
  statusBadgeColor: string;
  statusBorderColor: string;
  diagnostic: string;
  idealTempRange: { minTemp: number; maxTemp: number };
  curvePoints: FreezingPointSample[];
}

/**
 * Calcula a fração de água congelada a uma determinada temperatura negativa
 */
export function calculateIcePercentAtTemp(
  waterPct: number, // 0 a 1 (ex: 0.64 para 64%)
  pac: number, // em % do lote (ex: 21.5 para 21.5%)
  totalSolids: number, // 0 a 1 (ex: 0.36 para 36%)
  tempC: number // ex: -12
): { icePercent: number; liquidPercent: number } {
  const absTemp = Math.abs(tempC);
  if (absTemp <= 0.1 || waterPct <= 0) {
    return { icePercent: 0, liquidPercent: 100 };
  }

  const totalWaterGrams100 = waterPct * 100;

  // Água ligada (hidratação não-congelável de sólidos/proteínas/gomas ~0.2g H2O / g sólidos)
  const boundWater = Math.min(
    0.2 * (totalSolids * 100),
    totalWaterGrams100 * 0.4
  );

  // Água líquida livre requerida para dissolver os solutos (PAC) à temperatura T (relação crioscópica de Raoult)
  // |T| = 1.86 * (PAC / 342.3) / (W_free / 1000) => W_free = PAC * 5.434 / |T|
  const freeLiquidWater = (pac * 5.434) / absTemp;
  const totalLiquidWater = Math.min(totalWaterGrams100, freeLiquidWater + boundWater);

  const frozenWater = Math.max(0, totalWaterGrams100 - totalLiquidWater);
  const icePercent = (frozenWater / totalWaterGrams100) * 100;
  const liquidPercent = 100 - icePercent;

  return {
    icePercent: Math.max(0, Math.min(100, icePercent)),
    liquidPercent: Math.max(0, Math.min(100, liquidPercent))
  };
}

/**
 * Análise completa do estado térmico do gelato a uma dada temperatura de serviço
 */
export function calculateFreezingState(
  waterPct: number,
  pac: number,
  totalSolids: number,
  tempC: number,
  caldaWeightGrams: number = 1000
): FreezingStateResult {
  const { icePercent, liquidPercent } = calculateIcePercentAtTemp(waterPct, pac, totalSolids, tempC);

  const totalWaterGrams = caldaWeightGrams * waterPct;
  const frozenWaterGrams = Math.round((totalWaterGrams * icePercent) / 100);
  const liquidWaterGrams = Math.round(totalWaterGrams - frozenWaterGrams);

  // Mapeamento normalizado de dureza (0 = líquido, 50 = início ideal, 72 = centro ideal, 100 = bloco de gelo)
  const hardnessIndex = Math.max(0, Math.min(100, Math.round((icePercent - 45) * 2.5)));

  // Classificação qualitativa da consistência
  let status: 'too_soft' | 'soft' | 'ideal' | 'firm' | 'hard';
  let statusLabel: string;
  let statusBadgeColor: string;
  let statusBorderColor: string;
  let diagnostic: string;

  if (icePercent < 60) {
    status = 'too_soft';
    statusLabel = 'Muito Mole / Desmanchando';
    statusBadgeColor = 'bg-rose-500/15 text-rose-300';
    statusBorderColor = 'border-rose-500/40';
    diagnostic = `A ${tempC.toFixed(1)}°C, menos de 60% da água está congelada. O gelato perderá estrutura na cuba, escorrerá da espátula e derreterá muito rápido na casquinha. Recomenda-se reduzir a temperatura da vitrine ou reduzir o PAC da calda.`;
  } else if (icePercent < 65) {
    status = 'soft';
    statusLabel = 'Mole / Degustação Imediata';
    statusBadgeColor = 'bg-amber-500/15 text-amber-300';
    statusBorderColor = 'border-amber-500/40';
    diagnostic = `A ${tempC.toFixed(1)}°C, consistência aveludada, porém próxima ao limite inferior de sustentação para vitrines abertas com vento. Ideal para consumo imediato no copinho.`;
  } else if (icePercent <= 74) {
    status = 'ideal';
    statusLabel = 'Spatolabile Ideal (Padrão Ouro)';
    statusBadgeColor = 'bg-emerald-500/15 text-emerald-300';
    statusBorderColor = 'border-emerald-500/40';
    diagnostic = `A ${tempC.toFixed(1)}°C, equilíbrio termodinâmico perfeito! ${icePercent.toFixed(1)}% de água congelada confere excelente espalhabilidade na espátula (spatolabile), microcristais aveludados e alta estabilidade na vitrine.`;
  } else if (icePercent < 80) {
    status = 'firm';
    statusLabel = 'Firme / Ponto de Transporte';
    statusBadgeColor = 'bg-sky-500/15 text-sky-300';
    statusBorderColor = 'border-sky-500/40';
    diagnostic = `A ${tempC.toFixed(1)}°C, a fração de gelo atinge ${icePercent.toFixed(1)}%. O gelato fica mais resistente ao toque da espátula. Adequado para transporte térmico em caixas de isopor ou vitrines em climas muito quentes.`;
  } else {
    status = 'hard';
    statusLabel = 'Rígido / Ponto de Freezer (-18°C)';
    statusBadgeColor = 'bg-purple-500/15 text-purple-300';
    statusBorderColor = 'border-purple-500/40';
    diagnostic = `A ${tempC.toFixed(1)}°C, mais de 80% da água está congelada. Consistência de pote para viagem (Take Away). Para servir na espátula, necessita descansar de 10 a 15 minutos em temperatura ambiente.`;
  }

  // Gerar pontos da curva de -8°C a -20°C
  const curvePoints: FreezingPointSample[] = [];
  let minIdealTemp = -13;
  let maxIdealTemp = -11;
  let minIdealFound = false;
  let maxIdealFound = false;

  for (let t = -8; t >= -20; t -= 0.5) {
    const pt = calculateIcePercentAtTemp(waterPct, pac, totalSolids, t);
    const h = Math.max(0, Math.min(100, Math.round((pt.icePercent - 45) * 2.5)));
    curvePoints.push({
      tempC: t,
      icePercent: pt.icePercent,
      liquidPercent: pt.liquidPercent,
      hardnessIndex: h
    });

    // Detectar faixa ideal (65% a 74% de gelo)
    if (!maxIdealFound && pt.icePercent >= 65) {
      maxIdealTemp = t; // Ponto mais quente onde atinge 65%
      maxIdealFound = true;
    }
    if (pt.icePercent <= 74) {
      minIdealTemp = t; // Ponto mais frio antes de ultrapassar 74%
      minIdealFound = true;
    }
  }

  return {
    tempC,
    icePercent,
    liquidPercent,
    frozenWaterGrams,
    liquidWaterGrams,
    hardnessIndex,
    status,
    statusLabel,
    statusBadgeColor,
    statusBorderColor,
    diagnostic,
    idealTempRange: {
      minTemp: Math.min(minIdealTemp, maxIdealTemp),
      maxTemp: Math.max(minIdealTemp, maxIdealTemp)
    },
    curvePoints
  };
}
