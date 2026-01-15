
export type MaterialCategory = 'Impermeabilizante' | 'Pintura' | 'Sellador';

export interface Product {
  id: string;
  name: string;
  category: MaterialCategory;
  yield: number; // m2 per bucket
  price: number; // price per bucket
  brand: string; // bucket brand
}

export interface MaterialConfig {
  name: string;
  yield: number; 
  price: number; 
  brand: string; 
}

export interface Worker {
  id: string;
  name: string;
  dailyRate: number;
}

export interface ProjectConfig {
  m2: number;
  selectedCategory: MaterialCategory;
  selectedProductId: string;
  auxMaterialTotal: number; // Cambiado de rate a Total manual
  profitRate: number;
  materials: Record<string, MaterialConfig>;
  workers: Worker[];
  numWorkers: number;
  workerDailyRate: number;
  workDays: number;
  scaffoldCount: number;
  scaffoldDailyRate: number;
  scaffoldDays: number;
  masonryRepairEnabled: boolean;
  masonryRepairCost: number;
  extraBuckets: number; 
  extraSealerBuckets: number; 
}

export interface AIUpdates {
  m2?: number;
  selectedCategory?: string;
  selectedProductId?: string;
  yield?: number;
  price?: number;
  brand?: string;
  profitRate?: number;
  numWorkers?: number;
  workerDailyRate?: number;
  workDays?: number;
  scaffoldCount?: number;
  scaffoldDailyRate?: number;
  scaffoldDays?: number;
  masonryRepairEnabled?: boolean;
  masonryRepairCost?: number;
}

export interface QuoteItem {
  concept: string;
  detail: string;
  quantity: string | number;
  unitPrice: number;
  total: number;
  brand?: string; 
  yieldDisplay?: string;
  isWarning?: boolean;
  isAdjustable?: boolean; 
}

export interface QuoteResult {
  items: QuoteItem[];
  subtotal: number;
  iva: number;
  total: number;
}
