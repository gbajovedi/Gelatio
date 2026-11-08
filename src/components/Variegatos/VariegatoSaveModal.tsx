import React, { useState } from 'react';
import { Preparation, Ingredient, PreparationStep } from '../../types/gelato';
import { VariegatoAnalysis, VariegatoItemRow } from '../../types/variegato';
import { db } from '../../db/database';
import { syncPreparationToIngredient } from '../../core/preparationSync';
import { Save, X, Sparkles, CheckCircle2, AlertCircle, Scale, DollarSign, ChefHat } from 'lucide-react';

interface VariegatoSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  items: VariegatoItemRow[];
  analysis: VariegatoAnalysis;
  availableIngredients: Ingredient[];
  onSaved: (savedPrep: Preparation) => void;
}

export const VariegatoSaveModal: React.FC<VariegatoSaveModalProps> = ({
  isOpen,
  onClose,
  recipeName,
  items,
  analysis,
  availableIngredients,
  onSaved
}) => {
  const [name, setName] = useState<string>(recipeName);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setName(recipeName);
  }, [recipeName]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da mescla / variegato.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Converter instruções operacionais em PreparationStep[] estruturados
      const preparationSteps: PreparationStep[] = analysis.cookingInstructions.map((text, idx) => {
        let cat: PreparationStep['category'] = 'aquecimento';
        if (text.toLowerCase().includes('resfriamento') || text.toLowerCase().includes('maturação')) {
          cat = 'maturacao';
        } else if (text.toLowerCase().includes('frio') || text.toLowerCase().includes('mixer')) {
          cat = 'emulsao';
        } else if (text.toLowerCase().includes('pesagem') || text.toLowerCase().includes('dispersão')) {
          cat = 'pesagem';
        }

        return {
          id: `step_${Date.now()}_${idx + 1}`,
          order: idx + 1,
          title: text.split(':')[0] || `Passo ${idx + 1}`,
          description: text.split(':')[1]?.trim() || text,
          category: cat
        };
      });

      const prepId = `prep_variegato_${Date.now()}`;
      const prepToSave: Preparation = {
        id: prepId,
        name: name.trim(),
        category: 'Variegato',
        instructions: analysis.cookingInstructions.join('\n\n'),
        preparationSteps,
        ingredients: items.map(i => ({ name: i.name, grams: i.grams })),
        costKg: analysis.costing.finalCostKg,
        density: 1.30,
        isCustom: true
      };

      // 1. Salvar na tabela de pré-preparos
      await db.preparations.put(prepToSave);

      // 2. Sincronizar na tabela de insumos (para poder usar em receitas de gelato)
      await syncPreparationToIngredient(prepToSave, availableIngredients);

      onSaved(prepToSave);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar variegato no catálogo:', err);
      setError(`Erro ao salvar no banco de dados: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Salvar no Catálogo de Variegatos</h3>
              <p className="text-[11px] text-slate-400">Integração oficial com Pré-preparos e Insumos</p>
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nome da Mescla / Variegato
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Variegato Artesanal de Amoras Silvestres"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Metrics summary */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              Ficha Técnica do Lote
            </span>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Scale className="w-3.5 h-3.5 text-amber-400" /> Rendimento Final:
              </span>
              <span className="font-mono font-bold text-amber-300">
                {Math.round(analysis.finalWeightGrams)}g ({analysis.percentages.brix}°Bx)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Custo Efetivo:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                R$ {analysis.costing.finalCostKg.toFixed(2)} / kg
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ChefHat className="w-3.5 h-3.5 text-teal-400" /> Passos de Cocção:
              </span>
              <span className="font-mono font-bold text-slate-200">
                {analysis.cookingInstructions.length} passos técnicos
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Gravando...' : 'Salvar Variegato'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
