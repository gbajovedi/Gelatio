import { StyleStandard } from '../types/gelato';
import initialStyles from '../data/styles.json';

export const STYLES_STORAGE_KEY = 'gelato_custom_styles_v1';
export const USER_CUSTOM_STYLES_KEY = 'gelato_user_custom_styles_v2';
export const STYLES_PRESET_KEY = 'gelato_active_styles_preset_v1';
export const STYLES_UPDATED_EVENT = 'gelato-styles-updated';

export type StylePresetId = 'gold' | 'carpigiani' | 'custom';

/**
 * Conjunto de estilos que possuem dados e referências na Carpigiani Gelato University
 * (Apostila Corso Intermedio 2025/2026: Slides 11, 47, 48, 50, 51, 60, 63 e 64).
 * Categorias como Sorbets de Chocolate, Vegano, Alcoólicos e Zero pertencem ao Corso Avanzato,
 * e Gelatos Proteicos à nutrição funcional, não tendo parâmetros no material intermediário da CGU.
 */
export const STYLES_WITH_CARPIGIANI_DATA = new Set<string>([
  'Gelatos de Leite',
  'Gelatos de Leite com Chocolate',
  'Gelatos de Oleaginosas',
  'Gelatos de Leite com Fruta',
  'Sorbets',
  'Sorbets Cítricos / Frutas Ácidas',
  'Sorbets Polposos / Frutas Densas'
]);

export function hasCarpigianiData(styleName: string): boolean {
  return STYLES_WITH_CARPIGIANI_DATA.has(styleName);
}

/**
 * Padrão Ouro Híbrido Protegido (Opção 2 - Recomendado)
 * - PAC Carpigiani (220-260 para nozes, 280-330 para sorbets)
 * - Blindagem de Caviezel contra arenosidade (SLNG máx 10.5%)
 * - Açúcares moderados para valorizar frutas tropicais maduras brasileiras
 */
export const GOLD_STANDARD_STYLES: Record<string, StyleStandard> = initialStyles as Record<string, StyleStandard>;

/**
 * Carpigiani Gelato University (CGU 2025/2026 - Padrão Estrito Acadêmico)
 * - Açúcares frutas: 22% a 24% (Slide 11/48)
 * - Gordura leite: 7% a 16% (Slide 11)
 * - SLNG: 7% a 12% (Slide 11)
 * - Sorbets unificados: 26% a 31% de açúcares (Slide 60)
 */
export const CARPIGIANI_STRICT_STYLES: Record<string, StyleStandard> = {
  ...GOLD_STANDARD_STYLES,
  'Gelatos de Leite': {
    name: 'Gelatos de Leite',
    pacDivisor: 24,
    min: {
      sugars: 0.18,
      fat: 0.07,
      msnf: 0.07,
      otherSolids: 0.002,
      totalSolids: 0.37,
      water: 0.54,
      pod: 120,
      pac: 220,
      protein: 0
    },
    max: {
      sugars: 0.22,
      fat: 0.16,
      msnf: 0.12,
      otherSolids: 0.10,
      totalSolids: 0.46,
      water: 0.63,
      pod: 220,
      pac: 280,
      protein: 0
    }
  },
  'Gelatos de Oleaginosas': {
    name: 'Gelatos de Oleaginosas',
    pacDivisor: 24,
    min: {
      sugars: 0.18,
      fat: 0.07,
      msnf: 0.07,
      otherSolids: 0.002,
      totalSolids: 0.37,
      water: 0.54,
      pod: 120,
      pac: 220,
      protein: 0
    },
    max: {
      sugars: 0.20,
      fat: 0.16,
      msnf: 0.12,
      otherSolids: 0.10,
      totalSolids: 0.46,
      water: 0.63,
      pod: 220,
      pac: 260,
      protein: 0
    }
  },
  'Sorbets': {
    name: 'Sorbets (Geral)',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.68,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.005,
      msnf: 0,
      otherSolids: 0.02,
      totalSolids: 0.32,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Sorbets Cítricos / Frutas Ácidas': {
    name: 'Sorbets Cítricos / Frutas Ácidas',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.68,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.005,
      msnf: 0,
      otherSolids: 0.02,
      totalSolids: 0.32,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Sorbets Polposos / Frutas Densas': {
    name: 'Sorbets Polposos / Frutas Densas',
    pacDivisor: 24,
    min: {
      sugars: 0.26,
      fat: 0,
      msnf: 0,
      otherSolids: 0.004,
      totalSolids: 0.28,
      water: 0.65,
      pod: 200,
      pac: 280,
      protein: 0
    },
    max: {
      sugars: 0.31,
      fat: 0.01,
      msnf: 0,
      otherSolids: 0.04,
      totalSolids: 0.35,
      water: 0.72,
      pod: 280,
      pac: 330,
      protein: 0
    }
  },
  'Gelatos de Leite com Fruta': {
    name: 'Gelatos de Leite com Fruta',
    pacDivisor: 24,
    min: {
      sugars: 0.22,
      fat: 0.03,
      msnf: 0.03,
      otherSolids: 0.002,
      totalSolids: 0.32,
      water: 0.58,
      pod: 180,
      pac: 250,
      protein: 0
    },
    max: {
      sugars: 0.24,
      fat: 0.10,
      msnf: 0.07,
      otherSolids: 0.08,
      totalSolids: 0.42,
      water: 0.68,
      pod: 260,
      pac: 290,
      protein: 0
    }
  }
};

/**
 * Retorna os estilos e perfis personalizados do usuário armazenados de forma isolada.
 * Não é sobrescrito ao alternar entre Padrão Ouro ou Carpigiani.
 */
export function getUserCustomStyles(): Record<string, StyleStandard> {
  if (typeof window === 'undefined') return { ...GOLD_STANDARD_STYLES };
  try {
    let raw = localStorage.getItem(USER_CUSTOM_STYLES_KEY);
    // Migração de v1 caso não exista v2 ainda
    if (!raw) {
      const v1Preset = localStorage.getItem(STYLES_PRESET_KEY);
      if (v1Preset === 'custom') {
        raw = localStorage.getItem(STYLES_STORAGE_KEY);
      }
    }
    if (!raw) return { ...GOLD_STANDARD_STYLES };

    const parsed = JSON.parse(raw);
    if (parsed['Zero']) {
      parsed['Gelatos Zero Açúcar'] = { ...parsed['Zero'], name: 'Gelatos Zero Açúcar' };
      delete parsed['Zero'];
    }
    if (parsed['Sorbets Zero']) {
      parsed['Sorbets Zero Açúcar'] = { ...parsed['Sorbets Zero'], name: 'Sorbets Zero Açúcar' };
      delete parsed['Sorbets Zero'];
    }
    return { ...GOLD_STANDARD_STYLES, ...parsed };
  } catch (e) {
    console.warn('Erro ao carregar estilos customizados do usuário:', e);
    return { ...GOLD_STANDARD_STYLES };
  }
}

/**
 * Persiste os estilos personalizados do usuário no armazenamento dedicado
 */
export function saveUserCustomStyles(styles: Record<string, StyleStandard>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_CUSTOM_STYLES_KEY, JSON.stringify(styles));
  } catch (e) {
    console.error('Erro ao salvar USER_CUSTOM_STYLES_KEY:', e);
  }
}

/**
 * Retorna o ID do preset ativo ('gold', 'carpigiani' ou 'custom')
 */
export function getActivePresetId(): StylePresetId {
  if (typeof window === 'undefined') return 'gold';
  try {
    const p = localStorage.getItem(STYLES_PRESET_KEY);
    if (p === 'gold' || p === 'carpigiani' || p === 'custom') return p;
    return 'gold';
  } catch {
    return 'gold';
  }
}

/**
 * Carrega estilos efetivos de acordo com o preset ativo
 */
export function getStoredStyles(): Record<string, StyleStandard> {
  if (typeof window === 'undefined') return GOLD_STANDARD_STYLES;
  try {
    const activePreset = getActivePresetId();
    if (activePreset === 'carpigiani') {
      return CARPIGIANI_STRICT_STYLES;
    }
    if (activePreset === 'custom') {
      return getUserCustomStyles();
    }
    return GOLD_STANDARD_STYLES;
  } catch (e) {
    console.warn('Erro ao carregar estilos vigentes:', e);
    return GOLD_STANDARD_STYLES;
  }
}

/**
 * Salva estilos e dispara evento global de atualização imediata
 */
export function saveStoredStyles(
  styles: Record<string, StyleStandard>,
  presetId: StylePresetId = 'custom'
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(styles));
    localStorage.setItem(STYLES_PRESET_KEY, presetId);
    if (presetId === 'custom') {
      localStorage.setItem(USER_CUSTOM_STYLES_KEY, JSON.stringify(styles));
    }
    currentStylesMap = { ...styles };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles, presetId } })
    );
  } catch (e) {
    console.error('Erro ao salvar estilos no localStorage:', e);
  }
}

/**
 * Ativa o preset Personalizado do Mestre Gelatiere com 1 clique rápido
 */
export function applyCustomPreset(): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  saveStoredStyles(customStyles, 'custom');
  return customStyles;
}

/**
 * Restaura o Padrão Ouro Recomendado com 1 clique (preservando o armazenamento customizado)
 */
export function applyGoldStandardPreset(): Record<string, StyleStandard> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STYLES_PRESET_KEY, 'gold');
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(GOLD_STANDARD_STYLES));
    currentStylesMap = { ...GOLD_STANDARD_STYLES };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles: GOLD_STANDARD_STYLES, presetId: 'gold' } })
    );
  }
  return GOLD_STANDARD_STYLES;
}

/**
 * Aplica o preset estrito Carpigiani Gelato University com 1 clique (preservando o armazenamento customizado)
 */
export function applyCarpigianiPreset(): Record<string, StyleStandard> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STYLES_PRESET_KEY, 'carpigiani');
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(CARPIGIANI_STRICT_STYLES));
    currentStylesMap = { ...CARPIGIANI_STRICT_STYLES };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles: CARPIGIANI_STRICT_STYLES, presetId: 'carpigiani' } })
    );
  }
  return CARPIGIANI_STRICT_STYLES;
}

/**
 * Restaura um único estilo específico para o seu valor Padrão Ouro no armazenamento customizado
 */
export function resetSingleStyleToGold(styleName: string): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  const gold = GOLD_STANDARD_STYLES[styleName];
  if (!gold) return customStyles;
  const updated = { ...customStyles, [styleName]: JSON.parse(JSON.stringify(gold)) };
  saveUserCustomStyles(updated);
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Atualiza um único estilo customizado mantendo os outros e ativa o preset customizado
 */
export function saveSingleStyle(
  styleName: string,
  updatedStyle: StyleStandard
): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  const updated = { ...customStyles, [styleName]: updatedStyle };
  saveUserCustomStyles(updated);
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Mapa de estilos carregado em memória para acesso síncrono rápido
 */
export let currentStylesMap: Record<string, StyleStandard> = getStoredStyles();

