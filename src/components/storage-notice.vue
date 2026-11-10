<script setup lang="ts">
import { computed, ref } from 'vue';

import { useI18n } from '../i18n';
import { storageErrorTexts, useGamesStore, type StorageError } from '../stores/games';

/**
 * A notice above the page content while the games are not saved. It says why and what helps,
 * and stays closed for the rest of the page view once the visitor closes it.
 */
const games = useGamesStore();
const { t } = useI18n();

const closed = ref<StorageError[]>([]);

const shown = computed(() =>
  games.storageError && !closed.value.includes(games.storageError) ? games.storageError : undefined,
);

const reload = (): void => {
  globalThis.location.reload();
};
</script>

<template>
  <div v-if="shown" id="storage-notice" role="alert">
    <p>{{ t(storageErrorTexts[shown]) }}</p>
    <div class="storage-notice-buttons">
      <input v-if="shown === 'newer'" type="button" :value="t('Neu laden')" @click="reload" />
      <input type="button" :value="t('Schließen')" @click="closed.push(shown)" />
    </div>
  </div>
</template>
