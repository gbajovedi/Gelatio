import React from 'react';
import { Preparation } from '../../types/gelato';
import { VariegatoStyleId, VariegatoStyleStandard } from '../../types/variegato';
import { VARIEGATO_STYLES } from '../../core/variegatoStyles';
import {
  ChefHat,
  Plus,
  RotateCcw,
  Save,
  Printer,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  ChevronDown
} from 'lucide-react';

interface VariegatoHeaderProps {
  recipeName: string;
  onRecipeNameChange: (name: string) => void;
  selectedStyleId: VariegatoStyleId;
  onSelectStyle: (styleId: VariegatoStyleId) => void;
  catalogPreparations: Preparation[];
  onLoadPreparation: (prep: Preparation) => void;
  onNewRecipe: () => void;
  onResetRecipe: () => void;
  onOpenSaveModal: () => void;
  onOpenStyleModal: () => void;
  isDirty: boolean;
}

export const VariegatoHeader: React.FC<VariegatoHeaderProps> = ({
  recipeName,
  onRecipeNameChange,
  selectedStyleId,
  onSelectStyle,
  catalogPreparations,
  onLoadPreparation,
  onNewRecipe,
  onResetRecipe,
  onOpenSaveModal,
  onOpenStyleModal,
  isDirty
}) => {
  const [isCatalogOpen, setIsCatalogOpen] = React.useState<boolean>(false);
  const catalogRef = React.useRef<HTMLDivElement>(null);

  // Close catalog dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setIsCatalogOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stylesList = Object.values(VARIEGATO_STYLES);

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4 relative overflow-visible">
      {/* Barra superior de gradiente */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />

      {/* Identificador no topo: Tag amarela com ícone de pote/espátula */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
            <ChefHat className="w-4 h-4 text-amber-400" />
            BANCADA DE VARIEGATOS & MESCLAS
          </span>

          {isDirty && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Edições ativas na bancada
            </span>
          )}
        </div>

        {/* Dropdown de Catálogo de Variegatos */}
        <div className="relative" ref={catalogRef}>
          <button
            type="button"
            onClick={() => setIsCatalogOpen(!isCatalogOpen)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Carregar um variegato do catálogo existente"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Carregar do Catálogo ({catalogPreparations.length})</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-500" />
          </button>

          {isCatalogOpen && (
            <div className="absolute right-0 top-10 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block border-b border-slate-800">
                Variegatos Cadastrados
              </span>
              {catalogPreparations.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">
                  Nenhum variegato cadastrado no momento.
                </div>
              ) : (
                catalogPreparations.map(prep => (
                  <button
                    key={prep.id}
                    type="button"
                    onClick={() => {
                      onLoadPreparation(prep);
                      setIsCatalogOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center justify-between transition-colors"
                  >
                    <span className="truncate">{prep.name}</span>
                    {prep.costKg && (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                        R${prep.costKg.toFixed(1)}/kg
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha 1: Input do Nome do Variegato + Botões de Ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            value={recipeName}
            onChange={e => onRecipeNameChange(e.target.value)}
            placeholder="Nome da Mescla / Variegato..."
            className="w-full text-lg sm:text-xl font-black bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNewRecipe}
            className="px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Iniciar uma nova mescla do zero"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Nova Mescla</span>
          </button>

          <button
            type="button"
            onClick={onResetRecipe}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/60 text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-95"
            title="Reverter para o estado inicial"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reverter</span>
          </button>

          <button
            type="button"
            onClick={onOpenSaveModal}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Mescla</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Imprimir Ficha Técnica de Bancada"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Linha 2: Seletor de Estilo/Presets (Dropdown + Botões Rápidos) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-700/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Estilo da Mescla:
          </span>

          {stylesList.map(st => {
            const isSelected = selectedStyleId === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStyle(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/50'
                }`}
                title={st.description}
              >
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>

        {/* Botão "Ajustar Metas Reológicas" */}
        <button
          type="button"
          onClick={onOpenStyleModal}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-inner border bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-500/50 group"
          title="Ajustar limites físico-químicos e reológicos do estilo selecionado"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span>Ajustar Metas Reológicas</span>
        </button>
      </div>
    </div>
  );
};
