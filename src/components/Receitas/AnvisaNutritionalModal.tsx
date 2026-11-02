import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '../../types/gelato';
import { calculateAnvisaNutrition } from '../../core/anvisaNutrition';
import {
  X,
  Printer,
  Copy,
  Check,
  Search,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Scale,
  Package,
  Settings2
} from 'lucide-react';

interface AnvisaNutritionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  ingredients: Ingredient[];
}

/**
 * Selo Oficial da Rotulagem Nutricional Frontal da ANVISA (RDC 429/2020 e IN 75/2020)
 * Reproduz com fidelidade milimétrica o modelo gráfico oficial do Anexo XVII (lupa + caixas pretas)
 */
export const AnvisaFopSeal: React.FC<{
  highAddedSugars: boolean;
  highSaturatedFat: boolean;
  highSodium: boolean;
  className?: string;
}> = ({ highAddedSugars, highSaturatedFat, highSodium, className = '' }) => {
  if (!highAddedSugars && !highSaturatedFat && !highSodium) return null;

  return (
    <div
      className={`inline-flex flex-col gap-1 bg-white border-[2.5px] border-black rounded-[14px] p-1 w-[150px] shadow-sm select-none shrink-0 ${className}`}
    >
      {/* Caixa do Topo: Lupa Oficial + ALTO EM */}
      <div className="flex items-center justify-center gap-1.5 border-2 border-black rounded-[9px] bg-white py-1 px-2 h-[38px]">
        {/* SVG da Lupa Oficial ANVISA */}
        <svg
          viewBox="0 0 100 100"
          className="w-7 h-7 shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arco externo superior direito */}
          <path
            d="M 54 13 C 71 14 84 27 84 44 C 84 53 80 61 73 67"
            stroke="black"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Aro circular da lente */}
          <circle
            cx="49"
            cy="43"
            r="23"
            stroke="black"
            strokeWidth="7"
            fill="white"
          />
          {/* Cabo da Lupa (Preto) */}
          <path
            d="M 33 58 L 15 76 C 12.5 78.5 12.5 82.5 15 85 C 17.5 87.5 21.5 87.5 24 85 L 42 67 Z"
            fill="black"
          />
          {/* Fenda Interna Branca do Cabo */}
          <path
            d="M 32 61 L 18 75 C 17 76 17 77.5 18 78.5 C 19 79.5 20.5 79.5 21.5 78.5 L 35.5 64.5 Z"
            fill="white"
          />
        </svg>
        <span className="font-black text-black text-[14.5px] tracking-tight leading-none">
          ALTO EM
        </span>
      </div>

      {/* Caixas Pretas dos Nutrientes */}
      {highAddedSugars && (
        <div className="bg-black text-white rounded-[9px] py-1.5 px-2 flex flex-col items-center justify-center text-center font-black tracking-tight leading-[1.15]">
          <span className="text-[12px] leading-tight">AÇÚCAR</span>
          <span className="text-[12px] leading-tight">ADICIONADO</span>
        </div>
      )}

      {highSaturatedFat && (
        <div className="bg-black text-white rounded-[9px] py-1.5 px-2 flex flex-col items-center justify-center text-center font-black tracking-tight leading-[1.15]">
          <span className="text-[12px] leading-tight">GORDURA</span>
          <span className="text-[12px] leading-tight">SATURADA</span>
        </div>
      )}

      {highSodium && (
        <div className="bg-black text-white rounded-[9px] py-1.5 px-2 flex flex-col items-center justify-center text-center font-black tracking-tight leading-[1.15]">
          <span className="text-[13px] leading-tight py-0.5">SÓDIO</span>
        </div>
      )}
    </div>
  );
};

export const AnvisaNutritionalModal: React.FC<AnvisaNutritionalModalProps> = ({
  isOpen,
  onClose,
  recipe,
  ingredients
}) => {
  // Configuração da Porção
  const [portionGrams, setPortionGrams] = useState<number>(60);
  const [householdMeasure, setHouseholdMeasure] = useState<string>('1 bola');

  // Configuração da Embalagem (Suporte a Gramas e ML)
  const [containerUnit, setContainerUnit] = useState<'g' | 'ml'>('ml'); // ML por padrão para sorvetes/gelatos
  const [containerValue, setContainerValue] = useState<number>(500); // Ex: 500 ml ou 500 g
  const [density, setDensity] = useState<number>(0.75); // Densidade média do gelato artesanal (~30-35% overrun)
  const [showDensitySettings, setShowDensitySettings] = useState<boolean>(false);

  // Estados de Interface
  const [showFOP, setShowFOP] = useState<boolean>(true); // Toggle switch para a Lupa Frontal
  const [showFopDetails, setShowFopDetails] = useState<boolean>(false); // Painel de limites ANVISA
  const [copied, setCopied] = useState<boolean>(false);

  // Converte o tamanho da embalagem em gramas líquidas efetivas
  const effectiveContainerWeightGrams = useMemo(() => {
    if (containerUnit === 'ml') {
      return Math.max(1, Math.round(containerValue * density));
    }
    return Math.max(1, containerValue);
  }, [containerUnit, containerValue, density]);

  // Calcula a nutrição ANVISA
  const nutrition = useMemo(() => {
    if (!recipe) return null;
    return calculateAnvisaNutrition(
      recipe,
      ingredients,
      portionGrams,
      effectiveContainerWeightGrams,
      householdMeasure
    );
  }, [recipe, ingredients, portionGrams, effectiveContainerWeightGrams, householdMeasure]);

  if (!isOpen || !recipe || !nutrition) return null;

  // Lista de insumos (ingredientes + variegatos) em ordem decrescente de peso para o rótulo
  const allRecipeItems = [
    ...(recipe.ingredients || []),
    ...(recipe.variegatos || [])
  ];
  const sortedIngredientsNames = [...allRecipeItems]
    .sort((a, b) => b.grams - a.grams)
    .map(i => i.name.toUpperCase())
    .join(', ');

  // Ação: Copiar texto da tabela
  const handleCopyText = () => {
    let text = `INFORMAÇÃO NUTRICIONAL - ${recipe.name.toUpperCase()}\n`;
    text += `Porções por embalagem: cerca de ${nutrition.servingsPerContainer} porções\n`;
    text += `Porção: ${nutrition.portionHousehold}\n`;
    text += `Embalagem: ${containerValue} ${containerUnit}${containerUnit === 'ml' ? ` (aprox. ${effectiveContainerWeightGrams} g)` : ''}\n\n`;
    text += `Nutriente | 100g | ${portionGrams}g | %VD*\n`;
    text += `------------------------------------------------\n`;

    nutrition.items.forEach(item => {
      const prefix = item.indent ? '  ' : '';
      const vd = item.dailyValuePct !== undefined ? `${item.dailyValuePct}%` : '-';
      text += `${prefix}${item.name} (${item.unit}) | ${item.per100g} | ${item.perPortion} | ${vd}\n`;
    });

    text += `\n*Percentual de valores diários fornecidos pela porção.\n\n`;
    text += `INGREDIENTES: ${sortedIngredientsNames}.\n`;
    text += `${nutrition.allergens.fullDeclaration}\n`;

    if (showFOP) {
      if (nutrition.frontOfPack.hasAny) {
        text += `\nROTULAGEM FRONTAL (ANVISA RDC 429/2020):\n`;
        if (nutrition.frontOfPack.highAddedSugars) text += `[ 🔍 ALTO EM AÇÚCAR ADICIONADO ]\n`;
        if (nutrition.frontOfPack.highSaturatedFat) text += `[ 🔍 ALTO EM GORDURA SATURADA ]\n`;
        if (nutrition.frontOfPack.highSodium) text += `[ 🔍 ALTO EM SÓDIO ]\n`;
      } else {
        text += `\nROTULAGEM FRONTAL: Receita isenta de selos frontais (valores abaixo dos limites da ANVISA).\n`;
      }
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ação: Imprimir rótulo
  const handlePrint = () => {
    window.print();
  };

  const fopValues = nutrition.frontOfPack.values;
  const fopLimits = nutrition.frontOfPack.thresholds;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:bg-white">
        
        {/* Header (Ocultado na impressão) */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Tabela Nutricional Oficial ANVISA
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  RDC 429/2020
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md">
                Receita: <span className="text-slate-200 font-semibold">{recipe.name}</span>
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

        {/* Toolbar de Parâmetros e Personalização (Ocultado na impressão) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col gap-3 text-xs print:hidden shrink-0">
          
          {/* Linha 1: Controles da Lupa Frontal e Limites */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Toggle Switch para Lupa Frontal (FOP) - Área inteira clicável */}
            <button
              type="button"
              onClick={() => setShowFOP(!showFOP)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-inner ${
                showFOP
                  ? nutrition.frontOfPack.hasAny
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/15'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/15'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-950'
              }`}
              title="Clique para alternar a exibição da Rotulagem Frontal (Lupa ANVISA)"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <svg
                  viewBox="0 0 100 100"
                  className={`w-4 h-4 shrink-0 ${
                    showFOP
                      ? nutrition.frontOfPack.hasAny
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 54 13 C 71 14 84 27 84 44 C 84 53 80 61 73 67" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="49" cy="43" r="23" strokeWidth="8" />
                  <path d="M 33 58 L 15 76 C 12.5 78.5 12.5 82.5 15 85 C 17.5 87.5 21.5 87.5 24 85 L 42 67 Z" fill="currentColor" stroke="none" />
                </svg>
                <span>Lupa Frontal ANVISA:</span>
              </div>

              {/* Botão Switch visual */}
              <div
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  showFOP
                    ? nutrition.frontOfPack.hasAny
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                    showFOP ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>

              {/* Status Text / Badge */}
              <span className={`text-[11px] font-bold ${
                showFOP
                  ? nutrition.frontOfPack.hasAny
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                  : 'text-slate-400'
              }`}>
                {showFOP
                  ? nutrition.frontOfPack.hasAny
                    ? `Ativa (${nutrition.frontOfPack.count} ${nutrition.frontOfPack.count === 1 ? 'selo' : 'selos'})`
                    : 'Ativa (Isenta)'
                  : 'Oculta'}
              </span>
            </button>

            {/* Botão de Detalhes dos Limites ANVISA */}
            <button
              type="button"
              onClick={() => setShowFopDetails(!showFopDetails)}
              className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                showFopDetails
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Ver valores da receita comparados com os limites da ANVISA por 100g"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Limites ANVISA</span>
              {showFopDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Painel Expansível de Detalhes dos Limites ANVISA */}
          {showFopDetails && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-200">
              {/* Açúcar Adicionado */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                nutrition.frontOfPack.highAddedSugars
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Açúcar Adicionado</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                    nutrition.frontOfPack.highAddedSugars ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {nutrition.frontOfPack.highAddedSugars ? 'ALTO' : 'OK'}
                  </span>
                </div>
                <div className="mt-1 text-sm font-mono font-bold">
                  {fopValues.addedSugars100g} g <span className="text-[11px] font-normal text-slate-400">/ 100g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Limite ANVISA: ≥ {fopLimits.addedSugars100g} g
                </span>
              </div>

              {/* Gordura Saturada */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                nutrition.frontOfPack.highSaturatedFat
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Gordura Saturada</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                    nutrition.frontOfPack.highSaturatedFat ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {nutrition.frontOfPack.highSaturatedFat ? 'ALTO' : 'OK'}
                  </span>
                </div>
                <div className="mt-1 text-sm font-mono font-bold">
                  {fopValues.saturatedFat100g} g <span className="text-[11px] font-normal text-slate-400">/ 100g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Limite ANVISA: ≥ {fopLimits.saturatedFat100g} g
                </span>
              </div>

              {/* Sódio */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                nutrition.frontOfPack.highSodium
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Sódio</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                    nutrition.frontOfPack.highSodium ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {nutrition.frontOfPack.highSodium ? 'ALTO' : 'OK'}
                  </span>
                </div>
                <div className="mt-1 text-sm font-mono font-bold">
                  {fopValues.sodium100g} mg <span className="text-[11px] font-normal text-slate-400">/ 100g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Limite ANVISA: ≥ {fopLimits.sodium100g} mg
                </span>
              </div>
            </div>
          )}

          {/* Linha 2: Personalização da Porção e da Embalagem (com suporte a ML) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            
            {/* Card 1: Personalização da Porção */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Porção Individual</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Ref. ANVISA: 60g (1 bola)
                </span>
              </div>

              {/* Inputs de Peso (g) e Medida Caseira */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Peso da Porção:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={portionGrams || ''}
                      onChange={e => {
                        const val = Math.max(1, Number(e.target.value) || 0);
                        setPortionGrams(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500 font-mono pr-6"
                      placeholder="60"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                      g
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Medida Caseira:
                  </label>
                  <input
                    type="text"
                    list="household-presets"
                    value={householdMeasure}
                    onChange={e => setHouseholdMeasure(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="1 bola"
                  />
                  <datalist id="household-presets">
                    <option value="1 bola" />
                    <option value="2 bolas" />
                    <option value="1 fatia" />
                    <option value="1 copo" />
                    <option value="1 picolé" />
                    <option value="1 pote" />
                    <option value="porção" />
                  </datalist>
                </div>
              </div>

              {/* Presets Rápidos de Porção */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-semibold">Atalhos:</span>
                {[
                  { g: 60, label: '60g (1 bola)' },
                  { g: 100, label: '100g' },
                  { g: 120, label: '120g (2 bolas)' },
                  { g: 50, label: '50g (Picolé)' }
                ].map(p => (
                  <button
                    key={p.g}
                    type="button"
                    onClick={() => {
                      setPortionGrams(p.g);
                      if (p.g === 60) setHouseholdMeasure('1 bola');
                      else if (p.g === 120) setHouseholdMeasure('2 bolas');
                      else if (p.g === 50) setHouseholdMeasure('1 picolé');
                      else setHouseholdMeasure('porção');
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      portionGrams === p.g
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 2: Personalização da Embalagem (Gramas ou ML) */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Embalagem / Pote</span>
                </span>
                
                {/* Segmented Control Unidade: [ g | ml ] */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setContainerUnit('g')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      containerUnit === 'g'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Gramas (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContainerUnit('ml')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      containerUnit === 'ml'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Volume (ml)
                  </button>
                </div>
              </div>

              {/* Input Numérico da Embalagem e Conversão */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={50000}
                    value={containerValue || ''}
                    onChange={e => {
                      const val = Math.max(1, Number(e.target.value) || 0);
                      setContainerValue(val);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500 font-mono pr-8"
                    placeholder="500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">
                    {containerUnit}
                  </span>
                </div>

                {/* Badge de Rendimento / Porções Calculadas */}
                <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-300 text-xs shrink-0 font-medium">
                  <span>Rende:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    ~{nutrition.servingsPerContainer}
                  </span>
                  <span className="text-[10px] text-slate-400">porções</span>
                </div>
              </div>

              {/* Informação e Conversão de ML -> Gramas (quando em ML) */}
              {containerUnit === 'ml' && (
                <div className="flex items-center justify-between text-[10px] bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
                  <span>
                    Equivalente: <strong className="text-slate-200">{effectiveContainerWeightGrams} g</strong> líquidas (densidade: {density} g/ml)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDensitySettings(!showDensitySettings)}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Densidade</span>
                  </button>
                </div>
              )}

              {/* Painel Expansível de Ajuste de Densidade (quando em ML) */}
              {containerUnit === 'ml' && showDensitySettings && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 text-[10px] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">Densidade do Gelato / Sorvete:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={0.05}
                        min={0.3}
                        max={1.5}
                        value={density}
                        onChange={e => setDensity(Number(e.target.value) || 0.75)}
                        className="w-16 bg-slate-950 border border-slate-700 text-amber-300 font-bold px-1.5 py-0.5 rounded text-right text-[11px]"
                      />
                      <span className="text-slate-400 font-mono">g/ml</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-slate-500 font-semibold">Padrões:</span>
                    {[
                      { d: 0.75, name: 'Gelato Artesanal (0.75)' },
                      { d: 0.85, name: 'Sorbet (0.85)' },
                      { d: 0.60, name: 'Sorvete Areado (0.60)' },
                      { d: 0.50, name: 'Industrial (0.50)' }
                    ].map(item => (
                      <button
                        key={item.d}
                        type="button"
                        onClick={() => setDensity(item.d)}
                        className={`px-1.5 py-0.5 rounded border transition-colors ${
                          density === item.d
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets Rápidos de Embalagem */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-semibold">Atalhos:</span>
                {(containerUnit === 'ml'
                  ? [
                      { val: 500, label: '500 ml' },
                      { val: 700, label: '700 ml' },
                      { val: 1000, label: '1.000 ml' },
                      { val: 1500, label: '1.5 L' },
                      { val: 2000, label: '2.0 L' },
                      { val: 5000, label: '5.0 L' }
                    ]
                  : [
                      { val: 250, label: '250 g' },
                      { val: 500, label: '500 g' },
                      { val: 1000, label: '1.000 g' },
                      { val: 2000, label: '2.000 g' },
                      { val: 5000, label: '5.000 g' }
                    ]
                ).map(c => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setContainerValue(c.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      containerValue === c.val
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

            </div>

          </div>

        </div>

        {/* Modal Body: Rótulo Oficial da ANVISA (Preto e Branco Puro) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-950/60 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Card Branco da ANVISA */}
          <div
            id="anvisa-label"
            className="bg-white text-black p-5 sm:p-6 rounded-2xl border-2 border-black max-w-lg mx-auto shadow-xl font-sans print:shadow-none print:border-2 print:border-black print:max-w-none print:rounded-none"
          >
            
            {/* 1. SELOS DE ROTULAGEM NUTRICIONAL FRONTAL (FOP) - PADRÃO OFICIAL ANVISA */}
            {showFOP && (
              <>
                {nutrition.frontOfPack.hasAny ? (
                  <div className="mb-4 pb-4 border-b-2 border-black flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex flex-col items-center sm:items-start gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black/60 print:hidden">
                        Rotulagem Nutricional Frontal
                      </span>
                      <AnvisaFopSeal
                        highAddedSugars={nutrition.frontOfPack.highAddedSugars}
                        highSaturatedFat={nutrition.frontOfPack.highSaturatedFat}
                        highSodium={nutrition.frontOfPack.highSodium}
                      />
                    </div>

                    <div className="hidden sm:flex flex-col justify-center text-[10.5px] text-black/75 bg-slate-100 p-2.5 rounded-xl border border-black/10 max-w-[260px] leading-snug print:hidden">
                      <span className="font-bold text-black uppercase mb-0.5">
                        Selo Obrigatório (IN 75/2020)
                      </span>
                      <span>
                        Padrão oficial da ANVISA com a lupa regulamentar e os destaques dos nutrientes com limites excedidos.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 print:hidden animate-in fade-in duration-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="leading-tight">
                      <strong>Lupa Frontal Ativa:</strong> Receita <strong>isenta de advertências</strong> (açúcar adicionado &lt; 15g, gordura sat. &lt; 6g e sódio &lt; 600mg por 100g).
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 2. CABEÇALHO DA TABELA NUTRICIONAL */}
            <div className="border-b-2 border-black pb-1.5 mb-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-black m-0 leading-tight">
                INFORMAÇÃO NUTRICIONAL
              </h1>
              <p className="text-xs text-black font-medium leading-snug mt-1">
                Porções por embalagem: cerca de <strong>{nutrition.servingsPerContainer}</strong> porções
              </p>
              <p className="text-xs text-black font-medium leading-snug">
                Porção: <strong>{nutrition.portionHousehold}</strong>
              </p>
            </div>

            {/* 3. TABELA COM 3 COLUNAS OFICIAIS */}
            <table className="w-full text-xs text-black border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left font-black py-1 pr-2 w-1/2"></th>
                  <th className="text-right font-black py-1 px-1.5 w-1/6">100 g</th>
                  <th className="text-right font-black py-1 px-1.5 w-1/6">{portionGrams} g</th>
                  <th className="text-right font-black py-1 pl-1.5 w-1/6">%VD*</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 font-medium">
                {nutrition.items.map((item, idx) => {
                  const isEnergy = item.name === 'Valor energético';
                  return (
                    <tr
                      key={idx}
                      className={isEnergy ? 'border-b-2 border-black font-bold' : ''}
                    >
                      <td className={`py-1 pr-2 text-left ${item.indent ? 'pl-3 text-black/80' : 'font-bold'}`}>
                        {item.name} ({item.unit})
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-medium">
                        {item.per100g}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-bold">
                        {item.perPortion}
                      </td>
                      <td className="py-1 pl-1.5 text-right font-mono font-bold">
                        {item.dailyValuePct !== undefined ? `${item.dailyValuePct}%` : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 4. NOTA DE RODAPÉ REGULAMENTAR */}
            <p className="text-[10px] text-black font-normal mt-2 pt-1 border-t border-black/40 leading-tight">
              *Percentual de valores diários fornecidos pela porção.
            </p>

            {/* 5. LISTA DE INGREDIENTES */}
            <div className="mt-3 pt-2.5 border-t-2 border-black text-xs text-black leading-snug">
              <p>
                <strong>INGREDIENTES:</strong> {sortedIngredientsNames}.
              </p>
            </div>

            {/* 6. DECLARAÇÃO DE ALÉRGENOS, LACTOSE E GLÚTEN (RDC 727/2022) */}
            <div className="mt-2 text-xs font-black text-black leading-tight space-y-1">
              <p>{nutrition.allergens.fullDeclaration}</p>
            </div>

          </div>

        </div>

        {/* Footer (Ocultado na impressão) */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                Texto copiado para a área de transferência!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Copiar texto formatado da tabela para ficha técnica ou e-commerce"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Texto</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
              title="Imprimir rótulo nutricional em folha ou impressora de etiquetas"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Rótulo</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
