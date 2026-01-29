<script setup lang="ts">
import { SelectRoot as SelectPrimitive, useForwardPropsEmits } from 'radix-vue'
import type { SelectRootEmits, SelectRootProps } from 'radix-vue'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectPrimitive v-bind="forwarded">
    <slot />
  </SelectPrimitive>
</template>
