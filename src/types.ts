export type TasteLevel = 0 | 1 | 2;

export interface WineCard {
  id: string;
  janCode?: string;
  
  name: string;
  country: string;
  grapes: string;
  
  glassCount: number;
  bottleCount: number;
  
  rating5: number;
  tastes: Record<string, TasteLevel>;
  memo: string;
  
  images: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface WineList {
  listId: string;
  listName: string;
  ownerName: string;
  isMyList: boolean;
  tasteMaster: string[];
  cards: WineCard[];
}

export const DEFAULT_TASTES = [
  'すっきり', '中間', 'しっかり', '個性的', 
  'ドライ', 'フレッシュ', 'きれい', '華やか', 
  'ハーブ', 'お花', 'フルーティ', 'トロピカル', 
  'ミネラル', 'スパイス', 'グビグビ', 'ゆっくり', 
  '酸味', '渋味', '旨味', '甘やか', 
  'わんぱく', 'チャーミング', 'ダンディ', 'セクシー'
];
