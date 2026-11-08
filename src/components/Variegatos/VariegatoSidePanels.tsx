import React from 'react';
import { VariegatoAlerts } from '../../types/variegato';
import { Ingredient } from '../../types/gelato';
import { extractItemAllergens } from '../../core/calculator';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChefHat,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface VariegatoSidePanelsProps {
  alerts: VariegatoAlerts;
  cookingInstructions: string[];
  items: { name: string; grams: number }[];
  ingredientsMap: Map<string, Ingredient>;
}

export const VariegatoSidePanels: React.FC<VariegatoSidePanelsProps> = ({
  alerts,
  cookingInstructions,
  items,
  ingredientsMap
}) => {
  // Coletar alérgenos presentes em todos os insumos
  const detectedAllergens = React.useMemo(() => {
    const list = new Set<string>();
    for (const item of items) {
      const ing = ingredientsMap.get(item.name.toLowerCase().trim());
      const data = extractItemAllergens(item.name, ing);
      data.allergens.forEach(a => list.add(a));
    }
    return Array.from(list);
  }, [items, ingredientsMap]);

  return (
    <div className="space-y-4">
      {/* 1. PAINEL DE ALERTAS REOLÓGICOS E CRISTALIZAÇÃO */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className={`p-1.5 rounded-lg border ${
            alerts.messages.length > 0
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            {alerts.messages.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Diagnóstico Reológico & Físico-Químico
            </h4>
            <p className="text-[11px] text-slate-400">
              {alerts.messages.length > 0
                ? `${alerts.messages.length} atenção(ões) identificada(s)`
                : 'Formulação estável e sem defeitos a frio'}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {alerts.messages.length > 0 ? (
            alerts.messages.map((msg, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-snug flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 leading-snug flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Excelente equilíbrio! A relação sacarose/anti-cristalizantes impede a precipitação de pedras de açúcar vítreas e mantém textura aveludada.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. PROTOCOLO OPERACIONAL DINÂMICO DE COCÇÃO */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Protocolo Operacional de Cocção
            </h4>
            <p className="text-[11px] text-slate-400">Instruções dinâmicas de bancada</p>
          </div>
        </div>

        <ol className="mt-3 space-y-2.5 text-xs text-slate-300">
          {cookingInstructions.map((instruction, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0 border border-amber-500/40">
                {idx + 1}
              </span>
              <span className="leading-tight text-[11px] text-slate-300">
                {instruction}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 3. DECLARAÇÃO DE ALÉRGENOS ANVISA */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Alérgenos Regulamentares (RDC ANVISA)
            </h4>
            <p className="text-[11px] text-slate-400">Rastreabilidade sanitária da mescla</p>
          </div>
        </div>

        <div className="mt-3">
          {detectedAllergens.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detectedAllergens.map((alg, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider"
                >
                  Contém {alg}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Nenhum alérgeno principal declarado nesta formulação.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
