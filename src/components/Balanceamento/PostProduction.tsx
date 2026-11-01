import React from 'react';
import { VariegatoItem, Ingredient } from '../../types/gelato';
import { Plus, Trash2 } from 'lucide-react';

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
  const handleAdd = () => {
    onUpdateVariegatos([...variegatos, { name: '', grams: 100, costKg: 0 }]);
  };

  const handleRemove = (index: number) => {
    const next = [...variegatos];
    next.splice(index, 1);
    onUpdateVariegatos(next);
  };

  const handleChangeName = (index: number, name: string) => {
    const next = [...variegatos];
    const ing = availableIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
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
            <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 select-none">
              <div className="flex-1 pl-1">Mescla / Inclusão</div>
              <div className="w-32 text-right pr-2">Peso no Lote</div>
              <div className="w-36 text-center">Dosagem Calculada</div>
              <div className="w-32 text-right pr-2">Custo</div>
              <div className="w-10 text-center">Ação</div>
            </div>

            {/* Linhas de Mesclas */}
            {variegatos.map((item, idx) => {
              const ing = availableIngredients.find(
                i => i.name.toLowerCase() === item.name.toLowerCase().trim()
              );
              const costKg = item.costKg ?? (ing ? ing.costKg : 0);
              const totalItemCost = (item.grams * costKg) / 1000;
              const gPerKg = caldaWeightGrams > 0
                ? Math.round((item.grams / caldaWeightGrams) * 1000)
                : 0;
              const pctCalda = caldaWeightGrams > 0
                ? (item.grams / caldaWeightGrams) * 100
                : 0;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-colors"
                >
                  {/* Nome da Mescla */}
                  <div className="flex-1">
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
                  <div className="w-32 flex items-center bg-slate-800 border border-slate-700 focus-within:border-amber-500 rounded-lg px-2.5 py-1.5 shadow-inner transition-colors">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={item.grams || ''}
                      onChange={e => handleChangeGrams(idx, parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-sm text-right font-black font-mono text-amber-300 focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-400 pl-1.5 shrink-0">g</span>
                  </div>

                  {/* Pílula Informativa de Dosagem (Resultado Calculado) */}
                  <div
                    className="w-36 flex flex-col items-center justify-center bg-slate-800/80 border border-slate-700/60 rounded-lg py-1 px-2 shrink-0 shadow-inner"
                    title={`${gPerKg}g de mescla por 1kg de calda base (${pctCalda.toFixed(1)}% do peso da calda)`}
                  >
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {gPerKg} g/kg
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ~{pctCalda.toFixed(1)}% da calda
                    </span>
                  </div>

                  {/* Custo no Lote e Custo por Kg */}
                  <div className="w-32 text-right pr-2 shrink-0">
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
