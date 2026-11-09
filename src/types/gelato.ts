export interface Ingredient {
  id: string;
  name: string;
  category: string;
  costKg: number;
  packagePrice?: number;
  packageWeight?: number;
  packageUnit?: 'kg' | 'g';
  sugars: number;      // 0 to 1
  fat: number;         // 0 to 1
  msnf: number;        // SNGL (0 to 1)
  otherSolids: number; // OS (0 to 1)
  totalSolids: number; // ST (0 to 1)
  water: number;       // Água (0 to 1)
  pod: number;
  pac: number;
  protein: number;
  hasAllergen: boolean;
  allergenDetails?: string[];
  isCustom?: boolean;
  preparationId?: string;
  density?: number; // Densidade intrínseca ou aparente em g/ml ou kg/L
  overrun?: number; // % de aeração mecânica ou processo (ex: 20 para mixer)
  saturatedFatRatio?: number; // Proporção de gordura saturada sobre a gordura total (0 a 1)
  fiberRatio?: number;        // Gramas de fibra alimentar por grama de insumo (0 a 1)
  sodiumMgPer100g?: number;   // Miligramas de sódio por 100g de insumo
  transFatRatio?: number;     // Proporção de gordura trans sobre a gordura total (0 a 1)
}

export interface NutrientValues {
  sugars: number;
  fat: number;
  msnf: number;
  otherSolids: number;
  totalSolids: number;
  water: number;
  pod: number;
  pac: number;
  protein: number;
}

export interface StyleStandard {
  id?: string;
  name: string;
  customProfileName?: string;
  baseCategory?: string;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  pacDivisor: number;
  min: NutrientValues;
  max: NutrientValues;
}

export interface RecipeItem {
  name: string;
  grams: number;
}

export interface VariegatoItem {
  name: string;
  grams: number;
  costKg?: number;
  density?: number; // Densidade aparente em kg/L ou g/ml (ex: 1.07 para Nutella c/ mixer)
  overrun?: number; // % de aeração do mixer ou processo (ex: 20%)
  processMethod?: 'mixer' | 'direct' | 'custom'; // Método de preparo aplicado
}

export interface VariegatoPhysicalDetail {
  name: string;
  grams: number;
  density: number;
  overrun: number;
  volumeLiters: number;
  processMethod?: 'mixer' | 'direct' | 'custom';
}

export type PreparationStepCategory =
  | 'pesagem'      // Separação e pesagem de pós e líquidos
  | 'aquecimento'  // Pasteurização / dissolução a quente
  | 'emulsao'      // Mixer de alta rotação / homogeneização
  | 'maturacao'    // Tina de maturação / repouso a 4°C
  | 'fruta'        // Adição e incorporação de frutas frescas/polpas a frio
  | 'batimento'    // Mantecação / congelamento dinâmico na produtora
  | 'mesclagem'    // Variegatura e inclusões na extração
  | 'abatimento'   // Ultracongelamento (-35°C) / casquinha térmica
  | 'outro';

export interface PreparationStep {
  id: string;                         // Identificador único (ex: 'step_1')
  order: number;                      // Sequência ordinal (1, 2, 3...)
  title: string;                      // Título do passo (ex: "Pasteurização Alta")
  description: string;                // Instrução técnica detalhada
  temperature?: string;               // Temperatura-chave (ex: "85°C", "4°C", "-8°C")
  duration?: string;                  // Tempo estimado ou repouso (ex: "15 min", "4h a 12h")
  category?: PreparationStepCategory; // Categoria operacional para ícone e tema visual
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  targetStyle: string;
  ingredients: RecipeItem[];
  variegatos?: VariegatoItem[];
  totalGrams: number;
  isCustom?: boolean;
  notes?: string;
  preparationSteps?: PreparationStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Preparation {
  id: string;
  name: string;
  category: 'Pré-preparo' | 'Variegato' | 'Caldas' | 'Creminos' | 'Inclusões Crocantes';
  instructions: string;
  preparationSteps?: PreparationStep[];
  ingredients: { name: string; grams: number }[];
  isCustom?: boolean;
  costKg?: number;
  density?: number;
  overrun?: number;
}

export interface NutrientValidation {
  val: number;
  min: number;
  max: number;
  status: 'Ok' | 'Baixo' | 'Alto';
}

export interface SandinessRisk {
  maxSafeMsnf: number;
  currentMsnf: number;
  isAtRisk: boolean;
  excessPct: number;
}

export interface CorvittoMetrics {
  pacWater: number;
  vitrineStatus: 'firme' | 'ideal' | 'macio';
  vitrineLabel: string;
  freezerStatus: 'duro' | 'firme' | 'colher' | 'muito_macio';
  freezerLabel: string;
  freezerAdvice: string;
  neededPacForFreezer: number;
}

export interface EmulsionMetrics {
  fatMsnfRatio: number;
  status: 'ideal' | 'gorduroso' | 'magro' | 'sorbet';
  statusLabel: string;
  overrunEstimatePct: number;
  overrunRange: string;
  advice: string;
}

export interface BatchAnalysis {
  caldaWeight: number;
  batchScaleRatio: number;
  totals: {
    sugars: number;
    fat: number;
    msnf: number;
    otherSolids: number;
    totalSolids: number;
    water: number;
    pod: number;
    pac: number;
    protein: number;
    cost: number;
  };
  percentages: {
    sugars: number;
    fat: number;
    msnf: number;
    otherSolids: number;
    totalSolids: number;
    water: number;
    pod: number;
    pac: number;
    protein: number;
  };
  validations: {
    sugars: NutrientValidation;
    fat: NutrientValidation;
    msnf: NutrientValidation;
    otherSolids: NutrientValidation;
    totalSolids: NutrientValidation;
    water: NutrientValidation;
    pod: NutrientValidation;
    pac: NutrientValidation;
    protein: NutrientValidation;
  };
  isBalanced: boolean;
  servingTemperature: number;
  sandinessRisk?: SandinessRisk;
  corvittoMetrics?: CorvittoMetrics;
  emulsionMetrics?: EmulsionMetrics;
  densityAndVolume?: {
    caldaDensity: number;
    baseLiquidVolumeLiters: number;
    baseVolumeLiters: number;
    variegatoVolumeLiters: number;
    totalVolumeLiters: number;
    baseOverrunPct: number;
    effectiveOverrunPct: number;
    variegatoDetails?: VariegatoPhysicalDetail[];
  };
  allergensLabel: string;
  costing: {
    caldaCostKg: number;
    totalBatchCost: number;
    finalWeightGrams: number;
    finalCostKg: number;
    scoopCost60g: number;
    suggestedPrice500g: number;
    variegatoRatioPercent: number;
    totalVariegatoGrams?: number;
    totalVariegatoCost?: number;
    isMarginViable?: boolean;
    marginWarning?: string;
  };
}

export interface PricingSettings {
  tubWeightGrams: number;
  tubPackagingCost: number;
  indirectOverheadPerTub: number;
  targetProfitMarginPercent: number;
  pricingMethod?: 'margin' | 'markup';
  cardFeePercent: number;
  salesTaxPercent?: number;
}
