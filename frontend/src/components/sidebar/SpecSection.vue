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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      规格
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="pagesCount">📄 页数</label>
        <select
          id="pagesCount"
          v-model.number="config.pagesCount"
          class="form-select"
          @change="emit('changeStructure')"
        >
          <option :value="1">1 页</option>
          <option :value="2">2 页</option>
          <option :value="3">3 页</option>
          <option :value="5">5 页</option>
          <option :value="10">10 页</option>
        </select>
      </div>

      <div class="form-group">
        <label for="rowsPerPage">⊞ 行数</label>
        <select
          id="rowsPerPage"
          v-model.number="config.rowsPerPage"
          class="form-select"
          @change="emit('changeStructure')"
        >
          <option :value="2">2 行 (6题)</option>
          <option :value="3">3 行 (9题)</option>
          <option :value="4">4 行 (12题)</option>
          <option :value="5">5 行 (15题)</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="tierDivision">🎚️ 难度分档</label>
        <select
          id="tierDivision"
          v-model.number="config.tierDivision"
          class="form-select"
          @change="onTierDivisionChange"
        >
          <option :value="3">3 档制 (默认)</option>
          <option :value="5">5 档制 (进阶细分)</option>
          <option :value="6">6 档制 (精准能力)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="difficulty">⚡ 题库难度</label>
        <select
          id="difficulty"
          v-model="config.difficulty"
          class="form-select"
          @change="emit('changeStructure')"
        >
          <option
            v-for="opt in difficultyOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="symbolType">🔣 元素</label>
      <select
        id="symbolType"
        v-model="config.symbolType"
        class="form-select"
      >
        <option value="numbers">1 2 3 4</option>
        <option value="letters">A B C D</option>
        <option value="shapes">● ▲ ■ ★</option>
        <option value="fruits">🍎 🍌 🍇 🍓</option>
        <option value="animals">🐱 🐶 🐰 🐼</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PaperConfig } from "../../types/config";
import type { TierDivision } from "../../types/sudoku";
import { getDifficultyOptions } from "../../core/difficulty";

const props = defineProps<{
  config: PaperConfig;
}>();

const emit = defineEmits<{
  (e: "changeStructure"): void;
}>();

const difficultyOptions = computed(() => {
  return getDifficultyOptions(props.config.tierDivision || 3);
});

function onTierDivisionChange() {
  const div: TierDivision = props.config.tierDivision || 3;
  const current = props.config.difficulty;

  // 如果当前是通用模式（mixed_page 或 random），保持不变
  if (current === "mixed_page" || current === "random") {
    emit("changeStructure");
    return;
  }

  // 否则自动切换到对应分档制的中位推荐档
  if (div === 5) {
    props.config.difficulty = "tier_5_3";
  } else if (div === 6) {
    props.config.difficulty = "tier_6_3";
  } else {
    props.config.difficulty = "medium";
  }

  emit("changeStructure");
}
</script>
