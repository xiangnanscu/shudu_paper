<template>
  <div
    class="confirm-backdrop"
    :class="{ active: isOpen }"
    @click.self="emit('cancel')"
  >
    <div
      class="confirm-dialog"
      :class="`variant-${state.variant}`"
      role="alertdialog"
      aria-modal="true"
      :aria-label="state.title"
    >
      <div class="confirm-icon-badge">
        <span>{{ state.icon }}</span>
      </div>

      <h3 class="confirm-title">{{ state.title }}</h3>
      <p v-if="state.message" class="confirm-message">{{ state.message }}</p>

      <div v-if="state.stats.length" class="confirm-stats">
        <div
          v-for="(stat, i) in state.stats"
          :key="i"
          class="confirm-stat-chip"
        >
          <span class="val">{{ stat.value }}</span>
          <span class="lbl">{{ stat.label }}</span>
        </div>
      </div>

      <div class="confirm-actions" :class="{ single: state.hideCancel }">
        <button
          v-if="!state.hideCancel"
          type="button"
          class="btn-confirm-cancel"
          @click="emit('cancel')"
        >
          {{ state.cancelText }}
        </button>
        <button
          type="button"
          class="btn-confirm-ok"
          @click="emit('confirm')"
        >
          {{ state.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import type { ConfirmDialogState } from "../../composables/useConfirmDialog";

defineProps<{
  isOpen: boolean;
  state: ConfirmDialogState;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

// Esc 视为取消（弹窗打开时）
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("cancel");
  }
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>
