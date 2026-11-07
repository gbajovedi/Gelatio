import { describe, it, expect } from 'vitest';

// Importação com sufixo ?raw nativo do Vite (definido em vite/client)
import databaseRaw from '../../db/database.ts?raw';
import appRaw from '../../App.tsx?raw';
import balancingRaw from '../../components/Balanceamento/BalancingScreen.tsx?raw';
import navbarRaw from '../../components/Navbar.tsx?raw';

// Modais da aplicação
import saveRecipeModalRaw from '../../components/Balanceamento/SaveRecipeModal.tsx?raw';
import styleSettingsModalRaw from '../../components/Balanceamento/StyleSettingsModal.tsx?raw';
import stockAdjustmentModalRaw from '../../components/Estoque/StockAdjustmentModal.tsx?raw';
import importExportModalRaw from '../../components/ImportExport/ImportExportModal.tsx?raw';
import prePreparoViewerModalRaw from '../../components/PrePreparos/PrePreparoViewerModal.tsx?raw';
import anvisaNutritionalModalRaw from '../../components/Receitas/AnvisaNutritionalModal.tsx?raw';
import preparationStepsModalRaw from '../../components/Receitas/PreparationStepsModal.tsx?raw';
import recipeViewerModalRaw from '../../components/Receitas/RecipeViewerModal.tsx?raw';
import variegatoQuickModalRaw from '../../components/Receitas/VariegatoQuickModal.tsx?raw';

describe('Blindagem de Dados, Prevenção de Perdas e Acessibilidade (Auditoria)', () => {
  describe('Pilar 1: Integridade e Proteção de Dados (Dexie & Unsaved Changes)', () => {
    it('garante que database.ts NUNCA executa Dexie.delete destrutivo silencioso', () => {
      // Não pode conter auto-delete do banco de dados na inicialização
      expect(databaseRaw).not.toMatch(/await\s+Dexie\.delete\s*\(\s*['"]GelatoBalancerDB['"]\s*\)/);
      expect(databaseRaw).not.toMatch(/Dexie\.delete\s*\(\s*['"]GelatoBalancerDB['"]\s*\)\s*;/);

      // Deve disparar evento de contingência para a interface
      expect(databaseRaw).toContain('gelato_db_open_error');
    });

    it('garante que App.tsx escuta eventos de erro do banco para exibir contingência', () => {
      expect(appRaw).toContain('gelato_db_open_error');
      expect(appRaw).toContain('role="alert"');
    });

    it('garante que BalancingScreen.tsx possui guarda de confirmação para receitas não salvas', () => {
      // Deve ter estado isDirty
      expect(balancingRaw).toContain('isDirty');
      // Deve ter listener de beforeunload
      expect(balancingRaw).toContain('beforeunload');
      // Deve ter confirmação em handleSelectRecipe e handleStartNewRecipe
      expect(balancingRaw).toMatch(/if\s*\(\s*isDirty\s*\)/);
      expect(balancingRaw).toContain('window.confirm');
    });
  });

  describe('Pilar 2: Acessibilidade e Semântica ARIA', () => {
    it('garante que Navbar.tsx implementa role="tablist" e role="tab" com aria-selected', () => {
      expect(navbarRaw).toContain('role="tablist"');
      expect(navbarRaw).toContain('role="tab"');
      expect(navbarRaw).toContain('aria-selected');
      expect(navbarRaw).toContain('aria-controls');
      expect(navbarRaw).toContain('focus-visible:ring-2');
    });

    it('garante que App.tsx implementa role="tabpanel" e aria-labelledby correspondente', () => {
      expect(appRaw).toContain('role="tabpanel"');
      expect(appRaw).toContain('aria-labelledby="tab-');
    });

    it('garante que todos os 9 modais da aplicação possuem role="dialog" e aria-modal="true"', () => {
      const allModals = [
        { name: 'SaveRecipeModal', content: saveRecipeModalRaw },
        { name: 'StyleSettingsModal', content: styleSettingsModalRaw },
        { name: 'StockAdjustmentModal', content: stockAdjustmentModalRaw },
        { name: 'ImportExportModal', content: importExportModalRaw },
        { name: 'PrePreparoViewerModal', content: prePreparoViewerModalRaw },
        { name: 'AnvisaNutritionalModal', content: anvisaNutritionalModalRaw },
        { name: 'PreparationStepsModal', content: preparationStepsModalRaw },
        { name: 'RecipeViewerModal', content: recipeViewerModalRaw },
        { name: 'VariegatoQuickModal', content: variegatoQuickModalRaw }
      ];

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

  describe('Pilar 3: Alvos de Toque e Rolagem Responsiva', () => {
    it('garante alvos de clique ergonômicos e rolagem suave na tabela de balanceamento', () => {
      expect(balancingRaw).toContain('overflow-x-auto');
      expect(balancingRaw).toContain('focus-visible:ring-2');
      expect(balancingRaw).toContain('aria-label=');
    });
  });
});
