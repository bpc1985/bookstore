<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'radix-vue'
import { useForwardPropsEmits } from 'radix-vue'
import Dialog from './DialogRoot.vue'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <Dialog v-bind="forwarded">
    <slot />
  </Dialog>
</template>
