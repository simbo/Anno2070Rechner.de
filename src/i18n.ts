import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';

import { defaultLanguage, type Language } from './routes';

/**
 * English translations of the German interface texts, taken over from the old site's
 * gettext catalog. German texts are the keys and are shown unchanged in German.
 */
const english: Record<string, string> = {
  Startseite: 'Home',
  Hintergrund: 'Background',
  'Zufällig (wechselt täglich)': 'Random (changes daily)',
  Bevölkerung: 'Population',
  Produktionsketten: 'Commodity chains',
  Datenbank: 'Database',
  Info: 'Info',
  Wohnhäuser: 'Residences',
  insgesamt: 'total',
  Arbeiter: 'Workers',
  Angestellte: 'Employees',
  Ingenieure: 'Engineers',
  Executives: 'Executives',
  Information: 'Information',
  Wohnraum: 'Living space',
  'Bedarf nach Lifestyleprodukten': 'Need for lifestyle products',
  Laborgehilfen: 'Assistants',
  Forscher: 'Researchers',
  Zurücksetzen: 'Reset',
  'Wirklich zurücksetzen?': 'Really reset?',
  Ja: 'Yes',
  Nein: 'No',
  'für Spielversion': 'for Game Version',
  'Gespeicherte Spiele': 'Saved games',
  'Deine Eingaben werden automatisch in diesem Browser gespeichert.':
    'Your inputs are saved automatically in this browser.',
  'Dieser Browser erlaubt kein Speichern. Deine Eingaben gehen beim Schließen verloren.':
    'This browser does not allow saving. Your inputs will be lost when you close it.',
  'Neues Spiel': 'New game',
  Umbenennen: 'Rename',
  Löschen: 'Delete',
  'Wirklich löschen?': 'Really delete?',
  'Spiel exportieren': 'Export game',
  'Spiel importieren': 'Import game',
  'Dieser Text enthält das aktuelle Spiel. Er ist kopiert und lässt sich in einem anderen Browser importieren.':
    'This text holds the current game. It has been copied and can be imported in another browser.',
  'Dieser Text enthält das aktuelle Spiel. Kopiere ihn und importiere ihn in einem anderen Browser.':
    'This text holds the current game. Copy it and import it in another browser.',
  'Füge hier den Text eines exportierten Spiels ein.': 'Paste the text of an exported game here.',
  Importieren: 'Import',
  Abbrechen: 'Cancel',
  Schließen: 'Close',
  'Dieser Text ist kein gültiges Spiel.': 'This text is not a valid game.',
  'Dieser Text stammt aus einer neueren Version der Seite.': 'This text comes from a newer version of the site.',
  'Dieses Spiel ist schon vorhanden.': 'This game already exists.',
  'gibt es hier schon.': 'already exists here.',
  'Hier geändert am': 'Changed here on',
  'Import geändert am': 'Import changed on',
  Überschreiben: 'Overwrite',
  'Als Kopie anlegen': 'Add a copy',
  Einwohner: 'Inhabitants',
  Bedürfnisse: 'Demands',
  'Tonnen pro Minute': 'Tons per minute',
  Produktionsgebäude: 'Production buildings',
  'max. Produktivität': 'max. Productivity',
  'Anzahl der Produktionsgebäude': 'Production buildings count',
  Effizienz: 'Efficiency',
  'Soll TPM der Produktionskette:': 'Target TPM for commodity chain:',
  Bevölkerungsbedarf: 'Population demand',
  'max. Produktion des Endprodukts': 'max. production of final product',
  'Wohnhäuser anzeigen': 'Show residences',
  'Einwohner anzeigen': 'Show inhabitants',
  'Bedürfnisse anzeigen': 'Show demands',
  'Produktionsbetriebe anzeigen': 'Show Productionbuildings',
  Suche: 'Search',
  'Gebäude oder Ware': 'Building or Product',
  Anzahl: 'Count',
  'Sollproduktion in Tonnen pro Minute': 'Target production in tons per minute',
  'Soll TPM': 'Target TPM',
  automatisch: 'automatic',
  Berechnen: 'Calculate',
  alle: 'all',
  'alle Fabriken': 'all factories',
  'alle Farmen': 'all farms',
  'alle Energie erzeugenden': 'all energy producing',
  'alle Ökobilanz erzeugenden': 'all eco effect producing',
  Gebäude: 'Buildings',
  Waren: 'Goods',
  'Suche nach': 'Search for',
  Suchen: 'Search',
  Energie: 'Energy',
  Ökobilanz: 'eco effect',
  'Alternatives Produktionsgebäude': 'alternative production building',
  Credits: 'Credits',
  Bilanz: 'Balance',
  produziert: 'produces',
  benötigt: 'needs',
  'Produktionskette anzeigen': 'Show commodity chain',
  'produziert von': 'produced by',
  'Oops, da ist etwas total schiefgelaufen…': 'Oops, something went totally wrong here…',
  'Das von dir angeforderte Dokument konnte nicht gefunden werden.': 'The document you requested could not be found.',
  Support: 'Support',
  'Thema im deutschen Anno 2070 Forum': 'Topic in the german Anno 2070 forums',
  'Thema im englischen Anno 2070 Forum': 'Topic in the english Anno 2070 forums',
  'Issue Tracker von Anno2070Rechner.de auf Github': 'Issue Tracker of Anno2070Rechner.de at Github',
  Quelltexte: 'Sources',
  'Alle Quelltexte stehen auf Github zur Verfügung. Du bist herzlich eingeladen mitzuwirken.':
    'All sources are available at Github. You are invited to contribute.',
  'Anno2070Rechner.de auf Github': 'Anno2070Rechner.de at Github',
  'Entwickler und Betreiber': 'Developer and carrier',
  'Die Website ist rein zum privaten Gebrauch und dient keinem kommerziellen Zweck.':
    'The website is only for private use and does not serve any commercial purpose.',
  'Anno2070Rechner.de ist eine Fansite und ein Online-Tool für das Spiel <a href="%s" title="Anno 2070">Anno 2070</a> von <a href="%s" title="Ubisoft">Ubisoft</a>.':
    'Anno2070Rechner.de is a fansite and a online tool for the game <a href="%s" title="Anno 2070">Anno 2070</a> by <a href="%s" title="Ubisoft">Ubisoft</a>.',
  'Für volle Funktionalität und beste Darstellung ist ein moderner Browser, wie <a href="%s" title="Mozilla Firefox">Mozilla Firefox</a> oder <a href="%s" title="Google Chrome">Google Chrome</a>, erforderlich.':
    'For full functionality and best presentation, a modern browser like <a href="%s" title="Mozilla Firefox">Mozilla Firefox</a> or <a href="%s" title="Google Chrome">Google Chrome</a> is necessary.',
  '<em>Bitte</em> benutzt den Issue Tracker des Projekts auf Github um auf Fehler, Verbesserungsvorschläge und ähnliches aufmerksam zu machen:':
    "<em>Please</em> use the project's issue tracker on Github to report errors, suggestions or anything similar:",
};

/**
 * Translates a German interface text.
 *
 * @param language - The target language.
 * @param text - The German text.
 * @returns The translation, or the text itself in German or without a translation.
 */
export function translate(language: Language, text: string): string {
  return language === 'en' ? (english[text] ?? text) : text;
}

/**
 * The language of a route, taken from its meta data.
 *
 * @returns The current language.
 */
export function useLanguage(): ComputedRef<Language> {
  const route = useRoute();
  return computed(() => (route.meta.language as Language | undefined) ?? defaultLanguage);
}

/**
 * Translation helper for components.
 *
 * @returns The current language and a translate function.
 */
export function useI18n(): { language: ComputedRef<Language>; t: (text: string) => string } {
  const language = useLanguage();
  return { language, t: (text: string) => translate(language.value, text) };
}
