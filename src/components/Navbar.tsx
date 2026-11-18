import React from 'react';
import { Scale, BookOpen, Utensils, ChefHat, DollarSign, Database, Package } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import gelatioLogo from '../assets/gelatio-logo.png';

export type NavTab = 'balanceamento' | 'receitas' | 'preparos' | 'ingredientes' | 'financeiro' | 'estoque';

export interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenBackup: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenBackup,
  onOpenSearch
}) => {
  const tabs = [
    { id: 'balanceamento', label: 'Bancada', shortLabel: 'Bancada', icon: Scale },
    { id: 'receitas', label: 'Catálogo', shortLabel: 'Catálogo', icon: BookOpen },
    { id: 'preparos', label: 'Preparos', shortLabel: 'Preparos', icon: ChefHat },
    { id: 'ingredientes', label: 'Insumos', shortLabel: 'Insumos', icon: Utensils },
    { id: 'financeiro', label: 'Custos', shortLabel: 'Custos', icon: DollarSign },
    { id: 'estoque', label: 'Estoque', shortLabel: 'Estoque', icon: Package },
  ] as const;

  return (
    <header className="sticky top-0 z-40 max-w-7xl mx-auto mt-2 sm:mt-3 px-4 sm:px-5 py-2.5 pointer-events-auto rounded-2xl shadow-lg backdrop-blur-xl bg-white/75 dark:bg-slate-900/90 border border-stone-200/60 dark:border-slate-800 transition-all duration-300 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]">
      <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
        {/* Marca / Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('balanceamento')}
            className="flex items-center cursor-pointer group select-none py-0.5 bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
            title="Gelatio — Calculadora & Balanceamento de Gelatos"
            aria-label="Ir para a Bancada de Balanceamento"
          >
            <img
              src={gelatioLogo}
              alt="Gelatio"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
            />
          </button>
        </div>

        {/* Segmented Control Pills (Desktop Tabs — Apple Dock Style) */}
        <nav
          role="tablist"
          aria-label="Navegação Principal"
          className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-stone-100/80 dark:bg-slate-950 border border-stone-200/50 dark:border-slate-800 shadow-inner shrink-0"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                onClick={() => onTabChange(tab.id as NavTab)}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                className={`h-9 px-3 lg:px-4 rounded-lg text-[13px] lg:text-sm font-semibold flex items-center gap-2 whitespace-nowrap select-none transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-400 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Shortcuts: Backup, ThemeToggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Backup Button */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="h-9 px-3 sm:px-3.5 rounded-lg text-[13px] lg:text-sm font-semibold text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white bg-stone-100/80 dark:bg-slate-950 hover:bg-stone-200/60 dark:hover:bg-slate-800 border border-stone-200/50 dark:border-slate-800 flex items-center gap-2 transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 group"
            title="Importar ou Exportar Dados (.JSON)"
            aria-label="Backup e Sincronização de Dados"
          >
            <Database className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Tactile Pill Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation Tabs (Scrollable Segmented Control with ergonomic 44px h-11 py-2.5 touch targets) */}
      <nav
        role="tablist"
        aria-label="Navegação Móvel"
        className="flex md:hidden overflow-x-auto mt-2 pt-2 border-t border-stone-200/60 dark:border-slate-800 gap-1.5 scrollbar-none [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mob-tab-${tab.id}`}
              role="tab"
              type="button"
              onClick={() => onTabChange(tab.id as NavTab)}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`h-11 py-2.5 px-3.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white bg-stone-100/60 dark:bg-slate-950'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
