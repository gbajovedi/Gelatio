export type PaymentMethodType = 'pix' | 'debit' | 'credit_sight' | 'credit_installment' | 'cash';

export interface PackagingFormat {
  id: string;
  name: string;
  tubWeightGrams: number;
  defaultPackCost: number;
  isPopular?: boolean;
}

export const DEFAULT_PACKAGING_FORMATS: PackagingFormat[] = [
  { id: 'pote_500g', name: 'Pote 500g (Padrão)', tubWeightGrams: 500, defaultPackCost: 1.50, isPopular: true },
  { id: 'pote_1000g', name: 'Pote Família 1.000g (1L)', tubWeightGrams: 1000, defaultPackCost: 2.20, isPopular: true },
  { id: 'copinho_120g', name: 'Copinho Individual 120g', tubWeightGrams: 120, defaultPackCost: 0.85 },
  { id: 'cuba_5000g', name: 'Cuba / Tinhella 5kg (Vitrine)', tubWeightGrams: 5000, defaultPackCost: 4.50 },
  { id: 'personalizado', name: 'Formato Personalizado', tubWeightGrams: 500, defaultPackCost: 1.50 }
];

export interface ProductionBatch {
  id: string;
  recipeId: string;
  recipeName: string;
  category: string;
  batchCode: string;
  producedAt: string; // ISO string
  expiresAt: string;  // ISO string
  tubWeightGrams: number;
  unitsProduced: number;
  recipeCostKg: number;
  packagingCostUnit: number;
  fixedOverheadUnit: number;
  unitCostTotal: number;
  totalBatchCost: number;
  notes?: string;
}

export interface StockItem {
  id: string; // recipeId_tubWeightGrams
  recipeId: string;
  recipeName: string;
  category: string;
  tubWeightGrams: number;
  currentUnits: number;
  minStockAlert: number;
  avgCostUnit: number;
  suggestedPrice: number;
  lastProducedAt?: string;
}

export interface SaleTransaction {
  id: string;
  timestamp: string;
  stockItemId: string;
  recipeId: string;
  recipeName: string;
  category: string;
  tubWeightGrams: number;
  unitsSold: number;
  unitPrice: number;
  grossRevenue: number;
  paymentMethod: PaymentMethodType;
  cardFeeRate: number;
  cardFeeAmount: number;
  salesTaxRate: number;
  salesTaxAmount: number;
  netRevenue: number;
  unitCost: number;
  totalCostSold: number;
  netProfit: number;
  marginPercent: number;
  notes?: string;
}

export type AdjustmentType = 'loss' | 'tasting' | 'internal_consumption' | 'inventory_count';

export interface StockAdjustment {
  id: string;
  stockItemId: string;
  recipeId: string;
  recipeName: string;
  tubWeightGrams: number;
  timestamp: string;
  type: AdjustmentType;
  quantityChange: number; // Negativo para perdas, positivo para acertos a mais
  unitCost: number;
  totalCostImpact: number;
  notes: string;
}

export interface StockKPIs {
  totalTubsInStock: number;
  totalCapitalInvested: number;
  totalPotentialRevenue: number;
  lowStockItemsCount: number;
  outOfStockCount: number;
  flavorsInStockCount: number;
}

export interface SalesDRESummary {
  grossRevenue: number;
  cardFeesTotal: number;
  salesTaxTotal: number;
  netRevenue: number;
  cmvTotal: number;
  grossContributionMargin: number;
  fixedCostsPeriod: number;
  operatingNetProfit: number;
  profitMarginPercent: number;
  unitsSoldTotal: number;
}
