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
  // ═══════════════════════════════════════════════════════════════
  // PROFISSIONAIS
  // ═══════════════════════════════════════════════════════════════
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
    description: 'Processo 100% a frio com Neutro Específico de Sorbets (Neutro Frutta: Goma Guar + CMC + Pectina, 100% hidrossolúvel a frio). Turboliquidificador industrial, produtora comercial e ultracongelador. NOTA TÉCNICA: Se utilizar neutro universal à base de Garrofim/Alfarroba (LBG), adotar pasteurização da calda de água a 75°C–80°C antes de incorporar a fruta a frio.',
    badge: '❄️ Profissional Sorbet a Frio (Neutro Frutta)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura de Pós Secos',
        description: 'Pesar água, açúcares (sacarose, dextrose, maltodextrina) e o Neutro Específico para Sorbets (Neutro Frutta: à base de Goma Guar, CMC e pectinas de dissolução rápida, 100% hidrossolúvel a frio). Misturar os pós secos homogeneamente para dispersão prévia e prevenção de grumos.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Dissolução a Frio e Homogeneização com Mixer',
        description: 'Despejar os pós na água sob agitação de alta rotação (turboliquidificador) por 2 a 3 minutos. O Neutro Frutta (Guar + CMC + Pectina) atinge viscosidade plena por pura hidratação mecânica a frio, dispensando calor. Formar um xarope base límpido, viscoso e sem grumos.',
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
    id: 'gelato_alcoolico_profissional',
    name: 'Gelato Alcoólico Profissional (Pasteurização 85°C + Álcool a Frio)',
    description: 'Para gelatos com destilados e licores em equipamentos comerciais. Pasteurização da base láctea a 85°C e adição do álcool a frio (4°C) na tina para não evaporar o etanol.',
    badge: '🍸 Profissional Alcoólico',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos',
        description: 'Pesar com precisão os açúcares, neutro e pós secos. Pesar separadamente a bebida alcoólica (destilado ou licor) e mantê-la sob refrigeração a 4°C na garrafa ou recipiente fechado.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Alta da Base Láctea (Sem Álcool)',
        description: 'Colocar os líquidos lácteos no pasteurizador, adicionar os secos a 45°C e elevar a 85°C por 2 minutos. ATENÇÃO: NUNCA adicionar a bebida alcoólica nesta etapa, pois o etanol entra em ebulição e evapora a 78,3°C.',
        temperature: '85°C',
        duration: '15 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento Imediato a 4°C',
        description: 'Resfriar a calda no pasteurizador rapidamente até 4°C e transferir para a tina de maturação.',
        temperature: '4°C',
        duration: '1h a 2h',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Incorporação do Álcool a Frio na Tina de Maturação',
        description: 'Com a calda já resfriada e estabilizada a 4°C, verter o destilado ou licor gelado. Homogeneizar com agitador mecânico lento por 5 minutos para integração uniforme da fase alcoólica com a emulsão gordurosa.',
        temperature: '4°C',
        duration: '5 min',
        category: 'emulsao'
      },
      {
        order: 5,
        title: 'Mantecação com Compensação de Congelamento',
        description: 'Bater na produtora contínua ou descontínua. Como o álcool possui PAC extremamente alto (~2.5x a 3x maior que a sacarose), a temperatura de extração deve ser mais baixa (-9°C a -10°C) para garantir corpo firme e estruturado.',
        temperature: '-9.5°C',
        duration: '9 a 12 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Abatimento e Exposição em Vitrine Gelada',
        description: 'Extrair na cuba pré-resfriada e abater no ultracongelador a -35°C por 12 a 15 minutos. Na vitrine, posicionar na área mais fria (-13°C a -14°C) para manter o ponto ideal de espatulabilidade.',
        temperature: '-13.5°C',
        duration: '12 min abat.',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_proteico_profissional',
    name: 'Gelato Proteico Profissional (Base 85°C + Whey Off-Heat)',
    description: 'Para gelatos enriquecidos com Whey Protein 80%. Pasteurização da calda base (leite, fibras, neutro) a 85°C. O Whey Protein é adicionado FORA DO CALOR (off-heat) com emulsão vigorosa em mixer de alta rotação para evitar desnaturação da beta-lactoglobulina. Serviço a -12°C.',
    badge: '💪 Profissional Proteico (Whey Off-Heat)',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada: Calda Base e Whey Protein',
        description: 'Pesar os ingredientes da calda base (leite, edulcorantes/polióis, leite em pó, fibras solúveis, neutro) separadamente do Whey Protein 80%. Misturar os pós da calda base em tigela seca. Reservar o Whey Protein à parte, SEM misturá-lo aos demais pós.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Alta da Calda Base a 85°C (SEM Whey)',
        description: 'Aquecer os líquidos no pasteurizador até 45°C, incorporar os pós da calda base sob agitação mecânica. Elevar a 85°C e manter por 2 minutos para hidratação completa das proteínas lácteas estruturais, dissolução total das fibras e ativação do neutro. ATENÇÃO: O Whey Protein NÃO deve ir ao calor nesta etapa.',
        temperature: '85°C',
        duration: '15 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento da Calda Base a ≤45°C',
        description: 'Resfriar a calda no pasteurizador até atingir no máximo 45°C (idealmente 4°C). Esta é a faixa segura para incorporação do Whey sem desnaturação térmica precoce.',
        temperature: '≤45°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Incorporação do Whey Protein Off-Heat com Turbomixer',
        description: 'Com a calda base a ≤45°C (ou já a 4°C), adicionar o Whey Protein 80% reservado. Emulsionar vigorosamente com turboliquidificador ou homogeneizador a 120 bar por 2 a 3 minutos para dispersão coloidal uniforme das micelas de proteína do soro, sem aquecer. Garantir calda completamente lisa e sem grumos.',
        temperature: '≤45°C ou 4°C',
        duration: '3 min',
        category: 'emulsao'
      },
      {
        order: 5,
        title: 'Maturação Estendida a 4°C',
        description: 'Transferir para a tina de maturação. Manter entre 4°C e 5°C sob agitação lenta intermitente por 6 a 12 horas para completa hidratação das fibras alimentares, estabilização de água livre e integração molecular do Whey à fase aquosa.',
        temperature: '4°C',
        duration: '6h a 12h',
        category: 'maturacao'
      },
      {
        order: 6,
        title: 'Mantecação com Overrun Moderado',
        description: 'Mantecar na produtora industrial. Monitorar a aeração (overrun de 25% a 30%) para garantir textura aveludada e cremosa, compensando o teor elevado de sólidos proteicos. Temperatura de extração entre -7°C e -9°C.',
        temperature: '-8°C',
        duration: '8 a 10 min',
        category: 'batimento'
      },
      {
        order: 7,
        title: 'Abatimento Térmico e Vitrine a -12°C',
        description: 'Abater a -35°C por 10 minutos para selar a textura superficial. Expor na vitrine de gelato calibrada a -12°C, temperatura ideal para a espatulabilidade de gelatos proteicos com alto teor de sólidos.',
        temperature: '-12°C',
        duration: '10 min abat.',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_chocolate_cacau_profissional',
    name: 'Gelato de Chocolate/Cacau Profissional (Cacau 90°C + Chocolate Off-Heat 65°C)',
    description: 'Para gelatos com cacau em pó 100% e/ou chocolate em barra/gotas. O cacau é cozido na calda a 90°C para gelatinizar os amidos vegetais e eliminar a textura farinácea. O chocolate em barra é incorporado fora do fogo a 65°C.',
    badge: '🍫 Profissional Chocolate/Cacau',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos (Cacau Incluído)',
        description: 'Pesar com precisão todos os ingredientes. Misturar os açúcares sólidos, neutro, leite em pó e o cacau em pó 100% em recipiente seco. Se a receita leva chocolate em barra/gotas, reservá-lo picado finamente à parte (NÃO misturar aos pós).',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Alta a 90°C (Gelatinização do Cacau)',
        description: 'Aquecer os líquidos no pasteurizador até 45°C, incorporar os pós (incluindo o cacau em pó) sob agitação mecânica rápida. Elevar a temperatura até 90°C e manter por 2 minutos. O cacau em pó 100% contém ~10-15% de amidos vegetais que necessitam de 90°C para gelatinizar completamente, eliminando a textura farinácea/áspera (chalky mouthfeel) e abrindo o potencial aromático pleno.',
        temperature: '90°C',
        duration: '15 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Incorporação do Chocolate Off-Heat a 65°C',
        description: 'Desligar o fogo/pasteurizador. Quando a calda atingir 65°C, adicionar o chocolate picado (branco, ao leite ou amargo). Aguardar 1 minuto sem mexer para que o calor latente funda a manteiga de cacau uniformemente. Em seguida, emulsionar com mixer/turboliquidificador até obter calda perfeitamente lisa e aveludada. ATENÇÃO: Não adicionar acima de 70°C (quebra emulsão e queima os sólidos) nem abaixo de 50°C (cristaliza sem fundir).',
        temperature: '65°C',
        duration: '5 min',
        category: 'emulsao'
      },
      {
        order: 4,
        title: 'Resfriamento Rápido e Maturação a 4°C',
        description: 'Resfriar a calda imediatamente até 4°C no ciclo de pasteurização. Maturar na tina por 4 a 12 horas para cristalização estável da manteiga de cacau e hidratação completa dos hidrocoloides.',
        temperature: '4°C',
        duration: '4h a 12h',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação na Produtora',
        description: 'Verter a calda maturada na produtora. Bater até ponto de firmeza com temperatura de saída entre -7°C e -9°C. Gelatos de chocolate tendem a ser mais densos e podem exigir tempo de batimento ligeiramente maior.',
        temperature: '-8°C',
        duration: '8 a 12 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Abatimento e Estabilização na Vitrine',
        description: 'Extrair na cuba pré-resfriada e abater no ultracongelador a -35°C por 10 a 15 minutos. Expor na vitrine a -12°C.',
        temperature: '-12°C',
        duration: '15 min abat.',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_crema_gemas_profissional',
    name: 'Gelato Crema com Gemas Profissional (Pasteurização Média 80°C–82°C)',
    description: 'Para gelatos clássicos com gemas de ovo (Crema, Zabaione, Creme Inglês, Tiramisù). Pasteurização média controlada a 80°C–82°C sob agitação constante para prevenir coagulação das proteínas do ovo.',
    badge: '🥚 Profissional Crema com Gemas',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Branqueamento das Gemas',
        description: 'Pesar todos os ingredientes. Em uma tigela, misturar as gemas com parte dos açúcares (sacarose/dextrose) e bater com fuê até obter uma massa clara e aerada (branqueamento). Este passo protege as gemas do choque térmico ao entrar na calda quente.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Aquecimento dos Líquidos e Secos a 50°C',
        description: 'No pasteurizador, aquecer o leite e o creme de leite com os demais pós (neutro, leite em pó, açúcares restantes) até atingir 50°C sob agitação.',
        temperature: '50°C',
        duration: '10 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Temperagem das Gemas e Cozimento Controlado a 80°C–82°C',
        description: 'Verter uma concha do líquido quente (50°C) sobre as gemas branqueadas, mexendo rapidamente com fuê (temperagem). Incorporar as gemas temperadas na panela/pasteurizador e cozinhar mexendo ininterruptamente em formato de oito. Elevar até RIGOROSAMENTE 80°C–82°C. ATENÇÃO CRÍTICA: NÃO ultrapassar 82°C sob nenhuma hipótese — acima desse ponto as proteínas do ovo coagulam irreversivelmente, talhando a calda com pedaços sólidos de "omelete doce".',
        temperature: '80°C a 82°C',
        duration: '8 min',
        category: 'aquecimento'
      },
      {
        order: 4,
        title: 'Resfriamento Imediato (Choque Térmico)',
        description: 'Resfriar imediatamente no ciclo de pasteurização ou em banho de gelo industrial para interromper a ação do calor residual sobre as gemas. Atingir 4°C o mais rápido possível.',
        temperature: '4°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Maturação Obrigatória a 4°C',
        description: 'Maturar na tina por 6 a 12 horas a 4°C para ganho de viscosidade, integração dos aromas lácteos com a lecitina da gema e cristalização lenta das gorduras.',
        temperature: '4°C',
        duration: '6h a 12h',
        category: 'maturacao'
      },
      {
        order: 6,
        title: 'Mantecação na Produtora',
        description: 'Verter a calda maturada na produtora. Bater até ponto de firmeza amanteigada com temperatura de saída entre -7°C e -9°C.',
        temperature: '-8°C',
        duration: '8 a 12 min',
        category: 'batimento'
      },
      {
        order: 7,
        title: 'Abatimento e Vitrine',
        description: 'Extrair na cuba pré-resfriada e abater a -35°C por 10 a 15 minutos. Expor na vitrine a -12°C.',
        temperature: '-12°C',
        duration: '15 min abat.',
        category: 'abatimento'
      }
    ]
  },
  // ═══════════════════════════════════════════════════════════════
  // CASEIROS
  // ═══════════════════════════════════════════════════════════════
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
    description: 'Roteiro 100% a frio sem fogão para sorbets de frutas frescas e cítricos em sorveteiras domésticas. Utiliza Neutro Específico de Sorbets (Neutro Frutta), 100% hidrossolúvel a frio no liquidificador. NOTA: Se utilizar neutro universal à base de Garrofim, aquecer a calda de água + secos a 75°C–80°C antes de resfriar e adicionar a fruta.',
    badge: '❄️ Caseiro Sorbet a Frio / Neutro Frutta (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos a Frio',
        description: 'Pesar água filtrada gelada, açúcares (sacarose, dextrose) e o Neutro Específico para Sorbets (Neutro Frutta: Goma Guar + CMC + Pectina, hidrossolúvel a frio). Misturar os pós secos em tigela para dispersão prévia.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Dissolução no Liquidificador Doméstico',
        description: 'Colocar a água no copo do liquidificador e despejar a mistura de secos. Bater na velocidade média/alta por 1 a 2 minutos. O Neutro Frutta atinge viscosidade plena por hidratação mecânica a frio, sem necessidade de fogão. Dissolver totalmente os açúcares e formar xarope límpido sem grumos.',
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
  },
  {
    id: 'gelato_caseiro_alcoolico',
    name: 'Gelato Caseiro Alcoólico (Sorveteira Doméstica + Bebida a Frio)',
    description: 'Para receitas com destilados, vinhos ou licores na sorveteira doméstica. O álcool entra a frio para não evaporar no fogão.',
    badge: '🍸 Caseiro Alcoólico (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada da Calda e da Bebida Alcoólica',
        description: 'Pesar com precisão os pós secos e a base láctea na balança. Pesar o destilado/licor separadamente e mantê-lo bem tampado na geladeira a 4°C.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização Caseira no Fogão (Sem a Bebida)',
        description: 'Aquecer a calda láctea no fogão a 85°C por 1 a 2 minutos com fuê. ATENÇÃO: NUNCA coloque a bebida alcoólica no fogão! O etanol ferve e evapora a 78,3°C, o que destruiria o sabor e alteraria o ponto de congelamento do gelato.',
        temperature: '85°C',
        duration: '12 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento Rápido em Banho-Maria Invertido',
        description: 'Retirar do fogo e apoiar o bowl/panela em uma bacia com bastante água, gelo e sal grosso (banho-maria invertido). Mexer com fuê até atingir menos de 10°C, e transferir para a geladeira até chegar a 4°C.',
        temperature: '10°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Adição da Bebida Alcoólica a Frio e Maturação',
        description: 'Com a calda base fria a 4°C, verter o destilado ou licor gelado. Misturar delicadamente com fuê ou mixer por 1 minuto. Cobrir com filme plástico em contato e deixar maturar na geladeira por 4 a 8 horas.',
        temperature: '4°C',
        duration: '4h a 8h',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Ligar a sorveteira previamente para pré-resfriar. Despejar a calda alcoólica gelada. Como o álcool reduz o ponto de congelamento, o ciclo de batimento pode levar de 35 a 45 minutos até atingir consistência cremosa e densa.',
        temperature: '-8°C',
        duration: '35 a 45 min',
        category: 'batimento'
      },
      {
        order: 6,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Transferir com espátula para pote hermético e manter no ponto mais frio do freezer doméstico (-18°C) por 3 a 5 horas para atingir firmeza ideal de corte e colher.',
        temperature: '-18°C',
        duration: '3h a 5h',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_caseiro_proteico',
    name: 'Gelato Caseiro Proteico (Base 85°C no Fogão + Whey Off-Heat)',
    description: 'Para receitas enriquecidas com Whey Protein na sorveteira doméstica. Calda base pasteurizada a 85°C no fogão. Whey Protein adicionado FORA DO CALOR (off-heat) após resfriamento, com mixer de mão para dispersão sem desnaturação.',
    badge: '💪 Caseiro Proteico / Whey Off-Heat (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem Separada: Calda Base e Whey Protein',
        description: 'Pesar na balança digital os ingredientes da calda base (leite, edulcorantes/polióis, leite em pó, fibras solúveis, neutro) separadamente do Whey Protein 80%. Misturar os pós da calda base em tigela seca. Reservar o Whey Protein à parte, SEM misturá-lo aos demais pós.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização da Calda Base no Fogão a 85°C (SEM Whey)',
        description: 'Em panela de fundo grosso, aquecer o leite e derivados líquidos em fogo médio com fuê. Aos 40°C-45°C, adicionar os pós da calda base em chuva. Elevar até 85°C (termômetro culinário) e manter por 1 a 2 minutos. ATENÇÃO: O Whey Protein NÃO deve estar na panela nesta etapa para evitar desnaturação térmica e textura arenosa.',
        temperature: '85°C',
        duration: '12 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Resfriamento em Banho-Maria Invertido',
        description: 'Retirar do fogo e apoiar o bowl/panela sobre bacia com água fria, gelo e sal grosso (banho-maria invertido). Mexer com fuê até atingir menos de 45°C.',
        temperature: '<45°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 4,
        title: 'Incorporação do Whey Protein Off-Heat com Mixer de Mão',
        description: 'Com a calda base resfriada a ≤45°C (ou já a 4°C da geladeira), adicionar o Whey Protein 80% reservado. Bater com mixer de mão por 2 a 3 minutos em alta rotação para dispersão coloidal completa e calda perfeitamente lisa, sem grumos e sem aquecer.',
        temperature: '≤45°C ou 4°C',
        duration: '3 min',
        category: 'emulsao'
      },
      {
        order: 5,
        title: 'Maturação Estendida na Geladeira Doméstica',
        description: 'Cobrir com plástico filme em contato e guardar na geladeira a 4°C por no mínimo 6 horas (idealmente 8h a 12h) para completa hidratação das proteínas e fibras alimentares.',
        temperature: '4°C',
        duration: '6h a 12h',
        category: 'maturacao'
      },
      {
        order: 6,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Despejar a calda gelada na sorveteira pré-resfriada. Bater no ciclo de 30 a 40 minutos até adquirir corpo estruturado e consistência macia.',
        temperature: '-7°C',
        duration: '30 a 40 min',
        category: 'batimento'
      },
      {
        order: 7,
        title: 'Estabilização no Freezer Doméstico a -18°C (Serviço a -12°C)',
        description: 'Armazenar em pote hermético no freezer (-18°C) por 2 a 3 horas. Para servir, retirar e temperar na geladeira por 10 a 15 minutos até atingir a temperatura ideal de serviço de -12°C para espatulabilidade ideal de gelatos proteicos.',
        temperature: '-18°C / -12°C serviço',
        duration: '2h a 3h',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_chocolate_cacau_caseiro',
    name: 'Gelato de Chocolate/Cacau Caseiro (Cacau 90°C + Chocolate Off-Heat 65°C)',
    description: 'Para receitas caseiras com cacau em pó 100% e/ou chocolate em barra. Cocção da calda com cacau até 90°C no fogão. Chocolate incorporado fora do fogo a 65°C.',
    badge: '🍫 Caseiro Chocolate/Cacau (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Mistura dos Secos (Cacau Incluído)',
        description: 'Pesar os ingredientes na balança digital. Em um bowl seco, misturar o açúcar, dextrose, neutro, leite em pó e o cacau em pó 100%. Se a receita leva chocolate em barra/gotas, picar finamente e reservar à parte.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Pasteurização no Fogão a 90°C (Gelatinização do Cacau)',
        description: 'Em panela de fundo grosso, aquecer o leite em fogo médio com fuê. Aos 40°C-45°C, adicionar os pós (com cacau) em chuva. Adicionar creme de leite e elevar até 90°C (termômetro culinário), mantendo por 1 a 2 minutos sem ferver. A temperatura de 90°C é essencial para gelatinizar os amidos do cacau e eliminar a textura farinácea.',
        temperature: '90°C',
        duration: '15 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Incorporação do Chocolate Off-Heat a 65°C',
        description: 'Desligar o fogo imediatamente. Monitorar o termômetro: quando a calda atingir 65°C, adicionar o chocolate picado. Aguardar 1 minuto sem mexer para fusão pela inércia térmica da calda. Misturar com espátula e bater com mixer de mão até calda lisa e brilhante. ATENÇÃO: Não adicionar acima de 70°C nem abaixo de 50°C.',
        temperature: '65°C',
        duration: '5 min',
        category: 'emulsao'
      },
      {
        order: 4,
        title: 'Resfriamento em Banho-Maria Invertido',
        description: 'Apoiar o bowl sobre bacia com água fria, gelo e sal grosso (banho-maria invertido). Mexer com fuê até menos de 10°C.',
        temperature: '<10°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Maturação na Geladeira Doméstica',
        description: 'Cobrir com plástico filme em contato e guardar na geladeira a 4°C por 4 a 12 horas para cristalização estável da manteiga de cacau e hidratação completa dos estabilizantes.',
        temperature: '4°C',
        duration: '4h a 12h',
        category: 'maturacao'
      },
      {
        order: 6,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Despejar a calda gelada na sorveteira pré-resfriada. Bater por 30 a 45 minutos até consistência firme e aveludada.',
        temperature: '-7°C',
        duration: '30 a 45 min',
        category: 'batimento'
      },
      {
        order: 7,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Transferir para pote hermético pré-resfriado e levar ao freezer (-18°C) por 2 a 4 horas.',
        temperature: '-18°C',
        duration: '2h a 4h',
        category: 'abatimento'
      }
    ]
  },
  {
    id: 'gelato_crema_gemas_caseiro',
    name: 'Gelato Crema com Gemas Caseiro (Pasteurização Média 80°C–82°C no Fogão)',
    description: 'Para receitas caseiras com gemas de ovo (Crema, Zabaione, Creme Inglês). Cozimento controlado a no máximo 80°C–82°C no fogão com fuê para evitar coagulação das proteínas do ovo.',
    badge: '🥚 Caseiro Crema com Gemas (ex: EOS003)',
    steps: [
      {
        order: 1,
        title: 'Pesagem e Branqueamento das Gemas',
        description: 'Pesar todos os ingredientes na balança digital. Em uma tigela, bater as gemas com parte do açúcar usando fuê até obter mistura clara e levemente aerada (branqueamento). Reservar.',
        temperature: 'Ambiente',
        duration: '5 min',
        category: 'pesagem'
      },
      {
        order: 2,
        title: 'Aquecimento do Leite e Secos no Fogão a 50°C',
        description: 'Em panela de fundo grosso, aquecer o leite, creme de leite e demais pós (neutro, leite em pó, açúcares restantes) em fogo médio com fuê até 50°C.',
        temperature: '50°C',
        duration: '8 min',
        category: 'aquecimento'
      },
      {
        order: 3,
        title: 'Temperagem das Gemas e Cozimento a 80°C–82°C',
        description: 'Verter uma concha do leite morno sobre as gemas branqueadas, mexendo rapidamente (temperagem). Devolver à panela e cozinhar em fogo baixo, mexendo sem parar com fuê em formato de oito. Usar termômetro culinário: elevar até EXATAMENTE 80°C–82°C. NUNCA ultrapassar 82°C para não talhar as gemas. Desligar o fogo imediatamente ao atingir a temperatura.',
        temperature: '80°C a 82°C',
        duration: '10 min',
        category: 'aquecimento'
      },
      {
        order: 4,
        title: 'Resfriamento Imediato em Banho-Maria Invertido',
        description: 'Retirar do fogo e apoiar imediatamente sobre bacia com água fria, gelo e sal grosso (banho-maria invertido) para interromper a cocção residual sobre as gemas. Mexer com fuê até menos de 10°C.',
        temperature: '<10°C',
        duration: '15 min',
        category: 'maturacao'
      },
      {
        order: 5,
        title: 'Maturação na Geladeira Doméstica',
        description: 'Cobrir com plástico filme em contato e guardar na geladeira a 4°C por 6 a 12 horas para ganho de viscosidade e integração dos aromas lácteos com a lecitina da gema.',
        temperature: '4°C',
        duration: '6h a 12h',
        category: 'maturacao'
      },
      {
        order: 6,
        title: 'Mantecação na Sorveteira Doméstica (ex: EOS003)',
        description: 'Despejar a calda gelada na sorveteira pré-resfriada. Bater por 30 a 45 minutos até atingir textura amanteigada clássica e corpo cremoso.',
        temperature: '-7°C',
        duration: '30 a 45 min',
        category: 'batimento'
      },
      {
        order: 7,
        title: 'Endurecimento no Freezer Doméstico',
        description: 'Transferir para pote hermético pré-resfriado e levar ao freezer (-18°C) por 2 a 4 horas.',
        temperature: '-18°C',
        duration: '2h a 4h',
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

  // Detecção de ingredientes especiais pela lista de ingredientes
  const ingredientNames = (recipe.ingredients || []).map(i => (i.name || '').toLowerCase()).join(' ');

  const isSorbetBaseAgua =
    cat.includes('sorbet') ||
    cat.includes('água') ||
    cat.includes('agua') ||
    targetStyle.includes('sorbet') ||
    name.includes('sorbet');

  const isAlcohol =
    cat.includes('alcoólico') ||
    cat.includes('alcoolico') ||
    targetStyle.includes('alcoólico') ||
    targetStyle.includes('alcoolico') ||
    name.includes('caipirinha') ||
    name.includes('bailey') ||
    name.includes('whisky') ||
    name.includes('cachaça') ||
    name.includes('licor') ||
    name.includes('clericot');

  const isProteic =
    cat.includes('proteico') ||
    targetStyle.includes('proteico') ||
    name.includes('proteic') ||
    name.includes('whey');

  const hasChocolateOrCocoa =
    name.includes('chocolate') ||
    name.includes('cacau') ||
    name.includes('gianduia') ||
    name.includes('brigadeiro') ||
    ingredientNames.includes('cacau') ||
    ingredientNames.includes('chocolate');

  const hasEgg =
    ingredientNames.includes('gema') ||
    ingredientNames.includes('ovo') ||
    name.includes('crema') ||
    name.includes('zabaione') ||
    name.includes('creme inglês') ||
    name.includes('creme ingles');

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

  const isExplicitProfissional =
    name.includes('profissional') ||
    name.includes('industrial') ||
    cat.includes('profissional');

  if (isExplicitProfissional) {
    if (isAlcohol) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_alcoolico_profissional')!;
    }
    if (isProteic) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_proteico_profissional')!;
    }
    if (hasEgg && !hasChocolateOrCocoa) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_crema_gemas_profissional')!;
    }
    if (hasChocolateOrCocoa) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_chocolate_cacau_profissional')!;
    }
    if (isSorbetBaseAgua) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_sorbet')!;
    }
    if (hasFruit) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_frutas_pos_pasteurizacao')!;
    }
    return PREPARATION_TEMPLATES.find(t => t.id === 'processo_quente_tradicional')!;
  }

  // Linha Caseira por padrão (ou quando explicitamente caseiro)
  if (isAlcohol) {
    if (isSorbetBaseAgua) {
      return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_caseiro')!;
    }
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_alcoolico')!;
  }

  if (isProteic) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_proteico')!;
  }

  if (hasEgg && !hasChocolateOrCocoa) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_crema_gemas_caseiro')!;
  }

  if (hasChocolateOrCocoa) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_chocolate_cacau_caseiro')!;
  }

  if (isSorbetBaseAgua) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'processo_frio_caseiro')!;
  }

  if (hasFruit) {
    return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_frutas')!;
  }

  return PREPARATION_TEMPLATES.find(t => t.id === 'gelato_caseiro_tradicional')!;
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
