<template>
  <div class="section-box">
    <div class="section-title">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      答案
    </div>

    <div class="form-group">
      <label class="checkbox-label" style="font-weight: 600">
        <input v-model="config.appendAnswerPage" type="checkbox" />
        📄 附答案页
      </label>
    </div>

    <div class="form-group">
      <label class="checkbox-label" style="font-weight: 600">
        <input v-model="config.showAnswers" type="checkbox" />
        👁️ 显示答案
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaperConfig } from "../../types/config";

defineProps<{
  config: PaperConfig;
}>();
</script>
