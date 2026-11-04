import React, { useState, useEffect, useMemo } from 'react';
import { StyleStandard, NutrientValues } from '../../types/gelato';
import {
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  Info,
  ShieldCheck,
  GraduationCap,
  Save,
  Sparkles,
  PlusCircle,
  Trash2,
  BookmarkPlus
} from 'lucide-react';
import {
  getStoredStyles,
  saveSingleStyle,
  createCustomStyle,
  deleteCustomStyle,
  isOfficialStyle,
  applyGoldStandardPreset,
  applyCarpigianiPreset,
  resetSingleStyleToGold,
  getActivePresetId,
  GOLD_STANDARD_STYLES,
  StylePresetId,
  hasCarpigianiData
} from '../../core/stylesStorage';
import { getCategoryTheme } from '../../core/categoryThemes';

interface StyleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStyleName?: string;
  onStyleUpdated?: (styleName: string) => void;
  initialCreateMode?: boolean;
}

interface EditableFormState {
  sugarsMin: number;
  sugarsMax: number;
  fatMin: number;
  fatMax: number;
  msnfMin: number;
  msnfMax: number;
  otherSolidsMin: number;
  otherSolidsMax: number;
  totalSolidsMin: number;
  totalSolidsMax: number;
  waterMin: number;
  waterMax: number;
  podMin: number;
  podMax: number;
  pacMin: number;
  pacMax: number;
  proteinMin: number;
  proteinMax: number;
  pacDivisor: number;
}

function styleToFormState(style: StyleStandard): EditableFormState {
  return {
    sugarsMin: +(style.min.sugars * 100).toFixed(2),
    sugarsMax: +(style.max.sugars * 100).toFixed(2),
    fatMin: +(style.min.fat * 100).toFixed(2),
    fatMax: +(style.max.fat * 100).toFixed(2),
    msnfMin: +(style.min.msnf * 100).toFixed(2),
    msnfMax: +(style.max.msnf * 100).toFixed(2),
    otherSolidsMin: +(style.min.otherSolids * 100).toFixed(2),
    otherSolidsMax: +(style.max.otherSolids * 100).toFixed(2),
    totalSolidsMin: +(style.min.totalSolids * 100).toFixed(2),
    totalSolidsMax: +(style.max.totalSolids * 100).toFixed(2),
    waterMin: +(style.min.water * 100).toFixed(2),
    waterMax: +(style.max.water * 100).toFixed(2),
    podMin: style.min.pod,
    podMax: style.max.pod,
    pacMin: style.min.pac,
    pacMax: style.max.pac,
    proteinMin: +(style.min.protein * 100).toFixed(2),
    proteinMax: +(style.max.protein * 100).toFixed(2),
    pacDivisor: style.pacDivisor || 24
  };
}

export const StyleSettingsModal: React.FC<StyleSettingsModalProps> = ({
  isOpen,
  onClose,
  initialStyleName = 'Gelatos de Leite',
  onStyleUpdated,
  initialCreateMode = false
}) => {
  const [stylesMap, setStylesMap] = useState<Record<string, StyleStandard>>(() => getStoredStyles());
  const [selectedStyleName, setSelectedStyleName] = useState<string>(initialStyleName);
  const [presetId, setPresetId] = useState<StylePresetId>(() => getActivePresetId());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modo de criação de novo estilo
  const [isCreating, setIsCreating] = useState(initialCreateMode);
  const [newStyleName, setNewStyleName] = useState('');
  const [newBaseCategory, setNewBaseCategory] = useState('Gelatos de Leite');

  // Form inputs state for currently selected style
  const [form, setForm] = useState<EditableFormState>(() => {
    const s = stylesMap[initialStyleName] || stylesMap['Gelatos de Leite'];
    return styleToFormState(s);
  });

  // Sync when initialStyleName, isOpen or initialCreateMode changes
  useEffect(() => {
    if (isOpen) {
      const freshMap = getStoredStyles();
      setStylesMap(freshMap);
      setPresetId(getActivePresetId());

      if (initialCreateMode) {
        setIsCreating(true);
        setNewStyleName(initialStyleName && !freshMap[initialStyleName] ? initialStyleName : '');
        setNewBaseCategory('Gelatos de Leite');
        if (freshMap['Gelatos de Leite']) {
          setForm(styleToFormState(freshMap['Gelatos de Leite']));
        }
      } else {
        setIsCreating(false);
        const targetName = initialStyleName && freshMap[initialStyleName] ? initialStyleName : 'Gelatos de Leite';
        setSelectedStyleName(targetName);
        if (freshMap[targetName]) {
          setForm(styleToFormState(freshMap[targetName]));
        }
      }
    }
  }, [isOpen, initialStyleName, initialCreateMode]);

  // When changing selected style dropdown
  const handleSelectStyle = (name: string) => {
    setSelectedStyleName(name);
    const s = stylesMap[name] || stylesMap['Gelatos de Leite'];
    if (s) {
      setForm(styleToFormState(s));
    }
  };

  // Basear novo estilo em uma categoria existente
  const handleSelectBaseCategory = (baseCat: string) => {
    setNewBaseCategory(baseCat);
    const base = stylesMap[baseCat] || stylesMap['Gelatos de Leite'];
    if (base) {
      setForm(styleToFormState(base));
    }
  };

  // Iniciar modo de criação
  const handleStartCreate = () => {
    setIsCreating(true);
    setNewStyleName('');
    setNewBaseCategory('Gelatos de Leite');
    if (stylesMap['Gelatos de Leite']) {
      setForm(styleToFormState(stylesMap['Gelatos de Leite']));
    }
  };

  // Excluir estilo customizado selecionado
  const handleDeleteCurrentStyle = () => {
    if (isOfficialStyle(selectedStyleName)) {
      alert('Estilos oficiais protegidos não podem ser excluídos.');
      return;
    }
    const confirm = window.confirm(`Deseja realmente excluir o estilo personalizado "${selectedStyleName}"?`);
    if (!confirm) return;

    deleteCustomStyle(selectedStyleName);
    const updated = getStoredStyles();
    setStylesMap(updated);
    setSelectedStyleName('Gelatos de Leite');
    if (updated['Gelatos de Leite']) {
      setForm(styleToFormState(updated['Gelatos de Leite']));
    }
    if (onStyleUpdated) onStyleUpdated('Gelatos de Leite');
  };

  if (!isOpen) return null;

  const currentTheme = getCategoryTheme(isCreating ? newBaseCategory : (stylesMap[selectedStyleName]?.baseCategory || selectedStyleName));
  const isCurrentCustom = !isOfficialStyle(selectedStyleName) || !!stylesMap[selectedStyleName]?.isCustom;

  // Validation errors
  const errors: string[] = [];
  if (isCreating && !newStyleName.trim()) {
    errors.push('Nome do Estilo: Digite o nome do novo estilo.');
  }
  if (isCreating && stylesMap[newStyleName.trim()]) {
    errors.push(`Nome do Estilo: Já existe um estilo com o nome "${newStyleName.trim()}".`);
  }
  if (form.sugarsMin > form.sugarsMax) errors.push('Açúcares: Mínimo não pode ser maior que o Máximo.');
  if (form.fatMin > form.fatMax) errors.push('Gordura: Mínimo não pode ser maior que o Máximo.');
  if (form.msnfMin > form.msnfMax) errors.push('SLNG: Mínimo não pode ser maior que o Máximo.');
  if (form.otherSolidsMin > form.otherSolidsMax) errors.push('Outros Sólidos: Mínimo não pode ser maior que o Máximo.');
  if (form.totalSolidsMin > form.totalSolidsMax) errors.push('Sólidos Totais: Mínimo não pode ser maior que o Máximo.');
  if (form.waterMin > form.waterMax) errors.push('Água: Mínimo não pode ser maior que o Máximo.');
  if (form.podMin > form.podMax) errors.push('POD: Mínimo não pode ser maior que o Máximo.');
  if (form.pacMin > form.pacMax) errors.push('PAC: Mínimo não pode ser maior que o Máximo.');

  // Warnings
  const warnings: string[] = [];
  if (form.msnfMax > 10.5) {
    warnings.push(`SLNG Máximo de ${form.msnfMax}% está acima de 10.5%: risco de cristalização de lactose (arenosidade) após 48h a -12°C.`);
  }
  const checkStyleName = isCreating ? newStyleName : selectedStyleName;
  if (form.sugarsMax > 22 && !checkStyleName.toLowerCase().includes('sorbet')) {
    warnings.push(`Açúcares Máximos de ${form.sugarsMax}% podem conferir doçura excessiva e mascarar notas sutis do leite ou fruta.`);
  }
  if (form.fatMax > 13.5 && !checkStyleName.toLowerCase().includes('oleaginosa')) {
    warnings.push(`Gordura Máxima de ${form.fatMax}% pode reduzir o overrun e aumentar o risco de coalescência lipídica.`);
  }

  // Handle number input change helper
  const handleNumChange = (field: keyof EditableFormState, value: string) => {
    const parsed = parseFloat(value);
    setForm(prev => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed
    }));
  };

  // Salvar parâmetros atuais como um novo estilo da casa
  const handleSaveAsNewStyle = () => {
    const suggestedName = `${selectedStyleName} (Fórmula da Casa)`;
    const newName = window.prompt('Informe o nome para o novo estilo da casa:', suggestedName);
    if (!newName || !newName.trim()) return;

    const cleanName = newName.trim();
    if (stylesMap[cleanName]) {
      alert(`Já existe um estilo com o nome "${cleanName}". Escolha outro nome.`);
      return;
    }

    const newStyle: StyleStandard = {
      name: cleanName,
      baseCategory: stylesMap[selectedStyleName]?.baseCategory || selectedStyleName,
      isCustom: true,
      pacDivisor: form.pacDivisor || 24,
      min: {
        sugars: +(form.sugarsMin / 100).toFixed(4),
        fat: +(form.fatMin / 100).toFixed(4),
        msnf: +(form.msnfMin / 100).toFixed(4),
        otherSolids: +(form.otherSolidsMin / 100).toFixed(4),
        totalSolids: +(form.totalSolidsMin / 100).toFixed(4),
        water: +(form.waterMin / 100).toFixed(4),
        pod: Math.round(form.podMin),
        pac: Math.round(form.pacMin),
        protein: +(form.proteinMin / 100).toFixed(4)
      },
      max: {
        sugars: +(form.sugarsMax / 100).toFixed(4),
        fat: +(form.fatMax / 100).toFixed(4),
        msnf: +(form.msnfMax / 100).toFixed(4),
        otherSolids: +(form.otherSolidsMax / 100).toFixed(4),
        totalSolids: +(form.totalSolidsMax / 100).toFixed(4),
        water: +(form.waterMax / 100).toFixed(4),
        pod: Math.round(form.podMax),
        pac: Math.round(form.pacMax),
        protein: +(form.proteinMax / 100).toFixed(4)
      }
    };

    createCustomStyle(newStyle);
    const newMap = getStoredStyles();
    setStylesMap(newMap);
    setSelectedStyleName(cleanName);
    setIsCreating(false);
    setPresetId(getActivePresetId());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);

    if (onStyleUpdated) {
      onStyleUpdated(cleanName);
    }
  };

  // Save changes (ou criar novo estilo)
  const handleSave = () => {
    if (errors.length > 0) return;

    if (isCreating) {
      const cleanName = newStyleName.trim();
      const newStyle: StyleStandard = {
        name: cleanName,
        baseCategory: newBaseCategory,
        isCustom: true,
        pacDivisor: form.pacDivisor || 24,
        min: {
          sugars: +(form.sugarsMin / 100).toFixed(4),
          fat: +(form.fatMin / 100).toFixed(4),
          msnf: +(form.msnfMin / 100).toFixed(4),
          otherSolids: +(form.otherSolidsMin / 100).toFixed(4),
          totalSolids: +(form.totalSolidsMin / 100).toFixed(4),
          water: +(form.waterMin / 100).toFixed(4),
          pod: Math.round(form.podMin),
          pac: Math.round(form.pacMin),
          protein: +(form.proteinMin / 100).toFixed(4)
        },
        max: {
          sugars: +(form.sugarsMax / 100).toFixed(4),
          fat: +(form.fatMax / 100).toFixed(4),
          msnf: +(form.msnfMax / 100).toFixed(4),
          otherSolids: +(form.otherSolidsMax / 100).toFixed(4),
          totalSolids: +(form.totalSolidsMax / 100).toFixed(4),
          water: +(form.waterMax / 100).toFixed(4),
          pod: Math.round(form.podMax),
          pac: Math.round(form.pacMax),
          protein: +(form.proteinMax / 100).toFixed(4)
        }
      };

      createCustomStyle(newStyle);
      const newMap = getStoredStyles();
      setStylesMap(newMap);
      setSelectedStyleName(cleanName);
      setIsCreating(false);
      setPresetId(getActivePresetId());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);

      if (onStyleUpdated) {
        onStyleUpdated(cleanName);
      }
      return;
    }

    const updatedStyle: StyleStandard = {
      name: selectedStyleName,
      baseCategory: stylesMap[selectedStyleName]?.baseCategory,
      isCustom: stylesMap[selectedStyleName]?.isCustom,
      pacDivisor: form.pacDivisor || 24,
      min: {
        sugars: +(form.sugarsMin / 100).toFixed(4),
        fat: +(form.fatMin / 100).toFixed(4),
        msnf: +(form.msnfMin / 100).toFixed(4),
        otherSolids: +(form.otherSolidsMin / 100).toFixed(4),
        totalSolids: +(form.totalSolidsMin / 100).toFixed(4),
        water: +(form.waterMin / 100).toFixed(4),
        pod: Math.round(form.podMin),
        pac: Math.round(form.pacMin),
        protein: +(form.proteinMin / 100).toFixed(4)
      },
      max: {
        sugars: +(form.sugarsMax / 100).toFixed(4),
        fat: +(form.fatMax / 100).toFixed(4),
        msnf: +(form.msnfMax / 100).toFixed(4),
        otherSolids: +(form.otherSolidsMax / 100).toFixed(4),
        totalSolids: +(form.totalSolidsMax / 100).toFixed(4),
        water: +(form.waterMax / 100).toFixed(4),
        pod: Math.round(form.podMax),
        pac: Math.round(form.pacMax),
        protein: +(form.proteinMax / 100).toFixed(4)
      }
    };

    const newMap = saveSingleStyle(selectedStyleName, updatedStyle);
    setStylesMap(newMap);
    setPresetId(getActivePresetId());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);

    if (onStyleUpdated) {
      onStyleUpdated(selectedStyleName);
    }
  };

  // Reset this single style to Gold Standard
  const handleResetThisStyle = () => {
    const updated = resetSingleStyleToGold(selectedStyleName);
    setStylesMap(updated);
    if (updated[selectedStyleName]) {
      setForm(styleToFormState(updated[selectedStyleName]));
    }
    setPresetId(getActivePresetId());
    if (onStyleUpdated) onStyleUpdated(selectedStyleName);
  };

  // Apply all Gold Standard Preset
  const handleApplyGoldPreset = () => {
    const goldMap = applyGoldStandardPreset();
    setStylesMap(goldMap);
    if (goldMap[selectedStyleName]) {
      setForm(styleToFormState(goldMap[selectedStyleName]));
    }
    setPresetId('gold');
    if (onStyleUpdated) onStyleUpdated(selectedStyleName);
  };

  // Apply all Carpigiani Preset
  const handleApplyCarpigianiPreset = () => {
    const cguMap = applyCarpigianiPreset();
    setStylesMap(cguMap);
    if (cguMap[selectedStyleName]) {
      setForm(styleToFormState(cguMap[selectedStyleName]));
    }
    setPresetId('carpigiani');
    if (onStyleUpdated) onStyleUpdated(selectedStyleName);
  };

  // Separar chaves de estilos para o select
  const customStyleKeys = Object.keys(stylesMap)
    .filter(s => stylesMap[s]?.isCustom || !isOfficialStyle(s))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  const officialStyleKeys = Object.keys(stylesMap)
    .filter(s => isOfficialStyle(s) && !stylesMap[s]?.isCustom)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-settings-title"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {isCreating ? <Sparkles className="w-5 h-5 text-purple-400" /> : <SlidersHorizontal className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="style-settings-title" className="text-lg font-bold text-white">
                  {isCreating ? 'Criar Novo Estilo Personalizado' : 'Metas e Parâmetros Físico-Químicos'}
                </h2>
                {isCreating ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Novo Estilo
                  </span>
                ) : (
                  <>
                    {presetId === 'gold' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                        🛡️ Padrão Ouro Ativo
                      </span>
                    )}
                    {presetId === 'carpigiani' && hasCarpigianiData(selectedStyleName) && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                        🎓 Padrão Clássico Italiano
                      </span>
                    )}
                    {presetId === 'custom' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                        ✨ Personalizado
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isCreating
                  ? 'Defina o nome, categoria base e os intervalos ideais de cada variável para o seu novo estilo.'
                  : 'Ajuste os intervalos ideais de cada variável técnica para balizar receitas e diagnósticos.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style Selector & Quick Presets Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90">
          {isCreating ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Nome do Novo Estilo:
                </label>
                <input
                  type="text"
                  value={newStyleName}
                  onChange={e => setNewStyleName(e.target.value)}
                  placeholder="Ex: Base Leite Econômica, Gelato Keto..."
                  className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  autoFocus
                />
              </div>

              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Basear Parâmetros em:
                </label>
                <select
                  value={newBaseCategory}
                  onChange={e => handleSelectBaseCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(GOLD_STANDARD_STYLES).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar Criação
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {/* Linha 1: Estilo Alvo em Linha Própria com Largura Ampla + Botão Novo Estilo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider shrink-0 select-none">
                  Estilo Alvo:
                </span>
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedStyleName}
                    onChange={e => handleSelectStyle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-amber-500 text-slate-100 text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none transition-colors shadow-inner cursor-pointer"
                  >
                    {customStyleKeys.length > 0 && (
                      <optgroup label="⭐ Meus Estilos da Casa">
                        {customStyleKeys.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="🏛️ Estilos Oficiais Protegidos">
                      {officialStyleKeys.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
                  title="Criar um novo estilo da casa do zero"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>+ Novo Estilo da Casa</span>
                </button>
              </div>

              {/* Linha 2: Predefinições Bibliográficas e Ações de Restauração */}
              <div className="flex items-center justify-between gap-2.5 pt-2.5 border-t border-slate-800/80 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApplyGoldPreset}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      presetId === 'gold'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Aplica o Padrão Ouro Híbrido Protegido (Recomendado com proteção de Caviezel e PAC do Padrão Clássico Italiano)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restaurar Padrão Ouro</span>
                  </button>

                  {hasCarpigianiData(selectedStyleName) ? (
                    <button
                      type="button"
                      onClick={handleApplyCarpigianiPreset}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                        presetId === 'carpigiani'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Carrega as réguas tradicionais do Padrão Clássico Italiano"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                      <span>Padrão Clássico Italiano</span>
                    </button>
                  ) : (
                    <span
                      className="text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700/70 px-2.5 py-1 rounded-xl italic flex items-center gap-1"
                      title="Este estilo não possui parâmetros na bibliografia clássica italiana (reservado a formulações avançadas ou nutrição esportiva)"
                    >
                      <Info className="w-3 h-3 text-slate-400" />
                      <span>Sem dados no Clássico Italiano</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetThisStyle}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                  title="Restaura apenas este estilo selecionado para o Padrão Ouro"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Resetar este estilo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Editable Variables Grid */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* Alerts / Warnings Bar */}
          {errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && errors.length === 0 && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Card Contextual: Estilo Oficial vs Estilo da Casa */}
          {!isCreating && (
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">
                    {isCurrentCustom ? '⭐ Estilo da Casa' : '🏛️ Estilo Oficial Protegido'}
                  </span>
                  <span className="text-[11px] text-slate-400">({selectedStyleName})</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isCurrentCustom
                    ? 'Este estilo pertence exclusivamente à sua gelateria e pode ser ajustado ou excluído a qualquer momento.'
                    : 'Ajuste as metas para este estilo ou salve uma cópia independente com o nome que desejar.'}
                </p>
              </div>

              {!isCurrentCustom && (
                <button
                  type="button"
                  onClick={handleSaveAsNewStyle}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-all shrink-0 shadow-inner"
                  title="Salvar estas metas como um novo estilo da casa com nome exclusivo"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Salvar como Novo Estilo da Casa</span>
                </button>
              )}
            </div>
          )}

          {/* Variables Table Header */}
          <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4">Variável Físico-Química</div>
            <div className="col-span-3 sm:col-span-3 text-center">Mínimo</div>
            <div className="col-span-3 sm:col-span-3 text-center">Máximo</div>
            <div className="col-span-1 sm:col-span-2 text-right">Unidade</div>
          </div>

          {/* Form Rows */}
          <div className="space-y-3 font-mono text-sm">
            
            {/* Açúcares */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Açúcares Totais</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.sugarsMin}
                  onChange={e => handleNumChange('sugarsMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.sugarsMax}
                  onChange={e => handleNumChange('sugarsMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* Gordura */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Gordura Total</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.fatMin}
                  onChange={e => handleNumChange('fatMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.fatMax}
                  onChange={e => handleNumChange('fatMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* SLNG (SML) */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span title="Sólidos Lácteos Não Gordurosos (Soro Magro do Leite)">SLNG (SML)</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.msnfMin}
                  onChange={e => handleNumChange('msnfMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.msnfMax}
                  onChange={e => handleNumChange('msnfMax', e.target.value)}
                  className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none ${
                    form.msnfMax > 10.5 ? 'border-amber-500 text-amber-300' : 'border-slate-700 focus:border-amber-500'
                  }`}
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* Outros Sólidos */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>Outros Sólidos</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.otherSolidsMin}
                  onChange={e => handleNumChange('otherSolidsMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.otherSolidsMax}
                  onChange={e => handleNumChange('otherSolidsMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* Sólidos Totais */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Sólidos Totais</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.totalSolidsMin}
                  onChange={e => handleNumChange('totalSolidsMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.totalSolidsMax}
                  onChange={e => handleNumChange('totalSolidsMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* Água Total */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Água Livre / Total</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.waterMin}
                  onChange={e => handleNumChange('waterMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.waterMax}
                  onChange={e => handleNumChange('waterMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* PAC */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors bg-sky-500/5 border border-sky-500/10">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-sky-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span title="Poder Anticongelante (Maciez e ponto de espátula a -12°C)">PAC (Anticongelante)</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="5"
                  value={form.pacMin}
                  onChange={e => handleNumChange('pacMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="5"
                  value={form.pacMax}
                  onChange={e => handleNumChange('pacMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">pontos</div>
            </div>

            {/* POD */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors bg-amber-500/5 border border-amber-500/10">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span title="Poder Adoçante (Doçura percebida em relação à sacarose)">POD (Doçura)</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="5"
                  value={form.podMin}
                  onChange={e => handleNumChange('podMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="5"
                  value={form.podMax}
                  onChange={e => handleNumChange('podMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">pontos</div>
            </div>

            {/* Proteína Total */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Proteína Total</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.proteinMin}
                  onChange={e => handleNumChange('proteinMin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="0.5"
                  value={form.proteinMax}
                  onChange={e => handleNumChange('proteinMax', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">% calda</div>
            </div>

            {/* PAC Divisor da Calda */}
            <div className="grid grid-cols-12 gap-3 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="col-span-5 sm:col-span-4 font-sans font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span title="Divisor da curva crioscópica da calda">PAC Divisor</span>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  step="1"
                  value={form.pacDivisor}
                  onChange={e => handleNumChange('pacDivisor', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-3 text-center text-xs text-slate-400 font-sans">
                (Padrão: 22 a 25)
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-xs text-slate-400 font-sans">fator</div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                {isCreating ? 'Estilo criado com sucesso!' : 'Metas salvas com sucesso!'}
              </span>
            )}

            {isCurrentCustom && !isCreating && (
              <button
                type="button"
                onClick={handleDeleteCurrentStyle}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                title="Excluir este estilo personalizado"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Estilo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isCreating ? () => setIsCreating(false) : onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={errors.length > 0}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                errors.length > 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{isCreating ? 'Criar e Salvar Estilo' : 'Salvar Metas Técnicas'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

