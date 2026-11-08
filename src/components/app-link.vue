<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter, type RouteLocationRaw } from 'vue-router';

/**
 * A plain link that navigates inside the app. Unlike RouterLink's default output, it
 * adds no extra classes, so the markup stays like the old site's. A link inside the same
 * menu item and language replaces the history entry, so that a menu item stays one step
 * of the back button; other links add a new entry.
 */
const props = defineProps<{ to: RouteLocationRaw }>();

const route = useRoute();
const router = useRouter();

const replace = computed(() => {
  const target = router.resolve(props.to);
  return target.meta.page === route.meta.page && target.meta.language === route.meta.language;
});
</script>

<template>
  <RouterLink v-slot="{ href, navigate }" :to="to" :replace="replace" custom>
    <a :href="href" @click="navigate"><slot /></a>
  </RouterLink>
</template>
