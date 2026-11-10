import React from 'react';
import {
  VariegatoAlerts,
  VariegatoRheologyGuidance,
  VariegatoThermalGuidance
} from '../../types/variegato';
import { Ingredient } from '../../types/gelato';
import { extractItemAllergens } from '../../core/calculator';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface VariegatoSidePanelsProps {
  alerts: VariegatoAlerts;
  rheologyGuidance?: VariegatoRheologyGuidance;
  thermalGuidance?: VariegatoThermalGuidance;
  cookingInstructions: string[];
  items: { name: string; grams: number }[];
  ingredientsMap: Map<string, Ingredient>;
}

export const VariegatoSidePanels: React.FC<VariegatoSidePanelsProps> = ({
  alerts,
  rheologyGuidance,
  thermalGuidance,
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

  // Agregar diagnósticos físico-químicos, reológicos e térmicos em uma visão unificada
  const diagnosticMessages = React.useMemo(() => {
    const list: { key: string; text: string; tone: 'amber' | 'rose' | 'cyan' }[] = [];

    alerts.messages.forEach((msg, idx) => {
      list.push({ key: `alert_${idx}`, text: msg, tone: 'amber' });
    });

    if (rheologyGuidance && !rheologyGuidance.isFatBasedExempt && rheologyGuidance.status !== 'aligned') {
      list.push({
        key: 'rheology_delta',
        text: `Reologia (${rheologyGuidance.targetLabel}): ${rheologyGuidance.actionInstruction}`,
        tone: rheologyGuidance.status === 'above' ? 'rose' : 'amber'
      });
    }

    if (rheologyGuidance && rheologyGuidance.acidActivationNeeded) {
      list.push({
        key: 'rheology_acid',
        text: `Ativação de Pectina: Falta meio ácido na formulação. Adicione cerca de ${rheologyGuidance.acidGramsRecommended.toFixed(1)} g de Suco de Limão ao final da cocção para ativar o gel.`,
        tone: 'amber'
      });
    }

    if (thermalGuidance && thermalGuidance.status !== 'ideal') {
      list.push({
        key: 'thermal_delta',
        text: `${thermalGuidance.headline}: ${thermalGuidance.actionInstruction}`,
        tone: thermalGuidance.status === 'freezing_risk' ? 'cyan' : 'amber'
      });
    }

    return list;
  }, [alerts.messages, rheologyGuidance, thermalGuidance]);

  const hasIssues = diagnosticMessages.length > 0;

  return (
    <div className="space-y-4">
      {/* 1. PAINEL DE ALERTAS REOLÓGICOS E CRISTALIZAÇÃO */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className={`p-1.5 rounded-lg border ${
            hasIssues
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            {hasIssues ? (
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
              {hasIssues
                ? `${diagnosticMessages.length} atenção(ões) identificada(s)`
                : 'Formulação estável, alinhada e sem defeitos a frio'}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {hasIssues ? (
            diagnosticMessages.map(diag => {
              const toneStyle =
                diag.tone === 'rose'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : diag.tone === 'cyan'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200';
              const iconColor =
                diag.tone === 'rose'
                  ? 'text-rose-400'
                  : diag.tone === 'cyan'
                  ? 'text-cyan-400'
                  : 'text-amber-400';

              return (
                <div
                  key={diag.key}
                  className={`p-2.5 rounded-xl border text-[11px] leading-snug flex items-start gap-2 ${toneStyle}`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <span>{diag.text}</span>
                </div>
              );
            })
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 leading-snug flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Excelente equilíbrio! A relação sacarose/anti-cristalizantes, a viscosidade alvo e o PAC térmico garantem textura aveludada e sem cristalização.
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
