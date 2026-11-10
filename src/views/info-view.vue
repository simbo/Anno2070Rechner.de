<script setup lang="ts">
import { useI18n } from '../i18n';
import { imprintUrl, privacyUrl } from '../routes';

/**
 * The info page: what the site is, a personal note by its author and the legal notes.
 */
const { language, t } = useI18n();

const fill = (text: string, ...values: string[]): string =>
  values.reduce((result, value) => result.replace('%s', () => value), text);

const wikipedia = (article: string): string => `https://${language.value}.wikipedia.org/wiki/${article}`;

const repositoryUrl = 'https://github.com/simbo/Anno2070Rechner.de';
const licenseUrl = 'https://simbo.mit-license.org/@2011/';
</script>

<template>
  <h2 class="user">{{ t('Info') }}</h2>
  <p
    v-html="
      fill(
        t(
          'Anno2070Rechner.de ist eine Fansite und ein Online-Tool für das Spiel <a href=&quot;%s&quot; title=&quot;Anno 2070&quot;>Anno 2070</a> von <a href=&quot;%s&quot; title=&quot;Ubisoft&quot;>Ubisoft</a>.',
        ),
        wikipedia('Anno_2070'),
        wikipedia('Ubisoft'),
      )
    "
  ></p>
  <p>{{ t('Die Website ist rein zum privaten Gebrauch und verfolgt keine kommerziellen Zwecke.') }}</p>
  <div class="info-note">
    <p>
      {{
        t(
          'Zu Anno gehörte für mich immer auch ein Rechner. Ende 2011 erschien Anno 2070, und ich habe diesen hier gebaut – mit derselben Begeisterung, mit der ich es gespielt habe. Als mich das Spiel nicht mehr packte, ging es dem Rechner genauso: Die Erweiterung „Die Tiefsee“ kam nie dazu, und Feedback blieb unbeantwortet. Danke an alle, die Fehler gemeldet, Ideen geschickt oder selbst weitergebaut haben.',
        )
      }}
    </p>
    <p>
      {{
        t(
          '15 Jahre lief der Rechner mit PHP und MySQL auf dem Server und wurde über Updates und Umzüge hinweg gepflegt. 2026 ließ ich ihn mit Hilfe von KI in eine Version ohne Server und Datenbank übertragen. Die neue, hoffentlich zukunftssichere Version wurde intensiv geprüft und getestet, Fehler wurden behoben und die Spieldaten auf die letzte Spielversion gebracht. Möge er noch lange laufen, wie er ist.',
        )
      }}
    </p>
    <p class="info-signature">— <a href="https://simbo.de">Simon Lepel</a> ({{ t('Entwickler und Betreiber') }})</p>
  </div>
  <h3>{{ t('Rechtliches') }}</h3>
  <div class="info-legal">
    <h4>
      <a :href="imprintUrl(language)">{{ t('Impressum') }}</a>
    </h4>
    <h4>{{ t('Quelltext') }}</h4>
    <p>
      <span v-html="fill(t('Der Quelltext steht unter der <a href=&quot;%s&quot;>MIT-Lizenz</a>.'), licenseUrl)"></span
      ><br />{{ t('Ausgenommen sind die Grafiken aus dem Spiel.') }}
    </p>
    <p class="info-repository">
      <a :href="repositoryUrl"><span class="github-icon"></span>simbo/Anno2070Rechner.de</a>
    </p>
    <h4>Anno 2070</h4>
    <p>
      {{ t('Anno 2070 ist eine Marke von Ubisoft. Diese Seite ist kein offizielles Angebot von Ubisoft.') }}<br />{{
        t('Grafiken und Spieldaten stammen aus dem Spiel und gehören ihren Rechteinhabern.')
      }}
    </p>
    <h4>{{ t('Schrift') }}</h4>
    <p
      v-html="
        fill(
          t(
            'Die Überschriften verwenden die Schrift „Prototype“ von Justin Callaghan, siehe <a href=&quot;%s&quot;>Prototype.txt</a>.',
          ),
          '/fonts/Prototype.txt',
        )
      "
    ></p>
    <h4>{{ t('Datenschutz') }}</h4>
    <p
      v-html="
        fill(
          t(
            'Deine Eingaben werden nur in deinem Browser gespeichert. Es gibt keine Cookies. Eine anonyme Besucherstatistik läuft auf meinem eigenen Server, Details im <a href=&quot;%s&quot;>Datenschutzhinweis</a>.',
          ),
          `${privacyUrl(language)}#analytics`,
        )
      "
    ></p>
  </div>
</template>
