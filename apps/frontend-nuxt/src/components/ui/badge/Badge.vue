<template>
  <div
    :class="
      cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        props.variant === 'default' && 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        props.variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        props.variant === 'destructive' && 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        props.variant === 'outline' && 'text-foreground',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    class?: HTMLAttributes['class']
  }>(),
  {
    variant: 'default',
  }
)
</script>
