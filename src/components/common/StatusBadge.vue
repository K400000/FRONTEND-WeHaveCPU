<script setup>
import { computed } from 'vue'
import { getStatusDisplay } from '../../utils/statusLabels'

const props = defineProps({
  status: {
    type: String,
    default: '',
  },
})

const display = computed(() => getStatusDisplay(props.status))
</script>

<template>
  <span class="badge" :class="`text-bg-${display.variant}`">{{ display.label }}</span>
</template>