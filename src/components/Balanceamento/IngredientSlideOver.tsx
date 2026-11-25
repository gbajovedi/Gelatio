import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ingredient } from '../../types/gelato';
import { useModalDismiss } from '../../core/useModalDismiss';
import { Search, X, Plus, Sparkles, Info } from 'lucide-react';

export interface IngredientSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIngredient: (ingredient: Ingredient) => void;
  availableIngredients: Ingredient[];
  existingIngredientIds?: string[];
  className?: string;
  title?: string;
  subtitle?: string;
  categoryFilters?: string[];
  defaultCategory?: string;
  onCreateCustom?: (customName: string) => void;
}

export interface CategoryPillMeta {
  icon: string;
  label: string;
  color: string;
}

export const getIngredientCategoryBadge = (category?: string): CategoryPillMeta => {
  if (!category) return { icon: '📦', label: 'Outro', color: 'bg-slate-700/50 text-slate-300 border-slate-600/40' };
  switch (category) {
    case 'Laticínios':
      return { icon: '🥛', label: 'Lácteo', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
    case 'Açúcares':
      return { icon: '🍬', label: 'Açúcar', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    case 'Chocolates & Cacau':
      return { icon: '🍫', label: 'Cacau', color: 'bg-amber-900/30 text-amber-200 border-amber-700/40' };
    case 'Pastas & Oleaginosas':
      return { icon: '🌰', label: 'Pasta', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
    case 'Frutas':
    case 'Frutas & Polpas':
      return { icon: '🍓', label: 'Fruta', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    case 'Neutros & Fibras':
    case 'Neutros, Gomas & Fibras':
      return { icon: '🧪', label: 'Neutro', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    case 'Água & Líquidos':
    case 'Água / Líquido':
      return { icon: '💧', label: 'Água / Líquido', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    case 'Bases & Pré-preparos':
      return { icon: '🥣', label: 'Base', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    case 'Variegatos & Recheios':
      return { icon: '🍯', label: 'Mescla', color: 'bg-yellow-600/15 text-yellow-200 border-yellow-600/30' };
    case 'Álcoois & Bebidas':
      return { icon: '🍸', label: 'Álcool', color: 'bg-amber-600/20 text-amber-300 border-amber-500/40' };
    case 'Bebidas Vegetais & Plant-Based':
      return { icon: '🌱', label: 'Vegetal', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    case 'Ovos & Proteínas':
      return { icon: '🥚', label: 'Ovo/Prot', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' };
    case 'Confeitaria & Inclusões':
      return { icon: '🍪', label: 'Confeitaria', color: 'bg-orange-600/20 text-orange-200 border-orange-500/40' };
    default:
      return { icon: '📦', label: 'Outro', color: 'bg-slate-700/50 text-slate-300 border-slate-600/40' };
  }
};

const CATEGORY_FILTERS = [
  'Todos',
  'Laticínios',
  'Açúcares',
  'Chocolates & Cacau',
  'Pastas & Oleaginosas',
  'Frutas & Polpas',
  'Neutros & Fibras',
  'Bases & Pré-preparos',
  'Outros'
];

export const IngredientSlideOver: React.FC<IngredientSlideOverProps> = ({
  isOpen,
  onClose,
  onSelectIngredient,
  availableIngredients,
  existingIngredientIds = [],
  className = '',
  title = 'Catálogo de Matérias-Primas',
  subtitle = 'Selecione um insumo balanceado para adicionar à calda',
  categoryFilters = CATEGORY_FILTERS,
  defaultCategory = 'Todos',
  onCreateCustom
}) => {
  useModalDismiss(isOpen, onClose);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(defaultCategory);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSelectedCategory(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

  const filteredIngredients = useMemo(() => {
    return availableIngredients.filter(ing => {
      // Category match (se houver busca digitada, pesquisa em todas as categorias quando nenhum match ou respeita filtro ativo)
      if (selectedCategory !== 'Todos' && !searchQuery.trim()) {
        if (selectedCategory === 'Outros') {
          const knownCategories = categoryFilters.filter(c => c !== 'Todos' && c !== 'Outros');
          if (knownCategories.includes(ing.category)) return false;
        } else if (selectedCategory === 'Variegatos & Recheios') {
          if (ing.category !== 'Variegatos & Recheios' && ing.category !== 'Variegato') return false;
        } else if (selectedCategory === 'Frutas & Polpas') {
          if (ing.category !== 'Frutas' && ing.category !== 'Frutas & Polpas') return false;
        } else if (selectedCategory === 'Neutros & Fibras') {
          if (ing.category !== 'Neutros & Fibras' && ing.category !== 'Neutros, Gomas & Fibras') return false;
        } else if (selectedCategory === 'Açúcares') {
          if (ing.category !== 'Açúcares' && ing.category !== 'Açúcares & Adoçantes') return false;
        } else if (ing.category !== selectedCategory) {
          return false;
        }
      }

      // Query match (name, code, or category)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        ing.name.toLowerCase().includes(q) ||
        (ing.category && ing.category.toLowerCase().includes(q)) ||
        (ing.id && ing.id.toLowerCase().includes(q))
      );
    });
  }, [availableIngredients, selectedCategory, searchQuery, categoryFilters]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slide-over-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="slide-over-title"
                  className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar catálogo"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Input */}
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, categoria ou código..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categoryFilters.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all active:scale-95 select-none ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Ingredients - Non-expandable items: clicking card or '+' directly adds to recipe */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Nenhum item encontrado
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tente alterar o filtro ou o termo de pesquisa.
                  </p>
                </div>
                {onCreateCustom && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateCustom(searchQuery.trim());
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Adicionar &ldquo;{searchQuery.trim()}&rdquo; personalizado</span>
                  </button>
                )}
              </div>
            ) : (
              filteredIngredients.map(ing => {
                const badge = getIngredientCategoryBadge(ing.category);
                const isAlreadyInRecipe = existingIngredientIds.includes(ing.id);

                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => {
                      onSelectIngredient(ing);
                      onClose();
                    }}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/60 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    title={`Clique para adicionar ${ing.name} à receita`}
                    aria-label={`Adicionar ${ing.name}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                            {ing.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                          {isAlreadyInRecipe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700/60">
                              Na receita
                            </span>
                          )}
                        </div>

                        {/* Quick Metrics Bar */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono text-slate-400">
                          <span>Gord: {(ing.fat * 100).toFixed(1)}%</span>
                          <span>Açúc: {(ing.sugars * 100).toFixed(1)}%</span>
                          <span>PAC: {ing.pac.toFixed(0)}</span>
                          <span>POD: {ing.pod.toFixed(0)}</span>
                          <span className="text-emerald-400 font-semibold">
                            R$ {ing.costKg.toFixed(2)}/kg
                          </span>
                        </div>
                      </div>

                      {/* Quick Add Visual Indicator */}
                      <span
                        aria-hidden="true"
                        className="w-9 h-9 flex items-center justify-center bg-amber-500 group-hover:bg-amber-400 group-active:scale-95 text-slate-950 rounded-xl transition-all shadow-md shrink-0"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
            <span>{filteredIngredients.length} insumos disponíveis no catálogo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
