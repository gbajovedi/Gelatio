import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  ThemeMode,
  getStoredThemeMode,
  saveStoredThemeMode,
  getSystemTheme,
  getClientOS,
  THEME_CHANGE_EVENT
} from '../core/theme';

export const ThemeToggle: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredThemeMode);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme);
  const [clientOS, setClientOS] = useState<string>('Sistema');

  useEffect(() => {
    setClientOS(getClientOS());
    setSystemTheme(getSystemTheme());

    const handleThemeChange = () => {
      setThemeMode(getStoredThemeMode());
      setSystemTheme(getSystemTheme());
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    let mql: MediaQueryList | null = null;
    let listener: (() => void) | null = null;

    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => {
        setSystemTheme(getSystemTheme());
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', listener);
      } else if ((mql as any).addListener) {
        (mql as any).addListener(listener);
      }
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
      if (mql && listener) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', listener);
        } else if ((mql as any).removeListener) {
          (mql as any).removeListener(listener);
        }
      }
    };
  }, []);

  const handleSelectMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveStoredThemeMode(mode);
  };

  const autoTooltip = `Automático: segue o tema do seu sistema (${clientOS}). Atualmente em modo ${
    systemTheme === 'dark' ? 'Escuro' : 'Claro'
  }.`;

  return (
    <div
      className="theme-switch-track flex items-center p-0.5 sm:p-1 rounded-full bg-stone-200/50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 shadow-inner select-none transition-colors shrink-0"
      role="group"
      aria-label="Controle de Tema: Modo Escuro, Automático e Modo Claro"
    >
      {/* 1. Esquerda: Modo Escuro (Ícone de Lua) */}
      <button
        type="button"
        onClick={() => handleSelectMode('dark')}
        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full transition-all flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          themeMode === 'dark'
            ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20 scale-105'
            : 'theme-switch-inactive text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Modo Escuro (Fixo)"
        aria-label="Ativar Modo Escuro"
        aria-pressed={themeMode === 'dark'}
      >
        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      </button>

      {/* 2. Centro: Automático (Apenas texto Auto) */}
      <button
        type="button"
        onClick={() => handleSelectMode('auto')}
        className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          themeMode === 'auto'
            ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20 scale-105'
            : 'theme-switch-inactive text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title={autoTooltip}
        aria-label={autoTooltip}
        aria-pressed={themeMode === 'auto'}
      >
        <span>Auto</span>
      </button>

      {/* 3. Direita: Modo Claro (Ícone de Sol) */}
      <button
        type="button"
        onClick={() => handleSelectMode('light')}
        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full transition-all flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          themeMode === 'light'
            ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20 scale-105'
            : 'theme-switch-inactive text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Modo Claro (Fixo)"
        aria-label="Ativar Modo Claro"
        aria-pressed={themeMode === 'light'}
      >
        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      </button>
    </div>
  );
};
