import { PreparationStep, PreparationStepCategory } from '../types/gelato';

/**
 * Passos operacionais canônicos já mapeados e enriquecidos para os pré-preparos
 * oficiais existentes no catálogo de fábrica.
 */
export const DEFAULT_PREPARATION_STEPS_MAP: Record<string, Omit<PreparationStep, 'id'>[]> = {
  prep_pudim: [
    {
      order: 1,
      title: 'Caramelo na Forma',
      category: 'aquecimento',
      temperature: '165°C',
      duration: '10 min',
      description:
        'Em fogo brando, derreter o açúcar cristal diretamente na forma com furo central (ou em panela) até formar um caramelo dourado homogêneo. Espalhar cuidadosamente pelas paredes e pelo cone central da forma. Deixar esfriar até endurecer.'
    },
    {
      order: 2,
      title: 'Homogeneização da Mistura',
      category: 'emulsao',
      temperature: 'Ambiente',
      duration: '3 min',
      description:
        'Peneirar as gemas e ovos para retirar a película. Juntar o leite condensado e o leite integral. Misturar delicadamente com fuê ou pulsar brevemente no liquidificador em baixa rotação para não incorporar ar excessivo. Verter com cuidado na forma caramelizada.'
    },
    {
      order: 3,
      title: 'Cocção no Forno em Banho-Maria',
      category: 'aquecimento',
      temperature: '180°C',
      duration: '1h 50 min',
      description:
        'Cobrir a forma hermeticamente com papel alumínio (face brilhante voltada para dentro). Posicionar dentro de uma assadeira com água fervente (banho-maria). Assar em forno pré-aquecido a 180°C por cerca de 1 hora e 50 minutos até que o centro esteja firme com leve balanço gelatinoso.'
    },
    {
      order: 4,
      title: 'Resfriamento e Desenforme Seguro',
      category: 'maturacao',
      temperature: '4°C',
      duration: '6h a 12h',
      description:
        'Retirar do forno e deixar amornar em temperatura ambiente por 1 hora. Levar à geladeira por no mínimo 6 horas (idealmente pernoite). Antes de desenformar, aquecer o fundo da forma rapidamente na chama do fogão por 15 segundos para soltar o caramelo. Desenformar sobre prato de bordas altas.'
    }
  ],
  prep_variegato_de_nutella: [
    {
      order: 1,
      title: 'Aquecimento dos Líquidos',
      category: 'aquecimento',
      temperature: '80°C',
      duration: '5 min',
      description:
        'Aqueça o creme de leite junto com a glucose e o sal (e o cacau, se usar) em uma panela até atingir cerca de 80°C (início de fervura leve), dissolvendo a glucose por completo.'
    },
    {
      order: 2,
      title: 'Fusão Térmica sobre a Nutella',
      category: 'outro',
      temperature: '80°C',
      duration: '1 min',
      description:
        'Despeje a mistura quente diretamente sobre a Nutella em um bowl de inox ou vidro temperado. Deixe descansar por 1 minuto sem mexer para o calor amolecer a massa de avelãs e cacau.'
    },
    {
      order: 3,
      title: 'Emulsão com Mixer de Imersão',
      category: 'emulsao',
      temperature: '60°C',
      duration: '3 min',
      description:
        'Posicione o mixer de imersão no fundo do recipiente sem levantar a lâmina para não incorporar bolhas de ar. Processe por cerca de 2 a 3 minutos até obter uma ganache/emulsão lisa, brilhante e sedosa.'
    },
    {
      order: 4,
      title: 'Resfriamento e Estabilização da Textura',
      category: 'maturacao',
      temperature: '20°C',
      duration: '1h',
      description:
        'Deixe a mescla esfriar completamente em temperatura ambiente fresca até atingir cerca de 20°C e viscosidade elástica própria para intercalar no gelato.'
    },
    {
      order: 5,
      title: 'Armazenamento e Aplicação no Gelato',
      category: 'mesclagem',
      temperature: '20°C',
      duration: 'Uso imediato',
      description:
        'Armazenar em bisnaga ou pote hermético em temperatura ambiente. Aplicar em fios e colheradas durante a extração do gelato na cuba ou pote.'
    }
  ],
  prep_variegato_de_cocada: [
    {
      order: 1,
      title: 'Caramelização Seca do Açúcar',
      category: 'aquecimento',
      temperature: '165°C',
      duration: '8 min',
      description:
        'Colocar o açúcar em panela de fundo grosso e derreter em fogo médio-baixo até formar um caramelo dourado brilhante uniforme, sem queimar.'
    },
    {
      order: 2,
      title: 'Tostagem do Coco Ralado no Caramelo',
      category: 'aquecimento',
      temperature: '120°C',
      duration: '3 min',
      description:
        'Adicionar o coco ralado fino ao caramelo ainda quente, mexendo rapidamente com colher de silicone para tostar levemente e impregnar o aroma amanteigado do coco.'
    },
    {
      order: 3,
      title: 'Adição de Líquidos e Redução em Fogo Baixo',
      category: 'aquecimento',
      temperature: '95°C',
      duration: '15 min',
      description:
        'Adicionar com cuidado os líquidos restantes (leite/água) e cozinhar em fogo baixo, mexendo sempre, até que o caramelo dissolva e a cocada engrosse em ponto de doce cremoso de colher.'
    },
    {
      order: 4,
      title: 'Finalização com Fitas de Coco & Resfriamento',
      category: 'mesclagem',
      temperature: 'Ambiente',
      duration: '10 min',
      description:
        'Nos últimos minutos de cozimento, adicionar o coco em fitas/tiras para conferir textura mastigável e contraste visual no gelato. Desligar o fogo e deixar esfriar antes de utilizar na mesclagem.'
    }
  ]
};

/**
 * Analisa um texto de instruções corrido e converte de forma inteligente
 * em passos operacionais estruturados, extraindo automaticamente temperaturas,
 * tempos e categorias.
 */
export function parseInstructionsToSteps(rawText: string): PreparationStep[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const text = rawText.trim();

  // 1. Verificar se já possui formato numerado (ex: "1. Passo...", "2) Passo...")
  const numberedLineRegex = /(?:^|\n)\s*(?:\d+[\.\)]|\bpasso\s*\d+[:\.\-]?)\s*(.+?)(?=(?:\n\s*(?:\d+[\.\)]|\bpasso\s*\d+[:\.\-]?))|$)/gis;
  const numberedMatches: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = numberedLineRegex.exec(text)) !== null) {
    if (m[1] && m[1].trim().length > 0) {
      numberedMatches.push(m[1].trim());
    }
  }

  let blocks: string[] = [];

  if (numberedMatches.length >= 2) {
    blocks = numberedMatches;
  } else {
    // Quebrar por quebras de linha duplas ou parágrafos
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length >= 2) {
      blocks = paragraphs;
    } else {
      // Caso seja um parágrafo único, quebrar por frases terminadas em ponto final
      const sentences = text
        .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕ0-9])/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      blocks = sentences.length > 0 ? sentences : [text];
    }
  }

  return blocks.map((block, idx) => {
    // 2. Extração de Temperatura
    let temperature = '';
    const tempMatch = block.match(/(\d{1,3}\s?(?:°\s*[Cc]|graus(?:\s*celsius)?|\s*°))/i);
    if (tempMatch) {
      const numOnly = tempMatch[1].match(/\d+/);
      temperature = numOnly ? `${numOnly[0]}°C` : tempMatch[1].trim();
    } else if (/temperatura\s+ambiente|ambiente/i.test(block)) {
      temperature = 'Ambiente';
    }

    // 3. Extração de Duração / Tempo
    let duration = '';
    const durMatch = block.match(/(\d+\s*h(?:oras?)?(?:\s*\d+\s*m(?:in(?:utos)?)?)?|\d+\s*min(?:utos)?|\d+\s*seg(?:undos)?|\d+h\d*m*)/i);
    if (durMatch) {
      duration = durMatch[1]
        .replace(/\s*minutos?/i, ' min')
        .replace(/\s*horas?/i, 'h')
        .trim();
    }

    // 4. Inferência de Categoria e Título
    const lower = block.toLowerCase();
    let category: PreparationStepCategory = 'outro';
    let title = `Passo ${idx + 1}`;

    if (lower.includes('assar') || lower.includes('forno') || lower.includes('banho-maria') || lower.includes('assadeira')) {
      category = 'aquecimento';
      title = 'Cocção no Forno';
    } else if (lower.includes('caramel') || lower.includes('panela') || lower.includes('ferv') || lower.includes('fogo') || lower.includes('aquec') || lower.includes('cozinhar') || lower.includes('reduz')) {
      category = 'aquecimento';
      title = lower.includes('caramel') ? 'Caramelização no Fogão' : lower.includes('reduz') ? 'Redução em Fogo Baixo' : 'Aquecimento e Cocção';
    } else if (lower.includes('mixer') || lower.includes('liquidificador') || lower.includes('emuls') || lower.includes('bater') || lower.includes('homogeneiz') || lower.includes('fuê') || lower.includes('process')) {
      category = 'emulsao';
      title = lower.includes('mixer') ? 'Emulsão com Mixer' : lower.includes('liquidificador') ? 'Mistura no Liquidificador' : 'Homogeneização';
    } else if (lower.includes('geladeira') || lower.includes('resfriar') || lower.includes('esfriar') || lower.includes('descans') || lower.includes('repous') || lower.includes('refriger')) {
      category = 'maturacao';
      title = lower.includes('geladeira') ? 'Resfriamento na Geladeira' : 'Repouso e Resfriamento';
    } else if (lower.includes('fruta') || lower.includes('polpa') || lower.includes('morang') || lower.includes('manga') || lower.includes('coco')) {
      category = 'fruta';
      title = 'Adição de Frutas / Polpas';
    } else if (lower.includes('desenform') || lower.includes('pote') || lower.includes('mescl') || lower.includes('armazen') || lower.includes('guardar')) {
      category = 'mesclagem';
      title = lower.includes('desenform') ? 'Desenforme e Serviço' : 'Armazenamento e Aplicação';
    } else if (lower.includes('pesar') || lower.includes('balança') || lower.includes('secos') || lower.includes('misturar o açúcar')) {
      category = 'pesagem';
      title = 'Pesagem e Mistura dos Secos';
    }

    // Se a linha já tiver um título explícito (ex: "Caramelo: Derreter..."), extrair
    const explicitTitleMatch = block.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,35})\s*[:\-]\s*(.+)$/);
    let finalDesc = block;
    if (explicitTitleMatch) {
      title = explicitTitleMatch[1].trim();
      finalDesc = explicitTitleMatch[2].trim();
    }

    return {
      id: `step_${Date.now()}_${idx + 1}`,
      order: idx + 1,
      title,
      description: finalDesc,
      temperature: temperature || undefined,
      duration: duration || undefined,
      category
    };
  });
}

/**
 * Obtém os passos operacionais de um pré-preparo, priorizando passos já salvos,
 * recorrendo aos modelos oficiais mapeados de fábrica (como Pudim e Nutella),
 * ou realizando o parsing inteligente do texto legado de instruções.
 */
export function getInitialPreparationSteps(prep: {
  id: string;
  instructions?: string;
  preparationSteps?: PreparationStep[];
}): PreparationStep[] {
  if (prep.preparationSteps && prep.preparationSteps.length > 0) {
    return prep.preparationSteps;
  }

  if (DEFAULT_PREPARATION_STEPS_MAP[prep.id]) {
    return DEFAULT_PREPARATION_STEPS_MAP[prep.id].map((s, idx) => ({
      ...s,
      id: `step_${prep.id}_${idx + 1}`
    }));
  }

  if (prep.instructions && prep.instructions.trim().length > 0) {
    return parseInstructionsToSteps(prep.instructions);
  }

  return [];
}

/**
 * Converte uma lista de passos estruturados de volta para um formato de texto
 * consolidado, legível e organizado para o campo `instructions`.
 */
export function stepsToInstructions(steps: PreparationStep[]): string {
  if (!steps || steps.length === 0) {
    return '';
  }

  return steps
    .map((s, idx) => {
      const metaTokens: string[] = [];
      if (s.temperature) metaTokens.push(s.temperature);
      if (s.duration) metaTokens.push(s.duration);
      const meta = metaTokens.length > 0 ? ` [${metaTokens.join(' • ')}]` : '';
      return `${idx + 1}. ${s.title}${meta}:\n${s.description}`;
    })
    .join('\n\n');
}
