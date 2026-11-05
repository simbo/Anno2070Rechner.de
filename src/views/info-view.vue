<script setup lang="ts">
import { useI18n } from '../i18n';

/**
 * The info page with links and contact, unchanged from the old site.
 */
const { t } = useI18n();

const fill = (text: string, ...values: string[]): string =>
  values.reduce((result, value) => result.replace('%s', () => value), text);
</script>

<template>
  <h2 class="user">{{ t('Info') }}</h2>
  <p
    v-html="
      fill(
        t(
          'Anno2070Rechner.de ist eine Fansite und ein Online-Tool für das Spiel <a href=&quot;%s&quot; title=&quot;Anno 2070&quot;>Anno 2070</a> von <a href=&quot;%s&quot; title=&quot;Ubisoft&quot;>Ubisoft</a>.',
        ),
        'https://anno.de.ubi.com/',
        'https://www.ubi.com/',
      )
    "
  ></p>
  <p>{{ t('Die Website ist rein zum privaten Gebrauch und dient keinem kommerziellen Zweck.') }}</p>
  <p
    v-html="
      fill(
        t(
          'Für volle Funktionalität und beste Darstellung ist ein moderner Browser, wie <a href=&quot;%s&quot; title=&quot;Mozilla Firefox&quot;>Mozilla Firefox</a> oder <a href=&quot;%s&quot; title=&quot;Google Chrome&quot;>Google Chrome</a>, erforderlich.',
        ),
        'https://www.getfirefox.com/',
        'https://www.google.com/chrome/',
      )
    "
  ></p>
  <h3>{{ t('Support') }}</h3>
  <p>
    <a
      href="https://forums-de.ubi.com/showthread.php/116678-Tool-Anno2070Rechner-de-Bedarfsrechner-Produktionsketten-Datenbank"
      >{{ t('Thema im deutschen Anno 2070 Forum') }}</a
    >
  </p>
  <p>
    <a
      href="https://forums-de.ubi.com/showthread.php/116680-Tool-Anno2070Rechner-de-Demand-calculation-Commodity-Chains-Database"
      >{{ t('Thema im englischen Anno 2070 Forum') }}</a
    >
  </p>
  <p
    v-html="
      t(
        '<em>Bitte</em> benutzt den Issue Tracker des Projekts auf Github um auf Fehler, Verbesserungsvorschläge und ähnliches aufmerksam zu machen:',
      )
    "
  ></p>
  <p>
    <a
      href="https://github.com/simbo/Anno2070Rechner.de/issues"
      :title="t('Issue Tracker von Anno2070Rechner.de auf Github')"
      >github.com/simbo/Anno2070Rechner.de/issues</a
    >
  </p>
  <h3>{{ t('Quelltexte') }}</h3>
  <p>{{ t('Alle Quelltexte stehen auf Github zur Verfügung. Du bist herzlich eingeladen mitzuwirken.') }}</p>
  <p>
    <a href="https://github.com/simbo/Anno2070Rechner.de" :title="t('Anno2070Rechner.de auf Github')"
      >github.com/simbo/Anno2070Rechner.de</a
    >
  </p>
  <h3>{{ t('Entwickler und Betreiber') }}</h3>
  <address>Simon Lepel<br />post [at] anno2070rechner [dot] de</address>
</template>
