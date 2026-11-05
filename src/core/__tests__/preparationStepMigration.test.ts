import { describe, it, expect } from 'vitest';
import {
  parseInstructionsToSteps,
  stepsToInstructions,
  getInitialPreparationSteps,
  DEFAULT_PREPARATION_STEPS_MAP
} from '../preparationStepMigration';
import { PreparationStep } from '../../types/gelato';

describe('preparationStepMigration', () => {
  it('deve extrair passos estruturados a partir de texto numerado (ex: Variegato de Nutella)', () => {
    const raw = `1. Aqueça o creme de leite junto com a glucose em uma panela até atingir cerca de 80°C.
2. Despeje a mistura quente sobre a Nutella em um recipiente.
3. Deixe descansar por 1 minuto para o calor amolecer.
4. Utilize um mixer de imersão por 3 minutos até obter uma emulsão lisa.
5. Deixe esfriar completamente antes de utilizar.`;

    const steps = parseInstructionsToSteps(raw);
    expect(steps).toHaveLength(5);

    expect(steps[0].temperature).toBe('80°C');
    expect(steps[0].category).toBe('aquecimento');

    expect(steps[2].duration).toBe('1 min');
    expect(steps[2].category).toBe('maturacao');

    expect(steps[3].category).toBe('emulsao');
    expect(steps[3].duration).toBe('3 min');
  });

  it('deve extrair passos estruturados a partir de frases corridas (ex: Pudim)', () => {
    const raw =
      'Assar por 1h50m a 180 graus. Cobrir com papel alumínio e colocar uma assadeira com água embaixo. Usar açúcar cristal para fazer o caramelo.';

    const steps = parseInstructionsToSteps(raw);
    expect(steps.length).toBeGreaterThanOrEqual(2);

    const bakingStep = steps.find(s => s.description.toLowerCase().includes('assar'));
    expect(bakingStep).toBeDefined();
    expect(bakingStep?.temperature).toBe('180°C');
    expect(bakingStep?.duration).toBe('1h50m');
    expect(bakingStep?.category).toBe('aquecimento');
  });

  it('deve retornar array vazio para texto nulo ou vazio', () => {
    expect(parseInstructionsToSteps('')).toEqual([]);
    expect(parseInstructionsToSteps('   ')).toEqual([]);
  });

  it('deve converter passos estruturados de volta para texto consolidado legível', () => {
    const steps: PreparationStep[] = [
      {
        id: '1',
        order: 1,
        title: 'Caramelização',
        category: 'aquecimento',
        temperature: '165°C',
        duration: '10 min',
        description: 'Derreter o açúcar até cor âmbar.'
      },
      {
        id: '2',
        order: 2,
        title: 'Resfriamento',
        category: 'maturacao',
        temperature: '4°C',
        duration: '6h',
        description: 'Levar à geladeira.'
      }
    ];

    const text = stepsToInstructions(steps);
    expect(text).toContain('1. Caramelização [165°C • 10 min]:\nDerreter o açúcar até cor âmbar.');
    expect(text).toContain('2. Resfriamento [4°C • 6h]:\nLevar à geladeira.');
  });

  it('deve retornar os passos canônicos para pré-preparos oficiais mapeados (Pudim, Nutella, Cocada)', () => {
    const pudimSteps = getInitialPreparationSteps({ id: 'prep_pudim' });
    expect(pudimSteps).toHaveLength(4);
    expect(pudimSteps[0].title).toBe('Caramelo na Forma');
    expect(pudimSteps[2].temperature).toBe('180°C');

    const nutellaSteps = getInitialPreparationSteps({ id: 'prep_variegato_de_nutella' });
    expect(nutellaSteps).toHaveLength(5);
    expect(nutellaSteps[0].temperature).toBe('80°C');

    const cocadaSteps = getInitialPreparationSteps({ id: 'prep_variegato_de_cocada' });
    expect(cocadaSteps).toHaveLength(4);
    expect(cocadaSteps[0].title).toContain('Caramelização');
  });

  it('deve priorizar preparationSteps existentes quando já presentes no objeto', () => {
    const customSteps: PreparationStep[] = [
      {
        id: 'custom_1',
        order: 1,
        title: 'Passo Customizado Único',
        category: 'outro',
        description: 'Instrução personalizada do operador.'
      }
    ];

    const result = getInitialPreparationSteps({
      id: 'prep_pudim',
      preparationSteps: customSteps
    });

    expect(result).toEqual(customSteps);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Passo Customizado Único');
  });
});

