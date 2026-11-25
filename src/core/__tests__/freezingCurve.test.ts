import { describe, it, expect } from 'vitest';
import { calculateIcePercentAtTemp, calculateFreezingState } from '../freezingCurve';

describe('Freezing Curve & Cryoscopic Model (Raoult-Goff)', () => {
  const waterPct = 0.64; // 64% água
  const pac = 26.5;     // PAC típico de vitrine
  const totalSolids = 0.36; // 36% sólidos totais

  it('retorna 0% de gelo para temperaturas próximas ou acima de 0°C', () => {
    const result = calculateIcePercentAtTemp(waterPct, pac, totalSolids, 0);
    expect(result.icePercent).toBe(0);
    expect(result.liquidPercent).toBe(100);
  });

  it('calcula a fração de gelo a -12°C dentro do padrão de espátula (spatolabile)', () => {
    const result = calculateIcePercentAtTemp(waterPct, pac, totalSolids, -12);
    // A -12°C com PAC 26.5 e 64% água, espera-se ~65% a 75% de gelo
    expect(result.icePercent).toBeGreaterThan(60);
    expect(result.icePercent).toBeLessThan(80);
    expect(result.liquidPercent).toBeCloseTo(100 - result.icePercent, 1);
  });

  it('aumenta a fração de gelo conforme a temperatura diminui até -18°C', () => {
    const temp11 = calculateIcePercentAtTemp(waterPct, pac, totalSolids, -11);
    const temp14 = calculateIcePercentAtTemp(waterPct, pac, totalSolids, -14);
    const temp18 = calculateIcePercentAtTemp(waterPct, pac, totalSolids, -18);

    expect(temp14.icePercent).toBeGreaterThan(temp11.icePercent);
    expect(temp18.icePercent).toBeGreaterThan(temp14.icePercent);
  });

  it('fornece diagnóstico de textura com rótulos e métricas de massa líquida', () => {
    const state = calculateFreezingState(waterPct, pac, totalSolids, -12, 1000);

    expect(state.frozenWaterGrams).toBeGreaterThan(0);
    expect(state.liquidWaterGrams).toBeGreaterThan(0);
    expect(state.frozenWaterGrams + state.liquidWaterGrams).toBeCloseTo(640, 1); // 64% de 1000g
    expect(state.statusLabel).toBeDefined();
    expect(state.statusBorderColor).toBeDefined();
  });

  it('interpreta corretamente PAC <= 100 na escala per1000g e evita faixa falsa -13/-11 sem cruzamento', () => {
    // Calda zero/baixa em solutos com relPac = 80 (8.0%) em 1000g -> muito rígida a -12°C
    const rigidState = calculateFreezingState(0.68, 80, 0.32, -12, 1000, 'per1000g');
    expect(rigidState.icePercent).toBeGreaterThan(75);
    expect(rigidState.idealTempRange.minTemp).toBe(-8);
    expect(rigidState.idealTempRange.maxTemp).toBe(-8);

    // Verifica coerência do limite superior de 75% na curva de temperatura
    const normalState = calculateFreezingState(0.64, 265, 0.36, -12, 1000, 'per1000g');
    const pointAtMaxIdeal = normalState.curvePoints.find(pt => pt.tempC === normalState.idealTempRange.maxTemp);
    const pointAtMinIdeal = normalState.curvePoints.find(pt => pt.tempC === normalState.idealTempRange.minTemp);
    expect(pointAtMaxIdeal?.icePercent).toBeGreaterThanOrEqual(64);
    expect(pointAtMinIdeal?.icePercent).toBeLessThanOrEqual(75);
  });
});

