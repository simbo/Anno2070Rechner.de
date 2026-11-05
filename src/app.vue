<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppLink from './components/app-link.vue';
import { useI18n } from './i18n';
import { languages, pagePath, pages, siteTitle } from './routes';

/**
 * Page frame of the old site: header with logo and navigation, content, footer and the
 * language selection. Login, registration and the "Under Development" badge are gone.
 */
const route = useRoute();
const { language, t } = useI18n();

const languageNames = { de: 'Deutsch (Deutschland)', en: 'English (US)' } as const;

// The old site marked the current page with "current", except Info, which got "info".
const menuClass = (id: string): string => (route.meta.page === id ? (id === 'info' ? 'info' : 'current') : '');

// Language links point to the same page; the 404 page links to the start page.
const languageLinks = computed(() =>
  languages.map(code => ({
    code,
    title: languageNames[code],
    href: route.meta.page ? pagePath(route.meta.page, code) : code === 'de' ? '/' : `/${code}`,
  })),
);
</script>

<template>
  <div id="wrap">
    <div id="header">
      <div class="section">
        <AppLink id="home-link" :to="pagePath('population', language)" :title="`${siteTitle} » ${t('Startseite')}`" />
        <h1 id="site-title">{{ siteTitle }}</h1>
        <ul id="menu">
          <li v-for="page in pages" :key="page.id" :class="menuClass(page.id)">
            <AppLink :to="pagePath(page.id, language)" title="">{{ t(page.title.de) }}</AppLink>
          </li>
        </ul>
      </div>
    </div>
    <div id="content">
      <div class="section">
        <RouterView :key="route.path" />
      </div>
    </div>
    <div id="footer">
      <div class="section"></div>
    </div>
  </div>
  <ul id="lang-select">
    <li class="text">wähle deine Sprache&nbsp;&nbsp;/&nbsp;&nbsp;choose your language</li>
    <li v-for="link in languageLinks" :key="link.code">
      <AppLink :to="link.href" :title="link.title" :class="link.code" />
    </li>
  </ul>
</template>
