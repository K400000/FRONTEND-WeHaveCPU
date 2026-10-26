<script setup>
defineProps({
  group: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <main class="container py-4 page-scaffold">
    <p class="small text-secondary mb-1">{{ group }}</p>
    <h1 class="h3 mb-4">{{ title }}</h1>
  </main>
</template>