# 🍨 Gelatio — Calculadora & Balanceamento de Gelatos Artesanais

[![Deploy to GitHub Pages](https://github.com/gbajovedi/Gelatio/actions/workflows/deploy.yml/badge.svg)](https://github.com/gbajovedi/Gelatio/actions/workflows/deploy.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-success)](https://gbajovedi.github.io/Gelatio/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)

> **Progressive Web App (PWA)** profissional para cálculo bromatológico, balanceamento termodinâmico, rotulagem regulamentar ANVISA e engenharia de custos para gelaterias artesanais e indústrias de sorvete.

👉 **Acesse o aplicativo online:** [**https://gbajovedi.github.io/Gelatio/**](https://gbajovedi.github.io/Gelatio/)

---

## 📲 Como Instalar como Aplicativo (PWA)

O **Gelatio** pode ser instalado diretamente no seu smartphone, tablet ou computador, funcionando com interface nativa em tela cheia e operação **100% offline**:

- **📱 Android (Google Chrome):** Acesse o link acima, toque no menu de **três pontinhos** no canto superior e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **🍏 iPhone / iPad (Safari):** Abra o link no Safari, toque no botão de **Compartilhar** (ícone de quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.
- **💻 Computador (Chrome / Edge):** Abra o link e clique no ícone de **computador com seta para baixo** no canto direito da barra de endereço para **"Instalar Gelatio"** (ou crie um atalho na Área de Trabalho).

> **💡 Dica para a Cozinha & Produção:** Uma vez instalado, o aplicativo abre instantaneamente e não consome internet nem precisa de Wi-Fi para você consultar, formular, imprimir ou balancear suas receitas.

---

## 📱 Visão Geral

Desenvolvido para superar em definitivo as limitações e a fragilidade das planilhas eletrônicas convencionais, o **Gelatio** é uma aplicação web moderna, ultra-rápida, reativa e **100% offline-first**.

O sistema conta com um catálogo nativo de **151 receitas balanceadas**, uma base bromatológica com **208 matérias-primas**, **16 bases e pré-preparos** e **14 estilos técnicos calibrados**, cobrindo desde o gelato clássico italiano de vitrine até sorbets alcoólicos, formulações veganas, proteicas e zero açúcar.

---

## ✨ Recursos & Funcionalidades

### ⚖️ 1. Bancada de Balanceamento Reativo & Padrão Ouro
- **Edição Dinâmica em Tempo Real:** Ajuste gramagens e insumos livremente com recálculo instantâneo de toda a matriz bromatológica.
- **14 Estilos e Perfis Bromatológicos Calibrados:**
  * *Gelatos de Leite*
  * *Gelatos de Leite com Chocolate*
  * *Gelatos de Leite com Fruta*
  * *Gelatos de Oleaginosas (Pistache, Avelã, Amendoim)*
  * *Gelatos Proteicos (Whey / Isolados)*
  * *Gelatos Zero Açúcar*
  * *Sorbets Cítricos / Frutas Ácidas*
  * *Sorbets Polposos / Frutas Densas*
  * *Sorbets de Chocolate base água*
  * *Sorbets Alcoólicos*
  * *Sorbets Zero Açúcar*
  * *Gelatos Veganos*
  * *Gelatos Alcoólicos*
  * *Sorbets Especiais*
- **Gauges Bromatológicos com Metas:** Acompanhamento visual de limites mínimos, máximos e alvos ideais para:
  * Açúcares Totais (%)
  * Gorduras Lipídicas (%)
  * Sólidos Não Gordurosos do Leite — SLNG (%)
  * Outros Sólidos (%)
  * Sólidos Totais (%)
  * POD (*Potere Dolcificante* / Dulçor)
  * PAC (*Potere Anticongelante* / Poder Anticongelante)
- **Escala de Lote em 1 Clique:** Multiplicação ou divisão proporcional instantânea da receita para qualquer tamanho de batelada (ex.: 1 kg, 3,5 kg, 5 kg ou cubas de 10 kg) e botão de normalização para 1.000 g.
- **Rótulo Automático de Alérgenos:** Detecção regulamentar em tempo real de leite/lactose, glúten (trigo, aveia, cevada) e oleaginosas (castanhas, nozes, avelã, pistache).

---

### 🏷️ 2. Rotulagem Nutricional Oficial ANVISA (RDC 429/2020 & IN 75/2020)
- **Tabela Nutricional Padronizada:** Geração automática da tabela nos moldes oficiais exigidos pela ANVISA, com colunas para **100 g**, **Porção Personalizada** e **%VD\***:
  * Valor Energético (kcal e kJ)
  * Carboidratos Totais, Açúcares Totais e **Açúcares Adicionados**
  * Proteínas
  * Gorduras Totais, Gorduras Saturadas e Gorduras Trans
  * Fibras Alimentares e Sódio (mg)
- **Selos Frontais de Lupa (FOP — Front-of-Package):**
  * Algoritmo regulamentar que avalia os teores por 100 g e exibe os selos oficiais da **Lupa ANVISA** para nutrientes em excesso: **Alto em Açúcar Adicionado**, **Alto em Gordura Saturada** e **Alto em Sódio**.
  * Chave rápida para ativar/desativar a visualização dos selos no rótulo.
- **Personalização de Porções e Embalagens:**
  * Escolha flexível do tamanho da porção (ex: 60 g / 1 bola, 100 g, etc.).
  * Seleção do tamanho da embalagem tanto em massa (**g**) quanto em volume (**ML**), calculando o número exato de porções por embalagem.
  * Declaração de Conteúdo Líquido com dupla especificação regulamentar (ex.: `500 ML (375 G)`).
- **Lista Oficial de Ingredientes:** Ordenação decrescente automática por peso e agrupamento de insumos compostos.
- **Impressão Profissional do Rótulo:** Layout otimizado para impressão de etiquetas em tamanho real ou exportação de PDF para gráficas e rotuladoras.
- **Copiar Texto:** Exportação rápida dos dados nutricionais tabulados para transferência direta para softwares de design ou fichas técnicas.

---

### 🌡️ 3. Simulador Térmico de Vitrine & Ponto de Espátula
- **Slider Térmico Interativo (-8°C a -20°C):** Ajuste a temperatura exata da sua vitrine ou freezer e visualize o comportamento físico do gelato.
- **Atalhos Rápidos de Cenário:**
  * 🏺 **Pozzetti (-11°C):** Armazenamento vedado italiano tradicional.
  * 🍨 **Vitrine Clássica (-12°C):** Exposição padrão com temperatura equilibrada.
  * ❄️ **Vitrine Aberta (-14°C):** Vitrines ventiladas com maior perda térmica.
  * 🧊 **Pote / Freezer (-18°C):** Consumo domiciliar direto do congelador.
- **Diagnóstico de Consistência:** Régua visual informando a colherabilidade (*Muito Macio*, *Macio*, *Spatolabile Ideal*, *Firme*, *Freezer*).
- **Fração Congelada em Tempo Real:** Cálculo bromatológico da porcentagem e gramatura de **gelo sólido formado** versus **xarope concentrado fluido não congelado** em qualquer temperatura.

---

### 🌀 4. Emulsão & Estimativa de Overrun (Método Italiano)
- **Equilíbrio Lipídio vs. SLNG:** Análise da matriz coloidal de proteínas do leite e gorduras emulsionadas.
- **Estimativa de Overrun (%):** Previsão matemática da aeração incorporada no batimento na produtora vertical ou horizontal (ex.: ~32% a 38% no padrão artesanal italiano).
- **Diagnóstico da Calda:** Alertas para caldas magras com aeração excessivamente rápida ou caldas sobrecarregadas de gordura com risco de amanteigamento.

---

### 📖 5. Catálogo com 151 Receitas Balanceadas
- Repositório completo de 151 receitas testadas da gelateria clássica, contemporânea e funcional.
- **Combobox com Busca Inteligente:** Pesquisa instantânea por título, estilo ou ingredientes específicos (ex.: pistache, maracujá, cacau black, mascarpone).
- Carregamento imediato na Bancada de Balanceamento com um clique.

---

### 🥄 6. Tabela de Insumos & Custos (208 Matérias-Primas)
- **Banco de Dados Bromatológico Completo:** Composição detalhada por insumo (Água, Açúcares, Gorduras, SLNG, Outros Sólidos, Proteínas, Fibras, Sódio, POD, PAC e PAC Alcoólico).
- **Gestão de Custos por Quilo (R$/Kg):** Atualize o preço das matérias-primas e veja o reflexo imediato em todas as receitas e cálculos financeiros.
- **Cadastro Personalizado:** Adicione novos insumos e pastas especiais da sua gelateria.

---

### 👨‍🍳 7. Pré-preparos & Variegatos Artesanais (16 Fórmulas)
- Fórmulas de caldas base (Base Branca, Base Amarela, Base Chocolate, Mix Zero), pastas e variegatos caseiros.
- Procedimentos detalhados de cocção, pasteurização, maturação e choque térmico.

---

### 💰 8. Engenharia de Custos, Markup & Precificação
- **Simulador de Custos Indiretos:** Rateio preciso de aluguel, energia elétrica, equipe, embalagens e marketing por kg produzido.
- **Formação de Preço de Venda:** Cálculo de preço sugerido com base na margem de lucro líquida desejada e taxas de operadoras de cartão.
- **Métricas Chave:**
  * Custo da Calda Base (R$/Kg)
  * Custo Final com Variegatos e Mesclas (R$/Kg)
  * Custo por Porção / Bola (ex: 60 g)
  * Preço de Venda Sugerido para Potes (ex: 500 ml / 500 g)

---

### 🎨 9. Interface Visual Multitema com 3 Modos
- **Alternador de Tema em 3 Fases:**
  * 🌓 **Auto:** Acompanha automaticamente a preferência do sistema operacional.
  * ☀️ **Claro (Panna Linho Gastronômico):** Fundo acolhedor e profissional em tom creme panna (`#f6f5f0`), reduzindo a fadiga ocular sob iluminação forte de laboratórios e cozinhas.
  * 🌙 **Escuro (Deep Slate):** Interface elegante em tons ardósia e âmbar (`#0f172a`), com alto contraste e economia de bateria em telas OLED.

---

### 💾 10. Sistema de Backup & Sincronização Local (.JSON)
- Armazenamento 100% offline via **IndexedDB (Dexie.js)** no próprio navegador.
- **Exportar Backup (.JSON):** Salve todas as suas receitas, alterações de insumos e configurações em um arquivo seguro.
- **Importar Backup (.JSON):** Transfira facilmente dados entre celular, tablet e notebook com opções de mesclagem ou substituição completa.
- **Restaurar Padrões de Fábrica:** Retorne à base de dados original calibrada a qualquer momento.

---

## 🎯 Parâmetros Bromatológicos Técnicos

| Parâmetro | Significado Técnico | Efeito Prático no Gelato |
| :--- | :--- | :--- |
| **POD** | *Potere Dolcificante* (Poder Adoçante) | Dulçor relativo à sacarose (sacarose = 1.0). Evita produtos excessivamente doces ou sem sabor. |
| **PAC** | *Potere Anticongelante* | Determina o abaixamento crioscópico e a firmeza na espátula em vitrine (-11°C a -14°C). |
| **Gorduras** | Lipídios (leite, creme de leite, pastas puras) | Conferem cremosidade, palatabilidade, calor na boca e desaceleram o derretimento. |
| **SLNG** | Sólidos Não Gordurosos do Leite (*MSNF*) | Proteínas e lactose que retêm água livre e formam a estrutura que estabiliza o *overrun*. |
| **Açúcares** | Sacarose, Dextrose, Glucose, Frutose, Maltitol | Equilíbrio fundamental entre maciez térmica e dulçor. |
| **Outros Sólidos** | Fibras, cacau, neutros, sólidos de frutas | Estruturam caldas de sorbet base água e evitam a cristalização de gelo perceptível. |
| **Sólidos Totais** | Matéria seca total em relação à água livre | Garante textura aveludada e evita a sensação áspera de gelo na língua. |

---

## 🛠️ Tecnologias Utilizadas

- **Interface:** [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Estilização & Temas:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Build & Bundler:** [Vite 6](https://vitejs.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Banco de Dados Offline:** [IndexedDB](https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API) gerenciado via [Dexie.js 4](https://dexie.org/)
- **Motor PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) com Service Workers e Workbox
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) automatizado para o [GitHub Pages](https://pages.github.com/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Git

### Passo a Passo

1. Clone o repositório:
```bash
git clone https://github.com/gbajovedi/Gelatio.git
cd Gelatio
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```text
http://localhost:5173
```

### Compilar para Produção (Build)
```bash
npm run build
```

---

## 👨‍🍳 Autor

- **Gabriel Ajovedi** — [@gbajovedi](https://github.com/gbajovedi)
- Repositório Oficial: [https://github.com/gbajovedi/Gelatio](https://github.com/gbajovedi/Gelatio)
- Acesso Web Online: [https://gbajovedi.github.io/Gelatio/](https://gbajovedi.github.io/Gelatio/)
