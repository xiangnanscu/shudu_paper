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

    <div class="form-group">
      <label for="difficulty">⚡ 难度</label>
      <select
        id="difficulty"
        v-model="config.difficulty"
        class="form-select"
        @change="emit('changeStructure')"
      >
        <option value="starter">★ 入门</option>
        <option value="easy">★★ 初级</option>
        <option value="medium">★★★ 中级</option>
        <option value="medium_hypo_direct">🎯 假设·直显</option>
        <option value="medium_hypo_deep">🎯 假设·深度</option>
        <option value="medium_hypo_mixed">🎯 假设·综合</option>
        <option value="hard">★★★★ 高级</option>
        <option value="mixed_page">📈 阶梯</option>
        <option value="random">🎲 随机</option>
      </select>
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
import type { PaperConfig } from "../../types/config";

defineProps<{
  config: PaperConfig;
}>();

const emit = defineEmits<{
  (e: "changeStructure"): void;
}>();
</script>
