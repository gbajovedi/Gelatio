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
 * Verifica se um estilo pertence aos 14 estilos oficiais de fábrica
 */
export function isOfficialStyle(styleName: string): boolean {
  return Object.prototype.hasOwnProperty.call(GOLD_STANDARD_STYLES, styleName);
}

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
    if (parsed['Vegano']) {
      parsed['Gelatos Veganos'] = { ...parsed['Vegano'], name: 'Gelatos Veganos' };
      delete parsed['Vegano'];
    }
    if (parsed['Alcoólicos']) {
      parsed['Gelatos Alcoólicos'] = { ...parsed['Alcoólicos'], name: 'Gelatos Alcoólicos' };
      delete parsed['Alcoólicos'];
    }
    if (parsed['Sorbets de Chocolate']) {
      delete parsed['Sorbets de Chocolate'];
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
 * Carrega estilos efetivos de acordo com o preset ativo,
 * garantindo que novos estilos criados pelo usuário (isCustom === true) estejam sempre disponíveis.
 */
export function getStoredStyles(): Record<string, StyleStandard> {
  if (typeof window === 'undefined') return { ...GOLD_STANDARD_STYLES };
  try {
    const activePreset = getActivePresetId();
    let baseStyles: Record<string, StyleStandard>;
    if (activePreset === 'carpigiani') {
      baseStyles = { ...CARPIGIANI_STRICT_STYLES };
    } else if (activePreset === 'custom') {
      baseStyles = getUserCustomStyles();
    } else {
      baseStyles = { ...GOLD_STANDARD_STYLES };
    }

    // Mescla estilos customizados adicionais criados pelo usuário
    const userCustomMap = getUserCustomStyles();
    for (const [key, style] of Object.entries(userCustomMap)) {
      if (style.isCustom || !isOfficialStyle(key)) {
        baseStyles[key] = style;
      }
    }
    return baseStyles;
  } catch (e) {
    console.warn('Erro ao carregar estilos vigentes:', e);
    return { ...GOLD_STANDARD_STYLES };
  }
}

/**
 * Retorna todos os estilos vigentes (alias para getStoredStyles)
 */
export function getAllEffectiveStyles(): Record<string, StyleStandard> {
  return getStoredStyles();
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
 * Cria e persiste um novo estilo personalizado
 */
export function createCustomStyle(newStyle: StyleStandard): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  const trimmedName = newStyle.name.trim();
  if (!trimmedName) throw new Error('O nome do estilo não pode estar vazio.');

  const fullStyle: StyleStandard = {
    ...newStyle,
    id: newStyle.id || `custom_style_${Date.now()}`,
    name: trimmedName,
    isCustom: true,
    createdAt: newStyle.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = { ...customStyles, [trimmedName]: fullStyle };
  saveUserCustomStyles(updated);
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Clona um estilo existente com um novo nome
 */
export function duplicateStyle(sourceName: string, newName: string): StyleStandard {
  const all = getStoredStyles();
  const source = all[sourceName] || all['Gelatos de Leite'];
  const cleanName = newName.trim();
  if (!cleanName) throw new Error('O nome do novo estilo não pode estar vazio.');

  const cloned: StyleStandard = {
    ...JSON.parse(JSON.stringify(source)),
    id: `custom_style_${Date.now()}`,
    name: cleanName,
    customProfileName: undefined,
    baseCategory: source.baseCategory || source.name,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  createCustomStyle(cloned);
  return cloned;
}

/**
 * Remove um estilo criado pelo usuário (protegendo os 14 estilos oficiais)
 */
export function deleteCustomStyle(styleName: string): boolean {
  if (isOfficialStyle(styleName)) {
    console.warn(`Não é permitido excluir o estilo oficial: ${styleName}`);
    return false;
  }

  const customStyles = getUserCustomStyles();
  if (!customStyles[styleName]) return false;

  const updated = { ...customStyles };
  delete updated[styleName];
  saveUserCustomStyles(updated);
  const currentPreset = getActivePresetId();
  saveStoredStyles(updated, currentPreset);
  return true;
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
    const goldWithCustom = getStoredStyles();
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(goldWithCustom));
    currentStylesMap = { ...goldWithCustom };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles: goldWithCustom, presetId: 'gold' } })
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
    const carpigianiWithCustom = getStoredStyles();
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(carpigianiWithCustom));
    currentStylesMap = { ...carpigianiWithCustom };
    window.dispatchEvent(
      new CustomEvent(STYLES_UPDATED_EVENT, { detail: { styles: carpigianiWithCustom, presetId: 'carpigiani' } })
    );
  }
  return CARPIGIANI_STRICT_STYLES;
}

/**
 * Verifica se um estilo oficial foi modificado pelo usuário em relação à sua referência ativa (Padrão Ouro ou Carpigiani)
 */
export function isStyleModifiedFromOfficial(styleName: string): boolean {
  if (!isOfficialStyle(styleName)) return false;
  const current = getStoredStyles()[styleName];
  const activePreset = getActivePresetId();
  const reference = (activePreset === 'carpigiani' && hasCarpigianiData(styleName))
    ? CARPIGIANI_STRICT_STYLES[styleName]
    : GOLD_STANDARD_STYLES[styleName];
  if (!current || !reference) return false;

  return JSON.stringify(current.min) !== JSON.stringify(reference.min) ||
         JSON.stringify(current.max) !== JSON.stringify(reference.max) ||
         current.pacDivisor !== reference.pacDivisor;
}

/**
 * Restaura um único estilo oficial para a sua referência padrão ativa
 */
export function resetSingleStyleToReference(styleName: string): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  const activePreset = getActivePresetId();
  const updated = { ...customStyles };
  delete updated[styleName];
  saveUserCustomStyles(updated);
  const targetPreset = activePreset === 'carpigiani' ? 'carpigiani' : 'gold';
  saveStoredStyles(updated, targetPreset);
  return getStoredStyles();
}

/**
 * Restaura um único estilo específico para o seu valor Padrão Ouro no armazenamento customizado
 */
export function resetSingleStyleToGold(styleName: string): Record<string, StyleStandard> {
  return resetSingleStyleToReference(styleName);
}

/**
 * Atualiza um único estilo customizado mantendo os outros e ativa o preset customizado
 */
export function saveSingleStyle(
  styleName: string,
  updatedStyle: StyleStandard
): Record<string, StyleStandard> {
  const customStyles = getUserCustomStyles();
  const existing = customStyles[styleName];
  const isCustomFlag = existing?.isCustom ?? updatedStyle.isCustom ?? !isOfficialStyle(styleName);

  const updatedEntry: StyleStandard = {
    ...existing,
    ...updatedStyle,
    isCustom: isCustomFlag,
    updatedAt: new Date().toISOString()
  };

  const updated = { ...customStyles, [styleName]: updatedEntry };
  saveUserCustomStyles(updated);
  saveStoredStyles(updated, 'custom');
  return updated;
}

/**
 * Mapa de estilos carregado em memória para acesso síncrono rápido
 */
export let currentStylesMap: Record<string, StyleStandard> = getStoredStyles();

