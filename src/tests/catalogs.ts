import gameData from '../data/game-data.json';
import namesDe from '../data/names.de.json';
import namesEn from '../data/names.en.json';
import { createCatalog, type Catalog, type GameData } from '../models/game-data';

/**
 * Catalogs of the real game data for tests.
 */
export const catalogs: Record<'de' | 'en', Catalog> = {
  de: createCatalog(gameData as unknown as GameData, namesDe, 'de'),
  en: createCatalog(gameData as unknown as GameData, namesEn, 'en'),
};
