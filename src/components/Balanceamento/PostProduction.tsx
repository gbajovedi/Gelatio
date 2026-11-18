import React, { useState, useMemo } from 'react';
import { VariegatoItem, Ingredient } from '../../types/gelato';
import { Trash2, Sliders, X, Beaker } from 'lucide-react';
import { resolveVariegatoDensity } from '../../core/calculator';
import { IngredientSlideOver } from './IngredientSlideOver';

interface PostProductionProps {
  variegatos: VariegatoItem[];
  availableIngredients: Ingredient[];
  caldaWeightGrams?: number;
  onUpdateVariegatos: (variegatos: VariegatoItem[]) => void;
}

const MESCLA_CATEGORY_FILTERS = [
  'Variegatos & Recheios',
  'Confeitaria & Inclusões',
  'Pastas & Oleaginosas',
  'Chocolates & Cacau',
  'Frutas & Polpas',
  'Todos'
];

export const PostProduction: React.FC<PostProductionProps> = ({
  variegatos,
  availableIngredients,
  caldaWeightGrams = 0,
  onUpdateVariegatos
}) => {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [calibratingIndex, setCalibratingIndex] = useState<number | null>(null);
  const [cupVolumeInput, setCupVolumeInput] = useState<number>(100);
  const [cupWeightInput, setCupWeightInput] = useState<number>(107);

  // Mapa hash memoizado O(1) de insumos disponíveis por nome minúsculo
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of availableIngredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [availableIngredients]);

  const handleSelectFromSlideOver = (selected: Ingredient) => {
    const existingIdx = variegatos.findIndex(
      v => (v.name || '').toLowerCase().trim() === selected.name.toLowerCase().trim()
    );
    if (existingIdx >= 0) {
      handleChangeGrams(existingIdx, (variegatos[existingIdx].grams || 0) + 50);
    } else {
      const emptyIdx = variegatos.findIndex(v => !(v.name || '').trim());
      if (emptyIdx >= 0) {
        const next = [...variegatos];
        next[emptyIdx] = {
          ...next[emptyIdx],
          name: selected.name,
          grams: next[emptyIdx].grams || 100,
          costKg: selected.costKg
        };
        onUpdateVariegatos(next);
      } else {
        onUpdateVariegatos([
          ...variegatos,
          { name: selected.name, grams: 100, costKg: selected.costKg }
        ]);
      }
    }
  };

  const handleCreateCustomMescla = (customName: string) => {
    onUpdateVariegatos([
      ...variegatos,
      { name: customName, grams: 100, costKg: 0 }
    ]);
  };

  const handleRemove = (index: number) => {
    const next = [...variegatos];
    next.splice(index, 1);
    if (calibratingIndex === index) setCalibratingIndex(null);
    else if (calibratingIndex !== null && calibratingIndex > index) {
      setCalibratingIndex(calibratingIndex - 1);
    }
    onUpdateVariegatos(next);
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...variegatos];
    const ing = ingredientsMap.get(name.toLowerCase().trim());
    next[index] = {
      ...next[index],
      name,
      costKg: ing ? ing.costKg : next[index].costKg
    };
    onUpdateVariegatos(next);
  };

  const handleChangeGrams = (index: number, grams: number) => {
    const next = [...variegatos];
    next[index] = { ...next[index], grams: Math.max(0, grams) };
    onUpdateVariegatos(next);
  };

  const handleToggleMixer = (index: number) => {
    const next = [...variegatos];
    const ing = ingredientsMap.get((next[index].name || '').toLowerCase().trim());
    const resolved = resolveVariegatoDensity(next[index], ing);
    const isCurrentlyMixer = resolved.method === 'mixer';

    next[index] = {
      ...next[index],
      processMethod: isCurrentlyMixer ? 'direct' : 'mixer',
      overrun: isCurrentlyMixer ? 0 : 20,
      density: undefined // recalcular densidade dinamicamente
    };
    onUpdateVariegatos(next);
  };

  const handleApplyCalibration = (
    index: number,
    density: number,
    overrun?: number,
    method?: 'mixer' | 'direct' | 'custom'
  ) => {
    const next = [...variegatos];
    next[index] = {
      ...next[index],
      density: Math.round(density * 1000) / 1000,
      overrun: overrun !== undefined ? overrun : next[index].overrun,
      processMethod: method || 'custom'
    };
    onUpdateVariegatos(next);
    setCalibratingIndex(null);
  };

  const handleResetCalibration = (index: number) => {
    const next = [...variegatos];
    next[index] = {
      ...next[index],
      density: undefined,
      overrun: undefined,
      processMethod: undefined
    };
    onUpdateVariegatos(next);
    setCalibratingIndex(null);
  };

  const variegatoCandidates = useMemo(() => {
    return availableIngredients.filter(i =>
      /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja)/i.test(
        i.name
      )
    );
  }, [availableIngredients]);

  // Cálculo consolidado de peso, custo e volume em uma única passagem O(N) com Map O(1)
  const { totalVariegatosGrams, totalVariegatosCost, totalVariegatosVolMl } = useMemo(() => {
    let grams = 0;
    let cost = 0;
    let volMl = 0;

    for (const v of variegatos) {
      const g = v.grams || 0;
      grams += g;
      const ing = ingredientsMap.get((v.name || '').toLowerCase().trim());
      const costKg = v.costKg ?? (ing ? ing.costKg : 0);
      cost += (g * costKg) / 1000;
      const physical = resolveVariegatoDensity(v, ing);
      if (g > 0 && physical.density > 0) {
        volMl += g / physical.density;
      }
    }

    return {
      totalVariegatosGrams: grams,
      totalVariegatosCost: cost,
      totalVariegatosVolMl: Math.round(volMl)
    };
  }, [variegatos, ingredientsMap]);

  const totalPctCalda = caldaWeightGrams > 0 ? (totalVariegatosGrams / caldaWeightGrams) * 100 : 0;
  const totalGPerKg = caldaWeightGrams > 0 ? Math.round((totalVariegatosGrams / caldaWeightGrams) * 1000) : 0;

  const existingMesclaIds = useMemo(
    () =>
      variegatos
        .map(v => ingredientsMap.get((v.name || '').toLowerCase().trim())?.id)
        .filter(Boolean) as string[],
    [variegatos, ingredientsMap]
  );

  return (
    <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
      {/* Header Compacto em Linha Única (alinhado ao estilo de Composição da Calda Base) */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none shrink-0">🍯</span>
          <h3 className="text-base font-bold text-white whitespace-nowrap">Pós-Produção (Mesclas)</h3>
          <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
            ({variegatos.length} {variegatos.length === 1 ? 'mescla' : 'mesclas'})
          </span>
        </div>

        {variegatos.length > 0 && (
          <span
            className="text-xs font-mono font-bold text-cyan-300 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0"
            title={`${totalGPerKg}g de mesclas por kg de calda base (~${totalPctCalda.toFixed(1)}% do peso da calda)`}
          >
            {totalGPerKg} g/kg · ~{totalPctCalda.toFixed(0)}% calda
          </span>
        )}
      </div>

      {variegatos.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
          <p className="text-xs sm:text-sm text-slate-400">
            Nenhuma mescla, variegato ou inclusão adicionada à pós-produção.
          </p>
          <button
            type="button"
            onClick={() => setIsSlideOverOpen(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
          >
            Adicionar Mescla do Catálogo
          </button>
        </div>
      ) : (
        <>
          {/* Tabela Alinhada com as Mesmas Colunas de Composição da Calda Base */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 pb-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-2.5 pl-2 pr-2 min-w-[200px] whitespace-nowrap">Mescla / Variegato</th>
                  <th className="py-2.5 px-2 text-center w-[284px] whitespace-nowrap">Peso (g)</th>
                  <th className="py-2.5 px-2 text-right w-[74px] whitespace-nowrap">% Calda</th>
                  <th className="py-2.5 px-2 text-right w-[90px] whitespace-nowrap">Custo R$</th>
                  <th className="py-2.5 px-1.5 text-center w-11 whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody>
                {variegatos.map((item, idx) => {
                  const ing = ingredientsMap.get((item.name || '').toLowerCase().trim());
                  const physical = resolveVariegatoDensity(item, ing);
                  const costKg = item.costKg ?? (ing ? ing.costKg : 0);
                  const totalItemCost = (item.grams * costKg) / 1000;
                  const gPerKg = caldaWeightGrams > 0
                    ? Math.round((item.grams / caldaWeightGrams) * 1000)
                    : 0;
                  const pctCalda = caldaWeightGrams > 0
                    ? (item.grams / caldaWeightGrams) * 100
                    : 0;
                  const itemVolMl = item.grams > 0 && physical.density > 0
                    ? Math.round(item.grams / physical.density)
                    : 0;
                  const isLast = idx === variegatos.length - 1;

                  return (
                    <React.Fragment key={idx}>
                      {/* Linha Principal: Input do Nome 100% alinhado verticalmente com Peso, % Calda, Custo e Ação */}
                      <tr className="hover:bg-slate-750/30 transition-colors group">
                        {/* Coluna 1: Input do Nome */}
                        <td className="pt-2.5 pb-1 pl-2 pr-2 align-middle">
                          <input
                            type="text"
                            list="variegatos-options"
                            placeholder="Digite ou escolha a mescla..."
                            value={item.name}
                            onChange={e => handleChangeName(idx, e.target.value)}
                            title={item.name || undefined}
                            className="w-full h-9 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 text-sm text-white placeholder-slate-500 focus:outline-none font-semibold transition-colors"
                          />
                        </td>

                        {/* Coluna 2: Mesma Esteira Simétrica de 5 Controles da Calda Base */}
                        <td className="pt-2.5 pb-1 px-2 align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleChangeGrams(idx, Math.max(0, (item.grams || 0) - 10))}
                              className="w-[42px] h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 text-white hover:border-amber-500/60 hover:bg-slate-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none shadow-sm font-mono font-bold text-[11px] leading-none"
                              title="Diminuir 10g (-10g)"
                              aria-label={`Diminuir 10g de ${item.name || 'mescla'}`}
                            >
                              -10g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeGrams(idx, Math.max(0, (item.grams || 0) - 1))}
                              className="w-[42px] h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 text-white hover:border-amber-500/60 hover:bg-slate-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none shadow-sm font-mono font-bold text-[11px] leading-none"
                              title="Diminuir 1g (-1g)"
                              aria-label={`Diminuir 1g de ${item.name || 'mescla'}`}
                            >
                              -1g
                            </button>

                            <div className="w-[84px] h-8 shrink-0 px-2.5 rounded-full flex items-center justify-end bg-slate-900 border border-slate-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner">
                              <input
                                type="number"
                                min="0"
                                step="5"
                                value={item.grams === 0 ? '' : item.grams}
                                onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                                className="w-full min-w-0 bg-transparent text-right font-mono font-bold text-sm text-white tabular-nums tracking-tight focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                                aria-label={`Peso em gramas de ${item.name || 'mescla'}`}
                              />
                              <span className="text-xs font-mono font-semibold text-slate-400 pl-1 select-none shrink-0">
                                g
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleChangeGrams(idx, (item.grams || 0) + 1)}
                              className="w-[42px] h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 text-white hover:border-amber-500/60 hover:bg-slate-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none shadow-sm font-mono font-bold text-[11px] leading-none"
                              title="Aumentar 1g (+1g)"
                              aria-label={`Aumentar 1g de ${item.name || 'mescla'}`}
                            >
                              +1g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeGrams(idx, (item.grams || 0) + 10)}
                              className="w-[42px] h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 text-white hover:border-amber-500/60 hover:bg-slate-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none shadow-sm font-mono font-bold text-[11px] leading-none"
                              title="Aumentar 10g (+10g)"
                              aria-label={`Aumentar 10g de ${item.name || 'mescla'}`}
                            >
                              +10g
                            </button>
                          </div>
                        </td>

                        {/* Coluna 3: % Calda */}
                        <td
                          className="pt-2.5 pb-1 px-2 align-middle text-right font-mono font-bold tabular-nums text-slate-200 text-sm whitespace-nowrap"
                          title={`${gPerKg} g de mescla por kg de calda base`}
                        >
                          {pctCalda.toFixed(1)}%
                        </td>

                        {/* Coluna 4: Custo R$ */}
                        <td
                          className="pt-2.5 pb-1 px-2 align-middle text-right font-mono font-bold tabular-nums text-sm whitespace-nowrap"
                          title={`Custo cadastrado: R$ ${costKg.toFixed(2)}/kg`}
                        >
                          <span className={costKg <= 0 ? 'text-slate-400' : 'text-slate-200'}>
                            R$ {totalItemCost.toFixed(2)}
                          </span>
                        </td>

                        {/* Coluna 5: Ação (Lixeira centralizada) */}
                        <td className="pt-2.5 pb-1 px-1.5 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center text-amber-600 hover:text-amber-400 hover:bg-amber-500/15 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                            title="Remover mescla"
                            aria-label={`Remover ${item.name || 'mescla'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Sub-linha Técnica Deslocada para Baixo (Mixer, Densidade/Volume e g/kg) */}
                      <tr className={!isLast && calibratingIndex !== idx ? 'border-b border-slate-700/50' : ''}>
                        <td colSpan={5} className="pt-1 pb-3 pl-2.5 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleMixer(idx)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-1 border select-none ${
                                physical.method === 'mixer'
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                                  : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                              }`}
                              title={
                                physical.method === 'mixer'
                                  ? `Mixer ativado (+${physical.overrun}% de aeração mecânica). Clique para desligar.`
                                  : 'Clique para ativar preparo com Mixer (+20% de aeração mecânica)'
                              }
                            >
                              <span>🌪️</span>
                              <span>{physical.method === 'mixer' ? `Mixer: +${physical.overrun}%` : 'Mixer: Off'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCalibratingIndex(prev => (prev === idx ? null : idx))}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all inline-flex items-center gap-1 border select-none ${
                                calibratingIndex === idx
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
                              }`}
                              title="Clique para calibrar densidade física com copo dosador ou presets"
                            >
                              <Sliders className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                              <span>{physical.density.toFixed(2)} g/ml</span>
                              <span className="text-cyan-300 font-medium">· ~{itemVolMl} ml</span>
                            </button>

                            <span
                              className="text-[10px] font-mono text-slate-400 px-1 select-none"
                              title={`${gPerKg}g de mescla por kg de calda base`}
                            >
                              {gPerKg} g/kg
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Painel Expansível de Calibração Física (Copo 100ml / Presets) sob demanda */}
                      {calibratingIndex === idx && (
                        <tr className={!isLast ? 'border-b border-slate-700/50' : ''}>
                          <td colSpan={5} className="pt-0 pb-3 px-2">
                            <div className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3 shadow-xl space-y-2.5 animate-fade-in text-xs">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>
                                    Calibração de Densidade: <strong className="text-amber-300">{item.name || 'Mescla'}</strong>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCalibratingIndex(null)}
                                  className="text-slate-400 hover:text-white p-0.5 rounded"
                                  aria-label="Fechar calibração"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                                {/* Aferição com Balança e Copo */}
                                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-1 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  <Beaker className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">Copo:</span>
                                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-20">
                                    <input
                                      type="number"
                                      min="10"
                                      max="1000"
                                      value={cupVolumeInput}
                                      onChange={e => setCupVolumeInput(Number(e.target.value) || 100)}
                                      className="w-full bg-transparent text-xs font-mono font-bold text-white text-right focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 pl-0.5">ml</span>
                                  </div>
                                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 w-20">
                                    <input
                                      type="number"
                                      min="1"
                                      max="2000"
                                      value={cupWeightInput}
                                      onChange={e => setCupWeightInput(Number(e.target.value) || 107)}
                                      className="w-full bg-transparent text-xs font-mono font-bold text-white text-right focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 pl-0.5">g</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const d = cupVolumeInput > 0 ? cupWeightInput / cupVolumeInput : 1.25;
                                      handleApplyCalibration(idx, d, undefined, 'custom');
                                    }}
                                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold transition-colors shrink-0"
                                  >
                                    Aplicar
                                  </button>
                                </div>

                                {/* Presets Rápidos */}
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCalibration(idx, 1.07, 20, 'mixer')}
                                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono border border-slate-700"
                                  >
                                    Nutella Mixer (1.07)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCalibration(idx, 1.28, 0, 'direct')}
                                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700"
                                  >
                                    Nutella Pura (1.28)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCalibration(idx, 1.30, 0, 'direct')}
                                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 font-mono border border-slate-700"
                                  >
                                    Doce de Leite (1.30)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResetCalibration(idx)}
                                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-mono border border-slate-700"
                                  >
                                    Padrão
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600 font-black text-white text-sm">
                  <td className="py-3 pl-2 pr-2 text-base whitespace-nowrap">Total Mesclas</td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-base whitespace-nowrap">
                    <span className="text-amber-300">{totalVariegatosGrams} g</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="text-cyan-300 text-sm font-bold">~{totalVariegatosVolMl} ml</span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                    {totalPctCalda.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-400 text-base whitespace-nowrap">
                    R$ {totalVariegatosCost.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Ação Alinhada à Direita com Identidade Visual Idêntica ao Botão da Calda Base */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsSlideOverOpen(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Adicionar Mescla do Catálogo
            </button>
          </div>
        </>
      )}

      <datalist id="variegatos-options">
        {variegatoCandidates.map(i => (
          <option key={i.id} value={i.name}>
            R$ {i.costKg.toFixed(2)}/kg
          </option>
        ))}
      </datalist>

      {/* Gaveta Lateral do Catálogo de Mesclas & Inclusões (sem expansão em sanfona) */}
      <IngredientSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        onSelectIngredient={handleSelectFromSlideOver}
        onCreateCustom={handleCreateCustomMescla}
        availableIngredients={availableIngredients}
        existingIngredientIds={existingMesclaIds}
        title="Catálogo de Mesclas & Inclusões"
        subtitle="Selecione um variegato, recheio ou inclusão para pós-produção"
        categoryFilters={MESCLA_CATEGORY_FILTERS}
        defaultCategory="Variegatos & Recheios"
      />
    </div>
  );
};
