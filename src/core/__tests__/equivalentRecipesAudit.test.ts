import { describe, it, expect } from 'vitest';
import recipesData from '../../data/recipes.json';
import { Recipe } from '../../types/gelato';

const nodeRequire = eval('require');
const fs = nodeRequire('fs');
const path = nodeRequire('path');

describe('Equivalent Recipes Comparative Compendium Audit', () => {
  const compendiumPath = path.resolve('Fontes/Markdown/comparativo-receitas-equivalentes-4-fontes.md');
  const mirrorPath = path.resolve('Comparativo_Receitas_Equivalentes.md');

  it('should verify that both markdown compendium files exist and have substantial content', () => {
    expect(fs.existsSync(compendiumPath)).toBe(true);
    expect(fs.existsSync(mirrorPath)).toBe(true);

    const content1 = fs.readFileSync(compendiumPath, 'utf8');
    const content2 = fs.readFileSync(mirrorPath, 'utf8');

    expect(content1.length).toBeGreaterThan(15000);
    expect(content2.length).toBeGreaterThan(15000);
    expect(content1).toEqual(content2);
  });

  it('should verify all 17 clusters are described with tables and verdicts', () => {
    const content = fs.readFileSync(compendiumPath, 'utf8');
    for (let i = 1; i <= 17; i++) {
      expect(content).toContain(`## Grupo ${i}:`);
    }
    expect(content).toContain('🏆 **Veredito Técnico:**');
    expect(content).toContain('### Tabela Comparativa Físico-Química e Bromatológica');
  });

  it('should verify all cited recipe IDs exist in recipes.json', () => {
    const content = fs.readFileSync(compendiumPath, 'utf8');
    const matches = content.matchAll(/\(`(rec_\d+)`\)/g);
    const recipeIds = [...new Set([...matches].map(m => m[1]))];

    expect(recipeIds.length).toBeGreaterThan(20);

    const existingIds = new Set((recipesData as Recipe[]).map(r => r.id));
    for (const id of recipeIds) {
      expect(existingIds.has(id)).toBe(true);
    }
  });

  it('should verify strict anonymization with zero forbidden author names', () => {
    const content = fs.readFileSync(compendiumPath, 'utf8');
    const forbidden = /pennisi|palatrone|morrone|chef famoso|autor do livro/i;
    expect(forbidden.test(content)).toBe(false);
  });

  it('should verify index registration in 00_INDICE_GERAL.md', () => {
    const indexPath = path.resolve('Fontes/Markdown/00_INDICE_GERAL.md');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    expect(indexContent).toContain('comparativo-receitas-equivalentes-4-fontes.md');
  });
});
