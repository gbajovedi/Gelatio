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
  AlertCircle
} from 'lucide-react';

interface AnvisaNutritionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  ingredients: Ingredient[];
}

export const AnvisaNutritionalModal: React.FC<AnvisaNutritionalModalProps> = ({
  isOpen,
  onClose,
  recipe,
  ingredients
}) => {
  const [portionGrams, setPortionGrams] = useState<number>(60);
  const [containerWeight, setContainerWeight] = useState<number>(500);
  const [showFOP, setShowFOP] = useState<boolean>(true); // Toggle switch para a Lupa Frontal
  const [copied, setCopied] = useState<boolean>(false);

  // Calcula a nutrição ANVISA
  const nutrition = useMemo(() => {
    if (!recipe) return null;
    return calculateAnvisaNutrition(recipe, ingredients, portionGrams, containerWeight);
  }, [recipe, ingredients, portionGrams, containerWeight]);

  if (!isOpen || !recipe || !nutrition) return null;

  // Lista de ingredientes em ordem decrescente de peso para o rótulo
  const sortedIngredientsNames = [...(recipe.ingredients || [])]
    .sort((a, b) => b.grams - a.grams)
    .map(i => i.name.toUpperCase())
    .join(', ');

  // Ação: Copiar texto da tabela
  const handleCopyText = () => {
    let text = `INFORMAÇÃO NUTRICIONAL - ${recipe.name.toUpperCase()}\n`;
    text += `Porções por embalagem: cerca de ${nutrition.servingsPerContainer} porções\n`;
    text += `Porção: ${nutrition.portionHousehold}\n\n`;
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

    if (showFOP && nutrition.frontOfPack.hasAny) {
      text += `\nROTULAGEM FRONTAL:\n`;
      if (nutrition.frontOfPack.highAddedSugars) text += `[ ALTO EM AÇÚCAR ADICIONADO ]\n`;
      if (nutrition.frontOfPack.highSaturatedFat) text += `[ ALTO EM GORDURA SATURADA ]\n`;
      if (nutrition.frontOfPack.highSodium) text += `[ ALTO EM SÓDIO ]\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ação: Imprimir rótulo
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:bg-white">
        
        {/* Header (Ocultado na impressão) */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 print:hidden shrink-0">
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

        {/* Toolbar de Parâmetros e Toggle Switch (Ocultado na impressão) */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          
          {/* Toggle Switch para Lupa Frontal (FOP) */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800 shadow-inner">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Selos da Lupa Frontal:</span>
            </span>
            <button
              type="button"
              onClick={() => setShowFOP(!showFOP)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showFOP ? 'bg-amber-500' : 'bg-slate-700'
              }`}
              title="Ativar/desativar selos frontais da ANVISA (Alto em Açúcar, Gordura ou Sódio)"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                  showFOP ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold ${showFOP ? 'text-amber-400' : 'text-slate-500'}`}>
              {showFOP ? 'Ativos' : 'Ocultos'}
            </span>
          </div>

          {/* Seletores de Porção e Embalagem */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold text-[11px]">Porção:</span>
              <select
                value={portionGrams}
                onChange={e => setPortionGrams(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value={60}>60 g (1 bola - Padrão)</option>
                <option value={100}>100 g (Decimal)</option>
                <option value={120}>120 g (2 bolas)</option>
                <option value={500}>500 g (Pote P)</option>
                <option value={1000}>1.000 g (Pote G)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold text-[11px]">Embalagem:</span>
              <select
                value={containerWeight}
                onChange={e => setContainerWeight(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value={500}>Pote 500 g</option>
                <option value={1000}>Pote 1.000 g</option>
                <option value={250}>Pote 250 g</option>
                <option value={60}>Individual (60 g)</option>
              </select>
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
            
            {/* 1. SELOS DE ROTULAGEM NUTRICIONAL FRONTAL (FOP) - Se ativado pelo toggle e houver avisos */}
            {showFOP && nutrition.frontOfPack.hasAny && (
              <div className="mb-4 pb-3 border-b-2 border-black">
                <div className="inline-flex items-stretch border-2 border-black bg-white overflow-hidden shadow-sm">
                  {/* Ícone da Lupa Oficial */}
                  <div className="bg-black text-white px-2.5 py-2 flex items-center justify-center">
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  {/* Textos dos Selos */}
                  <div className="px-3 py-1.5 flex flex-col justify-center">
                    <span className="text-[11px] font-black uppercase tracking-tight text-black leading-tight">
                      ALTO EM
                    </span>
                    <div className="flex flex-col text-[12px] font-black uppercase leading-tight text-black">
                      {nutrition.frontOfPack.highAddedSugars && (
                        <span>AÇÚCAR ADICIONADO</span>
                      )}
                      {nutrition.frontOfPack.highSaturatedFat && (
                        <span>GORDURA SATURADA</span>
                      )}
                      {nutrition.frontOfPack.highSodium && (
                        <span>SÓDIO</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                  const isMainGroup = !item.indent;
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
