import React, { useState } from 'react';
import { VariegatoItem, Ingredient } from '../../types/gelato';
import { Plus, Trash2, Wind, Sliders, Check, X, Beaker } from 'lucide-react';
import { resolveVariegatoDensity } from '../../core/calculator';

interface PostProductionProps {
  variegatos: VariegatoItem[];
  availableIngredients: Ingredient[];
  caldaWeightGrams?: number;
  onUpdateVariegatos: (variegatos: VariegatoItem[]) => void;
}

export const PostProduction: React.FC<PostProductionProps> = ({
  variegatos,
  availableIngredients,
  caldaWeightGrams = 0,
  onUpdateVariegatos
}) => {
  const [calibratingIndex, setCalibratingIndex] = useState<number | null>(null);
  const [cupVolumeInput, setCupVolumeInput] = useState<number>(100);
  const [cupWeightInput, setCupWeightInput] = useState<number>(107);
  const [directDensityInput, setDirectDensityInput] = useState<string>('');

  const handleAdd = () => {
    onUpdateVariegatos([...variegatos, { name: '', grams: 100, costKg: 0 }]);
  };

  const handleRemove = (index: number) => {
    const next = [...variegatos];
    next.splice(index, 1);
    if (calibratingIndex === index) setCalibratingIndex(null);
    onUpdateVariegatos(next);
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...variegatos];
    const ing = availableIngredients.find(i => i.name.toLowerCase() === name.toLowerCase().trim());
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
    const ing = availableIngredients.find(
      i => i.name.toLowerCase() === (next[index].name || '').toLowerCase().trim()
    );
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

  const handleApplyCalibration = (index: number, density: number, overrun?: number, method?: 'mixer' | 'direct' | 'custom') => {
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

  const variegatoCandidates = availableIngredients.filter(i =>
    /(variegato|brigadeiro|nutella|caramelo|cocada|goiabada|doce de leite|biscoff|croissant|pudim|torrone|paçoca|pasta|calda|amendoim|castanha|avelã|pistache|nozes|amêndoa|biscoito|cereja)/i.test(
      i.name
    )
  );

  const totalVariegatosGrams = variegatos.reduce((acc, v) => acc + (v.grams || 0), 0);
  const totalVariegatosCost = variegatos.reduce((acc, v) => {
    const ing = availableIngredients.find(
      i => i.name.toLowerCase() === (v.name || '').toLowerCase().trim()
    );
    const costKg = v.costKg ?? (ing ? ing.costKg : 0);
    return acc + (v.grams * costKg) / 1000;
  }, 0);
  const totalVariegatosVolMl = Math.round(
    variegatos.reduce((acc, v) => {
      const ing = availableIngredients.find(
        i => i.name.toLowerCase() === (v.name || '').toLowerCase().trim()
      );
      const physical = resolveVariegatoDensity(v, ing);
      const vol = v.grams > 0 && physical.density > 0 ? v.grams / physical.density : 0;
      return acc + vol;
    }, 0)
  );

  return (
    <div className="bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-3.5">
      {/* Header com Título e Botão de Adição */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <span>🍯</span>
            <span>Pós-Produção (Mesclas)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Insumos adicionados após a calda base.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Mescla</span>
        </button>
      </div>

      {variegatos.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-700/90 rounded-xl text-xs text-slate-400 space-y-2">
          <p>Nenhuma mescla ou variegato adicionado.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar mescla (ex: Nutella, Frutas, Doce de Leite)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {variegatos.map((item, idx) => {
            const ing = availableIngredients.find(
              i => i.name.toLowerCase() === (item.name || '').toLowerCase().trim()
            );
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

            return (
              <div
                key={idx}
                className="bg-slate-900/90 rounded-xl border border-slate-700/80 p-3 space-y-2.5 shadow-sm hover:border-slate-600 transition-colors"
              >
                {/* Linha 1: Nome da Mescla (100% da largura útil) + Botão Excluir */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      list="variegatos-options"
                      placeholder="Nome da mescla (ex: Variegato de Nutella)..."
                      value={item.name}
                      onChange={e => handleChangeName(idx, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-colors shrink-0"
                    title="Remover mescla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Linha 2: Peso no Lote, Dosagem e Custo Distribuídos Simetricamente */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 pt-0.5">
                  {/* 1. Bloco de Pesagem */}
                  <div className="flex items-center bg-slate-800 border border-slate-700 focus-within:border-amber-500 rounded-xl px-2.5 py-1.5 shadow-inner transition-colors shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5 select-none">Peso:</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={item.grams || ''}
                      onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-transparent text-sm text-right font-black font-mono text-amber-300 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-400 pl-1 select-none">g</span>
                  </div>

                  {/* 2. Bloco de Dosagem (Centralizado Simetricamente) */}
                  <div
                    className="text-center text-[11px] font-mono leading-tight px-1"
                    title={`${gPerKg}g de mescla por 1kg de calda base (~${pctCalda.toFixed(1)}% do peso do lote)`}
                  >
                    <span className="text-cyan-300 font-bold block whitespace-nowrap">{gPerKg} g/kg</span>
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap">~{pctCalda.toFixed(0)}% calda</span>
                  </div>

                  {/* 3. Bloco de Custo */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-black text-emerald-400 block tracking-tight whitespace-nowrap">
                      R$ {totalItemCost.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block whitespace-nowrap">
                      R$ {costKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                {/* Linha 3: Controles de Física (Mixer & Densidade/Volume) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  {/* Botão Ação Rápida de Mixer com Estado Explícito */}
                  <button
                    type="button"
                    onClick={() => handleToggleMixer(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      physical.method === 'mixer'
                        ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm'
                        : 'bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                    title={
                      physical.method === 'mixer'
                        ? `Mixer ativado (+${physical.overrun}% de aeração mecânica). Clique para desligar.`
                        : 'Clique para ativar preparo com Mixer (+20% de aeração mecânica)'
                    }
                  >
                    <span>🌪️</span>
                    <span>{physical.method === 'mixer' ? `Mixer: Ativo (+${physical.overrun}%)` : 'Mixer: Desligado'}</span>
                  </button>

                  {/* Pílula de Densidade & Volume (com ícone e affordance de clique) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (calibratingIndex === idx) {
                        setCalibratingIndex(null);
                      } else {
                        setCalibratingIndex(idx);
                        setDirectDensityInput(String(physical.density));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
                      calibratingIndex === idx
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700/80 text-amber-300 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                    }`}
                    title="Clique para calibrar densidade física com copo dosador ou presets"
                  >
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>{physical.density.toFixed(2)} g/ml</span>
                    <span className="text-cyan-300 font-medium">· ~{itemVolMl} ml</span>
                  </button>
                </div>

                {/* Painel Expansível de Calibração Física (Copo 100ml / Mixer / Presets) */}
                {calibratingIndex === idx && (
                  <div className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3 shadow-xl space-y-2.5 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Calibração: <strong className="text-amber-300">{item.name || 'Mescla'}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCalibratingIndex(null)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Método A: Copo Dosador */}
                    <div className="space-y-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                        <Beaker className="w-3 h-3 text-cyan-400" />
                        <span>Aferição com Balança e Copo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                          <span className="text-[10px] text-slate-400 pr-1">Vol:</span>
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
                        <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                          <span className="text-[10px] text-slate-400 pr-1">Peso:</span>
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
                          className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold transition-colors shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleApplyCalibration(idx, 1.07, 20, 'mixer')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono border border-slate-700"
                      >
                        Nutella Mixer (1.07)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCalibration(idx, 1.28, 0, 'direct')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700"
                      >
                        Nutella Pura (1.28)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCalibration(idx, 1.30, 0, 'direct')}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 font-mono border border-slate-700"
                      >
                        Doce de Leite (1.30)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetCalibration(idx)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-mono border border-slate-700 ml-auto"
                      >
                        Padrão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Rodapé Sumário de Pós-Produção */}
          <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300 px-0.5">
            <span className="font-semibold text-slate-400">Total Mesclas ({variegatos.length}):</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-amber-300 font-bold">{totalVariegatosGrams} g</span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300 font-medium">~{totalVariegatosVolMl} ml</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-bold">R$ {totalVariegatosCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <datalist id="variegatos-options">
        {variegatoCandidates.map(i => (
          <option key={i.id} value={i.name}>
            R$ {i.costKg.toFixed(2)}/kg
          </option>
        ))}
      </datalist>
    </div>
  );
};
