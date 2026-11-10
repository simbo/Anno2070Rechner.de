<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppLink from './components/app-link.vue';
import BackgroundMenu from './components/background-menu.vue';
import SaveMenu from './components/save-menu.vue';
import StorageNotice from './components/storage-notice.vue';
import { useI18n } from './i18n';
import { gameVersion } from './models/game-data';
import { imprintUrl, languages, pagePath, pages, privacyUrl, siteTitle } from './routes';
import { useGamesStore } from './stores/games';

/**
 * Page frame of the old site: header with logo, save and background menus and navigation, content
 * with a notice while games are not saved, footer, the links to imprint and privacy notice and the language selection. Login, registration
 * and the "Under Development" badge are gone.
 */
const route = useRoute();
const { language, t } = useI18n();
const games = useGamesStore();

const languageNames = { de: 'Deutsch (Deutschland)', en: 'English (US)' } as const;

// The calculator starts over when another game is opened.
const viewKey = computed(() => (route.meta.page === 'population' ? `${route.path}#${games.revision}` : route.path));

const menuClass = (id: string): string => (route.meta.page === id ? 'current' : '');

// Language links point to the same page; the 404 page links to the start page.
const languageLinks = computed(() =>
  languages.map(code => ({
    code,
    title: languageNames[code],
    href: route.meta.page
      ? { path: pagePath(route.meta.page, code), query: route.query }
      : code === 'de'
        ? '/'
        : `/${code}`,
  })),
);
</script>

<template>
  <div id="wrap">
    <div id="header">
      <div class="section">
        <AppLink id="home-link" :to="pagePath('population', language)" :title="`${siteTitle} » ${t('Startseite')}`" />
        <h1 id="site-title">{{ siteTitle }}</h1>
        <small id="game-version">{{ t('für Version') }} {{ gameVersion }}</small>
        <div id="header-tab">
          <div class="header-tab-fill"></div>
          <div class="header-tab-left"></div>
          <div class="header-tab-middle">
            <SaveMenu />
            <BackgroundMenu />
          </div>
          <div class="header-tab-right"></div>
        </div>
        <ul id="menu">
          <li v-for="page in pages" :key="page.id" :class="menuClass(page.id)">
            <AppLink :to="pagePath(page.id, language)" title="">{{ t(page.title.de) }}</AppLink>
          </li>
        </ul>
      </div>
    </div>
    <div id="content">
      <StorageNotice />
      <div class="section">
        <RouterView :key="viewKey" />
      </div>
    </div>
    <div id="footer">
      <div class="section"></div>
    </div>
  </div>
  <ul id="legal-links">
    <li>
      <a :href="imprintUrl(language)">{{ t('Impressum') }}</a>
    </li>
    <li>
      <a :href="privacyUrl(language)">{{ t('Datenschutz') }}</a>
    </li>
  </ul>
  <ul id="lang-select">
    <li class="text">wähle deine Sprache&nbsp;&nbsp;/&nbsp;&nbsp;choose your language</li>
    <li v-for="link in languageLinks" :key="link.code">
      <AppLink :to="link.href" :title="link.title" :class="link.code" />
    </li>
  </ul>
</template>
