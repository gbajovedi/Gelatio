import React, { useState, useMemo, useEffect } from 'react';
import { Ingredient, Preparation } from '../../types/gelato';
import {
  VariegatoItemRow,
  VariegatoStyleId,
  VariegatoRheologyLevel,
  VariegatoThermalApplication,
  VariegatoStyleStandard
} from '../../types/variegato';
import { getVariegatoStyle } from '../../core/variegatoStyles';
import { calculateVariegatoBatchAnalysis } from '../../core/variegatoCalculator';
import { db } from '../../db/database';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { VariegatoHeader } from './VariegatoHeader';
import { VariegatoThermalCard } from './VariegatoThermalCard';
import { VariegatoRheologyCard } from './VariegatoRheologyCard';
import { VariegatoCookingReductionCard } from './VariegatoCookingReductionCard';
import { VariegatoCostingCard } from './VariegatoCostingCard';
import { VariegatoNutrientGrid } from './VariegatoNutrientGrid';
import { VariegatoIngredientsTable } from './VariegatoIngredientsTable';
import { VariegatoSidePanels } from './VariegatoSidePanels';
import { VariegatoStyleModal } from './VariegatoStyleModal';
import { VariegatoSaveModal } from './VariegatoSaveModal';

interface VariegatoBalancingScreenProps {
  ingredients: Ingredient[];
  preparations?: Preparation[];
  onRefresh?: () => void;
}

const DEFAULT_INITIAL_ITEMS: VariegatoItemRow[] = [
  { name: 'Polpa de Morango', grams: 550 },
  { name: 'Açúcar refinado', grams: 180 },
  { name: 'Xarope de Glicose 40 DE', grams: 160 },
  { name: 'Dextrose', grams: 50 },
  { name: 'Pectina LM', grams: 6 },
  { name: 'Solução Ácido Cítrico 50%', grams: 4 }
];

export const VariegatoBalancingScreen: React.FC<VariegatoBalancingScreenProps> = ({
  ingredients,
  preparations: initialPreparations = [],
  onRefresh
}) => {
  // Estado básico da receita
  const [recipeName, setRecipeName] = useState<string>('Geleia Artesanal de Morango com Pectina');
  const [selectedStyleId, setSelectedStyleId] = useState<VariegatoStyleId>('fruta_gelificada');
  const [styleOverride, setStyleOverride] = useState<VariegatoStyleStandard | null>(null);

  const [targetBrix, setTargetBrix] = useState<number>(68);
  const [rheologyLevel, setRheologyLevel] = useState<VariegatoRheologyLevel>(2);
  const [thermalApp, setThermalApp] = useState<VariegatoThermalApplication>('vitrine');
  const [dosagePercent, setDosagePercent] = useState<number>(15);

  const [items, setItems] = useState<VariegatoItemRow[]>(DEFAULT_INITIAL_ITEMS);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Modais
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);

  // Catálogo local de variegatos
  const [catalogVariegatos, setCatalogVariegatos] = useState<Preparation[]>(() => {
    return initialPreparations.filter(p => p.category === 'Variegato');
  });

  // Atualizar quando preparations mudar
  useEffect(() => {
    if (initialPreparations.length > 0) {
      setCatalogVariegatos(initialPreparations.filter(p => p.category === 'Variegato'));
    }
  }, [initialPreparations]);

  // Carregar do banco se vazio
  useEffect(() => {
    async function loadVariegatos() {
      try {
        const preps = await db.preparations.where('category').equals('Variegato').toArray();
        if (preps && preps.length > 0) {
          setCatalogVariegatos(preps);
        }
      } catch (err) {
        console.warn('Erro ao carregar variegatos do Dexie:', err);
      }
    }
    loadVariegatos();
  }, []);

  // Map de ingredientes por nome minúsculo para busca ultra rápida
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const ing of ingredients) {
      map.set(ing.name.toLowerCase().trim(), ing);
    }
    return map;
  }, [ingredients]);

  // Estilo atual (padrão ou sobrescrito pelo usuário)
  const currentStyle = useMemo(() => {
    if (styleOverride && styleOverride.id === selectedStyleId) {
      return styleOverride;
    }
    return getVariegatoStyle(selectedStyleId);
  }, [selectedStyleId, styleOverride]);

  // Cálculo bromatológico e reológico reativo em tempo real
  const analysis = useMemo(() => {
    return calculateVariegatoBatchAnalysis(
      items,
      targetBrix,
      rheologyLevel,
      thermalApp,
      currentStyle,
      ingredientsMap,
      dosagePercent
    );
  }, [items, targetBrix, rheologyLevel, thermalApp, currentStyle, ingredientsMap, dosagePercent]);

  // Status de equilíbrio geral da mescla
  const isBalanced = analysis.alerts.messages.length === 0 && analysis.thermalStatus.status === 'ideal';

  // Troca de Estilo
  const handleSelectStyle = (styleId: VariegatoStyleId) => {
    setSelectedStyleId(styleId);
    const newStyle = getVariegatoStyle(styleId);
    setTargetBrix(newStyle.defaultBrixTarget);
    if (newStyle.defaultRheology === 'fluid') setRheologyLevel(1);
    else if (newStyle.defaultRheology === 'balanced') setRheologyLevel(2);
    else if (newStyle.defaultRheology === 'structured') setRheologyLevel(3);
    setIsDirty(true);
  };

  // Carregar preparação do catálogo
  const handleLoadPreparation = (prep: Preparation) => {
    if (isDirty) {
      const confirmSwitch = window.confirm(
        'Você possui alterações não salvas na bancada. Deseja realmente carregar outro variegato e descartar as edições atuais?'
      );
      if (!confirmSwitch) return;
    }

    setRecipeName(prep.name);
    if (prep.ingredients && prep.ingredients.length > 0) {
      setItems(prep.ingredients.map(i => ({ name: i.name, grams: i.grams })));
    }
    setIsDirty(false);
  };

  // Criar nova mescla do zero
  const handleNewRecipe = () => {
    if (isDirty) {
      const confirmNew = window.confirm(
        'Deseja descartar as alterações atuais para iniciar uma nova mescla do zero?'
      );
      if (!confirmNew) return;
    }

    setRecipeName('Nova Mescla Artesanal');
    setItems([
      { name: 'Polpa de Fruta', grams: 500 },
      { name: 'Açúcar refinado', grams: 200 },
      { name: 'Xarope de Glicose 40 DE', grams: 150 },
      { name: 'Pectina LM', grams: 5 }
    ]);
    setSelectedStyleId('fruta_gelificada');
    setTargetBrix(68);
    setRheologyLevel(2);
    setIsDirty(true);
  };

  // Reverter alterações
  const handleResetRecipe = () => {
    const confirmReset = window.confirm('Deseja reverter a formulação para a receita padrão?');
    if (!confirmReset) return;

    setRecipeName('Geleia Artesanal de Morango com Pectina');
    setItems(DEFAULT_INITIAL_ITEMS);
    setSelectedStyleId('fruta_gelificada');
    setTargetBrix(68);
    setRheologyLevel(2);
    setThermalApp('vitrine');
    setIsDirty(false);
  };

  // Callback ao salvar
  const handleVariegatoSaved = (savedPrep: Preparation) => {
    setCatalogVariegatos(prev => {
      const filtered = prev.filter(p => p.id !== savedPrep.id);
      return [savedPrep, ...filtered];
    });
    setIsDirty(false);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Barra Superior de Controle (Header da Bancada) */}
      <VariegatoHeader
        recipeName={recipeName}
        onRecipeNameChange={name => {
          setRecipeName(name);
          setIsDirty(true);
        }}
        selectedStyleId={selectedStyleId}
        onSelectStyle={handleSelectStyle}
        catalogPreparations={catalogVariegatos}
        onLoadPreparation={handleLoadPreparation}
        onNewRecipe={handleNewRecipe}
        onResetRecipe={handleResetRecipe}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onOpenStyleModal={() => setIsStyleModalOpen(true)}
        isDirty={isDirty}
      />

      {/* 2. Moldura de Performance & Cenário Operacional (Grid 2x2 com Banner de Status) */}
      <div
        className={`p-5 rounded-2xl border shadow-xl transition-all ${
          isBalanced
            ? 'bg-slate-800/95 border-emerald-500/40'
            : 'bg-slate-800/95 border-amber-500/40'
        }`}
      >
        <div className="space-y-4">
          {/* Balance Status Banner */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isBalanced
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isBalanced ? (
                <CheckCircle2 className="w-7 h-7 animate-pulse text-emerald-400" />
              ) : (
                <AlertCircle className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {isBalanced ? 'Mescla Perfeitamente Balanceada' : 'Ajustes Recomendados na Mescla'}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                    isBalanced
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isBalanced ? 'Equilibrado' : 'Revisar Metas'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {isBalanced
                  ? 'Todos os parâmetros bromatológicos, reológicos e térmicos estão perfeitamente calibrados para o estilo selecionado.'
                  : 'Alguns parâmetros estão fora da faixa técnica recomendada. Utilize os controles de peso dos insumos para calibrar a mescla:'}
              </p>
            </div>
          </div>

          {/* Grid 2x2 dos 4 Cards Centrais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1 items-stretch">
            {/* ROW 1 - CARD 1: Ponto Térmico de Aplicação */}
            <VariegatoThermalCard
              application={thermalApp}
              onApplicationChange={app => setThermalApp(app)}
              thermalStatus={analysis.thermalStatus}
            />

            {/* ROW 1 - CARD 2: Controle de Reologia & Viscosidade */}
            <VariegatoRheologyCard
              level={rheologyLevel}
              onLevelChange={lvl => {
                setRheologyLevel(lvl);
                setIsDirty(true);
              }}
              rheologyStatus={analysis.rheologyStatus}
              hydrocolloidsPct={analysis.percentages.hydrocolloids}
            />

            {/* ROW 2 - CARD 3: Balanço de Cocção & Redução */}
            <VariegatoCookingReductionCard
              initialWeightGrams={analysis.initialWeightGrams}
              finalWeightGrams={analysis.finalWeightGrams}
              waterEvaporatedGrams={analysis.waterEvaporatedGrams}
              waterEvaporationPercent={analysis.waterEvaporationPercent}
              totalSolubleSolidsGrams={analysis.totalSolubleSolidsGrams}
              targetBrix={targetBrix}
              onTargetBrixChange={val => {
                setTargetBrix(val);
                setIsDirty(true);
              }}
              cookingState={analysis.cookingState}
            />

            {/* ROW 2 - CARD 4: Custos & Rendimento pós-evaporação */}
            <VariegatoCostingCard
              costing={analysis.costing}
              onDosageChange={val => setDosagePercent(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Grid de Parâmetros Físico-Químicos (8 Cards dentro de sua moldura padronizada) */}
      <VariegatoNutrientGrid
        percentages={analysis.percentages}
        style={currentStyle}
      />

      {/* 4. Layout Principal: Tabela de Insumos (8 cols) e Painéis Laterais (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Tabela de Insumos */}
        <div className="lg:col-span-8 space-y-4">
          <VariegatoIngredientsTable
            items={items}
            onItemsChange={newItems => {
              setItems(newItems);
              setIsDirty(true);
            }}
            ingredients={ingredients}
            ingredientsMap={ingredientsMap}
            finalWeightGrams={analysis.finalWeightGrams}
          />
        </div>

        {/* Coluna Direita: Painéis Laterais */}
        <div className="lg:col-span-4 space-y-4">
          <VariegatoSidePanels
            alerts={analysis.alerts}
            cookingInstructions={analysis.cookingInstructions}
            items={items}
            ingredientsMap={ingredientsMap}
          />
        </div>
      </div>

      {/* Modais Técnicos */}
      <VariegatoStyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        style={currentStyle}
        onSaveStyle={updatedStyle => {
          setStyleOverride(updatedStyle);
          setIsDirty(true);
        }}
        onResetStyle={() => {
          setStyleOverride(null);
          setIsDirty(true);
        }}
      />

      <VariegatoSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        recipeName={recipeName}
        items={items}
        analysis={analysis}
        availableIngredients={ingredients}
        onSaved={handleVariegatoSaved}
      />
    </div>
  );
};
