import { PreparationStep, PreparationStepCategory, Recipe } from '../types/gelato';

export interface StepCategoryMeta {
  label: string;
  emoji: string;
  badgeClass: string;
  borderClass: string;
}

export const STEP_CATEGORIES_META: Record<PreparationStepCategory, StepCategoryMeta> = {
  pesagem: {
    label: 'Pesagem & Secos',
    emoji: '⚖️',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    borderClass: 'border-sky-500/40'
  },
  aquecimento: {
    label: 'Pasteurização & Calor',
    emoji: '🔥',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/40'
  },
  emulsao: {
    label: 'Emulsão & Mixer',
    emoji: '🌪️',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderClass: 'border-purple-500/40'
  },
  maturacao: {
    label: 'Maturação a Frio',
    emoji: '❄️',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    borderClass: 'border-blue-500/40'
  },
  fruta: {
    label: 'Fruta Fresca a Frio',
    emoji: '🍓',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/40'
  },
  batimento: {
    label: 'Batimento / Mantecação',
    emoji: '⚡',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'border-cyan-500/40'
  },
  mesclagem: {
    label: 'Variegatura & Mescla',
    emoji: '🍯',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    borderClass: 'border-yellow-500/40'
  },
  abatimento: {
    label: 'Abatimento Térmico',
    emoji: '🧊',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    borderClass: 'border-indigo-500/40'
  },
  outro: {
    label: 'Procedimento Geral',
    emoji: '📋',
    badgeClass: 'bg-slate-700 text-slate-300 border-slate-600',
    borderClass: 'border-slate-600'
  }
};

export interface PreparationTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  steps: Omit<PreparationStep, 'id'>[];
}

export const VARIEGATO_STEP_TEMPLATE: Omit<PreparationStep, 'id'> = {
  order: 99,
  title: 'Mesclagem / Variegatura Final (Pós-Produção)',
  description:
    'Ao retirar o gelato da sorveteira ou produtora e transferir para o pote/cuba de armazenamento, intercalar camadas de gelato fresco com filetes generosos da calda ou pasta de mesclagem (variegato em temperatura ambiente de 18°C a 20°C). Com uma espátula, fazer movimentos em forma de ondas ("marmorizado"). Finalizar o topo com fios decorativos antes de enviar ao freezer ou ultracongelador.',
  temperature: 'Ambiente / -8°C',
  duration: '3 a 5 min',
  category: 'mesclagem'
};

export const PREPARATION_TEMPLATES: PreparationTemplate[] = [
  {
    id: 'processo_quente_tradicional',
    name: 'Processo a Quente Profissional (Pasteurização 85°C)',
    description: 'Padrão clássico com pasteurizador industrial, produtora comercial e ultracongelador (-35°C).',
    badge: '🔥 Profissional Alta Pasteurização',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura Prévia de Pós',
        description: 'Pesar com precisão todos os ingredientes. Misturar previamente os açúcares sólidos (sacarose, dextrose, glucose) junto com o neutro/estabilizante em pó em um recipiente seco, garantindo dispersão homogênea e evitando grumos.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Aquecimento dos Líquidos',
        description: 'Colocar o leite e derivados líquidos no pasteurizador. Iniciar o aquecimento sob agitação branda até atingir cerca de 40°C a 45°C.',
        temperature: '45°C',
        duration: '10 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Dispersão dos Secos e Pasteurização Alta',
        description: 'Com o leite aquecido a 45°C, incorporar a mistura de açúcares e neutro sob agitação mecânica rápida. Adicionar o creme de leite e leite em pó. Elevar a temperatura até 85°C e manter por 2 minutos para hidratação das proteínas e desnaturação térmica protetora.',
        temperature: '85°C',
        duration: '2 min',
        category: 'aquecimento'
      },
      {
        order: 4,
        title: 'Resfriamento Rápido e Maturação Obrigatória',
        description: 'Resfriar a calda imediatamente no ciclo de pasteurização até 4°C. Transferir para a tina de maturação e manter entre 4°C e 5°C sob agitação lenta intermitente por no mínimo 4 a 12 horas para completa hidratação dos hidrocoloides e cristalização das gorduras lácteas.',
        temperature: '4°C',
        duration: '4h a 12h',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação / Batimento na Produtora',
        description: 'Verter a calda maturada na produtora de batimento contínuo ou descontínuo. Monitorar o tempo e a extração até atingir ponto de firmeza com temperatura de saída entre -7°C e -9°C e incorporação correta de ar (overrun clássico de ~32%).',
        temperature: '-8°C',
        duration: '8 a 12 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Abatimento e Estabilização na Vitrine',
        description: 'Extrair o gelato diretamente na cuba previamente resfriada. Levar ao ultracongelador (-35°C) por 10 a 15 minutos para formar a casquinha térmica que sela os glóbulos de ar e retarda o derretimento. Em seguida, expor na vitrine a -12°C.',
        temperature: '-12°C',
        duration: '15 min abat.',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_frutas_pos_pasteurizacao',
    name: 'Gelato de Frutas Profissional (Calda Quente + Fruta a Frio)',
    description: 'Para gelatos de frutas base láctea. Calda pasteurizada no equipamento e fruta fresca incorporada a frio.',
    badge: '🍓 Profissional Fruta a Frio',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada da Calda e das Frutas',
        description: 'Pesar os insumos da calda base láctea (leite, creme, açúcares e neutro) e reservar a porção de fruta fresca ou polpa in natura separadamente na geladeira (4°C).',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Exclusiva da Calda Base (Sem Fruta)',
        description: 'Pasteurizar apenas a calda base láctea a 85°C por 2 minutos. ATENÇÃO: As frutas NÃO devem ir ao calor da pasteurização para evitar oxidação, alteração de cor, cozimento enzimático e perda das notas aromáticas frescas.',
        temperature: '85°C',
        duration: '15 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento Completo da Calda a 4°C',
        description: 'Resfriar a calda base rapidamente no pasteurizador até atingir 4°C e aguardar estabilização térmica.',
        temperature: '4°C',
        duration: '1h a 4h',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Incorporação da Fruta a Frio com Mixer de Alta Rotação',
        description: 'Com a calda base já resfriada a 4°C, adicionar a fruta fresca ou polpa in natura. Emulsionar vigorosamente com mixer/turboliquidificador por 2 minutos para micronizar as fibras e garantir homogeneização perfeita sem elevar a temperatura.',
        temperature: '4°C',
        duration: '3 min',
        category: 'fruta'
      },
      {
        order: 5,
        title: 'Mantecação Rápida na Produtora',
        description: 'Levar a mistura fresca imediatamente à produtora de gelato. Bater até o ponto de espatulabilidade ideal (-7.5°C a -8.5°C).',
        temperature: '-8°C',
        duration: '8 a 10 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Abatimento e Apresentação',
        description: 'Extrair na cuba e abater por 10 minutos a -35°C no ultracongelador antes de colocar na vitrine de atendimento a -12°C.',
        temperature: '-12°C',
        duration: '10 min',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'processo_frio_sorbet',
    name: 'Processo a Frio Profissional (Sorbets & Base Água)',
    description: 'Processo 100% a frio com turboliquidificador industrial, produtora comercial e ultracongelador.',
    badge: '❄️ Profissional Processo a Frio',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura de Pós Secos',
        description: 'Pesar água, açúcares (sacarose, dextrose, maltodextrina) e o neutro para sorbet (estabilizante à base de alfarroba, guar e carboximetilcelulose). Misturar secos homogeneamente.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Dissolução a Frio e Homogeneização com Mixer',
        description: 'Despejar os pós na água sob agitação de alta rotação (turboliquidificador) por 2 a 3 minutos para hidratação mecânica a frio dos hidrocoloides, formando um xarope base límpido e sem grumos.',
        temperature: 'Ambiente',
        duration: '3 min',
        category: 'emulsao'
      },
      {
        order: 3,
        title: 'Incorporação da Fruta Fresca ou Suco',
        description: 'Adicionar a polpa de fruta in natura, suco cítrico ou frutas vermelhas ao xarope base a frio. Bater brevemente para integrar sem gerar espuma excessiva.',
        temperature: '4°C a 10°C',
        duration: '2 min',
        category: 'fruta'
      },
      {
        order: 4,
        title: 'Repouso Técnico sob Refrigeração',
        description: 'Deixar a mistura descansar na geladeira a 4°C por 30 a 60 minutos para hidratação das gomas e liberação de pectina natural da fruta.',
        temperature: '4°C',
        duration: '45 min',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação e Extração',
        description: 'Colocar na produtora e bater até consistência aveludada (-7.0°C a -8.0°C). Sorbets exigem atenção ao tempo de congelamento para não criarem blocos duros.',
        temperature: '-7.5°C',
        duration: '8 a 10 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Abatimento Superficial e Vitrine',
        description: 'Extrair na cuba e abater por 10 minutos a -35°C para estabilizar a água livre superficial. Armazenar na vitrine entre -12°C e -13°C.',
        temperature: '-12.5°C',
        duration: '10 min',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_caseiro_tradicional',
    name: 'Gelato Caseiro Tradicional (Sorveteira Doméstica)',
    description: 'Para cozinhas domésticas e sorveteiras como a EOS003. Pasteurização no fogão e resfriamento em banho-maria invertido.',
    badge: '🏠 Caseiro Tradicional (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos',
        description: 'Pesar com precisão os ingredientes na balança digital de cozinha. Em um bowl seco, misturar previamente o açúcar, dextrose e o neutro/liga neutra em pó para dispersão homogênea, evitando grumos.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Caseira no Fogão',
        description: 'Em panela de fundo grosso, aquecer o leite e derivados líquidos em fogo médio, mexendo com fuê. Aos 40°C-45°C, adicionar os secos em chuva, mexendo com vigor. Adicionar o creme de leite e leite em pó. Aquecer até 85°C (acompanhando com termômetro culinário) e manter nessa temperatura por 1 a 2 minutos sem ferver.',
        temperature: '85°C',
        duration: '12 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento Rápido em Banho-Maria Invertido',
        description: 'Retirar do fogo e apoiar o bowl/panela sobre uma bacia com água fria, bastante gelo e sal grosso (banho-maria invertido). Mexer com o fuê para acelerar a queda de temperatura até menos de 10°C rapidamente, ou transferir para geladeira/freezer até atingir 4°C.',
        temperature: '10°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Maturação na Geladeira Doméstica',
        description: 'Cobrir o recipiente com plástico filme em contato com a superfície da calda para não criar película. Guardar na parte mais fria da geladeira comum (4°C) por no mínimo 4 horas (idealmente 6h a 12h) para hidratação das proteínas lácteas e estabilizantes.',
        temperature: '4°C',
        duration: '4h a 12h',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Ligar a sorveteira doméstica previamente para pré-resfriar o compressor. Despejar a calda gelada (4°C) e bater no ciclo de 30 a 45 minutos até que o gelato ganhe corpo firme, textura aveludada e a pá comece a desacelerar pela consistência.',
        temperature: '-7°C',
        duration: '30 a 45 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Transferir o gelato com espátula de silicone para um pote hermético pré-resfriado. Levar ao freezer doméstico (-18°C) por 2 a 4 horas para a água remanescente congelar e atingir a consistência ideal de corte e serviço.',
        temperature: '-18°C',
        duration: '2h a 4h',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_caseiro_frutas',
    name: 'Gelato Caseiro de Frutas (Sorveteira Doméstica + Fruta a Frio)',
    description: 'Para bases de leite ou iogurte com frutas frescas na sorveteira doméstica. Frutas frescas nunca vão ao fogão.',
    badge: '🍓 Caseiro Frutas (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada da Calda e Frutas',
        description: 'Pesar os insumos da calda base láctea (leite, creme, açúcares e neutro) e reservar as frutas frescas limpas e higienizadas na geladeira a 4°C.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização da Calda Base no Fogão (Sem Fruta)',
        description: 'Aquecer a calda láctea no fogão até 85°C por 1 a 2 minutos com fuê. ATENÇÃO: As frutas frescas NUNCA devem ir ao fogo para não cozinhá-las, não oxidar a cor natural e não perder os óleos essenciais e o aroma fresco.',
        temperature: '85°C',
        duration: '10 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento da Calda (Banho-Maria Invertido)',
        description: 'Resfriar a calda base quente no bowl de inox sobre água com gelo (banho-maria invertido) e levar à geladeira até que atinja 4°C de temperatura interna.',
        temperature: '4°C',
        duration: '20 min',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Processamento da Fruta & Incorporação a Frio',
        description: 'Bater as frutas geladas com mixer de mão ou liquidificador até purê fino. Incorporar o purê à calda base fria (4°C) imediatamente antes de colocar na sorveteira, misturando bem com fuê.',
        temperature: '4°C',
        duration: '3 min',
        category: 'fruta'
      },
      {
        order: 5,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Verter a mistura na sorveteira caseira imediatamente após a homogeneização. Bater por 30 a 40 minutos até atingir consistência densa e aveludada.',
        temperature: '-7°C',
        duration: '30 a 40 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Acondicionar em pote hermético e manter no freezer a -18°C por 2 a 3 horas antes de servir.',
        temperature: '-18°C',
        duration: '2h a 3h',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'processo_frio_caseiro',
    name: 'Processo a Frio Caseiro (Sorbets & Base Água)',
    description: 'Roteiro 100% a frio sem fogão para sorbets de frutas frescas e cítricos em sorveteiras domésticas.',
    badge: '❄️ Caseiro Sorbet a Frio (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos a Frio',
        description: 'Pesar água filtrada gelada, açúcares (sacarose, dextrose) e o neutro para sorbet / liga neutra. Misturar os pós secos em tigela.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Dissolução no Liquidificador Doméstico',
        description: 'Colocar a água no copo do liquidificador e despejar a mistura de secos. Bater na velocidade média/alta por 1 a 2 minutos para dissolução total dos açúcares e hidratação mecânica a frio das gomas, sem grumos.',
        temperature: 'Ambiente',
        duration: '2 min',
        category: 'emulsao'
      },
      {
        order: 3,
        title: 'Adição do Suco ou Polpa de Fruta Fresca',
        description: 'Adicionar as frutas frescas higienizadas ou polpas in natura geladas ao xarope base no liquidificador. Bater brevemente (modo pulsar) para integrar sem gerar espuma excessiva.',
        temperature: '4°C a 10°C',
        duration: '2 min',
        category: 'fruta'
      },
      {
        order: 4,
        title: 'Repouso Técnico na Geladeira',
        description: 'Deixar a calda repousar na geladeira a 4°C por 30 a 60 minutos para eliminação de microbolhas de ar e hidratação da pectina natural da fruta.',
        temperature: '4°C',
        duration: '30 a 60 min',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Despejar a calda gelada na sorveteira caseira ligada. Bater até consistência macia, brilhante e uniforme (geralmente entre 25 e 35 minutos).',
        temperature: '-7°C',
        duration: '25 a 35 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Transferir o sorbet para pote hermético e colocar no freezer (-18°C) por 1h30 a 3 horas para estabilização final.',
        temperature: '-18°C',
        duration: '2h',
        category: 'abatimento'
      }
    ]
  }
];

/**
 * Sugere o melhor template inicial para uma receita com base na categoria,
 * nos ingredientes e nas diretrizes de formulação.
 */
export function suggestPreparationTemplate(recipe: Recipe): PreparationTemplate {
  const cat = (recipe.category || '').toLowerCase();
  const name = (recipe.name || '').toLowerCase();
  const targetStyle = (recipe.targetStyle || '').toLowerCase();

  const isSorbetBaseAgua =
    cat.includes('sorbet') ||
    cat.includes('água') ||
    cat.includes('agua') ||
    targetStyle.includes('sorbet') ||
    name.includes('sorbet');

  const hasFruit =
    cat.includes('fruta') ||
    targetStyle.includes('fruta') ||
    name.includes('fruta') ||
    name.includes('morango') ||
    name.includes('limão') ||
    name.includes('maracujá') ||
    name.includes('manga') ||
    name.includes('framboesa') ||
    name.includes('amora') ||
    name.includes('abacaxi') ||
    name.includes('açaí');

  const isCaseiro =
    name.includes('caseir') ||
    name.includes('doméstic') ||
    name.includes('eos') ||
    cat.includes('caseir');

  if (isCaseiro) {
    if (isSorbetBaseAgua) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_caseiro')!;
    }
    if (hasFruit) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_frutas')!;
    }
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_tradicional')!;
  }

  if (isSorbetBaseAgua) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_sorbet')!;
  }

  if (hasFruit) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_frutas_pos_pasteurizacao')!;
  }

  return PREPARATION_TEMPLATES[0]; // Processo a quente tradicional
}

/**
 * Converte passos do template em instâncias com ID único para a receita,
 * opcionalmente acoplando o passo final de mesclagem / variegatura.
 */
export function instantiateTemplateSteps(
  template: PreparationTemplate,
  includeVariegato = false
): PreparationStep[] {
  const steps: PreparationStep[] = template.steps.map((s, idx) => ({
    ...s,
    id: `step_${Date.now()}_${idx + 1}`,
    order: idx + 1
  }));

  if (includeVariegato) {
    steps.push({
      ...VARIEGATO_STEP_TEMPLATE,
      id: `step_${Date.now()}_${steps.length + 1}`,
      order: steps.length + 1
    });
  }

  return steps;
}

