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

  return (
    <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span>🍯</span>
            <span>Pós-Produção (Variegatos, Mesclas & Inclusões)</span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Insumos adicionados após o congelamento/batimento na calda base.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Mescla</span>
        </button>
      </div>

      {variegatos.length === 0 ? (
        <div className="text-center py-5 border-2 border-dashed border-slate-700 rounded-xl text-xs text-slate-400 font-medium">
          Nenhuma mescla ou variegato adicionado. A calda base corresponde a 100% do gelato final.
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[620px] space-y-2">
            {/* Cabeçalho de Colunas Explicativo */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 select-none">
              <div className="flex-1 pl-1">Mescla / Inclusão</div>
              <div className="w-28 text-right pr-2">Peso</div>
              <div className="w-28 text-center">Processo / Mixer</div>
              <div className="w-28 text-center">Densidade & Vol</div>
              <div className="w-28 text-center">Dosagem</div>
              <div className="w-28 text-right pr-2">Custo</div>
              <div className="w-10 text-center">Ação</div>
            </div>

            {/* Linhas de Mesclas */}
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
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-colors">
                    {/* Nome da Mescla */}
                    <div className="flex-1 min-w-[160px]">
                      <input
                        type="text"
                        list="variegatos-options"
                        placeholder="Nome do variegato, pasta ou inclusão..."
                        value={item.name}
                        onChange={e => handleChangeName(idx, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    {/* Campo de Peso no Lote (Editável) */}
                    <div className="w-28 flex items-center bg-slate-800 border border-slate-700 focus-within:border-amber-500 rounded-lg px-2 py-1.5 shadow-inner transition-colors shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={item.grams || ''}
                        onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-sm text-right font-black font-mono text-amber-300 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                      <span className="text-xs font-mono font-bold text-slate-400 pl-1 shrink-0">g</span>
                    </div>

                    {/* Botão Ação Rápida de Mixer */}
                    <button
                      type="button"
                      onClick={() => handleToggleMixer(idx)}
                      className={`w-28 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                        physical.method === 'mixer'
                          ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                      }`}
                      title={
                        physical.method === 'mixer'
                          ? `Mixer ativado (+${physical.overrun}% de microbolhas de ar). Clique para alternar para direto.`
                          : 'Clique para ativar preparo com Mixer (+20% de aeração mecânica)'
                      }
                    >
                      <span>🌪️</span>
                      <span>Mixer {physical.method === 'mixer' ? `+${physical.overrun}%` : ''}</span>
                    </button>

                    {/* Pílula de Densidade & Volume Calculado */}
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
                      className="w-28 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/50 rounded-lg py-1 px-1.5 shrink-0 transition-colors cursor-pointer group"
                      title="Clique para calibrar densidade, alterar aeração ou aferir com copo 100ml"
                    >
                      <div className="flex items-center gap-0.5">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {physical.density.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">g/ml</span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono font-medium">
                        ~{itemVolMl} ml
                      </span>
                    </button>

                    {/* Pílula Informativa de Dosagem */}
                    <div
                      className="w-28 flex flex-col items-center justify-center bg-slate-800/80 border border-slate-700/60 rounded-lg py-1 px-1.5 shrink-0 shadow-inner"
                      title={`${gPerKg}g por 1kg de calda base (~${pctCalda.toFixed(1)}% do peso)`}
                    >
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {gPerKg} g/kg
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ~{pctCalda.toFixed(0)}% calda
                      </span>
                    </div>

                    {/* Custo no Lote e Custo por Kg */}
                    <div className="w-28 text-right pr-1 shrink-0">
                      <span className="text-sm font-mono font-bold text-emerald-400 block tracking-tight">
                        R$ {totalItemCost.toFixed(2)}
                      </span>
                      <span
                        className="text-[10px] text-slate-400 font-mono block"
                        title={`Preço da matéria-prima: R$ ${costKg.toFixed(2)}/kg`}
                      >
                        R$ {costKg.toFixed(2)}/kg
                      </span>
                    </div>

                    {/* Botão Remover */}
                    <div className="w-10 flex justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                        title="Remover mescla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Painel Expansível de Calibração Física (Copo 100ml / Mixer / Densidade Direta) */}
                  {calibratingIndex === idx && (
                    <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3.5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">
                            Calibração de Densidade & Aeração: <span className="text-amber-300">{item.name || 'Mescla'}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCalibratingIndex(null)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Método A: Aferidor de Bancada (Copo Dosador) */}
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                            <Beaker className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Aferição na Balança (Volume Conhecido)</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Pese uma quantidade fixa em copo graduado ou proveta:
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded px-2 py-1">
                              <span className="text-[10px] text-slate-400 pr-1">Vol:</span>
                              <input
                                type="number"
                                min="10"
                                max="1000"
                                value={cupVolumeInput}
                                onChange={e => setCupVolumeInput(Number(e.target.value) || 100)}
                                className="w-full bg-transparent text-xs font-mono font-bold text-white text-right focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 pl-1">ml</span>
                            </div>
                            <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded px-2 py-1">
                              <span className="text-[10px] text-slate-400 pr-1">Peso:</span>
                              <input
                                type="number"
                                min="1"
                                max="2000"
                                value={cupWeightInput}
                                onChange={e => setCupWeightInput(Number(e.target.value) || 107)}
                                className="w-full bg-transparent text-xs font-mono font-bold text-white text-right focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 pl-1">g</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const d = cupVolumeInput > 0 ? cupWeightInput / cupVolumeInput : 1.25;
                                handleApplyCalibration(idx, d, undefined, 'custom');
                              }}
                              className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors"
                            >
                              Aplicar
                            </button>
                          </div>
                          <span className="text-[10px] text-cyan-300/80 font-mono block">
                            Resultado: {(cupVolumeInput > 0 ? cupWeightInput / cupVolumeInput : 1.25).toFixed(3)} g/ml
                          </span>
                        </div>

                        {/* Método B: Densidade Direta e Presets Rápidos */}
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                            <Wind className="w-3.5 h-3.5 text-amber-400" />
                            <span>Presets e Densidade Direta</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0.5"
                              max="2.0"
                              placeholder="ex: 1.07"
                              value={directDensityInput}
                              onChange={e => setDirectDensityInput(e.target.value)}
                              className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-right focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">g/ml</span>
                            <button
                              type="button"
                              onClick={() => {
                                const d = parseFloat(directDensityInput);
                                if (d > 0) handleApplyCalibration(idx, d, undefined, 'custom');
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetCalibration(idx)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                              title="Restaurar parâmetros padrão da matéria-prima"
                            >
                              Restaurar
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
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
                              onClick={() => handleApplyCalibration(idx, 1.31, 0, 'direct')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono border border-slate-700"
                            >
                              Geleia Frutas (1.31)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
