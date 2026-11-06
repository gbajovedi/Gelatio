---
name: revisao-receitas
description: >-
  Auditoria, revisão e sincronização técnica de receitas de gelato a partir de fontes externas (livros, PDFs, apostilas).
  Garante a separação físico-química estrita entre Calda Base (ingredientes), Infusões Coadas (modo de preparo) e Mesclas/Variegatos (pós-produção),
  o cadastro de novos pré-preparos e variegatos no catálogo e banco de dados, a elaboração de passos artesanais específicos de preparo,
  anonimização total (sem menção a autores ou referências informais), e a elaboração prévia obrigatória de plano de ação e relatório comparativo.
---

# Skill: Revisão e Auditoria Técnica de Receitas de Gelato

Esta skill orienta o processo completo de auditoria, higienização físico-química, estruturação e sincronização de receitas provenientes de fontes externas (PDFs, cadernos técnicos, livros, apostilas) com a base de dados e catálogo do sistema.

---

## 1. Princípios Inegociáveis

### 1.1. Anonimização e Terminologia Técnica Estrita
- **NUNCA** citar nomes próprios de autores, apelidos, fontes comerciais informais ou marcas pessoais (ex: "Dica do Autor X", "Método do Fulano").
- Toda e qualquer recomendação prática deve ser convertida em linguagem profissional de gelateria artesanal:
  - *"Orientações do Mestre Gelatiere"*
  - *"Nota Técnica de Bancada"*
  - *"Protocolo de Infusão e Coagem"*
  - *"Controle Físico-Químico da Emulsão"*

### 1.2. A Tripartição Físico-Química do Gelato
Para não comprometer os cálculos matemáticos de balanceamento (PAC, POD, Gordura, Sólidos Não Gordurosos do Leite - SNG, e Extrato Seco Total), cada componente de uma receita deve ser rigorosamente classificado em uma de três categorias:

| Categoria | Destino no Sistema | Regra de Ouro | Impacto no Balanceamento |
| :--- | :--- | :--- | :--- |
| **A. Calda Base Líquida** | `ingredients` da receita | Apenas insumos que entram na mantecadora dissolvidos ou emulsionados na fase líquida. | Define 100% dos parâmetros físico-químicos (PAC, POD, etc.). A soma dos pesos deve corresponder à batelada líquida (ex: 1000g). |
| **B. Infusões Coadas e Descartadas** | `preparationSteps` da receita | Insumos botânicos sólidos (grãos de café inteiros, raspas de cítricos, paus de canela, especiarias) macerados a quente ou a frio e **coados antes da mantecação**. | **JAMAIS** entram no array `ingredients`. Devem constar apenas nas instruções descritivas de temperatura, tempo de infusão e filtragem. |
| **C. Mesclas, Variegatos e Inclusões** | `variegatos` da receita | Insumos incorporados após o batimento ou na saída da máquina (chocolate para flocagem *stracciatella*, cookies, brownies, caldas, doce de leite). | **JAMAIS** entram no array `ingredients` da calda líquida. Devem ser cadastrados como pré-preparo/variegato e vinculados via array `variegatos: [{ name, grams }]`. |

---

## 2. Fluxo de Execução em Duas Fases

### Fase 1: Auditoria, Relatório Técnico & Planejamento (Obrigatório)
Antes de alterar qualquer linha de código ou base de dados:
1. **Leitura e Extração**:
   - Analisar o documento fonte (ex: arquivos em `Fontes/`).
   - Mapear todas as formulações e cruzar com os IDs existentes em `src/data/recipes.json`.
2. **Diagnóstico Físico-Químico**:
   - Verificar se há ingredientes cadastrados na calda que deveriam ser infusões (remover da calda e documentar no modo de preparo).
   - Verificar se há mesclas cadastradas na calda (remover da calda e transferir para `variegatos`).
   - Identificar novos pré-preparos ou variegatos que precisam de formulação própria em `src/data/preparations.json`.
3. **Elaboração do Relatório & Plano de Ação**:
   - Criar um artefato markdown na pasta de brain contendo a tabela comparativa de todas as receitas auditadas, novos pré-preparos a cadastrar e passos de migração.
   - Configurar `ArtifactMetadata` com `RequestFeedback: true` e `UserFacing: true`.
   - **Aguardar a aprovação expressa do usuário** antes de passar para a Fase 2.

---

### Fase 2: Implementação e Sincronização

1. **Cadastramento de Pré-Preparos e Variegatos (`src/data/preparations.json`)**:
   - Cada novo insumo de pós-produção ou base intermediária deve ser cadastrado com ID único (`prep_*`), categoria apropriada (`variegato`, `cozimento`, `desidratado`, etc.), lista completa de ingredientes com gramas, custos, rendimento percentual e `preparationSteps` estruturados.
2. **Atualização do Catálogo de Receitas (`src/data/recipes.json`)**:
   - Ajustar formulação da calda quando houver correção de ingredientes.
   - Adicionar o array `variegatos` com nome e gramatura correspondente.
   - Substituir o modo de preparo genérico por `preparationSteps` específicos e detalhados para receitas com técnicas singulares (ex: caramelização no forno, queijos pós-pasteurização, redução de sucos, infusões a quente/frio, cocção prolongada de amidos).
3. **Migração do Banco de Dados Local (Dexie em `src/db/database.ts`)**:
   - Criar uma nova migração versionada (ex: `recipes_direto_ao_ponto_refinement_vX`) no array de migrações do Dexie.
   - Popular os novos pré-preparos em `db.preparations`.
   - Sincronizar os pré-preparos na tabela de ingredientes via `syncPreparationToIngredient`.
   - Atualizar `preparationSteps` e `variegatos` nas receitas existentes sem sobrescrever customizações do usuário quando aplicável.
4. **Verificação Automatizada de Qualidade**:
   - Criar/atualizar testes em `src/core/__tests__/` validando:
     - Existência e completude dos novos pré-preparos.
     - Separação correta de calda vs. mesclas.
     - **Ausência absoluta** de menções a nomes de autores ou referências proibidas em todos os dados.
   - Executar os comandos:
     - `npm.cmd test`
     - `npx.cmd tsc --noEmit`
     - `npm.cmd run build`

