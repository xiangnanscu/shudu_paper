<template>
  <div
    v-show="isOpen"
    class="cell-keypad-popover active"
    :class="placement"
    :style="popoverStyle"
    @click.stop
  >
    <button
      v-for="val in [1, 2, 3, 4]"
      :key="val"
      type="button"
      class="keypad-btn"
      :data-val="val"
      @click="handleButtonClick(val)"
    >
      {{ symbolMap[val] }}
    </button>

    <button
      v-if="hasUserVal"
      type="button"
      class="keypad-btn btn-erase"
      data-val="0"
      title="清空"
      @click="handleButtonClick(0)"
    >
      ⌫
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  isOpen: boolean;
  placement: "placement-bottom" | "placement-top";
  popoverLeft: number;
  popoverTop: number;
  arrowLeft: number;
  hasUserVal: boolean;
  symbolMap: Record<number, string>;
}>();

const emit = defineEmits<{
  (e: "fill", val: number): void;
}>();

const popoverStyle = computed(() => {
  return {
    left: `${props.popoverLeft}px`,
    top: `${props.popoverTop}px`,
    "--arrow-left": `${props.arrowLeft}px`,
  };
});

function handleButtonClick(val: number) {
  emit("fill", val);
}
</script>
