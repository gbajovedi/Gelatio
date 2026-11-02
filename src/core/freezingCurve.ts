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
  status: 'very_soft' | 'soft' | 'ideal' | 'firm' | 'freezer';
  statusLabel: string;
  statusBadgeColor: string;
  statusBorderColor: string;
  statusBoxBg: string;
  statusBoxBorder: string;
  statusBoxText: string;
  diagnostic: string;
  idealTempRange: { minTemp: number; maxTemp: number };
  curvePoints: FreezingPointSample[];
}

/**
 * Calcula a fração de água congelada a uma determinada temperatura negativa
 */
export function calculateIcePercentAtTemp(
  waterPct: number, // 0 a 1 ou 0 a 100
  pac: number, // pode vir em % (ex: 25.5) ou relativo por 1000g (ex: 255)
  totalSolids: number, // 0 a 1 ou 0 a 100
  tempC: number // ex: -12
): { icePercent: number; liquidPercent: number } {
  const absTemp = Math.abs(tempC);

  // Normalização de escalas para robustez absoluta
  const normalizedWater = waterPct > 1 ? waterPct / 100 : waterPct;
  const normalizedSolids = totalSolids > 1 ? totalSolids / 100 : totalSolids;
  // Se o PAC estiver na escala de 1.000g (ex: 255), converte para porcentagem do lote (25.5%)
  const normalizedPac = pac > 100 ? pac / 10 : pac;

  if (absTemp <= 0.1 || normalizedWater <= 0) {
    return { icePercent: 0, liquidPercent: 100 };
  }

  const totalWaterGrams100 = normalizedWater * 100;

  // Água ligada (hidratação não-congelável de sólidos/proteínas/gomas ~0.2g H2O / g sólidos)
  const boundWater = Math.min(
    0.2 * (normalizedSolids * 100),
    totalWaterGrams100 * 0.4
  );

  // Água líquida livre requerida para dissolver os solutos (PAC) à temperatura T (relação crioscópica de Raoult)
  // |T| = 1.86 * (PAC / 342.3) / (W_free / 1000) => W_free = PAC * 5.434 / |T|
  const freeLiquidWater = (normalizedPac * 5.434) / absTemp;
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
  // Normalização prévia de escalas
  const normalizedWater = waterPct > 1 ? waterPct / 100 : waterPct;
  const normalizedSolids = totalSolids > 1 ? totalSolids / 100 : totalSolids;
  const normalizedPac = pac > 100 ? pac / 10 : pac;

  const { icePercent, liquidPercent } = calculateIcePercentAtTemp(
    normalizedWater,
    normalizedPac,
    normalizedSolids,
    tempC
  );

  const totalWaterGrams = caldaWeightGrams * normalizedWater;
  const frozenWaterGrams = Math.round((totalWaterGrams * icePercent) / 100);
  const liquidWaterGrams = Math.round(totalWaterGrams - frozenWaterGrams);

  // Mapeamento normalizado de dureza (0 = líquido, 50 = início ideal, 70 = centro ideal, 100 = bloco de gelo)
  const hardnessIndex = Math.max(0, Math.min(100, Math.round((icePercent - 45) * 2.5)));

  // Classificação da consistência sem falsos alarmes vermelhos
  let status: 'very_soft' | 'soft' | 'ideal' | 'firm' | 'freezer';
  let statusLabel: string;
  let statusBadgeColor: string;
  let statusBorderColor: string;
  let statusBoxBg: string;
  let statusBoxBorder: string;
  let statusBoxText: string;
  let diagnostic: string;

  if (icePercent < 56) {
    status = 'very_soft';
    statusLabel = 'Muito Macio';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300';
    statusBorderColor = 'border-amber-500/40';
    statusBoxBg = 'bg-amber-500/10';
    statusBoxBorder = 'border-amber-500/30';
    statusBoxText = 'text-amber-200';
    diagnostic = `A ${tempC.toFixed(1)}°C, a receita apresenta textura muito macia e fluida. Caso deseje maior firmeza na espátula, sirva em vitrine um pouco mais fria (-13°C a -14°C) ou regule o PAC da calda.`;
  } else if (icePercent < 64) {
    status = 'soft';
    statusLabel = 'Macio & Cremoso';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300';
    statusBorderColor = 'border-amber-500/40';
    statusBoxBg = 'bg-amber-500/10';
    statusBoxBorder = 'border-amber-500/30';
    statusBoxText = 'text-amber-200';
    diagnostic = `A ${tempC.toFixed(1)}°C, consistência aveludada e cremosa. Ponto ótimo para copinhos ou consumo imediato.`;
  } else if (icePercent <= 75) {
    status = 'ideal';
    statusLabel = 'Spatolabile Ideal (Padrão Ouro)';
    statusBadgeColor = 'bg-emerald-500/20 text-emerald-300';
    statusBorderColor = 'border-emerald-500/40';
    statusBoxBg = 'bg-emerald-500/10';
    statusBoxBorder = 'border-emerald-500/30';
    statusBoxText = 'text-emerald-200';
    diagnostic = `A ${tempC.toFixed(1)}°C, equilíbrio termodinâmico perfeito! ${icePercent.toFixed(1)}% de água congelada confere excelente espalhabilidade na espátula (spatolabile), microcristais aveludados e alta estabilidade na vitrine.`;
  } else if (icePercent <= 82) {
    status = 'firm';
    statusLabel = 'Firme / Boa Estrutura';
    statusBadgeColor = 'bg-sky-500/20 text-sky-300';
    statusBorderColor = 'border-sky-500/40';
    statusBoxBg = 'bg-sky-500/10';
    statusBoxBorder = 'border-sky-500/30';
    statusBoxText = 'text-sky-200';
    diagnostic = `A ${tempC.toFixed(1)}°C, a textura fica mais firme e resistente (${icePercent.toFixed(1)}% de gelo). Excelente sustentação para casquinhas altas, vitrines externas ou transporte térmico.`;
  } else {
    status = 'freezer';
    statusLabel = 'Ponto de Pote / Freezer (-18°C)';
    statusBadgeColor = 'bg-purple-500/20 text-purple-300';
    statusBorderColor = 'border-purple-500/40';
    statusBoxBg = 'bg-purple-500/10';
    statusBoxBorder = 'border-purple-500/30';
    statusBoxText = 'text-purple-200';
    diagnostic = `A ${tempC.toFixed(1)}°C, consistência perfeita para armazenamento em freezer doméstico e potes de delivery (Take Away). Para servir na espátula, recomenda-se descansar de 5 a 10 minutos.`;
  }

  // Gerar pontos da curva de -8°C a -20°C
  const curvePoints: FreezingPointSample[] = [];
  let minIdealTemp = -13;
  let maxIdealTemp = -11;
  let minIdealFound = false;
  let maxIdealFound = false;

  for (let t = -8; t >= -20; t -= 0.5) {
    const pt = calculateIcePercentAtTemp(normalizedWater, normalizedPac, normalizedSolids, t);
    const h = Math.max(0, Math.min(100, Math.round((pt.icePercent - 45) * 2.5)));
    curvePoints.push({
      tempC: t,
      icePercent: pt.icePercent,
      liquidPercent: pt.liquidPercent,
      hardnessIndex: h
    });

    if (!maxIdealFound && pt.icePercent >= 64) {
      maxIdealTemp = t;
      maxIdealFound = true;
    }
    if (pt.icePercent <= 73) {
      minIdealTemp = t;
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
    statusBoxBg,
    statusBoxBorder,
    statusBoxText,
    diagnostic,
    idealTempRange: {
      minTemp: Math.min(minIdealTemp, maxIdealTemp),
      maxTemp: Math.max(minIdealTemp, maxIdealTemp)
    },
    curvePoints
  };
}
