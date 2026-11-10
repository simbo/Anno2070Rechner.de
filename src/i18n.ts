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
  'für Version': 'for Version',
  'Gespeicherte Spiele': 'Saved games',
  'Automatisch im Browser gespeichert.': 'Automatically saved in your browser.',
  'Dieser Browser erlaubt kein Speichern. Deine Eingaben gehen beim Schließen verloren. Erlaube Website-Daten für diese Seite, um sie zu behalten.':
    'This browser does not allow saving. Your inputs will be lost when you close it. Allow site data for this site to keep them.',
  'Deine Spiele wurden mit einer neueren Version der Seite gespeichert. Lade die Seite neu, damit deine Eingaben wieder gespeichert werden.':
    'Your games were saved by a newer version of the site. Reload the page so that your inputs are saved again.',
  'Neu laden': 'Reload',
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
  'Anno2070Rechner.de ist eine Fansite und ein Online-Tool für das Spiel <a href="%s" title="Anno 2070">Anno 2070</a> von <a href="%s" title="Ubisoft">Ubisoft</a>.':
    'Anno2070Rechner.de is a fansite and an online tool for the game <a href="%s" title="Anno 2070">Anno 2070</a> by <a href="%s" title="Ubisoft">Ubisoft</a>.',
  'Die Website ist rein zum privaten Gebrauch und verfolgt keine kommerziellen Zwecke.':
    'The website is purely for private use and has no commercial purpose.',
  'Zu Anno gehörte für mich immer auch ein Rechner. Ende 2011 erschien Anno 2070, und ich habe diesen hier gebaut – mit derselben Begeisterung, mit der ich es gespielt habe. Als mich das Spiel nicht mehr packte, ging es dem Rechner genauso: Die Erweiterung „Die Tiefsee“ kam nie dazu, und Feedback blieb unbeantwortet. Danke an alle, die Fehler gemeldet, Ideen geschickt oder selbst weitergebaut haben.':
    'Anno has always come with a calculator for me. Anno 2070 came out at the end of 2011, and I built this one – with the same enthusiasm I played it with. When the game lost its grip on me, so did the calculator: the “Deep Ocean” expansion never made it in, and feedback went unanswered. Thanks to everyone who reported bugs, sent ideas or built on it themselves.',
  '15 Jahre lief der Rechner mit PHP und MySQL auf dem Server und wurde über Updates und Umzüge hinweg gepflegt. 2026 ließ ich ihn mit Hilfe von KI in eine Version ohne Server und Datenbank übertragen. Die neue, hoffentlich zukunftssichere Version wurde intensiv geprüft und getestet, Fehler wurden behoben und die Spieldaten auf die letzte Spielversion gebracht. Möge er noch lange laufen, wie er ist.':
    'For 15 years the calculator ran on a server with PHP and MySQL and was kept alive through updates and moves. In 2026 I had it ported with the help of AI into a version without a server or database. The new, hopefully future-proof version was thoroughly checked and tested, bugs were fixed and the game data was brought up to the final game version. May it keep running just as it is for a long time.',
  'Entwickler und Betreiber': 'developer and operator',
  Rechtliches: 'Legal',
  Impressum: 'Imprint',
  'Anno 2070 ist eine Marke von Ubisoft. Diese Seite ist kein offizielles Angebot von Ubisoft.':
    'Anno 2070 is a trademark of Ubisoft. This site is not an official Ubisoft offering.',
  'Grafiken und Spieldaten stammen aus dem Spiel und gehören ihren Rechteinhabern.':
    'Graphics and game data come from the game and belong to their rights holders.',
  Quelltext: 'Source code',
  'Der Quelltext steht unter der <a href="%s">MIT-Lizenz</a>.':
    'The source code is licensed under the <a href="%s">MIT License</a>.',
  'Ausgenommen sind die Grafiken aus dem Spiel.': 'The graphics from the game are excluded.',
  Schrift: 'Font',
  'Die Überschriften verwenden die Schrift „Prototype“ von Justin Callaghan, siehe <a href="%s">Prototype.txt</a>.':
    'The headings use the font “Prototype” by Justin Callaghan, see <a href="%s">Prototype.txt</a>.',
  Datenschutz: 'Privacy',
  'Deine Eingaben werden nur in deinem Browser gespeichert. Es gibt keine Cookies. Eine anonyme Besucherstatistik läuft auf meinem eigenen Server, Details im <a href="%s">Datenschutzhinweis</a>.':
    'Your inputs are only stored in your browser. There are no cookies. An anonymous visitor statistic runs on my own server, details in the <a href="%s">privacy notice</a>.',
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
