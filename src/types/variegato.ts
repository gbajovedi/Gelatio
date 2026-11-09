import { PreparationStep } from './gelato';

export type VariegatoRheologyLevel = 1 | 2 | 3;
export type VariegatoRheologyProfile = 'fluid' | 'balanced' | 'structured';
export type VariegatoThermalApplication = 'vitrine' | 'freezer';
export type VariegatoCookingState = 'cold' | 'active_reduction';

export type VariegatoStyleId = 
  | 'fruta_suave' 
  | 'fruta_gelificada' 
  | 'caramelo_toffee' 
  | 'creme_trufado' 
  | 'custom';

export interface VariegatoItemRow {
  name: string;
  grams: number;
  customBrix?: number;
  customPac?: number;
  customDryMatter?: number;
}

export interface VariegatoStyleLimits {
  brix: number;
  pac: number;
  pacOnWater?: number;
  pod?: number;
  sugars: number;
  fat: number;
  hydrocolloids: number;
  maxSucroseRatio: number;
  water: number;
  aw: number;
}

export interface VariegatoStyleStandard {
  id: VariegatoStyleId;
  name: string;
  description: string;
  defaultBrixTarget: number;
  defaultRheology: VariegatoRheologyProfile;
  min: VariegatoStyleLimits;
  max: VariegatoStyleLimits;
}

export interface VariegatoAnalysisPercentages {
  brix: number;             // % sólidos solúveis pós-evaporação
  pac: number;              // PAC efetivo relativo pós-cocção (base 1.000g)
  pacOnWater: number;       // PAC sobre a fase aquosa: (Pontos PAC / Água g) * 100
  pod: number;              // POD (Poder Adoçante Relativo) concentrado pós-cocção
  sugars: number;           // % de açúcares totais na mescla final
  fat: number;              // % de lipídeos totais
  hydrocolloids: number;    // % de pectina, gomas, amidos
  sucroseRatio: number;     // % de sacarose sobre os açúcares totais
  water: number;            // % de água residual livre
  estimatedAw: number;      // Atividade de água estimada (0 a 1)
}

export interface VariegatoThermalStatus {
  application: VariegatoThermalApplication;
  targetTemp: number; // -12 ou -18
  pacValue: number;
  pacOnWater: number;
  status: 'ideal' | 'freezing_risk' | 'too_fluid';
  label: string;
  description: string;
}

export interface VariegatoRheologyStatus {
  profile: VariegatoRheologyProfile;
  level: VariegatoRheologyLevel;
  label: string;
  description: string;
  estimatedCps: number;
  recommendedTexturizer: string;
}

export interface VariegatoCostingAnalysis {
  initialCost: number;
  finalCostKg: number;
  dosagePercent: number;
  additionalCostPerScoop: number;  // Custo porção 60g
  additionalCostPerPint: number;   // Custo pote 500ml (~60g mescla)
}

export interface VariegatoAlerts {
  crystallizationRisk: boolean;
  lowBrixRisk: boolean;
  highSucroseRisk: boolean;
  excessFluidityRisk: boolean;
  messages: string[];
}

export interface VariegatoAnalysis {
  initialWeightGrams: number;
  finalWeightGrams: number;
  waterEvaporatedGrams: number;
  waterEvaporationPercent: number;
  totalSolubleSolidsGrams: number;
  targetBrix: number;
  cookingState: VariegatoCookingState;
  percentages: VariegatoAnalysisPercentages;
  thermalStatus: VariegatoThermalStatus;
  rheologyStatus: VariegatoRheologyStatus;
  costing: VariegatoCostingAnalysis;
  alerts: VariegatoAlerts;
  cookingInstructions: string[];
}

export interface VariegatoRecipe {
  id: string;
  name: string;
  category: 'Variegato';
  targetStyleId: VariegatoStyleId;
  targetBrix: number;
  rheologyLevel: VariegatoRheologyLevel;
  thermalApplication: VariegatoThermalApplication;
  dosagePercent: number; // 10 a 30%
  ingredients: VariegatoItemRow[];
  preparationSteps?: PreparationStep[];
  isCustom?: boolean;
}
