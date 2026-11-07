---
name: cadastro-receitas
description: >-
  Auditoria, balanceamento, extração de fontes (livros, PDFs escaneados, apostilas, planilhas) e cadastramento estruturado de novas receitas, pré-preparos e variegatos de gelato no catálogo oficial e banco de dados. Garante a tripartição físico-química estrita (calda base de 1.000g, infusões coadas, mesclas de pós-produção), anonimização total, cadastro bromatológico de novos insumos, elaboração de passos técnicos artesanais e migração segura no Dexie.
---

# Skill: Cadastro e Sincronização de Receitas e Compêndios de Gelato

Esta skill orienta o processo sistemático de ingestão, digitalização, verificação bromatológica e cadastramento oficial de novas coleções, compêndios e cadernos de receitas de gelato no sistema.

---

## 1. Princípios Fundamentais

### 1.1. Anonimização Total e Linguagem de Alta Gelateria
- **Regra Absoluta:** NUNCA incluir nomes próprios de autores, chefs, confeiteiros, apelidos ou marcas comerciais informais no código, dados JSON, testes ou interfaces.
- Toda instrução deve ser vertida para a terminologia técnica padrão:
  - *"Orientações do Mestre Gelatiere"*
  - *"Nota Técnica de Bancada"*
  - *"Protocolo de Infusão e Filtragem"*
  - *"Controle Físico-Químico Térmico e Emulsão"*

### 1.2. A Tripartição Físico-Química e Regra dos 1.000g
Para preservar a integridade dos cálculos do motor físico-químico (PAC, POD, Gordura, SLNG, Sólidos Totais e Água Livre):
1. **Calda Base Líquida (`ingredients`):**
   - Apenas insumos que entram na mantecadora para congelamento dinâmico.
   - **Batelada Padrão:** A soma dos pesos dos ingredientes da calda deve fechar rigorosamente em **1.000g**.
2. **Infusões Coadas e Descartadas (`preparationSteps`):**
   - Especiarias em rama (canela, cravo, anis), cascas/raspas de cítricos, grãos de café inteiros, folhas de ervas frescas (hortelã, alecrim, manjericão).
   - **JAMAIS** entram no array `ingredients` da calda líquida. Devem constar apenas nos passos operacionais com tempo e temperatura de extração.
3. **Mesclas, Variegatos e Inclusões (`variegatos`):**
   - Bolos, cookies, pedaços de torrone, avelãs/nozes picadas, flocos de chocolate (*stracciatella*), caldas e geleias de frutas incorporadas na saída da máquina.
   - **JAMAIS** somam no peso da calda base. Devem ser cadastradas como pré-preparo em `preparations.json` e vinculadas via `variegatos: [{ name, grams }]`.

---

## 2. Processo de Execução em 6 Etapas

### Etapa 1: Extração e Calibração das Fontes
- Extrair páginas (seja via texto nativo, imagens de alta resolução ou OCR com `winsdk.windows.media.ocr`).
- Conferir visualmente cada número de gramatura em relação ao scan original para evitar erros de leitura ótica (ex: 7 vs 1, 6 vs 8).
- Validar se cada receita atinge a soma exata de 1.000g.

### Etapa 2: Mapeamento Bromatológico de Insumos (`src/data/ingredients.json`)
- Verificar se todos os insumos já existem no catálogo comercial.
- Insumos ausentes (ex: licores regionais, rapadura, queijos artesanais, sementes) devem ser cadastrados com seus parâmetros bromatológicos reais:
  - `sugars`, `fat`, `msnf`, `otherSolids`, `totalSolids`, `water`, `pac`, `pod`.

### Etapa 3: Estruturação dos Pré-Preparos e Variegatos (`src/data/preparations.json`)
- Cadastrar bases intermediárias, caldas, geleias e crocantes como pré-preparos independentes com ID `prep_*`.
- Definir lista de ingredientes, rendimento percentual e passos detalhados de preparo com temperaturas de caramelização ou pasteurização.

### Etapa 4: Cadastramento das Receitas (`src/data/recipes.json`)
- Cada receita recebe ID único sequencial (ex: `rec_gir_*`), nome padronizado com sufixo do compêndio (ex: `Gelato de Pistache Puro (Gelato Irresistível)`), categoria técnica correspondente, lista de ingredientes balanceada (1000g), array `variegatos` e `preparationSteps` estruturados com categorias operacionais.

### Etapa 5: Migração Segura no Dexie (`src/db/database.ts`)
- Adicionar uma flag e bloco de sincronização versionado na inicialização do banco (`initializeSeedData`).
- Inserir novos insumos sem sobrescrever custos já customizados pelo usuário.
- Inserir novos pré-preparos e sincronizá-los como insumos disponíveis via `syncPreparationToIngredient`.
- Inserir as novas receitas preservando quaisquer dados preexistentes.

### Etapa 6: Testes Automatizados e Homologação
- Criar suíte de testes em `src/core/__tests__/` validando:
  - Todas as novas receitas presentes e ativas.
  - Soma de calda = 1000g.
  - Vínculos corretos de pré-preparos e mesclas.
  - Ausência total de nomes de autores proibidos via Regex.
- Executar e homologar:
  - `npx.cmd vitest run`
  - `npx.cmd tsc --noEmit`
  - `npm.cmd run build`
