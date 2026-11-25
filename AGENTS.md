# AGENTS.md — Gelatio

Guia técnico de referência para agentes de IA (OpenBot, Hermes Agent, Claude Code, Gemini, Codex, etc.) trabalhando neste repositório.

---

## 1. Visão Geral & Stack

- **Produto:** **Gelatio** — PWA offline-first para balanceamento bromatológico e termodinâmico de gelatos artesanais, rotulagem ANVISA, controle de produção/estoque/PDV e engenharia de custos (DRE).
- **Stack:** React 18, TypeScript 5, Vite 6 (`vite-plugin-pwa`), Tailwind CSS 3, Dexie 4 (IndexedDB) + `dexie-react-hooks`, Vitest 5.
- **Ambiente / Shell:** Windows PowerShell. Não encadear comandos com `&&` (em PowerShell 5.1 usar `;` ou `; if ($LASTEXITCODE -eq 0) { ... }`).

### Comandos Oficiais
- `npm test` — executa toda a suíte Vitest (`vitest run`).
- `npx tsc --noEmit` — checagem estrita de tipos TypeScript.
- `npm run build` — executa `tsc && vite build` e gera o bundle + Service Worker PWA.
- `npm run dev` — servidor de desenvolvimento Vite.

---

## 2. Mapa Arquitetural (`src/`)

- **`src/core/`** — Motores puros de cálculo e armazenamento local:
  - `calculator.ts`: cálculo bromatológico da batelada, densidade (Richmond), overrun, emulsão (incluindo ramo vegetal/vegano sem SLNG), precificação e `variegatoLiquidVolumeLiters`.
  - `anvisaNutrition.ts`: tabela nutricional e selos frontais (FOP) segundo **ANVISA RDC 429/2020 e IN 75/2020**.
  - `freezingCurve.ts`: curva crioscópica, `%` de gelo por temperatura e faixa ideal de vitrine.
  - `stockService.ts`: custos de lote (`directCostUnit` vs `fixedOverheadUnit`), registro de produção, vendas PDV, ajustes e `calculateSalesDRE`.
  - `preparationSync.ts`: cálculo nutricional/bromatológico agregado de pré-preparos.
  - `pricingStorage.ts`, `stylesStorage.ts`, `theme.ts`: persistência em `localStorage`, presets de estilos (`GOLD_STANDARD_STYLES`) e tema (`dark` / `light` / `auto`).
- **`src/db/database.ts`** — Banco IndexedDB via Dexie com **8 tabelas**:
  `ingredients`, `recipes`, `preparations`, `settings`, `productionBatches`, `stockItems`, `salesTransactions`, `stockAdjustments`.
  Também concentra `exportFullBackup()`, `importBackup()` (v5) e `restoreFactoryDefaults()`.
- **`src/data/`** — Catálogos base (`ingredients.json`, `preparations.json`, `recipes.json`, `styles.json`).
  - **Regra:** Não edite arquivos em `src/data/` manualmente sem solicitação explícita do usuário.
- **`src/components/`** — Módulos da UI organizados por domínio:
  `Balanceamento/`, `Receitas/`, `PrePreparos/`, `Ingredientes/`, `Financeiro/`, `Estoque/`, `ImportExport/`, `Common/`.

---

## 3. Regras de Domínio & Armadilhas Comuns

Ao auditar ou modificar o código, respeite os invariantes abaixo para evitar falsos positivos ou regressões:

1. **Unidades dos Insumos (`src/types/gelato.ts` / `ingredients.json`):**
   - Frações de composição (`water`, `sugars`, `fat`, `msnf`, `otherSolids`, `protein`, `saturatedFatRatio`, `transFatRatio`, `fiberRatio`) são expressas em razão **`0..1`** (ex.: `0.17` = 17%).
   - Exceções: `sodiumMgPer100g` (em `mg/100g`), `pod` e `pac` (índices relativos à sacarose = `100`).
2. **Tripartição Físico-Química da Receita:**
   - **Calda Base** (alvo padrão `1.000 g`), **Pré-preparos/Infusões** e **Mesclas/Variegatos pós-produção** (`PostProduction.tsx`).
   - Mesclas sem nome ou com peso `<= 0` não devem contribuir volume físico ao lote.
3. **Curva Térmica (`src/core/freezingCurve.ts`):**
   - `calculateFreezingState` e `calculateIcePercentAtTemp` aceitam `pacScale` (`'auto' | 'percent' | 'per1000g'`). A UI (`VitrineSimulator.tsx`) passa `'per1000g'` explicitamente para evitar ambiguidade quando `PAC <= 100` (caldas zero/pouco adoçadas).
   - A zona ideal de vitrine é **`64%` a `75%` de gelo** entre `-8°C` e `-20°C`. Se a curva não cruzar essa faixa, não fabrique médias falsas.
4. **Rotulagem ANVISA (`src/core/anvisaNutrition.ts`):**
   - Use `isValidNonNeg` ao ler campos opcionais (nunca confie em `null >= 0` do JS).
   - Energia por componente: fibras `2 kcal/g`, eritritol `0 kcal/g`, demais polióis `2.4 kcal/g`, sal `0 kcal/g`, carboidratos/proteínas `4 kcal/g`, gorduras `9 kcal/g` e **álcool etílico `7 kcal/g`** (IN 75/2020 Anexo XXII, estimado via `estimateAlcoholMassRatio`).
   - Em laticínios não adoçados que já trazem `sugars > 0`, tratar `sugars` como lactose natural sem somar `msnf * 0.52` por cima nem classificar como `addedSugars`.
5. **Estoque & DRE (`src/core/stockService.ts`):**
   - `avgDirectCostUnit` e `directCostSold` isolam o custo direto (`gelato + embalagem`) do `fixedOverheadUnit`. No `calculateSalesDRE`, `cmvTotal` usa `directCostSold ?? totalCostSold` para que `fixedCostsPeriod` seja deduzido **uma única vez**.
   - Ao registrar produção sobre saldo negativo, abata do saldo existente (`existingStock.currentUnits + unitsProduced`) em vez de zerar o negativo.

---

## 4. Persistência, Backup v5 & Sincronização entre Abas

- As abas principais ficam montadas em memória no `App.tsx` (ocultas com `display: none`). Portanto, importações de backup ou alterações de estado dependem de **eventos globais** e listeners:
  - `gelato-stock-updated` (`STOCK_UPDATED_EVENT`) — escutado por `StockScreen`, `ProductionScreen`, `PosSalesScreen`, `ProfitAnalyticsScreen`.
  - `PRICING_UPDATED_EVENT` — escutado por `PricingCalculator` (com guarda contra loop de auto-save).
  - `STYLES_UPDATED_EVENT` — sincronização de estilos após `importBackup`.
  - `THEME_CHANGE_EVENT` + `applyTheme()` — aplica `.dark` / `.light` no `<html>` imediatamente.
- O Backup v5 (`src/db/database.ts`) exporta/restaura as 8 tabelas Dexie **e** o objeto `uiPreferences` (`localStorage`), além de filtrar estilos oficiais intactos (`GOLD_STANDARD_STYLES`) para exportar apenas estilos customizados ou modificados.

---

## 5. UI, Tailwind & Modo Claro (`src/index.css`)

- Os componentes usam classes dark-first (`bg-slate-900`, `bg-slate-950/75`, `text-white`, etc.), mas o **Modo Claro** aplica overrides globais via seletores `html.light ...` em `src/index.css`.
- **Nunca diagnostique problemas de cor/contraste no Modo Claro olhando apenas classes Tailwind nos `.tsx`** — verifique sempre `src/index.css` primeiro.
- Classes utilitárias relevantes em `src/index.css`:
  - `.weight-pill-input`: garante fundo branco limpo nas pílulas de peso em `BalancingScreen.tsx` e `PostProduction.tsx` no Modo Claro (sobrescrevendo a regra de trilhos `.rounded-full.bg-slate-900`).
  - `.scrollbar-none`: oculta scrollbars horizontais em barras mobile.

---

## 6. Fluxo de Trabalho & Git

- **Nunca execute `git commit` ou `git push` sem pedido explícito do usuário.**
- Antes de encerrar alterações de código, rode `npm test` e `npm run build` (que inclui `tsc`).
- Customizações específicas do workspace (regras e skills de receitas/balanceamento) ficam em `.agents/rules/` e `.agents/skills/`.
