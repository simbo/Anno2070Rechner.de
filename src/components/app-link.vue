<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router';

/**
 * A plain link that navigates inside the app. Unlike RouterLink's default output, it
 * adds no extra classes, so the markup stays like the old site's.
 */
defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink v-slot="{ href, navigate }" :to="to" custom>
    <a :href="href" @click="navigate"><slot /></a>
  </RouterLink>
</template>
