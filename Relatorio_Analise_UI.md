# Relatório de análise da interface — Gelatio

**Data:** 3 de novembro de 2026  
**Escopo:** interface principal, seis áreas de navegação, módulos internos de estoque, diálogos, temas, responsividade e acessibilidade.  
**Alterações no produto:** nenhuma alteração de código. Este documento registra os achados e recomendações.

## Síntese

O Gelatio reúne fluxos de trabalho relevantes para uma gelateria: formular e balancear receitas, consultar fichas de produção, administrar insumos, preparar bases, precificar, lançar produção e registrar vendas. Há bons recursos de contexto, cálculos atualizados durante a edição, filtros úteis, mensagens de estado em algumas operações, modo claro/escuro e grades que se reorganizam em telas menores.

A interface concentra muitas funções e dados por tela. Isso é mais evidente no balanceamento, no cadastro de insumos e na precificação. No desktop essa densidade pode servir a usuários experientes; no celular, em formulários extensos, tabelas largas e navegação horizontal, ela tende a aumentar rolagem, esforço de leitura e chance de perder o contexto.

**Prioridades recomendadas:** proteger edições não salvas e tornar explícitas as premissas de rendimento; corrigir barreiras de acessibilidade e o transbordamento móvel observado; e validar as oportunidades de simplificação e carregamento antes de priorizar mudanças maiores.

## Método e limite da análise

Revisei a estrutura de navegação, componentes React, estilos globais e padrões de controles e mensagens nos principais fluxos. Também inspecionei visualmente a versão publicada em desktop e em viewport móvel de 390 px, nas áreas de balanceamento e catálogo. Na tela de balanceamento móvel, a largura do documento chegou a 477 px para um viewport de 390 px; no catálogo, não houve o mesmo transbordamento.

A versão publicada pode divergir do estado atual do código local; usei-a para observações visuais, não para confirmar todos os detalhes internos. As demais áreas foram avaliadas principalmente por leitura estática. Não foi feita uma auditoria completa com leitor de tela, teclado, contraste automatizado, todos os tamanhos de tela ou testes de ponta a ponta. O relatório separa observações verificadas de riscos inferidos; não rodei testes de software, pois não houve alteração de código.

## Aspectos positivos

- A navegação separa claramente as áreas centrais do produto; Estoque ainda agrupa estoque atual, PDV, produção e DRE.
- A bancada de balanceamento mantém receita, estilo, metas, composição, custos e simulação no mesmo fluxo, com alterações numéricas recalculadas em tempo real.
- Na versão publicada, a tela desktop de balanceamento apresenta uma identidade visual consistente, separa os grupos de informação por cartões e destaca o status da receita e as ações principais.
- O catálogo de receitas combina busca, categoria, estado de balanceamento e ordenação, além de oferecer ações de consulta, balanceamento e produção.
- Insumos e pré-preparos mostram dados técnicos e custos perto dos controles que os alteram.
- Há estados vazios, contagens e confirmações em partes importantes dos fluxos, e o CSS prevê estilos próprios para impressão do rótulo nutricional.
- O uso de grades responsivas em cartões e formulários fornece uma base útil para telas menores.

## Achados e oportunidades

**Critérios de prioridade:** P1 indica risco direto de acessibilidade, perda de trabalho ou interpretação de resultado importante; P2 indica fricção recorrente ou impacto provável que merece validação; P3 indica melhoria de conveniência.

### P1 — O viewport restringe o zoom manual

O viewport de `index.html:7` declara `maximum-scale=1.0` e `user-scalable=no`, uma restrição que pode impedir ou limitar o zoom manual em alguns navegadores móveis. O comportamento pode variar conforme navegador e sistema operacional; não foi testado em dispositivos reais.

**Melhoria:** remover a restrição de zoom e validar redimensionamento de texto até 200% e reflow em viewport estreito, preservando controles e conteúdo.

### P1 — Interações e diálogos precisam de semântica e foco acessíveis

O controle de tema já usa rótulos acessíveis e `aria-pressed` (`ThemeToggle.tsx:69–115`), mas esse padrão não aparece de forma consistente nos demais controles. A seleção atual das abas e de vários filtros é comunicada principalmente por cor; os botões de navegação não expõem estado selecionado. A marca é uma `div` clicável (`Navbar.tsx:27–35`), e o cartão de receita é uma `div` clicável (`RecipeList.tsx:678–684`), sem comportamento de teclado equivalente ao de um botão ou link.

Os diálogos personalizados usam overlays (`StyleSettingsModal.tsx:415–416`, `SaveRecipeModal.tsx:68` e `ImportExportModal.tsx:202`), mas não declaram `role="dialog"`, `aria-modal` ou um título associado. Também não encontrei `aria-current`, `aria-live`, `htmlFor` ou regras `:focus-visible` no código pesquisado. A ausência de `htmlFor` não prova, por si só, que todo campo esteja sem rótulo associado: alguns podem usar associação por aninhamento. Há vários campos com `focus:outline-none`, o que torna importante garantir foco visível alternativo nesses controles.

**Melhoria:** auditar os controles por teclado e leitor de tela; padronizar elementos semânticos, estado selecionado e nomes acessíveis; verificar a associação de cada rótulo ao campo; e completar os diálogos com semântica, gestão de foco, Escape e retorno do foco ao disparador. Anunciar erros e resultados dinâmicos quando necessário e manter um indicador de foco evidente.

### P2 — Módulos das abas inativas são carregados na inicialização

`App.tsx:184–238` mantém todas as áreas no React e oculta as inativas com `display: none`. Como os componentes lazy também são renderizados, seus imports dinâmicos são iniciados mesmo antes de o usuário abrir as respectivas abas. Isso reduz o benefício esperado de carregar os módulos sob demanda e pode inicializar telas e ouvintes sem necessidade. Não medi o efeito em tempo de carregamento ou uso de memória; portanto, o impacto perceptível para o usuário ainda precisa ser confirmado.

**Melhoria:** medir o carregamento inicial e, se houver benefício relevante, carregar a aba ativa e as demais sob demanda. Se os módulos forem desmontados, preservar rascunhos e estado de tela quando necessário.

### P1 — Alterações não salvas podem ser perdidas ao recarregar ou fechar

A bancada indica quando há edições ativas e confirma algumas ações internas que descartam alterações, mas não encontrei proteção para recarregar/fechar a página. O identificador da receita é persistido; as alterações ainda não salvas da fórmula não são persistidas junto com ele. Assim, atualizar a página ou fechar a aba pode descartar o trabalho sem aviso.

**Melhoria:** avisar ao sair/recarregar quando houver alterações pendentes e oferecer salvamento de rascunho recuperável. O aviso deve desaparecer após salvar ou descartar explicitamente as alterações. A navegação entre abas da aplicação mantém os módulos montados no código atual, então o risco observado é especialmente em saídas que desmontem/reiniciem a aplicação.

### P1 — “Rendimento exato” sugere precisão que a estimativa não garante

O card de emulsão apresenta o overrun como estimado, mas o simulador descreve “rendimento exato” baseado na “aeração real”. Na implementação local, o valor inicial vem de uma estimativa heurística da composição e o usuário pode ajustá-lo manualmente; não há medição da produtora nessa tela. Como esse número influencia quantidade de potes e simulação financeira, a diferença entre medido e estimado deve ficar explícita.

**Melhoria:** rotular o resultado como estimativa enquanto não houver calibração com dados medidos; expor as premissas relevantes (densidade, overrun da calda e contribuição volumétrica das mesclas) e permitir registrar um overrun medido por equipamento/processo. Evitar apresentar precisão decimal ou “exato” sem essa calibração.

### P2 — Telas densas podem dificultar a priorização das tarefas

A bancada reúne ações de receita, filtros de estilo, metas, preset, tabela de ingredientes, lote, custos e simuladores (`BalancingScreen.tsx:520–715` em diante). A precificação reúne custos fixos em cinco grupos, rateio, formação de preço, quatro modalidades de pagamento e comparativos (`PricingCalculator.tsx:486–516`, `:893–935`, `:1109–1170` e `:1370–1498`). O cadastro de insumo também combina preço, composição, sólidos/água e alérgenos num formulário longo (`IngredientManager.tsx:518–1150`). Essa concentração é verificável no código, mas não medi tempo de conclusão, erros ou dificuldade com usuários; trato-a como oportunidade de usabilidade a validar, não como falha comprovada.

**Melhoria:** organizar os fluxos por etapas ou blocos recolhíveis, com o caminho principal aberto por padrão e ajustes técnicos/avançados sob demanda. Manter um resumo de resultado visível (custo, lote, estado de balanceamento ou preço sugerido) e indicar claramente o que é obrigatório, opcional ou avançado.

### P2 — Tabelas e navegação horizontal exigem cuidado no celular

A navegação compacta usa rolagem horizontal (`Navbar.tsx:113–126`), e algumas áreas contêm tabelas largas dentro de `overflow-x-auto`, como insumos com 11 colunas (`IngredientManager.tsx:384–399`), vendas com 9 (`PosSalesScreen.tsx:458–470`) e estoque/produção. No teste visual da versão publicada, o balanceamento em viewport de 390 px expandiu a largura do documento para 477 px, forçando rolagem horizontal da página; no catálogo, a largura medida permaneceu dentro do viewport. Portanto, o transbordamento é específico de conteúdo/tela e precisa ser localizado e corrigido sem ocultar dados. A navegação horizontal também deixa as abas seguintes parcialmente fora da área visível, e a barra sticky do topo ocupa duas linhas em telas menores.

**Melhoria:** em mobile, eliminar o transbordamento do documento no balanceamento; apresentar dados prioritários em cartões ou linhas resumidas com detalhe sob demanda; manter apenas colunas essenciais e fixar a primeira coluna quando a rolagem lateral da tabela continuar necessária. Dar indicação visual de conteúdo lateral e avaliar uma navegação móvel mais compacta, sem retirar acesso às seis áreas.

### P2 — Há textos e metadados muito pequenos para leitura contínua

Há textos de 9 a 11 px em precificação, estoque, pré-preparos e PDV (por exemplo, `PricingCalculator.tsx:905–945`, `:1375–1492`, `PosSalesScreen.tsx:192–202` e `PrePreparosList.tsx` nos cartões de perfil). Parte deles é metadado secundário; o tamanho, isoladamente, não comprova problema de leitura. O risco é maior quando informação operacional ou necessária para tomar decisão usa esses tamanhos, especialmente em telas pequenas.

**Melhoria:** validar a legibilidade de rótulos e instruções em mobile e com ampliação; aumentar os textos funcionais que falharem nessa avaliação e reservar tamanhos menores a metadados secundários.

### P2 — Feedback depende de diálogos nativos e varia entre módulos

Há operações que usam `window.alert` e `window.confirm` para sucesso, erro, exclusão ou estorno (`ProductionScreen.tsx`, `PosSalesScreen.tsx`, `PrePreparosList.tsx` e outros). Esses diálogos interrompem o contexto, têm aparência controlada pelo navegador e oferecem pouca orientação junto ao item alterado. Backup e restauração também aparecem dentro do mesmo diálogo de importação/exportação (`ImportExportModal.tsx:504–624`), embora a restauração afete dados personalizados.

**Melhoria:** usar notificações consistentes de sucesso/erro e confirmação inline contextual para operações comuns. Para substituir dados ou restaurar padrões, manter uma etapa explícita de confirmação que mostre o alcance da ação e como recuperar os dados (por exemplo, exportar backup antes).

### Observação técnica — Implementação do tema claro

`src/index.css:60–778` contém muitas regras `html.light` que sobrescrevem fundos, textos, bordas, cores de estado e componentes específicos. Isso é principalmente uma questão de manutenibilidade; sem um defeito visual ou de contraste confirmado, não deve ser apresentado como problema de UX atual.

**Possível melhoria:** se a auditoria visual/automatizada encontrar inconsistências entre temas, considerar consolidar superfícies, texto, bordas, foco e estados semânticos em tokens, migrando por etapas.

### P2 — A apresentação de números parece inconsistente para o público brasileiro

Alguns campos usam placeholder `0,00` (como no cadastro de insumo), enquanto outros usam `0.00` (`PricingCalculator.tsx`, por exemplo `:543`, `:1161` e `PosSalesScreen.tsx:335`). Isso torna o formato apresentado inconsistente. Não confirmei se a entrada com vírgula ou ponto é interpretada incorretamente; portanto, o problema de entrada é uma hipótese a testar, não um defeito constatado.

**Melhoria:** padronizar moeda, decimal e agrupamento para pt-BR e testar a entrada com vírgula e ponto antes de concluir que há falha funcional.

### P3 — Filtros avançados do catálogo competem visualmente com a busca

O catálogo apresenta busca, metodologia de fórmula, estado de balanceamento, categorias, contagens, ordenação e metas técnicas antes da grade de cartões (`RecipeList.tsx:390–669`). Os recursos são úteis, mas todos ficam expostos ao mesmo tempo e ocupam espaço antes dos resultados.

**Melhoria:** manter busca e filtros mais usados visíveis; agrupar os demais em “Filtros” com contagem de filtros ativos, resumo removível e ação clara de limpar. Garantir que contagens e estado selecionado também sejam anunciados a leitores de tela.

## Revisão por área

| Área | O que já funciona bem | Melhor oportunidade |
|---|---|---|
| Balanceamento | Contexto da receita, metas e composição na mesma bancada; escala de lote e feedback visual. | Corrigir o transbordamento horizontal móvel; proteger edições pendentes; distinguir estimativa de medição no overrun/rendimento; resumir resultados prioritários. |
| Receitas | Busca por sabor/insumo, filtros, ordenação, contagem e ações ligadas a consulta, balanceamento e produção. | Reduzir ruído inicial dos filtros; tornar o cartão acessível por teclado e separar melhor o clique de abrir ficha das ações de cada cartão. |
| Insumos | Busca e categorias, edição rápida de custo, dados bromatológicos e declaração de alérgenos. | Melhorar apresentação mobile da tabela e dividir o formulário de cadastro em grupos curtos com validação junto ao campo. |
| Pré-preparos | Busca, cadastro/edição, perfil técnico e sincronização de insumos. | Reduzir metadados minúsculos e separar informação de consulta da ação de sincronizar toda a biblioteca. |
| Financeiro | Entradas detalhadas, rateio, métodos de formação de preço e comparação por pagamento. | Priorizar resultado e premissas principais; recolher custos raros/avançados e padronizar apresentação numérica pt-BR. |
| Estoque e PDV | KPIs, filtros de estoque, produção, venda, histórico e DRE numa área coesa. | Em telas estreitas, reduzir dependência de tabelas horizontais e dar mais espaço aos controles críticos de venda/produção. |
| Backup e rótulo | Exportação/importação com modos descritos; personalização de porção e impressão do rótulo. | Dar semântica/foco correto aos diálogos e reforçar a confirmação de substituição/restauração perto da ação. |

## Sequência sugerida

1. **Evitar perda de trabalho e interpretações erradas:** proteger edições pendentes e diferenciar valores estimados de medidos, especialmente no rendimento e na precificação.
2. **Acessibilidade básica:** liberar zoom, foco visível, semântica de seleção/abas, campos rotulados e diálogos acessíveis.
3. **Legibilidade e mobile:** corrigir o transbordamento medido no balanceamento, adaptar tabelas, compactar navegação e priorizar controles essenciais em telas estreitas.
4. **Fluxos densos:** reorganizar precificação, cadastro de insumos e bancada em blocos progressivos; manter resumo de resultados em destaque.
5. **Feedback:** padronizar mensagens de sucesso/erro e confirmações contextuais para ações que alteram ou substituem dados.
6. **Carregamento:** medir o impacto de carregar as abas inativas e só então decidir sobre montagem sob demanda, preservando rascunhos quando necessário.
7. **Temas e validação:** conferir contraste e consistência em dark/light antes de decidir se a migração para tokens visuais se justifica; revisar também desktop/mobile, teclado, zoom e impressão.

## Arquivos de referência

- `index.html:7` — restrição de zoom móvel.
- `src/App.tsx:184–238` — painéis mantidos no DOM com `display: none`.
- `src/components/Balanceamento/BalancingScreen.tsx:162, 335, 472, 501` — sinalização/estado de alterações pendentes; não há guarda de saída/recarregamento encontrada no código pesquisado.
- `src/core/calculator.ts:326–332, 393–419` e `src/components/Balanceamento/ProfitSimulator.tsx:169–186, 344–347` — estimativa de overrun, projeção de volume e texto de rendimento “exato”.
- `src/components/Navbar.tsx:27–35, 41–126` — marca clicável, navegação desktop e barra horizontal móvel.
- `src/components/Receitas/RecipeList.tsx:390–669, 678–684` — controles do catálogo e cartão clicável.
- `src/components/Ingredientes/IngredientManager.tsx:384–399, 518–1150` — tabela e formulário de insumos.
- `src/components/Financeiro/PricingCalculator.tsx:486–516, 893–935, 1109–1170, 1370–1498` — custos, rateio e parâmetros de pagamento.
- `src/components/Estoque/PosSalesScreen.tsx:210–235, 297–427, 458–470` — fluxo de PDV e histórico.
- `src/components/Balanceamento/StyleSettingsModal.tsx:415–416`, `src/components/Balanceamento/SaveRecipeModal.tsx:68` e `src/components/ImportExport/ImportExportModal.tsx:202` — overlays de diálogo.
- `src/index.css:60–778` — substituições do tema claro; `:779–975` — regras de impressão.
