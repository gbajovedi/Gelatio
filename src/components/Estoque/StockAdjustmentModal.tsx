import React, { useState } from 'react';
import { StockItem, AdjustmentType } from '../../types/stock';
import { recordStockAdjustment } from '../../core/stockService';
import { AlertTriangle, X, Check, Scale } from 'lucide-react';
import { useModalDismiss } from '../../core/useModalDismiss';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  stockItem: StockItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  stockItem,
  onClose,
  onSuccess
}) => {
  useModalDismiss(isOpen && !!stockItem, onClose);

  if (!isOpen || !stockItem) return null;

  const [type, setType] = useState<AdjustmentType>('loss');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    try {
      // Perdas, degustação e consumo são saídas (negativo)
      // Recontagem pode ser ajuste positivo ou negativo, mas aqui tratamos como saída de ajuste ou recontagem direta
      const quantityChange = type === 'inventory_count' ? quantity - stockItem.currentUnits : -quantity;
      await recordStockAdjustment({
        stockItem,
        type,
        quantityChange,
        notes: notes.trim() || getDefaultNote(type)
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao registrar ajuste de estoque:', err);
      alert('Falha ao registrar ajuste de estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultNote = (t: AdjustmentType) => {
    switch (t) {
      case 'loss': return 'Perda por descongelamento ou avaria';
      case 'tasting': return 'Degustação oferecida a clientes no balcão';
      case 'internal_consumption': return 'Consumo interno da equipe';
      case 'inventory_count': return 'Ajuste de inventário físico';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Ajuste de Estoque / Baixa</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Sabor Selecionado:</span>
              <strong className="text-white text-sm block">{stockItem.recipeName}</strong>
              <span className="text-[11px] text-amber-300 font-mono">Pote de {stockItem.tubWeightGrams}g</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Saldo Atual:</span>
              <strong className="text-emerald-400 text-base font-mono">{stockItem.currentUnits} potes</strong>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Motivo do Ajuste:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'loss', label: 'Descarte / Perda', desc: 'Avaria ou validade' },
                { id: 'tasting', label: 'Degustação', desc: 'Amostras clientes' },
                { id: 'internal_consumption', label: 'Consumo Interno', desc: 'Uso da equipe' },
                { id: 'inventory_count', label: 'Recontagem Fís.', desc: 'Novo saldo real' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as AdjustmentType)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    type === opt.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {type === 'inventory_count' ? 'Novo Saldo Real em Potes:' : 'Quantidade de Potes a Baixar:'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity || ''}
              onChange={e => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg p-2.5 text-base text-white font-mono font-bold"
              placeholder="1"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Observações (opcional):</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Pote amassado no transporte ou prova de vitrine"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
