import { describe, it, expect } from 'vitest';
import {
  PREPARATION_TEMPLATES,
  suggestPreparationTemplate
} from '../preparationTemplates';
import allRecipes from '../../data/recipes.json';
import { Recipe } from '../../types/gelato';

describe('Refinamento e Calibração Físico-Química dos Modos de Preparo', () => {
  describe('1. Templates Padrão de Preparo (PREPARATION_TEMPLATES)', () => {
    it('deve conter os 14 templates canônicos (7 profissionais e 7 caseiros)', () => {
      expect(PREPARATION_TEMPLATES.length).toBe(14);
      const proTemplates = PREPARATION_TEMPLATES.filter(t => !t.id.includes('caseiro'));
      const homeTemplates = PREPARATION_TEMPLATES.filter(t => t.id.includes('caseiro'));
      expect(proTemplates).toHaveLength(7);
      expect(homeTemplates).toHaveLength(7);
    });

    it('deve calibrar os templates de Sorbets para Neutro Frutta 100% a frio', () => {
      const sorbetPro = PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_sorbet');
      const sorbetHome = PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_caseiro');

      expect(sorbetPro).toBeDefined();
      expect(sorbetHome).toBeDefined();

      expect(sorbetPro!.description).toContain('Neutro Frutta');
      expect(sorbetPro!.description).toContain('100% hidrossolúvel a frio');
      expect(sorbetHome!.description).toContain('Neutro Frutta');
      expect(sorbetHome!.description).toContain('100% hidrossolúvel a frio');

      // Passo de emulsão a frio
      const emulsaoPro = sorbetPro!.steps.find(s => s.category === 'emulsao');
      expect(emulsaoPro!.description).toContain('dispensando calor');
    });

    it('deve calibrar os templates Proteicos com base a 85°C e Whey Off-Heat com serviço a -12°C', () => {
      const proteicPro = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_proteico_profissional');
      const proteicHome = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_proteico');

      expect(proteicPro).toBeDefined();
      expect(proteicHome).toBeDefined();

      // Base sem whey a 85°C
      const heatPro = proteicPro!.steps.find(s => s.category === 'aquecimento');
      expect(heatPro!.temperature).toBe('85°C');
      expect(heatPro!.description).toContain('NÃO deve ir ao calor');

      // Whey off-heat
      const wheyPro = proteicPro!.steps.find(s => s.category === 'emulsao');
      expect(wheyPro!.title).toContain('Off-Heat');
      expect(wheyPro!.temperature).toContain('45°C');

      // Serviço a -12°C
      const vitrinePro = proteicPro!.steps.find(s => s.category === 'abatimento');
      expect(vitrinePro!.temperature).toBe('-12°C');
    });

    it('deve estruturar os novos templates de Chocolate/Cacau com 90°C para cacau e 65°C para chocolate', () => {
      const chocoPro = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_chocolate_cacau_profissional');
      const chocoHome = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_chocolate_cacau_caseiro');

      expect(chocoPro).toBeDefined();
      expect(chocoHome).toBeDefined();

      // Cacau a 90°C
      const heatPro = chocoPro!.steps.find(s => s.category === 'aquecimento');
      expect(heatPro!.temperature).toBe('90°C');
      expect(heatPro!.description).toContain('amidos vegetais');

      // Chocolate a 65°C off-heat
      const chocoStepPro = chocoPro!.steps.find(s => s.title.includes('65°C'));
      expect(chocoStepPro!.temperature).toBe('65°C');
      expect(chocoStepPro!.description).toContain('calor latente');
    });

    it('deve estruturar os novos templates de Crema com Gemas com teto estrito de 80°C a 82°C', () => {
      const cremaPro = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_crema_gemas_profissional');
      const cremaHome = PREPARATION_TEMPLATES.find(t => t.id === 'gelato_crema_gemas_caseiro');

      expect(cremaPro).toBeDefined();
      expect(cremaHome).toBeDefined();

      const heatPro = cremaPro!.steps.find(s => s.title.includes('80°C–82°C'));
      expect(heatPro!.temperature).toContain('80°C a 82°C');
      expect(heatPro!.description).toContain('coagulam');
    });
  });

  describe('2. Auditoria e Calibração Térmica nas 159 Receitas Cadastradas', () => {
    it('deve garantir que 100% das receitas com chocolate em barra/gotas contenham o protocolo de 65°C off-heat', () => {
      const recipes = allRecipes as Recipe[];
      const chocoRecipes = recipes.filter(r =>
        r.ingredients.some(i => i.name.toLowerCase().includes('chocolate'))
      );

      expect(chocoRecipes.length).toBeGreaterThanOrEqual(17);

      for (const rec of chocoRecipes) {
        const stepsTxt = rec.preparationSteps!
          .map(s => `${s.title} ${s.temperature} ${s.description}`.toLowerCase())
          .join(' ');

        expect(
          stepsTxt.includes('65°c') || stepsTxt.includes('65 °c'),
          `Receita ${rec.id} (${rec.name}) com chocolate sem especificação de 65°C`
        ).toBe(true);
      }
    });

    it('deve garantir que 100% das receitas com cacau em pó (sem gemas) contenham a temperatura de 90°C', () => {
      const recipes = allRecipes as Recipe[];
      const cocoaRecipes = recipes.filter(r =>
        r.ingredients.some(i => i.name.toLowerCase().includes('cacau')) &&
        !r.ingredients.some(i => i.name.toLowerCase().includes('gema') || i.name.toLowerCase().includes('ovo'))
      );

      expect(cocoaRecipes.length).toBeGreaterThanOrEqual(20);

      for (const rec of cocoaRecipes) {
        const stepsTxt = rec.preparationSteps!
          .map(s => `${s.title} ${s.temperature} ${s.description}`.toLowerCase())
          .join(' ');

        expect(
          stepsTxt.includes('90°c') || stepsTxt.includes('90 °c'),
          `Receita ${rec.id} (${rec.name}) com cacau sem especificação de 90°C`
        ).toBe(true);
      }
    });

    it('deve garantir que receitas clássicas com gemas de ovo respeitem o limite de 80°C a 82°C', () => {
      const recipes = allRecipes as Recipe[];
      const eggRecipes = recipes.filter(r =>
        r.ingredients.some(i => i.name.toLowerCase().includes('gema') || i.name.toLowerCase().includes('ovo')) &&
        !r.ingredients.some(i => i.name.toLowerCase().includes('ovomaltine'))
      );

      expect(eggRecipes.length).toBeGreaterThanOrEqual(5);

      for (const rec of eggRecipes) {
        const stepsTxt = rec.preparationSteps!
          .map(s => `${s.title} ${s.temperature} ${s.description}`.toLowerCase())
          .join(' ');

        expect(
          stepsTxt.includes('80°c') || stepsTxt.includes('82°c'),
          `Receita ${rec.id} (${rec.name}) com gemas sem limite de 80°C–82°C`
        ).toBe(true);
      }
    });
  });
});
