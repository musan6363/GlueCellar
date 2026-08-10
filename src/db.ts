import Dexie, { Table } from 'dexie';
import { WineCard, WineList } from './types';

export class WineDatabase extends Dexie {
  wineLists!: Table<WineList, string>;
  wineCards!: Table<WineCard, string>;

  constructor() {
    super('WineDatabase');
    this.version(1).stores({
      wineLists: 'id',
      wineCards: 'id, listId, janCode, name, country, grapes'
    });
  }
}

export const db = new WineDatabase();
