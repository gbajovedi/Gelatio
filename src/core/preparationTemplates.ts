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

export const PREPARATION_TEMPLATES: PreparationTemplate[] = [
  {
    id: 'processo_quente_tradicional',
    name: 'Processo a Quente (Pasteurização 85°C)',
    description: 'Padrão clássico italiano para gelatos de leite, cremes, chocolates e bases lácteas.',
    badge: '🔥 Clássico Alta Pasteurização',
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
    name: 'Gelato de Frutas (Calda a Quente + Fruta a Frio)',
    description: 'Para gelatos de frutas com base láctea ou iogurte. As frutas NUNCA devem ser pasteurizadas para não perderem aromas e vitaminas.',
    badge: '🍓 Fruta Fresca Sem Cozimento',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada da Calda e das Frutas',
        description: 'Pesar os insumos da calda base (leite, creme, açúcares e neutro) e reservar a porção de fruta fresca ou polpa in natura separadamente na geladeira (4°C).',
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
    name: 'Processo a Frio (Sorbets & Frutas Base Água)',
    description: 'Processo totalmente a frio para sorbets de frutas frescas, cítricos e polpas puras.',
    badge: '❄️ Processo a Frio 100%',
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
    id: 'gelato_com_mesclas_variegato',
    name: 'Gelato com Mesclagem / Variegato (Pós-Produção)',
    description: 'Inclui as etapas de calda base e a técnica correta de mesclagem na cuba durante a extração.',
    badge: '🍯 Variegatura & Mesclagem',
    steps: [
      {
        order: 1,
        title: 'Preparo e Maturação da Calda Base',
        description: 'Produzir e maturar a calda base do gelato conforme o processo clássico a quente a 85°C e maturação a 4°C por 6 a 12 horas.',
        temperature: '4°C',
        duration: '6h a 12h',
        category: 'maturacao'
      },
      {
        order: 2,
        title: 'Climatização e Preparo da Mescla (Variegato)',
        description: 'Verificar a consistência do variegato. A mescla deve estar em temperatura ambiente (18°C a 20°C) ou levemente amaciada com espátula/mixer. NUNCA utilize mescla gelada demais (quebrar a estrutura do gelato) nem quente (derreter o gelato na cuba).',
        temperature: '20°C',
        duration: '5 min',
        category: 'mesclagem'
      },
      {
        order: 3,
        title: 'Mantecação da Calda Base',
        description: 'Bater a calda base na produtora até atingir consistência estruturada e espatulável (-8.0°C).',
        temperature: '-8°C',
        duration: '10 min',
        category: 'batimento'
      },
      {
        order: 4,
        title: 'Extração com Variegatura em Camadas Onduladas',
        description: 'Ao abrir a porta de extração da produtora, intercalar camadas de gelato fresco com filetes generosos da mescla utilizando espátula italiana. Fazer movimentos em formato de ondas (marblizado) para distribuição harmônica visual e degustativa.',
        temperature: '-8°C',
        duration: '3 min',
        category: 'mesclagem'
      },
      {
        order: 5,
        title: 'Decoração Superior e Abatimento Imediato',
        description: 'Finalizar o topo da cuba com fios da mescla e decoração representativa. Enviar imediatamente ao ultracongelador (-35°C) por 15 minutos para congelar rapidamente as bordas da mescla e preservar o contraste visual.',
        temperature: '-35°C',
        duration: '15 min',
        category: 'abatimento'
      }
    ]
  }
];

/**
 * Sugere o melhor template inicial para uma receita com base na categoria,
 * nos ingredientes e na presença de mesclas/variegatos.
 */
export function suggestPreparationTemplate(recipe: Recipe): PreparationTemplate {
  const cat = (recipe.category || '').toLowerCase();
  const name = (recipe.name || '').toLowerCase();
  const hasVariegatos = Boolean(recipe.variegatos && recipe.variegatos.length > 0);
  
  const hasFruit =
    cat.includes('fruta') ||
    cat.includes('sorbet') ||
    name.includes('fruta') ||
    name.includes('morango') ||
    name.includes('limão') ||
    name.includes('maracujá') ||
    name.includes('manga') ||
    name.includes('framboesa') ||
    name.includes('amora') ||
    name.includes('abacaxi') ||
    name.includes('açaí');

  const isSorbetBaseAgua =
    cat.includes('sorbet') ||
    cat.includes('água') ||
    cat.includes('agua') ||
    name.includes('sorbet');

  if (isSorbetBaseAgua) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_sorbet')!;
  }

  if (hasFruit) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_frutas_pos_pasteurizacao')!;
  }

  if (hasVariegatos) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_com_mesclas_variegato')!;
  }

  return PREPARATION_TEMPLATES[0]; // Processo a quente tradicional
}

/**
 * Converte passos do template em instâncias com ID único para a receita.
 */
export function instantiateTemplateSteps(template: PreparationTemplate): PreparationStep[] {
  return template.steps.map((s, idx) => ({
    ...s,
    id: `step_${Date.now()}_${idx + 1}`,
    order: idx + 1
  }));
}

