export type TradeType = 'buy' | 'swap' | 'free';

export type Condition = 'Brand New' | 'Like New' | 'Good' | 'Well-Loved';

export type ItemCategory =
  | 'Textbooks & Reviewers'
  | 'Uniforms & Scrubs'
  | 'Tools & Lab Gear'
  | 'Dorm & Room'
  | 'Tech & Gadgets';

export interface GreenImpactStats {
  co2SavedKg: number;
  wasteDivertedKg: number;
  itemsReused: number;
  moneySavedPhp: number;
  userItemsReused: number;
  userCo2SavedKg: number;
  userMoneySavedPhp: number;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number | null; // null for free or swap-only items
  tradeType: TradeType;
  category: ItemCategory;
  condition: Condition;
  courseTag?: string; // e.g., 'BS Nursing', 'BS Accountancy'
  yearLevel?: string; // e.g., '2nd Year', 'Graduating'
  campus: string; // e.g., 'Ateneo de Naga University', 'Univ. of Nueva Caceres'
  safeMeetupSpot: string; // e.g., 'Main Library Ground Floor', 'Gate 1 Security Post'
  sellerName: string;
  sellerRating: number;
  sellerYear: string;
  isVerifiedStudent: boolean;
  isReserved?: boolean;
  createdAt: string;
  imageUrl?: string;
  description: string;
  estimatedCo2SavedKg: number;
}
