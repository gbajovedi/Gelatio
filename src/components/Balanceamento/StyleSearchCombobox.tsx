import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  X,
  Check,
  PlusCircle,
  Copy,
  Trash2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { StyleStandard } from '../../types/gelato';
import {
  getStoredStyles,
  isOfficialStyle,
  duplicateStyle,
  deleteCustomStyle,
  STYLES_UPDATED_EVENT
} from '../../core/stylesStorage';
import { getCategoryTheme } from '../../core/categoryThemes';

interface StyleSearchComboboxProps {
  selectedStyleName: string;
  onSelectStyle: (styleName: string) => void;
  onOpenSettings: (styleName?: string, createMode?: boolean) => void;
  className?: string;
}

export const StyleSearchCombobox: React.FC<StyleSearchComboboxProps> = ({
  selectedStyleName,
  onSelectStyle,
  onOpenSettings,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stylesMap, setStylesMap] = useState<Record<string, StyleStandard>>(() => getStoredStyles());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escuta atualizações de estilos (adições, exclusões, trocas de preset)
  useEffect(() => {
    const handleUpdate = () => {
      setStylesMap(getStoredStyles());
    };
    window.addEventListener(STYLES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(STYLES_UPDATED_EVENT, handleUpdate);
  }, []);

  // Foco automático no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const currentStyle = stylesMap[selectedStyleName] || stylesMap['Gelatos de Leite'];
  const isSelectedCustom = currentStyle ? (!isOfficialStyle(selectedStyleName) || !!currentStyle.isCustom) : false;
  const currentTheme = getCategoryTheme(currentStyle?.baseCategory || selectedStyleName);

  // Normalização de texto sem acentos
  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Separar estilos oficiais e estilos customizados pelo usuário
  const { customStyles, officialStyles } = useMemo(() => {
    const customList: StyleStandard[] = [];
    const officialList: StyleStandard[] = [];
    const query = normalize(searchQuery.trim());

    Object.entries(stylesMap).forEach(([name, style]) => {
      const matchName = normalize(name).includes(query);
      const matchProfile = style.customProfileName ? normalize(style.customProfileName).includes(query) : false;
      if (query && !matchName && !matchProfile) return;

      if (!isOfficialStyle(name) || style.isCustom) {
        customList.push(style);
      } else {
        officialList.push(style);
      }
    });

    customList.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    officialList.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

    return { customStyles: customList, officialStyles: officialList };
  }, [stylesMap, searchQuery]);

  // Ação: Duplicar Estilo
  const handleDuplicate = (e: React.MouseEvent, style: StyleStandard) => {
    e.stopPropagation();
    const defaultNewName = `${style.name} (Personalizado)`;
    const newName = window.prompt(`Informe o nome para o novo estilo clonado a partir de "${style.name}":`, defaultNewName);
    if (!newName || !newName.trim()) return;

    try {
      const cloned = duplicateStyle(style.name, newName.trim());
      setStylesMap(getStoredStyles());
      onSelectStyle(cloned.name);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao duplicar estilo.');
    }
  };

  // Ação: Excluir Estilo Customizado
  const handleDelete = (e: React.MouseEvent, style: StyleStandard) => {
    e.stopPropagation();
    if (isOfficialStyle(style.name)) {
      alert('Estilos oficiais protegidos não podem ser excluídos.');
      return;
    }

    const confirm = window.confirm(`Deseja realmente excluir o estilo personalizado "${style.name}"?`);
    if (!confirm) return;

    const ok = deleteCustomStyle(style.name);
    if (ok) {
      const updated = getStoredStyles();
      setStylesMap(updated);
      if (selectedStyleName === style.name) {
        onSelectStyle('Gelatos de Leite');
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Botão Gatilho / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-amber-500/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3.5 py-2 transition-all shadow-inner group text-left cursor-pointer"
        title="Clique para pesquisar ou alternar o estilo alvo de balanceamento"
      >
        <span className="shrink-0 group-hover:scale-110 transition-transform">
          {currentTheme.icon}
        </span>
        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[280px]">
          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
            Estilo: {selectedStyleName}
          </span>
          {isSelectedCustom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shrink-0 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>Estilo da Casa</span>
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-amber-400' : 'group-hover:text-slate-200'
          }`}
        />
      </button>

      {/* Dropdown Menu Flutuante */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* Caixa de Pesquisa no Topo */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrar ou pesquisar estilos..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Estilos (Agrupados) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            
            {/* GRUPO 1: Meus Estilos Personalizados */}
            {customStyles.length > 0 && (
              <div className="p-1.5">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Meus Estilos da Casa
                  </span>
                  <span className="text-purple-400/80 font-mono text-[10px]">({customStyles.length})</span>
                </div>
                {customStyles.map(style => {
                  const isSelected = style.name === selectedStyleName;
                  const itemTheme = getCategoryTheme(style.baseCategory || style.name);
                  return (
                    <div
                      key={style.name}
                      onClick={() => {
                        onSelectStyle(style.name);
                        setIsOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="shrink-0">{itemTheme.icon}</span>
                        <div className="truncate">
                          <span className="font-semibold text-white truncate block">
                            {style.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && (
                          <Check className="w-4 h-4 text-purple-400 mr-1" />
                        )}
                        {/* Ação Clonar */}
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(e, style)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 transition-colors opacity-70 group-hover:opacity-100"
                          title="Clonar este estilo"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {/* Ação Excluir */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, style)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors opacity-70 group-hover:opacity-100"
                          title="Excluir estilo personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* GRUPO 2: Estilos Oficiais */}
            {officialStyles.length > 0 && (
              <div className="p-1.5">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Estilos Oficiais Protegidos
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">({officialStyles.length})</span>
                </div>
                {officialStyles.map(style => {
                  const isSelected = style.name === selectedStyleName;
                  const itemTheme = getCategoryTheme(style.name);
                  return (
                    <div
                      key={style.name}
                      onClick={() => {
                        onSelectStyle(style.name);
                        setIsOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="shrink-0">{itemTheme.icon}</span>
                        <span className="font-semibold text-white truncate">
                          {style.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-400 mr-1" />
                        )}
                        {/* Ação Clonar como novo estilo */}
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(e, style)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 transition-colors opacity-70 group-hover:opacity-100"
                          title="Clonar como novo estilo personalizado"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nenhum resultado */}
            {customStyles.length === 0 && officialStyles.length === 0 && (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <p className="text-xs">
                  Nenhum estilo encontrado para <span className="text-amber-300 font-bold">"{searchQuery}"</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings(searchQuery.trim(), true);
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Criar "{searchQuery.trim()}"</span>
                </button>
              </div>
            )}

          </div>

          {/* Rodapé: Botão de Criação de Novo Estilo */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings(undefined, true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>+ Novo Estilo da Casa</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

