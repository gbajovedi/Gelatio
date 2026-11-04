import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateTotalFixedCosts,
  calculateEffectiveCardFee,
  getStoredPricingParams,
  saveStoredPricingParams,
  getPricingSettings,
  getPricingUIPreferences,
  savePricingUIPreferences,
  DEFAULT_PRICING_PARAMS,
  DEFAULT_PRICING_UI_PREFS,
  STORAGE_KEY,
  PRICING_UI_PREFS_KEY,
  PRICING_UPDATED_EVENT,
  PricingParams,
  PricingUIPreferences
} from '../pricingStorage';

describe('Pricing Storage & Financial Engine (pricingStorage.ts)', () => {
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

  describe('1. calculateTotalFixedCosts', () => {
    it('soma perfeitamente todos os 16 custos fixos padrão', () => {
      const sampleParams: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        rent: 2000,
        electricity: 500,
        water: 100,
        telecom: 150,
        payroll: 3000,
        ownerSalary: 2500,
        accounting: 400,
        software: 200,
        equipmentMaintenance: 300,
        equipmentDepreciation: 250,
        cleaningHygiene: 150,
        secPackaging: 200,
        fixedTaxes: 100,
        licensesAndPermits: 150,
        commercialInsurance: 200,
        posRentalMonthly: 100,
        marketing: 300,
        customCosts: []
      };

      const total = calculateTotalFixedCosts(sampleParams);
      // 2000+500+100+150+3000+2500+400+200+300+250+150+200+100+150+200+100+300 = 10600
      expect(total).toBe(10600);
    });

    it('inclui dinamicamente custos extras personalizados (customCosts)', () => {
      const sampleParams: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        rent: 1000,
        payroll: 0,
        electricity: 0,
        water: 0,
        telecom: 0,
        ownerSalary: 0,
        accounting: 0,
        software: 0,
        equipmentMaintenance: 0,
        equipmentDepreciation: 0,
        cleaningHygiene: 0,
        secPackaging: 0,
        fixedTaxes: 0,
        licensesAndPermits: 0,
        commercialInsurance: 0,
        posRentalMonthly: 0,
        marketing: 0,
        customCosts: [
          { id: 'c1', name: 'Aluguel Vaga Garagem', amount: 350 },
          { id: 'c2', name: 'Segurança Noturna', amount: 250 }
        ]
      };

      const total = calculateTotalFixedCosts(sampleParams);
      expect(total).toBe(1600); // 1000 + 350 + 250
    });

    it('trata graciosamente campos nulos, vazios ou indefinidos', () => {
      const incompleteParams = {
        rent: 500
      } as unknown as PricingParams;

      const total = calculateTotalFixedCosts(incompleteParams);
      expect(total).toBe(500);
    });
  });

  describe('2. calculateEffectiveCardFee (Taxa Média de Cartão)', () => {
    it('retorna a taxa manual quando useSalesMix é falso', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        useSalesMix: false,
        cardFee: 2.75
      };

      expect(calculateEffectiveCardFee(params)).toBe(2.75);
    });

    it('calcula a taxa média ponderada pelo mix de vendas (Pix, Débito, Crédito à Vista, Parcelado)', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        useSalesMix: true,
        // Taxas
        cardFeePix: 0.00,
        cardFeeDebit: 1.50,
        cardFeeCreditSight: 3.00,
        cardFeeCreditInstallment: 6.00,
        // Mix: 40% Pix, 30% Débito, 20% Crédito à Vista, 10% Parcelado = 100%
        mixPix: 40,
        mixDebit: 30,
        mixCreditSight: 20,
        mixCreditInstallment: 10
      };

      // Média esperada:
      // (0*40 + 1.50*30 + 3.00*20 + 6.00*10) / 100 = (0 + 45 + 60 + 60) / 100 = 165 / 100 = 1.65%
      expect(calculateEffectiveCardFee(params)).toBe(1.65);
    });

    it('retorna 0% quando 100% das vendas são via Pix', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        useSalesMix: true,
        cardFeePix: 0.00,
        mixPix: 100,
        mixDebit: 0,
        mixCreditSight: 0,
        mixCreditInstallment: 0
      };

      expect(calculateEffectiveCardFee(params)).toBe(0.00);
    });

    it('faz fallback para cardFee se o mix total for 0%', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        useSalesMix: true,
        cardFee: 3.20,
        mixPix: 0,
        mixDebit: 0,
        mixCreditSight: 0,
        mixCreditInstallment: 0
      };

      expect(calculateEffectiveCardFee(params)).toBe(3.20);
    });

    it('normaliza corretamente mesmo se o somatório do mix for diferente de 100', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        useSalesMix: true,
        cardFeePix: 0.00,
        cardFeeDebit: 2.00,
        cardFeeCreditSight: 4.00,
        cardFeeCreditInstallment: 0.00,
        mixPix: 50,
        mixDebit: 50,
        mixCreditSight: 50,
        mixCreditInstallment: 0 // Total = 150
      };

      // (0*50 + 2*50 + 4*50) / 150 = (0 + 100 + 200) / 150 = 300 / 150 = 2.00%
      expect(calculateEffectiveCardFee(params)).toBe(2.00);
    });
  });

  describe('3. getStoredPricingParams & saveStoredPricingParams', () => {
    it('retorna DEFAULT_PRICING_PARAMS quando o localStorage está vazio', () => {
      const params = getStoredPricingParams();
      expect(params).toBeDefined();
      expect(params.monthlyUnits).toBe(DEFAULT_PRICING_PARAMS.monthlyUnits);
      expect(params.tubWeightGrams).toBe(DEFAULT_PRICING_PARAMS.tubWeightGrams);
      expect(params.targetMargin).toBe(DEFAULT_PRICING_PARAMS.targetMargin);
    });

    it('recupera com segurança e retorna defaults se o JSON no localStorage estiver corrompido', () => {
      memoryStorage[STORAGE_KEY] = '{ invalid json ::: broken';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const params = getStoredPricingParams();
      expect(params).toEqual(DEFAULT_PRICING_PARAMS);

      consoleWarnSpy.mockRestore();
    });

    it('salva e recupera parâmetros personalizados com roundtrip completo', () => {
      const customParams: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        rent: 4500,
        monthlyUnits: 2500,
        targetMargin: 65,
        pricingMethod: 'markup',
        customCosts: [{ id: '1', name: 'Software Gestão', amount: 300 }]
      };

      saveStoredPricingParams(customParams);

      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(customParams));
      const loaded = getStoredPricingParams();
      expect(loaded.rent).toBe(4500);
      expect(loaded.monthlyUnits).toBe(2500);
      expect(loaded.targetMargin).toBe(65);
      expect(loaded.pricingMethod).toBe('markup');
      expect(loaded.customCosts).toHaveLength(1);
      expect(loaded.customCosts?.[0].name).toBe('Software Gestão');
    });

    it('dispara o evento PRICING_UPDATED_EVENT na window ao salvar quando window existir', () => {
      const mockDispatch = vi.fn();
      class MockEvent {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
      }

      vi.stubGlobal('Event', MockEvent);
      vi.stubGlobal('window', { dispatchEvent: mockDispatch });

      saveStoredPricingParams(DEFAULT_PRICING_PARAMS);

      expect(mockDispatch).toHaveBeenCalled();
      const dispatchedEvent = mockDispatch.mock.calls[0][0];
      expect(dispatchedEvent.type).toBe(PRICING_UPDATED_EVENT);
    });
  });

  describe('4. getPricingSettings', () => {
    it('calcula o overhead indireto unitário por pote com base nas unidades mensais', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        rent: 5000,
        payroll: 5000,
        // Zerar outros para total exato = 10000
        electricity: 0,
        water: 0,
        telecom: 0,
        ownerSalary: 0,
        accounting: 0,
        software: 0,
        equipmentMaintenance: 0,
        equipmentDepreciation: 0,
        cleaningHygiene: 0,
        secPackaging: 0,
        fixedTaxes: 0,
        licensesAndPermits: 0,
        commercialInsurance: 0,
        posRentalMonthly: 0,
        marketing: 0,
        customCosts: [],
        monthlyUnits: 1000, // 10.000 / 1.000 = R$ 10,00 por pote
        tubWeightGrams: 500,
        tubPackCost: 2.50,
        targetMargin: 55,
        salesTaxPercent: 4.5
      };

      const settings = getPricingSettings(params);
      expect(settings.indirectOverheadPerTub).toBe(10.00);
      expect(settings.tubWeightGrams).toBe(500);
      expect(settings.tubPackagingCost).toBe(2.50);
      expect(settings.targetProfitMarginPercent).toBe(55);
      expect(settings.salesTaxPercent).toBe(4.5);
    });

    it('evita divisão por zero se monthlyUnits for zero', () => {
      const params: PricingParams = {
        ...DEFAULT_PRICING_PARAMS,
        rent: 5000,
        monthlyUnits: 0
      };

      const settings = getPricingSettings(params);
      expect(settings.indirectOverheadPerTub).toBe(0);
      expect(Number.isFinite(settings.indirectOverheadPerTub)).toBe(true);
    });
  });

  describe('5. getPricingUIPreferences & savePricingUIPreferences (Preferências Visuais)', () => {
    it('retorna DEFAULT_PRICING_UI_PREFS quando não há preferências salvas', () => {
      const prefs = getPricingUIPreferences();
      expect(prefs).toEqual(DEFAULT_PRICING_UI_PREFS);
      expect(prefs.expandedCostGroups.occupancy).toBe(false);
      expect(prefs.isCardFeeExpanded).toBe(false);
      expect(prefs.isTaxExpanded).toBe(false);
    });

    it('recupera com segurança e retorna defaults se o JSON de preferências estiver corrompido', () => {
      memoryStorage[PRICING_UI_PREFS_KEY] = 'not-valid-json';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const prefs = getPricingUIPreferences();
      expect(prefs).toEqual(DEFAULT_PRICING_UI_PREFS);

      consoleWarnSpy.mockRestore();
    });

    it('salva e recupera alterações de expansão mantendo persistência de acordeões', () => {
      const modifiedPrefs: PricingUIPreferences = {
        expandedCostGroups: {
          occupancy: true,
          personnel: true,
          equipment: false,
          legal: false,
          custom: true
        },
        isCardFeeExpanded: true,
        isTaxExpanded: false,
        isPaymentMatrixExpanded: true
      };

      savePricingUIPreferences(modifiedPrefs);

      const loaded = getPricingUIPreferences();
      expect(loaded.expandedCostGroups.occupancy).toBe(true);
      expect(loaded.expandedCostGroups.personnel).toBe(true);
      expect(loaded.expandedCostGroups.equipment).toBe(false);
      expect(loaded.expandedCostGroups.custom).toBe(true);
      expect(loaded.isCardFeeExpanded).toBe(true);
      expect(loaded.isPaymentMatrixExpanded).toBe(true);
    });

    it('faz merge gracioso de novas propriedades preservando grupos ausentes', () => {
      // Simula uma versão anterior salva que só tinha "occupancy: true"
      memoryStorage[PRICING_UI_PREFS_KEY] = JSON.stringify({
        expandedCostGroups: {
          occupancy: true
        }
      });

      const loaded = getPricingUIPreferences();
      expect(loaded.expandedCostGroups.occupancy).toBe(true);
      expect(loaded.expandedCostGroups.personnel).toBe(false); // Default preservado
      expect(loaded.isCardFeeExpanded).toBe(false); // Default preservado
    });
  });
});
