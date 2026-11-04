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
});

