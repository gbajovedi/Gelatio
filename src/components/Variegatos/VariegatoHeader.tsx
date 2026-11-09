import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Preparation } from '../../types/gelato';
import { VariegatoStyleId } from '../../types/variegato';
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
  ChevronDown,
  Search,
  X
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
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const catalogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close catalog dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setIsCatalogOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no campo de busca ao abrir o dropdown
  useEffect(() => {
    if (isCatalogOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isCatalogOpen]);

  // Filtragem das receitas/variegatos pelo termo digitado
  const filteredPreparations = useMemo(() => {
    if (!searchTerm.trim()) return catalogPreparations;
    const term = searchTerm.toLowerCase().trim();
    return catalogPreparations.filter(prep => {
      const matchName = prep.name.toLowerCase().includes(term);
      const matchCategory = prep.category?.toLowerCase().includes(term);
      const matchIngs = prep.ingredients?.some(i => i.name?.toLowerCase().includes(term));
      return matchName || matchCategory || matchIngs;
    });
  }, [catalogPreparations, searchTerm]);

  const stylesList = Object.values(VARIEGATO_STYLES);

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4 relative overflow-visible">
      {/* Barra superior de gradiente */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />

      {/* Identificador no topo: Tag amarela com ícone de pote/espátula */}
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

      {/* LINHA 1: Caixa de Nome + Catálogo Integrado alinhada com os Botões de Ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Bloco Unificado: Input de Nome + Botão Catálogo com Dropdown Pesquisável */}
        <div ref={catalogRef} className="relative flex-1 min-w-[260px] sm:min-w-[340px] max-w-2xl">
          <div
            className={`flex items-center bg-slate-900 border ${
              isCatalogOpen
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-slate-700 hover:border-slate-600 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
            } rounded-xl shadow-inner transition-all overflow-hidden`}
          >
            <input
              type="text"
              value={recipeName}
              onChange={e => onRecipeNameChange(e.target.value)}
              placeholder="Nome da Mescla / Variegato..."
              className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-base sm:text-lg font-bold text-amber-300 placeholder-slate-500 focus:outline-none"
              title="Clique para editar o nome do variegato na bancada"
            />

            <button
              type="button"
              onClick={() => setIsCatalogOpen(!isCatalogOpen)}
              className={`px-3 sm:px-3.5 py-2.5 border-l border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/80 text-xs font-bold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-colors shrink-0 ${
                isCatalogOpen ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : ''
              }`}
              title={`Abrir catálogo e buscar receitas (${catalogPreparations.length} mesclas cadastradas)`}
            >
              <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Catálogo ({catalogPreparations.length})</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isCatalogOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>
          </div>

          {/* Dropdown Menu com Busca e Lista */}
          {isCatalogOpen && (
            <div className="absolute left-0 top-full mt-2 w-full sm:w-[460px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[440px] animate-in fade-in zoom-in-95 duration-150">
              {/* Campo de Busca */}
              <div className="p-3 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome (ex: morango, trufado, caramelo)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-white rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>{filteredPreparations.length} variegatos encontrados</span>
                  <span>Clique para carregar na bancada</span>
                </div>
              </div>

              {/* Lista de Opções */}
              <div className="overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
                {/* Opção Criar Nova Mescla do zero */}
                <button
                  type="button"
                  onClick={() => {
                    onNewRecipe();
                    setIsCatalogOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl transition-all flex items-center justify-between hover:bg-slate-800/80 text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-300">
                        Iniciar Nova Mescla Personalizada
                      </div>
                      <div className="text-xs text-slate-400">
                        Comece do zero com a bancada em branco
                      </div>
                    </div>
                  </div>
                </button>

                {filteredPreparations.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Nenhum variegato encontrado com &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  filteredPreparations.map(prep => {
                    const isSelected = prep.name.trim().toLowerCase() === recipeName.trim().toLowerCase();
                    return (
                      <button
                        key={prep.id}
                        type="button"
                        onClick={() => {
                          onLoadPreparation(prep);
                          setIsCatalogOpen(false);
                        }}
                        className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'hover:bg-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-slate-600'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {prep.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{prep.ingredients?.length || 0} insumos</span>
                              {prep.category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{prep.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {prep.costKg != null && prep.costKg > 0 && (
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold font-mono text-emerald-400">
                              R$ {prep.costKg.toFixed(2)}/kg
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
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
            <span>Nova Mescla</span>
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

      {/* LINHA 2: Seletor de Estilo/Presets (Dropdown + Botões Rápidos) */}
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
