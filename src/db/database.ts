import Dexie, { type EntityTable } from 'dexie';
import { Ingredient, Recipe, Preparation, StyleStandard } from '../types/gelato';
import { ProductionBatch, StockItem, SaleTransaction, StockAdjustment } from '../types/stock';

import initialIngredients from '../data/ingredients.json';
import initialRecipes from '../data/recipes.json';
import initialStyles from '../data/styles.json';
import initialPreparations from '../data/preparations.json';
import { DEFAULT_PRICING } from '../core/calculator';
import { STORAGE_KEY as PRICING_STORAGE_KEY, PRICING_UPDATED_EVENT } from '../core/pricingStorage';
import { THEME_STORAGE_KEY, THEME_CHANGE_EVENT } from '../core/theme';
import {
  getUserCustomStyles,
  saveUserCustomStyles,
  getActivePresetId,
  saveStoredStyles,
  applyGoldStandardPreset,
  STYLES_UPDATED_EVENT,
  USER_CUSTOM_STYLES_KEY,
  STYLES_STORAGE_KEY,
  getStoredStyles
} from '../core/stylesStorage';

export interface AppSetting {
  key: string;
  value: any;
}

export const BRAND_NAME_REPLACEMENTS: Record<string, string> = {
  'Neutro Fabbri': 'Neutro',
  'Creme De Leite UHT 17% - Piracanjuba': 'Creme De Leite UHT 17%',
  'Pasta Baunilha - Vanilla Brasil': 'Pasta de Baunilha',
  'Leite de Coco Sococo': 'Leite de Coco Tradicional (20% gordura)',
  'Leite de coco em pó - IO': 'Leite de Coco em Pó',
  'Doce de leite Rocca': 'Doce de Leite Artesanal (Sem Amido)',
  'Xylitol': 'Xilitol'
};

export const RESTORED_BRAND_NAMES: Record<string, { newName: string; newCategory?: string }> = {
  'Base DPO 165 Premium': { newName: 'DPO 165 Premium - Aroma Italia', newCategory: 'Bases & Pré-preparos' },
  'IMO 900 + Taumatina': { newName: 'IMO 900 + Taumatina (moonsugar)', newCategory: 'Açúcares' },
  'Achocolatado em Pó': { newName: 'Nesquik / Ovomaltine', newCategory: 'Confeitaria & Inclusões' },
  'Creme de Avelã com Cacau': { newName: 'Nutella', newCategory: 'Pastas & Oleaginosas' },
  'Variegato de Creme de Avelã com Cacau': { newName: 'Variegato de Nutella', newCategory: 'Variegatos & Recheios' },
  'Cereal de Milho Açucarado': { newName: 'Sucrilhos', newCategory: 'Confeitaria & Inclusões' },
  'Xarope de Açúcar Saborizado': { newName: 'Xarope (monin)', newCategory: 'Açúcares' },
  'Biscoito Speculoos (Caramelizado)': { newName: 'Biscoff', newCategory: 'Confeitaria & Inclusões' },
  'Licor de Creme Irlandês (Irish Cream)': { newName: "Licor Bailey's", newCategory: 'Álcoois & Bebidas' },
  'Licor Triple Sec (Laranja)': { newName: 'Cointreau', newCategory: 'Álcoois & Bebidas' }
};

export const SUGAR_NAME_REPLACEMENTS: Record<string, string> = {
  'Açúcar Sacarose': 'Açúcar',
  'Açúcar - Dextrose': 'Dextrose',
  'Açúcar - Frutose': 'Frutose',
  'Açúcar - Glucose em pó': 'Glucose em pó',
  'Açúcar - Glucose em pó (28-30 DE)': 'Glucose em pó (28-30 DE)',
  'Açúcar - Glucose Líquida': 'Glucose Líquida',
  'Açúcar - Lactose': 'Lactose',
  'Açúcar - Maltodextrina': 'Maltodextrina',
  'Açúcar – Dextrose': 'Dextrose',
  'Açúcar – Frutose': 'Frutose',
  'Açúcar – Glucose em pó': 'Glucose em pó',
  'Açúcar – Glucose em pó (28-30 DE)': 'Glucose em pó (28-30 DE)',
  'Açúcar – Glucose Líquida': 'Glucose Líquida',
  'Açúcar – Lactose': 'Lactose',
  'Açúcar – Maltodextrina': 'Maltodextrina'
};

export const CANONICAL_NAME_REPLACEMENTS: Record<string, string> = {
  'Limão Suco': 'Suco de Limão',
  'Suco De Limão': 'Suco de Limão',
  'Polpa de Açai(10-14%)': 'Polpa de Açaí (10-14% Sólidos)',
  'Açaí (Polpa Média 12-14% Sólidos)': 'Polpa de Açaí (10-14% Sólidos)',
  'Mexerica': 'Tangerina / Mexerica',
  'Tangerina': 'Tangerina / Mexerica',
  'Laranja Suco': 'Suco de Laranja',
  'Açúcar de maçã(66% açúcar)': 'Açúcar de Maçã (66% açúcar)',
  'Pasta De Nozes 100%': 'Pasta de Nozes 100%',
  'Pasta De Castanha De Caju 100%': 'Pasta de Castanha de Caju 100%'
};

export const DUPLICATE_IDS_TO_REMOVE = ['ing_111', 'ing_215', 'ing_216', 'ing_197'];

export interface BackupResult {
  recipesCount: number;
  ingredientsCount: number;
  preparationsCount?: number;
  stockItemsCount?: number;
  batchesCount?: number;
  salesCount?: number;
  pricingImported: boolean;
  themeImported: boolean;
  customStylesImported: boolean;
  stockImported?: boolean;
}

export class GelatoDatabase extends Dexie {
  ingredients!: EntityTable<Ingredient, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  preparations!: EntityTable<Preparation, 'id'>;
  settings!: EntityTable<AppSetting, 'key'>;
  productionBatches!: EntityTable<ProductionBatch, 'id'>;
  stockItems!: EntityTable<StockItem, 'id'>;
  salesTransactions!: EntityTable<SaleTransaction, 'id'>;
  stockAdjustments!: EntityTable<StockAdjustment, 'id'>;

  constructor() {
    super('GelatoBalancerDB');

    // Versão 1: Esquema original
    this.version(1).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'name, category',
      settings: 'key'
    });

    // Versão 2: Deleta a tabela antiga preparations cujo primary key era 'name'
    // No IndexedDB, mudar a primary key exige deletar a tabela antes de recriá-la
    this.version(2).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: null,
      settings: 'key'
    });

    // Versão 3: Recria a tabela preparations com primary key 'id'
    this.version(3).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        for (const p of initialPreparations) {
          await tx.table('preparations').put(p);
        }
      } catch (e) {
        console.warn('Migration to v3 preparations:', e);
      }
    });

    // Versão 4: Atualização taxonômica das categorias dos 190 insumos
    this.version(4).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const initialMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i.category]));
        const currentIngs = await tx.table('ingredients').toArray();
        for (const ing of currentIngs) {
          const newCat = initialMap.get(ing.id);
          if (newCat && newCat !== ing.category) {
            await tx.table('ingredients').update(ing.id, { category: newCat });
          }
        }
      } catch (e) {
        console.warn('Migration to v4 ingredient categories:', e);
      }
    });

    // Versão 5: Adição de 22 insumos técnicos e refinamentos de parâmetros físico-químicos
    this.version(5).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const currentIds = new Set((await tx.table('ingredients').toArray()).map(i => i.id));
        const newCatalogIngs = (initialIngredients as Ingredient[]).filter(i => !currentIds.has(i.id));
        if (newCatalogIngs.length > 0) {
          await tx.table('ingredients').bulkPut(newCatalogIngs);
        }
      } catch (e) {
        console.warn('Migration to v5 ingredients:', e);
      }
    });

    // Versão 6: Remoção de marcas comerciais dos nomes de insumos, receitas e pré-preparos
    this.version(6).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          if (BRAND_NAME_REPLACEMENTS[ing.name]) {
            await tx.table('ingredients').update(ing.id, { name: BRAND_NAME_REPLACEMENTS[ing.name] });
          }
        }
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (BRAND_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (BRAND_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: BRAND_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (BRAND_NAME_REPLACEMENTS[prep.name]) {
            newName = BRAND_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (BRAND_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v6 brand name cleaning:', e);
      }
    });

    // Versão 7: Eliminação de duplicatas de insumos e calibração físico-química canônica
    this.version(7).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        // Remover duplicatas
        for (const dupId of DUPLICATE_IDS_TO_REMOVE) {
          await tx.table('ingredients').delete(dupId);
        }

        // Sincronizar calibração físico-química preservando custo customizado
        const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          const cat = catalogMap.get(ing.id);
          if (cat && !ing.isCustom) {
            await tx.table('ingredients').update(ing.id, {
              name: cat.name,
              category: cat.category,
              fat: cat.fat,
              sugars: cat.sugars,
              msnf: cat.msnf,
              otherSolids: cat.otherSolids,
              totalSolids: cat.totalSolids,
              water: cat.water,
              pod: cat.pod,
              pac: cat.pac,
              protein: cat.protein
            });
          }
        }

        // Atualizar nomes em receitas
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: CANONICAL_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }

        // Atualizar nomes em pré-preparos
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (CANONICAL_NAME_REPLACEMENTS[prep.name]) {
            newName = CANONICAL_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v7 ingredient audit:', e);
      }
    });

    // Versão 8: Estilo Gelatos de Oleaginosas e parâmetros clássicos de balanceamento
    this.version(8).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const nutRecipeIds = ['rec_19', 'rec_27', 'rec_31', 'rec_32', 'rec_44', 'rec_58'];
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (nutRecipeIds.includes(rec.id) && !rec.isCustom) {
            await tx.table('recipes').update(rec.id, {
              category: 'Gelatos de Oleaginosas',
              targetStyle: 'Gelatos de Oleaginosas'
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v8 nut styles:', e);
      }
    });

    // Versão 9: Subdivisão de Sorbets (Cítricos / Ácidos vs. Polposos / Densos)
    this.version(9).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const citricosIds = ['rec_73', 'rec_74', 'rec_78', 'rec_81', 'rec_82', 'rec_83', 'rec_87', 'rec_88', 'rec_89', 'rec_93', 'rec_95'];
        const polpososIds = ['rec_71', 'rec_72', 'rec_75', 'rec_76', 'rec_77', 'rec_79', 'rec_80', 'rec_84', 'rec_85', 'rec_86', 'rec_90', 'rec_91', 'rec_92', 'rec_94', 'rec_96'];
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (!rec.isCustom) {
            if (citricosIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Cítricos / Frutas Ácidas',
                targetStyle: 'Sorbets Cítricos / Frutas Ácidas'
              });
            } else if (polpososIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Polposos / Frutas Densas',
                targetStyle: 'Sorbets Polposos / Frutas Densas'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Migration to v9 sorbet styles:', e);
      }
    });

    // Versão 10: Restauração de marcas originais selecionadas
    this.version(10).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const ings = await tx.table('ingredients').toArray();
        for (const ing of ings) {
          if (RESTORED_BRAND_NAMES[ing.name]) {
            const r = RESTORED_BRAND_NAMES[ing.name];
            await tx.table('ingredients').update(ing.id, {
              name: r.newName,
              ...(r.newCategory ? { category: r.newCategory } : {})
            });
          }
        }
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map((item: any) => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (RESTORED_BRAND_NAMES[v.name]) {
              dirty = true;
              return { ...v, name: RESTORED_BRAND_NAMES[v.name].newName };
            }
            return v;
          });
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const preps = await tx.table('preparations').toArray();
        for (const prep of preps) {
          let dirty = false;
          let newName = prep.name;
          if (RESTORED_BRAND_NAMES[prep.name]) {
            newName = RESTORED_BRAND_NAMES[prep.name].newName;
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          if (dirty) {
            await tx.table('preparations').update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v10 brand restoration:', e);
      }
    });

    // Versão 11: Reclassificação taxonômica de receitas e calibração físico-química de Whey Protein e Queijos
    this.version(11).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const milkChocIds = ['rec_3', 'rec_12', 'rec_17', 'rec_18', 'rec_28', 'rec_39', 'rec_40', 'rec_41', 'rec_59'];
        const waterChocIds = ['rec_97', 'rec_98', 'rec_99'];
        const sorbetAlcIds = ['rec_110', 'rec_117', 'rec_118', 'rec_119'];
        const sorbetZeroIds = [
          'rec_131', 'rec_132', 'rec_133', 'rec_134', 'rec_135', 'rec_136', 'rec_137',
          'rec_138', 'rec_139', 'rec_140', 'rec_141', 'rec_142', 'rec_144', 'rec_145',
          'rec_164', 'rec_165'
        ];

        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (!rec.isCustom) {
            if (milkChocIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Gelatos de Leite com Chocolate',
                targetStyle: 'Gelatos de Leite com Chocolate'
              });
            } else if (waterChocIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets de Chocolate',
                targetStyle: 'Sorbets de Chocolate'
              });
            } else if (sorbetAlcIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Alcoólicos',
                targetStyle: 'Sorbets Alcoólicos'
              });
            } else if (sorbetZeroIds.includes(rec.id)) {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets Zero',
                targetStyle: 'Sorbets Zero'
              });
            }
          }
        }

        const whey = await tx.table('ingredients').get('ing_166');
        if (whey && !whey.isCustom) {
          await tx.table('ingredients').update('ing_166', {
            msnf: 0.04,
            otherSolids: 0.8667
          });
        }

        // Atualizar queijos maturados: caseína em Outros Sólidos e SLNG zerado (ausência de lactose)
        const parmesao = await tx.table('ingredients').get('ing_135');
        if (parmesao && !parmesao.isCustom) {
          await tx.table('ingredients').update('ing_135', { msnf: 0, otherSolids: 0.38 });
        }
        const gorgonzola = await tx.table('ingredients').get('ing_174');
        if (gorgonzola && !gorgonzola.isCustom) {
          await tx.table('ingredients').update('ing_174', { msnf: 0, otherSolids: 0.23 });
        }
        const brie = await tx.table('ingredients').get('ing_175');
        if (brie && !brie.isCustom) {
          await tx.table('ingredients').update('ing_175', { msnf: 0, otherSolids: 0.2 });
        }
      } catch (e) {
        console.warn('Migration to v11 styles reclassification:', e);
      }
    });

    // Versão 12: Nomenclatura refinada para chocolates (Sorbets de Chocolate e Gelatos de Leite com Chocolate)
    this.version(12).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const milkChocIds = ['rec_3', 'rec_12', 'rec_17', 'rec_18', 'rec_28', 'rec_39', 'rec_40', 'rec_41', 'rec_59'];
        const waterChocIds = ['rec_97', 'rec_98', 'rec_99'];
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          if (!rec.isCustom) {
            if (milkChocIds.includes(rec.id) || rec.category === 'Gelatos de Chocolate com Leite') {
              await tx.table('recipes').update(rec.id, {
                category: 'Gelatos de Leite com Chocolate',
                targetStyle: 'Gelatos de Leite com Chocolate'
              });
            } else if (waterChocIds.includes(rec.id) || rec.category === 'Chocolate base água') {
              await tx.table('recipes').update(rec.id, {
                category: 'Sorbets de Chocolate',
                targetStyle: 'Sorbets de Chocolate'
              });
            }
          }
        }
        // Atualizar polióis (alocar como Outros Sólidos e zerar açúcares simples)
        const polyolIds = ['ing_64', 'ing_113', 'ing_168', 'ing_198', 'ing_199'];
        for (const id of polyolIds) {
          const ing = await tx.table('ingredients').get(id);
          if (ing && !ing.isCustom) {
            await tx.table('ingredients').update(id, {
              sugars: 0,
              otherSolids: id === 'ing_199' ? 0.98 : 1
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v12 chocolate naming & polyols:', e);
      }
    });

    // Versão 13: Rebalanceamento anti-arenosidade de 6 receitas Zero (substituição de leite em pó por leite integral líquido)
    this.version(13).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const targetIds = ['rec_121', 'rec_122', 'rec_123', 'rec_126', 'rec_160', 'rec_161'];
        const targetMap = new Map((initialRecipes as Recipe[]).filter(r => targetIds.includes(r.id)).map(r => [r.id, r]));
        for (const id of targetIds) {
          const updated = targetMap.get(id);
          if (updated) {
            const existing = await tx.table('recipes').get(id);
            if (existing && !existing.isCustom) {
              await tx.table('recipes').update(id, { ingredients: updated.ingredients });
            }
          }
        }
      } catch (e) {
        console.warn('Migration to v13 zero recipes rebalancing:', e);
      }
    });

    // Versão 14: Migração dos 6 gelatos veganos da categoria Zero para a categoria Vegano
    this.version(14).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const veganZeroIds = ['rec_154', 'rec_155', 'rec_158', 'rec_159', 'rec_162', 'rec_163'];
        for (const id of veganZeroIds) {
          const existing = await tx.table('recipes').get(id);
          if (existing && !existing.isCustom) {
            await tx.table('recipes').update(id, {
              category: 'Vegano',
              targetStyle: 'Zero'
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v14 vegan recipes category:', e);
      }
    });

    // Versão 15: Remoção do Mix Zero e das 22 receitas associadas
    this.version(15).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const mixZeroRecipeIds = [
          'rec_120', 'rec_121', 'rec_122', 'rec_123', 'rec_124', 'rec_125', 'rec_126', 'rec_127', 'rec_128', 'rec_129', 'rec_130',
          'rec_131', 'rec_132', 'rec_133', 'rec_134', 'rec_135', 'rec_136', 'rec_137', 'rec_138', 'rec_139', 'rec_140', 'rec_141'
        ];
        for (const id of mixZeroRecipeIds) {
          const r = await tx.table('recipes').get(id);
          if (r && !r.isCustom) {
            await tx.table('recipes').delete(id);
          }
        }
        const ing = await tx.table('ingredients').get('ing_169');
        if (ing && !ing.isCustom) {
          await tx.table('ingredients').delete('ing_169');
        }
        const prep = await tx.table('preparations').get('prep_mix_zero');
        if (prep && !prep.isCustom) {
          await tx.table('preparations').delete('prep_mix_zero');
        }
      } catch (e) {
        console.warn('Migration to v15 delete mix zero:', e);
      }
    });

    // Versão 16: Renomeação dos estilos e categorias Zero -> Gelatos Zero Açúcar e Sorbets Zero -> Sorbets Zero Açúcar
    this.version(16).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const recs = await tx.table('recipes').toArray();
        for (const rec of recs) {
          let dirty = false;
          let newCategory = rec.category;
          let newTargetStyle = rec.targetStyle;
          if (rec.category === 'Zero') {
            newCategory = 'Gelatos Zero Açúcar';
            dirty = true;
          } else if (rec.category === 'Sorbets Zero') {
            newCategory = 'Sorbets Zero Açúcar';
            dirty = true;
          }
          if (rec.targetStyle === 'Zero') {
            newTargetStyle = 'Gelatos Zero Açúcar';
            dirty = true;
          } else if (rec.targetStyle === 'Sorbets Zero') {
            newTargetStyle = 'Sorbets Zero Açúcar';
            dirty = true;
          }
          if (dirty) {
            await tx.table('recipes').update(rec.id, {
              category: newCategory,
              targetStyle: newTargetStyle
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v16 rename zero styles:', e);
      }
    });

    // Versão 17: Reclassificação taxonômica de 6 receitas (Proteico, Chocolate com Leite e Oleaginosas)
    this.version(17).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const reclassifications: Record<string, { category: string; targetStyle: string }> = {
          'rec_29': { category: 'Gelatos Proteicos', targetStyle: 'Gelatos Proteicos' },
          'rec_37': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
          'rec_51': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
          'rec_55': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
          'rec_56': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
          'rec_47': { category: 'Gelatos de Oleaginosas', targetStyle: 'Gelatos de Oleaginosas' }
        };
        for (const [id, target] of Object.entries(reclassifications)) {
          const rec = await tx.table('recipes').get(id);
          if (rec && !rec.isCustom) {
            await tx.table('recipes').update(id, {
              category: target.category,
              targetStyle: target.targetStyle
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v17 recipe reclassifications:', e);
      }
    });

    // Versão 18: Separação de Nesquik / Ovomaltine em dois insumos independentes
    this.version(18).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const nesquikIng = (initialIngredients as Ingredient[]).find(i => i.name === 'Nesquik');
        const ovomaltineIng = (initialIngredients as Ingredient[]).find(i => i.name === 'Ovomaltine');
        if (nesquikIng) await tx.table('ingredients').put(nesquikIng);
        if (ovomaltineIng) await tx.table('ingredients').put(ovomaltineIng);

        // Atualizar rec_8 para Nesquik
        const r8 = await tx.table('recipes').get('rec_8');
        if (r8 && !r8.isCustom) {
          const updated = r8.ingredients.map((it: any) =>
            it.name === 'Nesquik / Ovomaltine' ? { ...it, name: 'Nesquik' } : it
          );
          await tx.table('recipes').update('rec_8', { ingredients: updated });
        }

        // Atualizar rec_51 para Ovomaltine
        const r51 = await tx.table('recipes').get('rec_51');
        if (r51 && !r51.isCustom) {
          const updated = r51.ingredients.map((it: any) =>
            it.name === 'Nesquik / Ovomaltine' ? { ...it, name: 'Ovomaltine' } : it
          );
          await tx.table('recipes').update('rec_51', { ingredients: updated });
        }
      } catch (e) {
        console.warn('Migration to v18 nesquik/ovomaltine split:', e);
      }
    });

    // Versão 19: Renomeação dos estilos 'Vegano' -> 'Gelatos Veganos' e 'Alcoólicos' -> 'Gelatos Alcoólicos'
    this.version(19).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        await tx.table('recipes').toCollection().modify((recipe: any) => {
          if (recipe.category === 'Vegano') recipe.category = 'Gelatos Veganos';
          if (recipe.targetStyle === 'Vegano') recipe.targetStyle = 'Gelatos Veganos';
          if (recipe.category === 'Alcoólicos') recipe.category = 'Gelatos Alcoólicos';
          if (recipe.targetStyle === 'Alcoólicos') recipe.targetStyle = 'Gelatos Alcoólicos';
        });
      } catch (e) {
        console.warn('Migration to v19 style rename:', e);
      }
    });

    // Versão 20: Padronização de nomes de receitas com prefixo 'Gelato' ou 'Sorbet'
    this.version(20).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const recipeNameMap: Record<string, string> = {
          'rec_1': 'Gelato Fior di Latte (Direto ao Ponto)',
          'rec_2': 'Gelato de Café Bianco Flocado (Direto ao Ponto)',
          'rec_3': 'Gelato de Chocolate com Gostosuras (Direto ao Ponto)',
          'rec_4': 'Gelato de Crema (Direto ao Ponto)',
          'rec_5': 'Gelato Crema di Santa Fina (Direto ao Ponto)',
          'rec_6': 'Gelato de Baunilha com Mascavo (Direto ao Ponto)',
          'rec_7': 'Gelato de Doce de Leite (Direto ao Ponto)',
          'rec_8': 'Gelato de Nesquik (Direto ao Ponto)',
          'rec_9': 'Gelato de Cream Cheese (Direto ao Ponto)',
          'rec_10': 'Gelato de Parmesão (Direto ao Ponto)',
          'rec_11': 'Gelato de Gorgonzola (Direto ao Ponto)',
          'rec_12': 'Gelato de Chocolate Branco Assado com Missô (Direto ao Ponto)',
          'rec_13': 'Gelato de Iogurte (Direto ao Ponto)',
          'rec_14': 'Gelato de Milho (Direto ao Ponto)',
          'rec_15': 'Gelato de Coco Fresco (Direto ao Ponto)',
          'rec_16': 'Gelato de Sucrilhos (Direto ao Ponto)',
          'rec_17': 'Gelato Intenso de Cacau (Direto ao Ponto)',
          'rec_18': 'Gelato de Chocolate 70% (Direto ao Ponto)',
          'rec_19': 'Gelato de Pistache - Base Oleaginosas (Direto ao Ponto)',
          'rec_57': 'Gelato Soft - Calda Base de Leite (Addolcire)',
          'rec_58': 'Gelato Soft de Pistache (Addolcire)',
          'rec_59': 'Gelato Soft de Chocolate (Addolcire)',
          'rec_61': 'Gelato de Mousse de Maracujá (Direto ao Ponto)',
          'rec_62': 'Gelato de Banana Assada (Direto ao Ponto)',
          'rec_63': 'Gelato de Morango / Fragola (Direto ao Ponto)',
          'rec_106': 'Gelato Calda Base Vegana de Aveia (Addolcire)',
          'rec_146': 'Gelato Fior di Latte 17% - Polióis (Sem Açúcar)',
          'rec_147': 'Gelato Fior di Latte 17% - Menos Polióis (Sem Açúcar)',
          'rec_148': 'Gelato de Chocolate 17% - Polióis (Sem Açúcar)',
          'rec_149': 'Gelato de Chocolate 17% - Redução Polióis (Sem Açúcar)',
          'rec_150': 'Gelato de Fragola / Morango ao Leite - Polióis (Sem Açúcar)',
          'rec_151': 'Gelato de Fragola / Morango ao Leite - Redução Polióis (Sem Açúcar)'
        };

        for (const [id, newName] of Object.entries(recipeNameMap)) {
          const existing = await tx.table('recipes').get(id);
          if (existing && !existing.isCustom) {
            await tx.table('recipes').update(id, { name: newName });
          }
        }
      } catch (e) {
        console.warn('Migration to v20 recipe names standardization:', e);
      }
    });
    // Versão 21: Remoção de 3 bases genéricas e renomeação de Pistache e Sorbet de Chocolate
    this.version(21).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const idsToDelete = ['rec_20', 'rec_106', 'rec_57'];
        for (const id of idsToDelete) {
          await tx.table('recipes').delete(id);
        }
        const r19 = (initialRecipes as Recipe[]).find(r => r.id === 'rec_19');
        if (r19) {
          await tx.table('recipes').put(r19);
        }
        const r99 = await tx.table('recipes').get('rec_99');
        if (r99 && !r99.isCustom) {
          await tx.table('recipes').update('rec_99', { name: 'Sorbet de Chocolate (Direto ao Ponto)' });
        }
      } catch (e) {
        console.warn('Migration to v21 bases removal and recipe renames:', e);
      }
    });
    // Versão 22: Remoção dos Gelatos Soft da Addolcire restantes (rec_58, rec_59)
    this.version(22).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const idsToDelete = ['rec_58', 'rec_59'];
        for (const id of idsToDelete) {
          await tx.table('recipes').delete(id);
        }
      } catch (e) {
        console.warn('Migration to v22 soft gelatos removal:', e);
      }
    });
    // Versão 23: Simplificação e padronização dos nomes das receitas (39 receitas)
    this.version(23).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const recipeNameUpdates: Record<string, string> = {
          'rec_63': 'Gelato de Morango (Direto ao Ponto)',
          'rec_84': 'Sorbet de Atemoia (Addolcire)',
          'rec_109': 'Gelato de Licor Amaretto (Direto ao Ponto)',
          'rec_142': 'Sorbet de Morango e Manjericão (Addolcire)',
          'rec_143': 'Gelato de Coco com Cumaru (Addolcire)',
          'rec_144': 'Sorbet de Framboesa - Polióis',
          'rec_145': 'Sorbet de Framboesa - Redução de Polióis',
          'rec_146': 'Gelato Fior di Latte 17% - Polióis',
          'rec_147': 'Gelato Fior di Latte 17% - Redução de Polióis',
          'rec_148': 'Gelato de Chocolate 17% - Polióis',
          'rec_149': 'Gelato de Chocolate 17% - Redução de Polióis',
          'rec_150': 'Gelato de Morango ao Leite - Polióis',
          'rec_151': 'Gelato de Morango ao Leite - Redução de Polióis',
          'rec_152': 'Gelato de Coco - Polióis',
          'rec_153': 'Gelato de Coco - Redução de Polióis',
          'rec_154': 'Gelato de Coco Vegano - Polióis',
          'rec_155': 'Gelato de Coco Vegano - Redução de Polióis',
          'rec_156': 'Gelato de Pistache - Polióis',
          'rec_157': 'Gelato de Pistache - Redução de Polióis',
          'rec_158': 'Gelato de Pistache Vegano - Polióis',
          'rec_159': 'Gelato de Pistache Vegano - Redução de Polióis',
          'rec_160': 'Gelato de Iogurte - Polióis',
          'rec_161': 'Gelato de Iogurte - Redução de Polióis',
          'rec_162': 'Gelato Intenso de Cacau com Laranja Vegano - Polióis',
          'rec_163': 'Gelato Intenso de Cacau com Laranja Vegano - Redução de Polióis',
          'rec_164': 'Sorbet de Manga - Polióis',
          'rec_165': 'Sorbet de Manga - Redução de Polióis',
          'rec_166': 'Gelato de Baunilha Proteico',
          'rec_167': 'Gelato de Baunilha Proteico Zero Açúcar',
          'rec_168': 'Gelato de Baunilha Proteico Redução de Polióis',
          'rec_169': 'Gelato de Chocolate Proteico',
          'rec_170': 'Gelato de Chocolate Proteico Zero Açúcar',
          'rec_171': 'Gelato de Chocolate Proteico Redução de Polióis',
          'rec_172': 'Gelato de Pistache Proteico',
          'rec_173': 'Gelato de Pistache Proteico Zero Açúcar',
          'rec_174': 'Gelato de Pistache Proteico Redução de Polióis',
          'rec_175': 'Gelato de Banana Proteico',
          'rec_176': 'Gelato de Banana Proteico Zero Açúcar',
          'rec_177': 'Gelato de Banana Proteico Redução de Polióis'
        };

        for (const [id, newName] of Object.entries(recipeNameUpdates)) {
          const rec = await tx.table('recipes').get(id);
          if (rec && !rec.isCustom) {
            await tx.table('recipes').update(id, { name: newName });
          }
        }
      } catch (e) {
        console.warn('Migration to v23 recipe name simplification:', e);
      }
    });

    // Versão 24: Simplificação dos nomes de açúcares (Açúcar Sacarose -> Açúcar, Açúcar - * -> *)
    this.version(24).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key'
    }).upgrade(async tx => {
      try {
        const ingTable = tx.table('ingredients');
        const recTable = tx.table('recipes');
        const prepTable = tx.table('preparations');

        const allIngs = await ingTable.toArray();
        for (const ing of allIngs) {
          if (SUGAR_NAME_REPLACEMENTS[ing.name]) {
            await ingTable.update(ing.id, { name: SUGAR_NAME_REPLACEMENTS[ing.name] });
          }
        }

        const allRecs = await recTable.toArray();
        for (const rec of allRecs) {
          let dirty = false;
          const updatedItems = rec.ingredients?.map((item: any) => {
            if (SUGAR_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: SUGAR_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map((v: any) => {
            if (SUGAR_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: SUGAR_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await recTable.update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }

        const allPreps = await prepTable.toArray();
        for (const prep of allPreps) {
          let dirty = false;
          let newName = prep.name;
          if (SUGAR_NAME_REPLACEMENTS[prep.name]) {
            newName = SUGAR_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map((item: any) => {
            if (SUGAR_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: SUGAR_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await prepTable.update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
      } catch (e) {
        console.warn('Migration to v24 sugar names simplification:', e);
      }
    });

    // Versão 25: Criação formal das tabelas de gestão de Estoque, Lotes de Produção, Vendas e Ajustes
    this.version(25).stores({
      ingredients: 'id, name, category, costKg',
      recipes: 'id, name, category, targetStyle, isCustom',
      preparations: 'id, name, category, isCustom',
      settings: 'key',
      productionBatches: 'id, recipeId, category, producedAt',
      stockItems: 'id, recipeId, category, currentUnits',
      salesTransactions: 'id, stockItemId, recipeId, timestamp, paymentMethod',
      stockAdjustments: 'id, stockItemId, recipeId, timestamp, type'
    });

  }

  async initializeSeedData(): Promise<void> {
    try {
      await this.open();
    } catch (openErr) {
      console.error('Falha de conexão com IndexedDB ao inicializar GelatoBalancerDB:', openErr);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gelato_db_open_error', { detail: openErr }));
      }
      // NUNCA executar Dexie.delete automático: preserva intactos os dados, receitas customizadas
      // e configurações existentes do usuário para recuperação manual ou exportação de emergência.
      throw openErr;
    }

    try {
      // 1. Insumos
      const ingCount = await this.ingredients.count();
      if (ingCount === 0) {
        console.log('Populando insumos iniciais...');
        await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
      } else {
        // Sincronizar categorias atualizadas para insumos do catálogo inicial sem perder custo customizado
        const catSyncSetting = await this.settings.get('ingredient_categories_version');
        if (!catSyncSetting || catSyncSetting.value < 2) {
          console.log('Sincronizando novas categorias de insumos no banco...');
          const initialMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i.category]));
          const allCurrentIngs = await this.ingredients.toArray();
          for (const ing of allCurrentIngs) {
            const newCat = initialMap.get(ing.id);
            if (newCat && newCat !== ing.category) {
              await this.ingredients.update(ing.id, { category: newCat });
            }
          }
          await this.settings.put({ key: 'ingredient_categories_version', value: 2 });
        }

        // Inserir novos insumos do catálogo técnico ausentes no banco do usuário
        const existingIds = new Set((await this.ingredients.toArray()).map(i => i.id));
        const newCatalogIngs = (initialIngredients as Ingredient[]).filter(i => !existingIds.has(i.id));
        if (newCatalogIngs.length > 0) {
          console.log(`Adicionando ${newCatalogIngs.length} novos insumos técnicos ao banco...`);
          await this.ingredients.bulkPut(newCatalogIngs);
        }

        // Sincronizar refinamentos técnicos de POD/PAC/SLNG/Açúcares/Gordura/Proteína/Densidade (Padrão Brasileiro v7)
        const paramSyncSetting = await this.settings.get('ingredient_technical_params_version');
        if (!paramSyncSetting || paramSyncSetting.value < 7) {
          console.log('Atualizando refinamentos técnicos (Padrão Brasileiro v7) em insumos do catálogo...');
          const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            const catItem = catalogMap.get(ing.id);
            if (catItem && !ing.isCustom) {
              await this.ingredients.update(ing.id, {
                name: catItem.name,
                category: catItem.category,
                fat: catItem.fat,
                pac: catItem.pac,
                pod: catItem.pod,
                sugars: catItem.sugars,
                msnf: catItem.msnf,
                otherSolids: catItem.otherSolids,
                totalSolids: catItem.totalSolids,
                water: catItem.water,
                protein: catItem.protein,
                ...(catItem.density !== undefined ? { density: catItem.density } : {}),
                preparationId: catItem.preparationId,
                hasAllergen: catItem.hasAllergen,
                ...(catItem.allergenDetails ? { allergenDetails: catItem.allergenDetails } : {})
              });
            }
          }
          await this.settings.put({ key: 'ingredient_technical_params_version', value: 7 });
        }

        // Sincronizar limpeza de nomes de marcas em bancos existentes
        const cleanNamesSetting = await this.settings.get('ingredient_clean_names_version');
        if (!cleanNamesSetting || cleanNamesSetting.value < 1) {
          console.log('Sincronizando limpeza de marcas nos nomes de insumos, receitas e pré-preparos...');
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            if (BRAND_NAME_REPLACEMENTS[ing.name]) {
              await this.ingredients.update(ing.id, { name: BRAND_NAME_REPLACEMENTS[ing.name] });
            }
          }
          const allRecs = await this.recipes.toArray();
          for (const rec of allRecs) {
            let dirty = false;
            const updatedItems = rec.ingredients.map(item => {
              if (BRAND_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            const updatedVars = rec.variegatos?.map(v => {
              if (BRAND_NAME_REPLACEMENTS[v.name]) {
                dirty = true;
                return { ...v, name: BRAND_NAME_REPLACEMENTS[v.name] };
              }
              return v;
            });
            if (dirty) {
              await this.recipes.update(rec.id, {
                ingredients: updatedItems,
                ...(updatedVars ? { variegatos: updatedVars } : {})
              });
            }
          }
          const allPreps = await this.preparations.toArray();
          for (const prep of allPreps) {
            let dirty = false;
            let newName = prep.name;
            if (BRAND_NAME_REPLACEMENTS[prep.name]) {
              newName = BRAND_NAME_REPLACEMENTS[prep.name];
              dirty = true;
            }
            const updatedItems = prep.ingredients?.map(item => {
              if (BRAND_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: BRAND_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            if (dirty) {
              await this.preparations.update(prep.id, {
                name: newName,
                ...(updatedItems ? { ingredients: updatedItems } : {})
              });
            }
          }
          await this.settings.put({ key: 'ingredient_clean_names_version', value: 1 });
        }

        // Sincronizar auditoria de insumos v7 (eliminação de duplicatas e dados canônicos)
        const auditV7Setting = await this.settings.get('ingredient_audit_v7');
        if (!auditV7Setting || auditV7Setting.value < 1) {
          console.log('Executando sincronização de auditoria de insumos v7 no banco...');
          for (const dupId of DUPLICATE_IDS_TO_REMOVE) {
            await this.ingredients.delete(dupId);
          }

          const catalogMap = new Map((initialIngredients as Ingredient[]).map(i => [i.id, i]));
          const currentIngs = await this.ingredients.toArray();
          for (const ing of currentIngs) {
            const cat = catalogMap.get(ing.id);
            if (cat && !ing.isCustom) {
              await this.ingredients.update(ing.id, {
                name: cat.name,
                category: cat.category,
                fat: cat.fat,
                sugars: cat.sugars,
                msnf: cat.msnf,
                otherSolids: cat.otherSolids,
                totalSolids: cat.totalSolids,
                water: cat.water,
                pod: cat.pod,
                pac: cat.pac,
                protein: cat.protein
              });
            }
          }

          const allRecs = await this.recipes.toArray();
          for (const rec of allRecs) {
            let dirty = false;
            const updatedItems = rec.ingredients.map(item => {
              if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            const updatedVars = rec.variegatos?.map(v => {
              if (CANONICAL_NAME_REPLACEMENTS[v.name]) {
                dirty = true;
                return { ...v, name: CANONICAL_NAME_REPLACEMENTS[v.name] };
              }
              return v;
            });
            if (dirty) {
              await this.recipes.update(rec.id, {
                ingredients: updatedItems,
                ...(updatedVars ? { variegatos: updatedVars } : {})
              });
            }
          }

          const allPreps = await this.preparations.toArray();
          for (const prep of allPreps) {
            let dirty = false;
            let newName = prep.name;
            if (CANONICAL_NAME_REPLACEMENTS[prep.name]) {
              newName = CANONICAL_NAME_REPLACEMENTS[prep.name];
              dirty = true;
            }
            const updatedItems = prep.ingredients?.map(item => {
              if (CANONICAL_NAME_REPLACEMENTS[item.name]) {
                dirty = true;
                return { ...item, name: CANONICAL_NAME_REPLACEMENTS[item.name] };
              }
              return item;
            });
            if (dirty) {
              await this.preparations.update(prep.id, {
                name: newName,
                ...(updatedItems ? { ingredients: updatedItems } : {})
              });
            }
          }
          await this.settings.put({ key: 'ingredient_audit_v7', value: 1 });
        }
      }

      // Verificação de sincronização v8: Estilo Gelatos de Oleaginosas
      const stylesUpdated = await this.settings.get('styles_updated_v8');
      if (!stylesUpdated) {
        const nutRecipeIds = ['rec_19', 'rec_27', 'rec_31', 'rec_32', 'rec_44', 'rec_58'];
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          if (nutRecipeIds.includes(rec.id) && !rec.isCustom) {
            await this.recipes.update(rec.id, {
              category: 'Gelatos de Oleaginosas',
              targetStyle: 'Gelatos de Oleaginosas'
            });
          }
        }
        await this.settings.put({ key: 'styles_updated_v8', value: 1 });
      }

      // Verificação de sincronização v9: Subdivisão de Sorbets
      const sorbetsUpdated = await this.settings.get('sorbets_updated_v9');
      if (!sorbetsUpdated) {
        const citricosIds = ['rec_73', 'rec_74', 'rec_78', 'rec_81', 'rec_82', 'rec_83', 'rec_87', 'rec_88', 'rec_89', 'rec_93', 'rec_95'];
        const polpososIds = ['rec_71', 'rec_72', 'rec_75', 'rec_76', 'rec_77', 'rec_79', 'rec_80', 'rec_84', 'rec_85', 'rec_86', 'rec_90', 'rec_91', 'rec_92', 'rec_94', 'rec_96'];
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          if (!rec.isCustom) {
            if (citricosIds.includes(rec.id)) {
              await this.recipes.update(rec.id, {
                category: 'Sorbets Cítricos / Frutas Ácidas',
                targetStyle: 'Sorbets Cítricos / Frutas Ácidas'
              });
            } else if (polpososIds.includes(rec.id)) {
              await this.recipes.update(rec.id, {
                category: 'Sorbets Polposos / Frutas Densas',
                targetStyle: 'Sorbets Polposos / Frutas Densas'
              });
            }
          }
        }
        await this.settings.put({ key: 'sorbets_updated_v9', value: 1 });
      }

      // Verificação de sincronização v10: Restauração de marcas nos insumos, receitas e pré-preparos
      const brandRestoreSetting = await this.settings.get('brands_restored_v10');
      if (!brandRestoreSetting) {
        console.log('Restaurando marcas selecionadas nos insumos, receitas e pré-preparos...');
        const currentIngs = await this.ingredients.toArray();
        for (const ing of currentIngs) {
          if (RESTORED_BRAND_NAMES[ing.name]) {
            const r = RESTORED_BRAND_NAMES[ing.name];
            await this.ingredients.update(ing.id, {
              name: r.newName,
              ...(r.newCategory ? { category: r.newCategory } : {})
            });
          }
        }
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map(item => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map(v => {
            if (RESTORED_BRAND_NAMES[v.name]) {
              dirty = true;
              return { ...v, name: RESTORED_BRAND_NAMES[v.name].newName };
            }
            return v;
          });
          if (dirty) {
            await this.recipes.update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const allPreps = await this.preparations.toArray();
        for (const prep of allPreps) {
          let dirty = false;
          let newName = prep.name;
          if (RESTORED_BRAND_NAMES[prep.name]) {
            newName = RESTORED_BRAND_NAMES[prep.name].newName;
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map(item => {
            if (RESTORED_BRAND_NAMES[item.name]) {
              dirty = true;
              return { ...item, name: RESTORED_BRAND_NAMES[item.name].newName };
            }
            return item;
          });
          if (dirty) {
            await this.preparations.update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
        await this.settings.put({ key: 'brands_restored_v10', value: 1 });
      }

      // 2. Receitas
      const recCount = await this.recipes.count();
      if (recCount === 0) {
        console.log('Populando receitas iniciais...');
        await this.recipes.bulkPut(initialRecipes as Recipe[]);
      } else {
        // Garantir sincronização das 6 receitas Zero rebalanceadas
        const zeroRebalanceFlag = await this.settings.get('zero_rebalance_v13');
        if (!zeroRebalanceFlag) {
          const targetIds = ['rec_121', 'rec_122', 'rec_123', 'rec_126', 'rec_160', 'rec_161'];
          const targetMap = new Map((initialRecipes as Recipe[]).filter(r => targetIds.includes(r.id)).map(r => [r.id, r]));
          for (const id of targetIds) {
            const updated = targetMap.get(id);
            if (updated) {
              const existing = await this.recipes.get(id);
              if (existing && !existing.isCustom) {
                await this.recipes.update(id, { ingredients: updated.ingredients });
              }
            }
          }
          await this.settings.put({ key: 'zero_rebalance_v13', value: 1 });
        }

        // Garantir atualização da categoria dos 6 gelatos veganos
        const veganMoveFlag = await this.settings.get('vegan_category_move_v14');
        if (!veganMoveFlag) {
          const veganZeroIds = ['rec_154', 'rec_155', 'rec_158', 'rec_159', 'rec_162', 'rec_163'];
          for (const id of veganZeroIds) {
            const existing = await this.recipes.get(id);
            if (existing && !existing.isCustom) {
              await this.recipes.update(id, {
                category: 'Gelatos Veganos',
                targetStyle: 'Zero'
              });
            }
          }
          await this.settings.put({ key: 'vegan_category_move_v14', value: 1 });
        }

        // Garantir remoção do Mix Zero e das 22 receitas associadas
        const mixZeroDeleteFlag = await this.settings.get('mix_zero_deleted_v15');
        if (!mixZeroDeleteFlag) {
          const mixZeroRecipeIds = [
            'rec_120', 'rec_121', 'rec_122', 'rec_123', 'rec_124', 'rec_125', 'rec_126', 'rec_127', 'rec_128', 'rec_129', 'rec_130',
            'rec_131', 'rec_132', 'rec_133', 'rec_134', 'rec_135', 'rec_136', 'rec_137', 'rec_138', 'rec_139', 'rec_140', 'rec_141'
          ];
          for (const id of mixZeroRecipeIds) {
            const r = await this.recipes.get(id);
            if (r && !r.isCustom) {
              await this.recipes.delete(id);
            }
          }
          const ing = await this.ingredients.get('ing_169');
          if (ing && !ing.isCustom) {
            await this.ingredients.delete('ing_169');
          }
          const prep = await this.preparations.get('prep_mix_zero');
          if (prep && !prep.isCustom) {
            await this.preparations.delete('prep_mix_zero');
          }
          await this.settings.put({ key: 'mix_zero_deleted_v15', value: 1 });
        }

        // Garantir renomeação das categorias e estilos Zero -> Gelatos Zero Açúcar e Sorbets Zero -> Sorbets Zero Açúcar
        const zeroRenameFlag = await this.settings.get('zero_renamed_v16');
        if (!zeroRenameFlag) {
          const recs = await this.recipes.toArray();
          for (const rec of recs) {
            let dirty = false;
            let newCategory = rec.category;
            let newTargetStyle = rec.targetStyle;
            if (rec.category === 'Zero') {
              newCategory = 'Gelatos Zero Açúcar';
              dirty = true;
            } else if (rec.category === 'Sorbets Zero') {
              newCategory = 'Sorbets Zero Açúcar';
              dirty = true;
            }
            if (rec.targetStyle === 'Zero') {
              newTargetStyle = 'Gelatos Zero Açúcar';
              dirty = true;
            } else if (rec.targetStyle === 'Sorbets Zero') {
              newTargetStyle = 'Sorbets Zero Açúcar';
              dirty = true;
            }
            if (dirty) {
              await this.recipes.update(rec.id, {
                category: newCategory,
                targetStyle: newTargetStyle
              });
            }
          }
          await this.settings.put({ key: 'zero_renamed_v16', value: 1 });
        }

        // Garantir reclassificação taxonômica das 6 receitas
        const reclassFlag = await this.settings.get('reclassified_recipes_v17');
        if (!reclassFlag) {
          const reclassifications: Record<string, { category: string; targetStyle: string }> = {
            'rec_29': { category: 'Gelatos Proteicos', targetStyle: 'Gelatos Proteicos' },
            'rec_37': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
            'rec_51': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
            'rec_55': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
            'rec_56': { category: 'Gelatos de Leite com Chocolate', targetStyle: 'Gelatos de Leite com Chocolate' },
            'rec_47': { category: 'Gelatos de Oleaginosas', targetStyle: 'Gelatos de Oleaginosas' }
          };
          for (const [id, target] of Object.entries(reclassifications)) {
            const rec = await this.recipes.get(id);
            if (rec && !rec.isCustom) {
              await this.recipes.update(id, {
                category: target.category,
                targetStyle: target.targetStyle
              });
            }
          }
          await this.settings.put({ key: 'reclassified_recipes_v17', value: 1 });
        }

        // Garantir separação de Nesquik e Ovomaltine
        const splitFlag = await this.settings.get('nesquik_ovomaltine_split_v18');
        if (!splitFlag) {
          const nesquikIng = (initialIngredients as Ingredient[]).find(i => i.name === 'Nesquik');
          const ovomaltineIng = (initialIngredients as Ingredient[]).find(i => i.name === 'Ovomaltine');
          if (nesquikIng) await this.ingredients.put(nesquikIng);
          if (ovomaltineIng) await this.ingredients.put(ovomaltineIng);

          const r8 = await this.recipes.get('rec_8');
          if (r8 && !r8.isCustom) {
            const updated = r8.ingredients.map((it: any) =>
              it.name === 'Nesquik / Ovomaltine' ? { ...it, name: 'Nesquik' } : it
            );
            await this.recipes.update('rec_8', { ingredients: updated });
          }

          const r51 = await this.recipes.get('rec_51');
          if (r51 && !r51.isCustom) {
            const updated = r51.ingredients.map((it: any) =>
              it.name === 'Nesquik / Ovomaltine' ? { ...it, name: 'Ovomaltine' } : it
            );
            await this.recipes.update('rec_51', { ingredients: updated });
          }
          await this.settings.put({ key: 'nesquik_ovomaltine_split_v18', value: 1 });
        }

        // Garantir renomeação dos estilos e categorias Vegano -> Gelatos Veganos e Alcoólicos -> Gelatos Alcoólicos
        const veganAlcoRenameFlag = await this.settings.get('vegan_alco_renamed_v19');
        if (!veganAlcoRenameFlag) {
          const recs = await this.recipes.toArray();
          for (const rec of recs) {
            let dirty = false;
            let newCategory = rec.category;
            let newTargetStyle = rec.targetStyle;
            if (rec.category === 'Vegano') {
              newCategory = 'Gelatos Veganos';
              dirty = true;
            } else if (rec.category === 'Alcoólicos') {
              newCategory = 'Gelatos Alcoólicos';
              dirty = true;
            }
            if (rec.targetStyle === 'Vegano') {
              newTargetStyle = 'Gelatos Veganos';
              dirty = true;
            } else if (rec.targetStyle === 'Alcoólicos') {
              newTargetStyle = 'Gelatos Alcoólicos';
              dirty = true;
            }
            if (dirty) {
              await this.recipes.update(rec.id, {
                category: newCategory,
                targetStyle: newTargetStyle
              });
            }
          }
          await this.settings.put({ key: 'vegan_alco_renamed_v19', value: 1 });
        }

        // Garantir padronização de nomes de receitas com prefixo Gelato ou Sorbet
        const nameStandardizeFlag = await this.settings.get('recipe_names_standardized_v20');
        if (!nameStandardizeFlag) {
          const recipeNameMap: Record<string, string> = {
            'rec_1': 'Gelato Fior di Latte (Direto ao Ponto)',
            'rec_2': 'Gelato de Café Bianco Flocado (Direto ao Ponto)',
            'rec_3': 'Gelato de Chocolate com Gostosuras (Direto ao Ponto)',
            'rec_4': 'Gelato de Crema (Direto ao Ponto)',
            'rec_5': 'Gelato Crema di Santa Fina (Direto ao Ponto)',
            'rec_6': 'Gelato de Baunilha com Mascavo (Direto ao Ponto)',
            'rec_7': 'Gelato de Doce de Leite (Direto ao Ponto)',
            'rec_8': 'Gelato de Nesquik (Direto ao Ponto)',
            'rec_9': 'Gelato de Cream Cheese (Direto ao Ponto)',
            'rec_10': 'Gelato de Parmesão (Direto ao Ponto)',
            'rec_11': 'Gelato de Gorgonzola (Direto ao Ponto)',
            'rec_12': 'Gelato de Chocolate Branco Assado com Missô (Direto ao Ponto)',
            'rec_13': 'Gelato de Iogurte (Direto ao Ponto)',
            'rec_14': 'Gelato de Milho (Direto ao Ponto)',
            'rec_15': 'Gelato de Coco Fresco (Direto ao Ponto)',
            'rec_16': 'Gelato de Sucrilhos (Direto ao Ponto)',
            'rec_17': 'Gelato Intenso de Cacau (Direto ao Ponto)',
            'rec_18': 'Gelato de Chocolate 70% (Direto ao Ponto)',
            'rec_19': 'Gelato de Pistache - Base Oleaginosas (Direto ao Ponto)',
            'rec_57': 'Gelato Soft - Calda Base de Leite (Addolcire)',
            'rec_58': 'Gelato Soft de Pistache (Addolcire)',
            'rec_59': 'Gelato Soft de Chocolate (Addolcire)',
            'rec_61': 'Gelato de Mousse de Maracujá (Direto ao Ponto)',
            'rec_62': 'Gelato de Banana Assada (Direto ao Ponto)',
            'rec_63': 'Gelato de Morango / Fragola (Direto ao Ponto)',
            'rec_106': 'Gelato Calda Base Vegana de Aveia (Addolcire)',
            'rec_146': 'Gelato Fior di Latte 17% - Polióis (Sem Açúcar)',
            'rec_147': 'Gelato Fior di Latte 17% - Menos Polióis (Sem Açúcar)',
            'rec_148': 'Gelato de Chocolate 17% - Polióis (Sem Açúcar)',
            'rec_149': 'Gelato de Chocolate 17% - Redução Polióis (Sem Açúcar)',
            'rec_150': 'Gelato de Fragola / Morango ao Leite - Polióis (Sem Açúcar)',
            'rec_151': 'Gelato de Fragola / Morango ao Leite - Redução Polióis (Sem Açúcar)'
          };

          for (const [id, newName] of Object.entries(recipeNameMap)) {
            const existing = await this.recipes.get(id);
            if (existing && !existing.isCustom) {
              await this.recipes.update(id, { name: newName });
            }
          }
          await this.settings.put({ key: 'recipe_names_standardized_v20', value: 1 });
        // Garantir remoção das 3 bases genéricas e renomeação de rec_19 (Pistache) e rec_99 (Sorbet de Chocolate)
        const basesRemovedFlag = await this.settings.get('bases_removed_v21_fix');
        if (!basesRemovedFlag) {
          const idsToDelete = ['rec_20', 'rec_106', 'rec_57'];
          for (const id of idsToDelete) {
            await this.recipes.delete(id);
          }
          const r19 = (initialRecipes as Recipe[]).find(r => r.id === 'rec_19');
          if (r19) {
            await this.recipes.put(r19);
          }
          const r99 = await this.recipes.get('rec_99');
          if (r99 && !r99.isCustom) {
            await this.recipes.update('rec_99', { name: 'Sorbet de Chocolate (Direto ao Ponto)' });
          }
          await this.settings.put({ key: 'bases_removed_v21_fix', value: 1 });
        }

        }
      }

      // 3. Pré-preparos & Variegatos
      const prepCount = await this.preparations.count();
      if (prepCount < initialPreparations.length) {
        console.log('Populando/atualizando pré-preparos...');
        await this.preparations.bulkPut(initialPreparations as Preparation[]);
      }

      // Sincronizar simplificação de nomes de açúcares no catálogo existente
      const sugarSyncSetting = await this.settings.get('sugar_names_v24');
      if (!sugarSyncSetting) {
        console.log('Sincronizando simplificação de nomes de açúcares no catálogo...');
        const allIngs = await this.ingredients.toArray();
        for (const ing of allIngs) {
          if (SUGAR_NAME_REPLACEMENTS[ing.name]) {
            await this.ingredients.update(ing.id, { name: SUGAR_NAME_REPLACEMENTS[ing.name] });
          }
        }
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          let dirty = false;
          const updatedItems = rec.ingredients.map(item => {
            if (SUGAR_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: SUGAR_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          const updatedVars = rec.variegatos?.map(v => {
            if (SUGAR_NAME_REPLACEMENTS[v.name]) {
              dirty = true;
              return { ...v, name: SUGAR_NAME_REPLACEMENTS[v.name] };
            }
            return v;
          });
          if (dirty) {
            await this.recipes.update(rec.id, {
              ingredients: updatedItems,
              ...(updatedVars ? { variegatos: updatedVars } : {})
            });
          }
        }
        const allPreps = await this.preparations.toArray();
        for (const prep of allPreps) {
          let dirty = false;
          let newName = prep.name;
          if (SUGAR_NAME_REPLACEMENTS[prep.name]) {
            newName = SUGAR_NAME_REPLACEMENTS[prep.name];
            dirty = true;
          }
          const updatedItems = prep.ingredients?.map(item => {
            if (SUGAR_NAME_REPLACEMENTS[item.name]) {
              dirty = true;
              return { ...item, name: SUGAR_NAME_REPLACEMENTS[item.name] };
            }
            return item;
          });
          if (dirty) {
            await this.preparations.update(prep.id, {
              name: newName,
              ...(updatedItems ? { ingredients: updatedItems } : {})
            });
          }
        }
        await this.settings.put({ key: 'sugar_names_v24', value: 1 });
      }

      // Sincronizar calibração Fase 1: Quick Wins Padrão Ouro (20 receitas calibradas)
      const quickWinsV1Setting = await this.settings.get('recipes_quick_wins_v1');
      if (!quickWinsV1Setting) {
        console.log('Sincronizando 20 receitas calibradas (Fase 1 Quick Wins) no banco...');
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom) {
            await this.recipes.update(rec.id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams
            });
          }
        }
        await this.settings.put({ key: 'recipes_quick_wins_v1', value: 1 });
      }

      // Sincronizar calibração Fase 2: Sorbets, Veganos, Leite com Fruta e Reclassificação de Chocolates (38 receitas)
      const phase2V1Setting = await this.settings.get('recipes_phase2_sorbets_v1');
      if (!phase2V1Setting) {
        console.log('Sincronizando 38 receitas calibradas (Fase 2 Sorbets & Veganos) no banco...');
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom) {
            await this.recipes.update(rec.id, {
              name: catRec.name,
              category: catRec.category,
              targetStyle: catRec.targetStyle,
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams
            });
          }
        }
        await this.settings.put({ key: 'recipes_phase2_sorbets_v1', value: 1 });
      }

      // Sincronizar calibração Fase 3: Blindagem Alcoólica (9 receitas alcoólicas)
      const phase3V1Setting = await this.settings.get('recipes_phase3_alcohol_v1');
      if (!phase3V1Setting) {
        console.log('Sincronizando 9 receitas calibradas (Fase 3 Blindagem Alcoólica) no banco...');
        const phase3Ids = ['rec_109', 'rec_111', 'rec_112', 'rec_113', 'rec_114', 'rec_115', 'rec_116', 'rec_118', 'rec_119'];
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom && phase3Ids.includes(rec.id)) {
            await this.recipes.update(rec.id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams
            });
          }
        }
        await this.settings.put({ key: 'recipes_phase3_alcohol_v1', value: 1 });
      }

      // Sincronizar calibração Fase 4: Sobremesas Complexas, Chocolates Lácteos e Remoção de Sucrilhos e Whey Brownie (18 receitas + purge rec_16 e rec_29)
      const phase4V2Setting = await this.settings.get('recipes_phase4_final_100pct_v2');
      if (!phase4V2Setting) {
        console.log('Sincronizando 18 receitas calibradas (Fase 4) e removendo Sucrilhos (rec_16) e Whey Brownie (rec_29)...');
        // Remover sabores descontinuados do catálogo
        for (const removedId of ['rec_16', 'rec_29']) {
          const r = await this.recipes.get(removedId);
          if (r && !r.isCustom) {
            await this.recipes.delete(removedId);
          }
        }

        const phase4Ids = [
          'rec_8', 'rec_22', 'rec_23', 'rec_33', 'rec_35', 'rec_36', 'rec_46', 'rec_48',
          'rec_12', 'rec_17', 'rec_28', 'rec_40', 'rec_41', 'rec_51', 'rec_55', 'rec_56',
          'rec_44', 'rec_47'
        ];
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom && phase4Ids.includes(rec.id)) {
            await this.recipes.update(rec.id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams
            });
          }
        }
        await this.settings.put({ key: 'recipes_phase4_final_100pct_v2', value: 1 });
      }

      // Sincronizar calibração anti-arenosidade (SLNG vs Água Livre) nos Gelatos Proteicos (7 receitas)
      const proteicAntiSandinessSetting = await this.settings.get('recipes_proteic_anti_arenosidade_v1');
      if (!proteicAntiSandinessSetting) {
        console.log('Sincronizando 7 receitas proteicas calibradas contra arenosidade no banco...');
        const proteicIds = ['rec_166', 'rec_167', 'rec_168', 'rec_170', 'rec_171', 'rec_173', 'rec_174'];
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom && proteicIds.includes(rec.id)) {
            await this.recipes.update(rec.id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams
            });
          }
        }
        await this.settings.put({ key: 'recipes_proteic_anti_arenosidade_v1', value: 1 });
      }

      // Sincronizar pré-preenchimento dos Modos de Preparo Caseiros (148 receitas)
      const prepStepsCaseiroSetting = await this.settings.get('recipes_caseiro_steps_v1');
      if (!prepStepsCaseiroSetting) {
        console.log('Sincronizando modos de preparo caseiros em todas as receitas do catálogo...');
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allRecs = await this.recipes.toArray();
        for (const rec of allRecs) {
          const catRec = initialMap.get(rec.id);
          if (catRec && !rec.isCustom && catRec.preparationSteps) {
            await this.recipes.update(rec.id, {
              preparationSteps: catRec.preparationSteps
            });
          }
        }
        await this.settings.put({ key: 'recipes_caseiro_steps_v1', value: 1 });
      }

      // Sincronizar refinamento de receitas do compêndio Base de Leite (Passos artesanais específicos, novos pré-preparos/variegatos e correções de calda)
      const diretoAoPontoSetting = await this.settings.get('recipes_direto_ao_ponto_refinement_v2');
      if (!diretoAoPontoSetting) {
        console.log('Sincronizando novos pré-preparos, variegatos e passos refinados de receitas...');
        // 1. Garantir que os 23 pré-preparos do catálogo estejam no banco
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Atualizar as 23 receitas refinadas do compêndio
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const targetIds = [
          'rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5', 'rec_6', 'rec_7', 'rec_8',
          'rec_9', 'rec_10', 'rec_11', 'rec_12', 'rec_13', 'rec_14', 'rec_15',
          'rec_17', 'rec_18', 'rec_19', 'rec_60', 'rec_61', 'rec_62', 'rec_63', 'rec_109'
        ];

        for (const id of targetIds) {
          const catRec = initialMap.get(id);
          const dbRec = await this.recipes.get(id);
          if (catRec && dbRec && !dbRec.isCustom) {
            await this.recipes.update(id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams,
              preparationSteps: catRec.preparationSteps,
              ...(catRec.variegatos ? { variegatos: catRec.variegatos } : {})
            });
          }
        }
        await this.settings.put({ key: 'recipes_direto_ao_ponto_refinement_v2', value: 1 });
      }

      // Sincronizar refinamento de receitas do compêndio Profissional Addolcire (16 novos pré-preparos/variegatos, rec_178, rec_142 manjericão e passos artesanais refinados)
      const addolcireSetting = await this.settings.get('recipes_addolcire_refinement_v3');
      if (!addolcireSetting) {
        console.log('Sincronizando 16 novos pré-preparos e 74 receitas Addolcire refinadas...');
        // 1. Garantir que todos os pré-preparos do catálogo estejam no banco
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Garantir que o insumo Manjericão Fresco esteja no banco
        const manjericao = (initialIngredients as Ingredient[]).find(i => i.id === 'ing_218' || i.name === 'Manjericão Fresco');
        if (manjericao) {
          await this.ingredients.put(manjericao);
        }

        // 3. Atualizar/inserir receitas do compêndio
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));

        // Inserir rec_178 se ainda não existir
        const rec178 = initialMap.get('rec_178');
        if (rec178) {
          const dbRec178 = await this.recipes.get('rec_178');
          if (!dbRec178) {
            await this.recipes.put(rec178);
          }
        }

        // Atualizar receitas Addolcire
        const addolcireRecipes = (initialRecipes as Recipe[]).filter(r => r.name.includes('(Addolcire)'));
        for (const catRec of addolcireRecipes) {
          const dbRec = await this.recipes.get(catRec.id);
          if (dbRec && !dbRec.isCustom) {
            await this.recipes.update(catRec.id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams,
              preparationSteps: catRec.preparationSteps,
              ...(catRec.variegatos ? { variegatos: catRec.variegatos } : { variegatos: [] })
            });
          }
        }
        await this.settings.put({ key: 'recipes_addolcire_refinement_v3', value: 1 });
      }

      // Sincronizar refinamento de receitas do compêndio Gelatos Proteicos (3 novos pré-preparos/variegatos e 12 receitas com passos refinados)
      const proteicCompendiumSetting = await this.settings.get('recipes_proteic_compendium_refinement_v4');
      if (!proteicCompendiumSetting) {
        console.log('Sincronizando 3 novos pré-preparos proteicos e 12 receitas proteicas refinadas...');
        // 1. Garantir que os 42 pré-preparos do catálogo estejam no banco
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Atualizar as 12 receitas proteicas refinadas
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const proteicTargetIds = [
          'rec_166', 'rec_167', 'rec_168', 'rec_169', 'rec_170', 'rec_171',
          'rec_172', 'rec_173', 'rec_174', 'rec_175', 'rec_176', 'rec_177'
        ];

        for (const id of proteicTargetIds) {
          const catRec = initialMap.get(id);
          const dbRec = await this.recipes.get(id);
          if (catRec && dbRec && !dbRec.isCustom) {
            await this.recipes.update(id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams,
              preparationSteps: catRec.preparationSteps
            });
          }
        }
        await this.settings.put({ key: 'recipes_proteic_compendium_refinement_v4', value: 1 });
      }

      // Sincronizar refinamento de receitas do compêndio Gelatos Sem Adição de Açúcar e Redução de Açúcar (3 novos pré-preparos, 22 receitas zero refinadas e 10 novas receitas com Açúcar de Maçã)
      const sugarFreeSetting = await this.settings.get('recipes_sugar_free_and_reduced_refinement_v5');
      if (!sugarFreeSetting) {
        console.log('Sincronizando 3 novos pré-preparos, 22 receitas zero refinadas e 10 novas receitas com açúcar de maçã...');
        // 1. Garantir que os 45 pré-preparos do catálogo estejam no banco
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Inserir as 10 novas receitas com Açúcar de Maçã se ainda não existirem
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const newSugarReducedIds = [
          'rec_179', 'rec_180', 'rec_181', 'rec_182', 'rec_183',
          'rec_184', 'rec_185', 'rec_186', 'rec_187', 'rec_188'
        ];
        for (const id of newSugarReducedIds) {
          const catRec = initialMap.get(id);
          if (catRec) {
            const dbRec = await this.recipes.get(id);
            if (!dbRec) {
              await this.recipes.put(catRec);
            }
          }
        }

        // 3. Atualizar as 22 receitas existentes refinadas (rec_144 a rec_165)
        for (let num = 144; num <= 165; num++) {
          const id = `rec_${num}`;
          const catRec = initialMap.get(id);
          const dbRec = await this.recipes.get(id);
          if (catRec && dbRec && !dbRec.isCustom) {
            await this.recipes.update(id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams,
              preparationSteps: catRec.preparationSteps,
              ...(catRec.variegatos ? { variegatos: catRec.variegatos } : {})
            });
          }
        }
        await this.settings.put({ key: 'recipes_sugar_free_and_reduced_refinement_v5', value: 1 });
      }

      // Sincronizar refinamento de receitas do compêndio Sorbetos & Gelatos Veganos (Caramelo de Maracujá e 19 receitas refinadas)
      const sorbetosSetting = await this.settings.get('recipes_sorbetos_direto_ao_ponto_refinement_v6');
      if (!sorbetosSetting) {
        console.log('Sincronizando pré-preparo Caramelo de Maracujá e 19 sorbetos/veganos refinados...');
        // 1. Garantir que os 46 pré-preparos do catálogo estejam no banco
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Atualizar as 19 receitas refinadas
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const sorbetosTargetIds = [
          'rec_71', 'rec_72', 'rec_73', 'rec_74', 'rec_75', 'rec_76', 'rec_77', 'rec_78', 'rec_79', 'rec_80',
          'rec_99', 'rec_100', 'rec_101', 'rec_102', 'rec_103', 'rec_104', 'rec_105',
          'rec_110'
        ];

        for (const id of sorbetosTargetIds) {
          const catRec = initialMap.get(id);
          const dbRec = await this.recipes.get(id);
          if (catRec && dbRec && !dbRec.isCustom) {
            await this.recipes.update(id, {
              ingredients: catRec.ingredients,
              totalGrams: catRec.totalGrams,
              preparationSteps: catRec.preparationSteps,
              ...(catRec.variegatos ? { variegatos: catRec.variegatos } : { variegatos: [] })
            });
          }
        }
        await this.settings.put({ key: 'recipes_sorbetos_direto_ao_ponto_refinement_v6', value: 1 });
      }

      // Sincronizar calibração físico-química dos modos de preparo (Cacau 90°C, Chocolate 65°C Off-Heat, Gemas 80°C–82°C)
      const thermalSetting = await this.settings.get('recipes_thermal_calibration_refinement_v7');
      if (!thermalSetting) {
        console.log('Sincronizando calibração térmica de modos de preparo nas receitas do catálogo...');
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        const allDbRecs = await this.recipes.toArray();
        for (const dbRec of allDbRecs) {
          if (!dbRec.isCustom) {
            const catRec = initialMap.get(dbRec.id);
            if (catRec && catRec.preparationSteps) {
              await this.recipes.update(dbRec.id, {
                preparationSteps: catRec.preparationSteps
              });
            }
          }
        }
        await this.settings.put({ key: 'recipes_thermal_calibration_refinement_v7', value: 1 });
      }

      // Sincronizar catálogo do compêndio Gelato Irresistível (15 novos insumos, 13 novos pré-preparos/variegatos e 40 novas receitas rec_189 a rec_228)
      const gelatoIrresistivelSetting = await this.settings.get('recipes_gelato_irresistivel_v1');
      if (!gelatoIrresistivelSetting) {
        console.log('Sincronizando novos insumos, 13 pré-preparos e 40 novas receitas do compêndio Gelato Irresistível...');
        // 1. Garantir que todos os insumos e pré-preparos estejam no banco
        await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
        await this.preparations.bulkPut(initialPreparations as Preparation[]);

        // 2. Inserir as 40 novas receitas (rec_189 a rec_228)
        const initialMap = new Map((initialRecipes as Recipe[]).map(r => [r.id, r]));
        for (let num = 189; num <= 228; num++) {
          const id = `rec_${num}`;
          const catRec = initialMap.get(id);
          if (catRec) {
            const dbRec = await this.recipes.get(id);
            if (!dbRec) {
              await this.recipes.put(catRec);
            }
          }
        }
        await this.settings.put({ key: 'recipes_gelato_irresistivel_v1', value: 1 });
      }

      // Sincronizar padronização tipográfica de pré-preparos e insumos base v25
      const prepTypoFlag = await this.settings.get('prep_names_standardized_v25');
      if (!prepTypoFlag) {
        const typoMap: Record<string, string> = {
          'Base de leite(Fior di latte)': 'Base de Leite (Fior di Latte)',
          'Base de água': 'Base de Água',
          'Base de leite': 'Base de Leite'
        };
        for (const [oldName, newName] of Object.entries(typoMap)) {
          const ings = await this.ingredients.where('name').equals(oldName).toArray();
          for (const ing of ings) {
            await this.ingredients.update(ing.id, { name: newName });
          }
          const preps = await this.preparations.where('name').equals(oldName).toArray();
          for (const prep of preps) {
            await this.preparations.update(prep.id, { name: newName });
          }
        }
        await this.settings.put({ key: 'prep_names_standardized_v25', value: 1 });
      }


      // 4. Parâmetros de Precificação
      const settingsCount = await this.settings.count();
      if (settingsCount === 0) {
        await this.settings.put({ key: 'pricing', value: DEFAULT_PRICING });
      }
    } catch (seedErr) {
      console.error('Erro durante o povoamento inicial de dados:', seedErr);
    }
  }

  async exportFullBackup(): Promise<string> {
    const ingredients = await this.ingredients.toArray();
    const recipes = await this.recipes.toArray();
    const preparations = await this.preparations.toArray();
    const settings = await this.settings.toArray();
    const productionBatches = await this.productionBatches.toArray();
    const stockItems = await this.stockItems.toArray();
    const salesTransactions = await this.salesTransactions.toArray();
    const stockAdjustments = await this.stockAdjustments.toArray();

    // Capturar também parâmetros de precificação do usuário (localStorage)
    let pricingParams = null;
    try {
      const rawPricing = localStorage.getItem(PRICING_STORAGE_KEY);
      if (rawPricing) {
        pricingParams = JSON.parse(rawPricing);
      }
    } catch (e) {
      console.warn('Erro ao ler pricingParams para backup:', e);
    }

    // Capturar tema
    let themeMode = null;
    try {
      themeMode = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      console.warn('Erro ao ler themeMode para backup:', e);
    }

    // Capturar estilos e balanceamentos personalizados do usuário
    let customStyles = null;
    let activePresetId = null;
    try {
      customStyles = getUserCustomStyles();
      activePresetId = getActivePresetId();
    } catch (e) {
      console.warn('Erro ao ler customStyles para backup:', e);
    }

    const backup = {
      version: 5,
      exportedAt: new Date().toISOString(),
      ingredients,
      recipes,
      preparations,
      settings,
      productionBatches,
      stockItems,
      salesTransactions,
      stockAdjustments,
      pricingParams,
      themeMode,
      customStyles,
      activePresetId
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string, mode: 'merge' | 'replace' = 'merge'): Promise<BackupResult> {
    const data = JSON.parse(jsonString);

    if (!data.recipes || !data.ingredients) {
      throw new Error('Formato de backup inválido: campos de receitas e ingredientes ausentes.');
    }

    let stockImported = false;
    let stockItemsCount = 0;
    let batchesCount = 0;
    let salesCount = 0;
    let preparationsCount = 0;

    await this.transaction('rw', [this.ingredients, this.recipes, this.preparations, this.settings, this.productionBatches, this.stockItems, this.salesTransactions, this.stockAdjustments], async () => {
      if (mode === 'replace') {
        await this.ingredients.clear();
        await this.recipes.clear();
        await this.preparations.clear();
        await this.settings.clear();
        await this.productionBatches.clear();
        await this.stockItems.clear();
        await this.salesTransactions.clear();
        await this.stockAdjustments.clear();
      }

      // Normalizar nomes de açúcares legados ao importar backup
      const normalizedIngredients = data.ingredients.map((ing: any) => ({
        ...ing,
        name: SUGAR_NAME_REPLACEMENTS[ing.name] || ing.name
      }));
      const normalizedRecipes = data.recipes.map((rec: any) => ({
        ...rec,
        ingredients: rec.ingredients?.map((item: any) => ({
          ...item,
          name: SUGAR_NAME_REPLACEMENTS[item.name] || item.name
        })),
        variegatos: rec.variegatos?.map((v: any) => ({
          ...v,
          name: SUGAR_NAME_REPLACEMENTS[v.name] || v.name
        }))
      }));
      const normalizedPreps = data.preparations ? data.preparations.map((prep: any) => ({
        ...prep,
        name: SUGAR_NAME_REPLACEMENTS[prep.name] || prep.name,
        ingredients: prep.ingredients?.map((item: any) => ({
          ...item,
          name: SUGAR_NAME_REPLACEMENTS[item.name] || item.name
        }))
      })) : undefined;

      await this.ingredients.bulkPut(normalizedIngredients);
      await this.recipes.bulkPut(normalizedRecipes);

      if (normalizedPreps && normalizedPreps.length > 0) {
        await this.preparations.bulkPut(normalizedPreps);
        preparationsCount = normalizedPreps.length;
      }
      if (data.settings && Array.isArray(data.settings)) {
        for (const s of data.settings) {
          await this.settings.put(s);
        }
      }

      // Importar módulo de estoque, lotes e histórico contábil caso presentes no backup v5
      if (data.productionBatches && Array.isArray(data.productionBatches) && data.productionBatches.length > 0) {
        await this.productionBatches.bulkPut(data.productionBatches);
        batchesCount = data.productionBatches.length;
        stockImported = true;
      }
      if (data.stockItems && Array.isArray(data.stockItems) && data.stockItems.length > 0) {
        await this.stockItems.bulkPut(data.stockItems);
        stockItemsCount = data.stockItems.length;
        stockImported = true;
      }
      if (data.salesTransactions && Array.isArray(data.salesTransactions) && data.salesTransactions.length > 0) {
        await this.salesTransactions.bulkPut(data.salesTransactions);
        salesCount = data.salesTransactions.length;
        stockImported = true;
      }
      if (data.stockAdjustments && Array.isArray(data.stockAdjustments) && data.stockAdjustments.length > 0) {
        await this.stockAdjustments.bulkPut(data.stockAdjustments);
        stockImported = true;
      }
    });

    let pricingImported = false;
    let themeImported = false;
    let customStylesImported = false;

    // Restaurar custos fixos e taxas de maquininha caso existam no backup
    if (data.pricingParams && typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data.pricingParams));
        window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
        pricingImported = true;
      } catch (err) {
        console.warn('Erro ao restaurar pricingParams do backup:', err);
      }
    }

    // Restaurar preferência de tema caso exista no backup
    if (data.themeMode && typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, data.themeMode);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        themeImported = true;
      } catch (err) {
        console.warn('Erro ao restaurar themeMode do backup:', err);
      }
    }

    // Restaurar estilos e balanceamentos personalizados caso existam no backup
    if (data.customStyles && typeof window !== 'undefined') {
      try {
        if (mode === 'replace') {
          saveUserCustomStyles(data.customStyles);
        } else {
          const existing = getUserCustomStyles();
          const merged = { ...existing, ...data.customStyles };
          saveUserCustomStyles(merged);
        }

        const presetToSet = data.activePresetId || 'custom';
        saveStoredStyles(getUserCustomStyles(), presetToSet);
        customStylesImported = true;
      } catch (err) {
        console.warn('Erro ao restaurar customStyles do backup:', err);
      }
    }

    return {
      recipesCount: data.recipes.length,
      ingredientsCount: data.ingredients.length,
      preparationsCount,
      stockItemsCount,
      batchesCount,
      salesCount,
      pricingImported,
      themeImported,
      customStylesImported,
      stockImported
    };
  }

  async restoreFactoryDefaults(): Promise<void> {
    await this.transaction('rw', [
      this.ingredients,
      this.recipes,
      this.preparations,
      this.settings,
      this.productionBatches,
      this.stockItems,
      this.salesTransactions,
      this.stockAdjustments
    ], async () => {
      await this.ingredients.clear();
      await this.recipes.clear();
      await this.preparations.clear();
      await this.settings.clear();
      await this.productionBatches.clear();
      await this.stockItems.clear();
      await this.salesTransactions.clear();
      await this.stockAdjustments.clear();

      await this.ingredients.bulkPut(initialIngredients as Ingredient[]);
      await this.recipes.bulkPut(initialRecipes as Recipe[]);
      await this.preparations.bulkPut(initialPreparations as Preparation[]);
      await this.settings.put({ key: 'pricing', value: DEFAULT_PRICING });
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PRICING_STORAGE_KEY);
        window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
      } catch (e) {
        console.warn('Erro ao redefinir pricingParams no reset:', e);
      }
      try {
        localStorage.removeItem(USER_CUSTOM_STYLES_KEY);
        localStorage.removeItem(STYLES_STORAGE_KEY);
        applyGoldStandardPreset();
      } catch (e) {
        console.warn('Erro ao resetar customStyles:', e);
      }
    }
  }
}

export const db = new GelatoDatabase();

/**
 * Proxy dinâmico para stylesDataMap que sempre reflete as metas customizadas salvas pelo usuário
 */
export const stylesDataMap: Record<string, StyleStandard> = new Proxy({} as Record<string, StyleStandard>, {
  get: (_target, prop: string) => {
    const map = getStoredStyles();
    return map[prop];
  },
  ownKeys: () => {
    return Reflect.ownKeys(getStoredStyles());
  },
  getOwnPropertyDescriptor: (_target, prop) => {
    const map = getStoredStyles();
    return Reflect.getOwnPropertyDescriptor(map, prop);
  }
});
