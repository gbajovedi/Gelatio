import fs from 'fs';

let content = fs.readFileSync('./src/db/database.ts', 'utf8');
const target = `      // Sincronizar catálogo da Fase 11 (Varredura Final de Pré-preparos Autorais)
      const phase11Setting = await this.settings.get('catalog_sync_phase_11');
      if (!phase11Setting) {
        console.log('Sincronizando pré-preparos autorais e varredura final (Fase 11)...');
        await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
        await this.preparations.bulkPut(initialPreparations as Preparation[]);
        await this.settings.put({ key: 'catalog_sync_phase_11', value: 1 });
      }`;

const addition = `

      // Sincronizar simplificação de categorias de Sorbets e fusão de Gelatos Tradicionais de Leite (Fase 12)
      const phase12Setting = await this.settings.get('catalog_sync_phase_12_sorbets_and_milk');
      if (!phase12Setting) {
        console.log('Sincronizando simplificação de Sorbets Cítricos, Sorbets Polposos e Gelatos de Leite (Fase 12)...');
        const allDbRecipes = await this.recipes.toArray();
        for (const rec of allDbRecipes) {
          let needUpdate = false;
          let newCategory = rec.category;
          let newTargetStyle = rec.targetStyle;

          if (rec.category === 'Gelatos Tradicionais de Leite') {
            newCategory = 'Gelatos de Leite';
            needUpdate = true;
          }
          if (rec.category === 'Sorbets Cítricos / Frutas Ácidas') {
            newCategory = 'Sorbets Cítricos';
            needUpdate = true;
          }
          if (rec.targetStyle === 'Sorbets Cítricos / Frutas Ácidas') {
            newTargetStyle = 'Sorbets Cítricos';
            needUpdate = true;
          }
          if (rec.category === 'Sorbets Polposos / Frutas Densas') {
            newCategory = 'Sorbets Polposos';
            needUpdate = true;
          }
          if (rec.targetStyle === 'Sorbets Polposos / Frutas Densas') {
            newTargetStyle = 'Sorbets Polposos';
            needUpdate = true;
          }

          if (needUpdate) {
            await this.recipes.update(rec.id, {
              category: newCategory,
              targetStyle: newTargetStyle
            });
          }
        }
        await this.settings.put({ key: 'catalog_sync_phase_12_sorbets_and_milk', value: 1 });
      }`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, normalizedTarget + addition);
  fs.writeFileSync('./src/db/database.ts', updated, 'utf8');
  console.log('database.ts atualizado com sucesso!');
} else {
  console.log('Alvo não encontrado');
}
