<script setup lang="ts">
import { useI18n } from '../i18n';

/**
 * The 404 page of the old site.
 */
const { t } = useI18n();
</script>

<template>
  <h2 class="error">{{ t('Oops, da ist etwas total schiefgelaufen…') }}</h2>
  <p>{{ t('Das von dir angeforderte Dokument konnte nicht gefunden werden.') }}</p>
</template>
