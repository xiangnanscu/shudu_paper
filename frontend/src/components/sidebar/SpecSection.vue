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
      出题规格
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="pagesCount">试卷页数</label>
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
          <option :value="10">10 页 (大批量)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="rowsPerPage">
          每页行数
          <span class="tip">(每行固定3题)</span>
        </label>
        <select
          id="rowsPerPage"
          v-model.number="config.rowsPerPage"
          class="form-select"
          @change="emit('changeStructure')"
        >
          <option :value="2">2 行 (6题 · 启蒙特大 · 推荐)</option>
          <option :value="3">3 行 (9题 · 超大格)</option>
          <option :value="4">4 行 (12题 · 进阶训练)</option>
          <option :value="5">5 行 (15题 · 紧凑版)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="difficulty">难度等级</label>
      <select
        id="difficulty"
        v-model="config.difficulty"
        class="form-select"
        @change="emit('changeStructure')"
      >
        <option value="starter">
          入门级 (13~14个已知数 · 空2~3格，幼儿启蒙首选)
        </option>
        <option value="easy">
          初级 (9~12个已知数 · 空4~7格，巩固基础规则)
        </option>
        <option value="medium">
          中级 (6~8个已知数 · 空8~10格，行列交叉排除)
        </option>
        <option value="hard">
          高级 (4~5个已知数 · 空11~12格，极少提示挑战)
        </option>
        <option value="mixed_page">
          阶梯递进 (每页从入门→初级→中级→高级)
        </option>
        <option value="random">
          随机混合 (全范围4~14个已知数)
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="symbolType">题型元素</label>
      <select
        id="symbolType"
        v-model="config.symbolType"
        class="form-select"
      >
        <option value="numbers">经典数字 (1, 2, 3, 4)</option>
        <option value="letters">英文字母 (A, B, C, D)</option>
        <option value="shapes">几何形状 (●, ▲, ■, ★)</option>
        <option value="fruits">趣味水果 (🍎, 🍌, 🍇, 🍓)</option>
        <option value="animals">萌趣动物 (🐱, 🐶, 🐰, 🐼)</option>
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
