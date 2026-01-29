<template>
  <span
    :class="
      cn(
        'relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full',
        props.class
      )
    "
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="cn('aspect-square h-full w-full object-cover')"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    alt: '',
  }
)
</script>
