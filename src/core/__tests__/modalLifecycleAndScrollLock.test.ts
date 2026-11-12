import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  acquireModalLock,
  getActiveModalCount,
  forceUnlockBodyScroll
} from '../useModalDismiss';

// Importação estática via ?raw nativo do Vite para auditoria de conformidade de código
import saveRecipeModalRaw from '../../components/Balanceamento/SaveRecipeModal.tsx?raw';
import styleSettingsModalRaw from '../../components/Balanceamento/StyleSettingsModal.tsx?raw';
import stockAdjustmentModalRaw from '../../components/Estoque/StockAdjustmentModal.tsx?raw';
import importExportModalRaw from '../../components/ImportExport/ImportExportModal.tsx?raw';
import prePreparoViewerModalRaw from '../../components/PrePreparos/PrePreparoViewerModal.tsx?raw';
import anvisaNutritionalModalRaw from '../../components/Receitas/AnvisaNutritionalModal.tsx?raw';
import preparationStepsModalRaw from '../../components/Receitas/PreparationStepsModal.tsx?raw';
import recipeViewerModalRaw from '../../components/Receitas/RecipeViewerModal.tsx?raw';
import variegatoQuickModalRaw from '../../components/Receitas/VariegatoQuickModal.tsx?raw';
import navbarRaw from '../../components/Navbar.tsx?raw';
import balancingRaw from '../../components/Balanceamento/BalancingScreen.tsx?raw';
import comboboxRaw from '../../components/Balanceamento/StyleSearchCombobox.tsx?raw';
import vitrineRaw from '../../components/Balanceamento/VitrineSimulator.tsx?raw';

// Leitura dinâmica segura no runner Node do Vitest compatível com tsconfig sem @types/node
let indexCssContent = '';
try {
  const nodeRequire = eval('require');
  const fsMod = nodeRequire('fs');
  const pathMod = nodeRequire('path');
  const cwd = (globalThis as any).process?.cwd?.() || '.';
  indexCssContent = fsMod.readFileSync(pathMod.resolve(cwd, 'src/index.css'), 'utf-8');
} catch {
  indexCssContent = '';
}

describe('Ciclo de Vida de Modais, Bloqueio de Rolagem e Blindagem Mobile (M1)', () => {
  // Mock de ambiente DOM para execução no runner Node do Vitest
  let bodyProperties: Record<string, string>;
  let htmlProperties: Record<string, string>;

  beforeEach(() => {
    bodyProperties = {};
    htmlProperties = {};

    const createStyleMock = (store: Record<string, string>) => ({
      get overflow() {
        return store['overflow'] ?? '';
      },
      set overflow(val: string) {
        store['overflow'] = val;
      },
      removeProperty: (prop: string) => {
        delete store[prop];
      },
      getPropertyValue: (prop: string) => store[prop] ?? ''
    });

    (globalThis as any).document = {
      body: {
        style: createStyleMock(bodyProperties)
      },
      documentElement: {
        style: createStyleMock(htmlProperties)
      }
    };

    forceUnlockBodyScroll();
  });

  afterEach(() => {
    forceUnlockBodyScroll();
  });

  describe('Pilar 1: Gestão de Scroll Lock e Contagem Universal de Modais', () => {
    it('bloqueia body e documentElement na abertura de um modal e remove incondicionalmente no fechamento', () => {
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
      expect(document.documentElement.style.overflow).toBe('');

      // Abertura do modal
      const release = acquireModalLock();
      expect(getActiveModalCount()).toBe(1);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Fechamento do modal
      release();
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
      expect('overflow' in bodyProperties).toBe(false);
      expect('overflow' in htmlProperties).toBe(false);
    });

    it('gerencia modais aninhados e sucessivos sem restaurar prematuramente a rolagem', () => {
      // Modal A (ex: Ficha Técnica RecipeViewerModal) abre
      const releaseA = acquireModalLock();
      expect(getActiveModalCount()).toBe(1);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Modal B (ex: Modo de Preparo PreparationStepsModal aberto de dentro de A) abre
      const releaseB = acquireModalLock();
      expect(getActiveModalCount()).toBe(2);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Modal B fecha primeiro: Modal A continua aberto, rolagem DEVE permanecer travada
      releaseB();
      expect(getActiveModalCount()).toBe(1);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Modal A fecha: agora a contagem chega a zero e a rolagem é liberada
      releaseA();
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('suporta múltiplos modais fechando fora de ordem sem corromper o estado', () => {
      const release1 = acquireModalLock();
      const release2 = acquireModalLock();
      const release3 = acquireModalLock();
      expect(getActiveModalCount()).toBe(3);

      // Fecha o primeiro aberto
      release1();
      expect(getActiveModalCount()).toBe(2);
      expect(document.body.style.overflow).toBe('hidden');

      // Fecha o terceiro
      release3();
      expect(getActiveModalCount()).toBe(1);
      expect(document.body.style.overflow).toBe('hidden');

      // Fecha o segundo (último restante)
      release2();
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
    });

    it('é idempotente caso a função de liberação seja invocada mais de uma vez', () => {
      const release = acquireModalLock();
      expect(getActiveModalCount()).toBe(1);

      release();
      expect(getActiveModalCount()).toBe(0);

      // Invocação repetida não decrementa para valores negativos
      release();
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
    });

    it('forceUnlockBodyScroll() zera o contador e limpa incondicionalmente qualquer trava residual', () => {
      acquireModalLock();
      acquireModalLock();
      expect(getActiveModalCount()).toBe(2);
      expect(document.body.style.overflow).toBe('hidden');

      // Simular chamada de emergência ao navegar entre abas ou tratar erros
      forceUnlockBodyScroll();
      expect(getActiveModalCount()).toBe(0);
      expect(document.body.style.overflow).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
    });
  });

  describe('Pilar 2: Auditoria Estática de Rules of Hooks em Todos os 9 Modais', () => {
    const allModals = [
      { name: 'RecipeViewerModal', content: recipeViewerModalRaw },
      { name: 'SaveRecipeModal', content: saveRecipeModalRaw },
      { name: 'StockAdjustmentModal', content: stockAdjustmentModalRaw },
      { name: 'PreparationStepsModal', content: preparationStepsModalRaw },
      { name: 'VariegatoQuickModal', content: variegatoQuickModalRaw },
      { name: 'StyleSettingsModal', content: styleSettingsModalRaw },
      { name: 'ImportExportModal', content: importExportModalRaw },
      { name: 'PrePreparoViewerModal', content: prePreparoViewerModalRaw },
      { name: 'AnvisaNutritionalModal', content: anvisaNutritionalModalRaw }
    ];

    it('garante que nenhum modal possua if (!isOpen...) return null antes de useModalDismiss', () => {
      for (const modal of allModals) {
        const useModalIdx = modal.content.indexOf('useModalDismiss');
        expect(useModalIdx, `Modal ${modal.name} deve invocar useModalDismiss`).toBeGreaterThan(-1);

        // Localiza retornos condicionais baseados em isOpen
        const earlyReturnMatch = modal.content.match(/if\s*\(\s*!isOpen[^)]*\)\s*return\s+null\s*;/);
        if (earlyReturnMatch && earlyReturnMatch.index !== undefined) {
          expect(
            useModalIdx,
            `Modal ${modal.name}: useModalDismiss (pos ${useModalIdx}) DEVE ser declarado ANTES de early return condicional (pos ${earlyReturnMatch.index})`
          ).toBeLessThan(earlyReturnMatch.index);
        }
      }
    });

    it('garante que todos os 5 modais críticos possuam todos os hooks antes do retorno condicional', () => {
      const targetModals = [
        { name: 'RecipeViewerModal', content: recipeViewerModalRaw },
        { name: 'SaveRecipeModal', content: saveRecipeModalRaw },
        { name: 'StockAdjustmentModal', content: stockAdjustmentModalRaw },
        { name: 'PreparationStepsModal', content: preparationStepsModalRaw },
        { name: 'VariegatoQuickModal', content: variegatoQuickModalRaw }
      ];

      for (const modal of targetModals) {
        // Encontra a posição do early return condicional de fechamento
        const earlyReturnMatch = modal.content.match(/if\s*\(\s*!isOpen[^)]*\)\s*return\s+null\s*;/);
        expect(earlyReturnMatch, `Modal ${modal.name} deve possuir guarda de fechamento`).not.toBeNull();
        const returnPos = earlyReturnMatch!.index!;

        // Busca chamadas a useState, useEffect, useMemo dentro do componente
        const hookCalls = [...modal.content.matchAll(/\b(useState|useEffect|useMemo|useCallback|useModalDismiss)\s*(?:<[^>]+>)?\s*\(/g)];
        for (const hookCall of hookCalls) {
          expect(
            hookCall.index!,
            `Modal ${modal.name}: hook ${hookCall[0]} na pos ${hookCall.index} NÃO pode ser declarado após return null na pos ${returnPos}`
          ).toBeLessThan(returnPos);
        }
      }
    });

    it('garante que todos os modais mantenham role="dialog" e aria-modal="true"', () => {
      for (const modal of allModals) {
        expect(
          modal.content.includes('role="dialog"') || modal.content.includes("role='dialog'"),
          `Modal ${modal.name} deve conter role="dialog"`
        ).toBe(true);
        expect(
          modal.content.includes('aria-modal="true"') || modal.content.includes("aria-modal='true'"),
          `Modal ${modal.name} deve conter aria-modal="true"`
        ).toBe(true);
      }
    });
  });

  describe('Pilar 3: Auditoria de Usabilidade, Auto-Zoom e Layout Mobile (R2)', () => {
    it('garante prevenção de auto-zoom no iOS Safari com font-size >= 16px em telas <= 768px', () => {
      expect(indexCssContent).toMatch(/@media\s*\(\s*max-width:\s*768px\s*\)/);
      expect(indexCssContent).toMatch(/font-size:\s*16px\s*!important/);
    });

    it('garante que a mini-barra sticky de sinais vitais possui flex-wrap para telas estreitas (360px)', () => {
      expect(balancingRaw).toContain('flex-wrap');
      expect(balancingRaw).toContain('justify-center');
    });

    it('garante que o dropdown de estilos possui largura adaptativa para viewports mobile', () => {
      expect(comboboxRaw).toContain('max-w-[calc(100vw-2rem)]');
    });

    it('garante que os presets de equipamentos em VitrineSimulator usam grid responsivo 2x2 no mobile', () => {
      expect(vitrineRaw).toContain('grid-cols-2');
      expect(vitrineRaw).toContain('sm:grid-cols-4');
    });

    it('garante que a Navbar móvel possui touch targets ergonômicos (h-11)', () => {
      expect(navbarRaw).toContain('h-11');
      expect(navbarRaw).toContain('py-2.5');
    });
  });
});
