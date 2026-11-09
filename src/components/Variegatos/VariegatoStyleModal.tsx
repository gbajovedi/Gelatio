import React, { useState } from 'react';
import { VariegatoStyleStandard } from '../../types/variegato';
import { SlidersHorizontal, X, RotateCcw, Save, ShieldCheck } from 'lucide-react';

interface VariegatoStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: VariegatoStyleStandard;
  onSaveStyle: (updatedStyle: VariegatoStyleStandard) => void;
  onResetStyle: () => void;
}

export const VariegatoStyleModal: React.FC<VariegatoStyleModalProps> = ({
  isOpen,
  onClose,
  style,
  onSaveStyle,
  onResetStyle
}) => {
  const [formData, setFormData] = useState<VariegatoStyleStandard>(() => JSON.parse(JSON.stringify(style)));

  // Atualizar quando o estilo de entrada mudar
  React.useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(style)));
  }, [style]);

  if (!isOpen) return null;

  const handleChangeMinMax = (
    field: keyof VariegatoStyleStandard['min'],
    type: 'min' | 'max',
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveStyle(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Metas Reológicas & Físico-Químicas</h3>
              <p className="text-xs text-slate-400">{formData.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Ajuste as faixas de tolerância técnica (mínimo e máximo) para a validação automática na bancada de balanceamento.
            </span>
          </div>

          <div className="space-y-3">
            {/* Brix */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">°Brix Alvo Pós-Cocção</span>
                <p className="text-[10px] text-slate-400">Faixa de sólidos solúveis</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={formData.min.brix}
                  onChange={e => handleChangeMinMax('brix', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="0.5"
                  value={formData.max.brix}
                  onChange={e => handleChangeMinMax('brix', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-amber-400">°Bx</span>
              </div>
            </div>

            {/* PAC */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">PAC Efetivo Concentrado</span>
                <p className="text-[10px] text-slate-400">Ponto anticongelante a frio</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10"
                  value={formData.min.pac}
                  onChange={e => handleChangeMinMax('pac', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="10"
                  value={formData.max.pac}
                  onChange={e => handleChangeMinMax('pac', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-cyan-400">pts</span>
              </div>
            </div>

            {/* PAC sobre Água Livre */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">PAC sobre Água Livre</span>
                <p className="text-[10px] text-slate-400">Poder anticongelante na fase aquosa real</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10"
                  value={formData.min.pacOnWater || 180}
                  onChange={e => handleChangeMinMax('pacOnWater', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="10"
                  value={formData.max.pacOnWater || 340}
                  onChange={e => handleChangeMinMax('pacOnWater', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-teal-400">pts</span>
              </div>
            </div>

            {/* POD Concentrado */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">POD Concentrado (Doçura Relativa)</span>
                <p className="text-[10px] text-slate-400">Poder adoçante sobre sacarose pura</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  value={formData.min.pod || 38}
                  onChange={e => handleChangeMinMax('pod', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="1"
                  value={formData.max.pod || 60}
                  onChange={e => handleChangeMinMax('pod', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-pink-400">%</span>
              </div>
            </div>

            {/* Açúcares */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Açúcares Totais (%)</span>
                <p className="text-[10px] text-slate-400">Teor total de açúcares</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  value={formData.min.sugars}
                  onChange={e => handleChangeMinMax('sugars', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="1"
                  value={formData.max.sugars}
                  onChange={e => handleChangeMinMax('sugars', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-rose-400">%</span>
              </div>
            </div>

            {/* Hidrocolóides */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Taxa de Hidrocolóides (%)</span>
                <p className="text-[10px] text-slate-400">Pectina, gomas e texturizantes</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={formData.min.hydrocolloids}
                  onChange={e => handleChangeMinMax('hydrocolloids', 'min', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-slate-500">até</span>
                <input
                  type="number"
                  step="0.05"
                  value={formData.max.hydrocolloids}
                  onChange={e => handleChangeMinMax('hydrocolloids', 'max', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                />
                <span className="text-xs text-teal-400">%</span>
              </div>
            </div>

            {/* Máxima Sacarose Ratio */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Limite de Sacarose / Anti-Cristalizantes</span>
                <p className="text-[10px] text-slate-400">Máximo permitido para evitar cristais vítreos</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  value={formData.min.maxSucroseRatio || 60}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 60;
                    setFormData(prev => ({
                      ...prev,
                      min: { ...prev.min, maxSucroseRatio: val },
                      max: { ...prev.max, maxSucroseRatio: val }
                    }));
                  }}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-purple-300 text-center"
                />
                <span className="text-xs text-purple-400">% máx</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetStyle}
            className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Metas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
