<template>
  <div
    class="training-board-wrapper"
    :class="{ 'shake-anim': isWrongShake }"
  >
    <div class="training-board-grid">
      <!-- ==============================================================
           唯余法：排、列、宫三色动态滚动虚线框图层 (Marching Ants SVG)
           ============================================================== -->
      <svg
        v-if="question.technique === 'naked_single' && (hintLevel >= 2 || isCorrect)"
        class="naked-marching-svg-layer"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <!-- 1. 排 (行)：蓝色滚动虚线框 -->
        <rect
          class="marching-rect marching-row"
          x="0.6"
          :y="question.targetCell.r * 25 + 0.6"
          width="98.8"
          height="23.8"
          rx="2.5"
        />

        <!-- 2. 列：紫色滚动虚线框 -->
        <rect
          class="marching-rect marching-col"
          :x="question.targetCell.c * 25 + 0.6"
          y="0.6"
          width="23.8"
          height="98.8"
          rx="2.5"
        />

        <!-- 3. 小宫格 (2x2 宫)：金橙色滚动虚线框 -->
        <rect
          class="marching-rect marching-block"
          :x="(targetBlockIndex % 2) * 50 + 0.6"
          :y="Math.floor(targetBlockIndex / 2) * 50 + 0.6"
          width="48.8"
          height="48.8"
          rx="3.5"
        />
      </svg>

      <!-- ==============================================================
           摒除法：激光射线层 (发射激光封锁其他空格)
           ============================================================== -->
      <template v-if="question.technique === 'hidden_single' && (hintLevel >= 2 || isCorrect)">
        <template v-for="(laser, idx) in question.hiddenDetails?.laserBeams" :key="`laser-${idx}`">
          <!-- 行激光 -->
          <div
            v-if="laser.direction === 'row'"
            class="laser-beam-overlay beam-row"
            :style="{
              top: `calc(${laser.lineIndex * 25}% + 12.5% - 2.5px)`,
              left: '0%',
              width: '100%',
            }"
          ></div>
          <!-- 列激光 -->
          <div
            v-else
            class="laser-beam-overlay beam-col"
            :style="{
              left: `calc(${laser.lineIndex * 25}% + 12.5% - 2.5px)`,
              top: '0%',
              height: '100%',
            }"
          ></div>
        </template>
      </template>

      <!-- 4x4 格子渲染 -->
      <template v-for="r in 4" :key="`r-${r}`">
        <template v-for="c in 4" :key="`c-${c}`">
          <div
            class="t-cell"
            :class="[
              c === 2 ? 'border-col-2' : '',
              r === 2 ? 'border-row-2' : '',
              isClue(r - 1, c - 1) ? 'is-clue' : 'is-empty',
              isTargetCell(r - 1, c - 1) ? 'is-target' : '',
              isCastleUnit(r - 1, c - 1) ? 'is-castle-unit' : '',
              isBlockedCell(r - 1, c - 1) ? 'is-blocked-cell' : '',
              isLaserSource(r - 1, c - 1) ? 'is-laser-source' : '',
              isTargetCell(r - 1, c - 1) && isCorrect ? 'correct-filled' : '',
            ]"
            @click="handleCellClick(r - 1, c - 1)"
          >
            <!-- 初始已知数 -->
            <template v-if="isClue(r - 1, c - 1)">
              <span class="t-cell-val">{{ symbolMap[question.puzzle[r - 1][c - 1]] }}</span>
            </template>

            <!-- 用户填入的答案 (正确或已揭晓) -->
            <template v-else-if="isTargetCell(r - 1, c - 1) && (isCorrect || userVal !== null)">
              <span class="t-cell-val user-val">{{ symbolMap[userVal || question.targetValue] }}</span>
            </template>

            <!-- 摒除法：被激光封锁的空格覆盖图标 -->
            <div
              v-if="isBlockedCell(r - 1, c - 1) && question.puzzle[r - 1][c - 1] === 0"
              class="blocked-overlay"
              title="被激光封锁，不能填此数"
            >
              🚫
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>

  <!-- 唯余法：三色动态滚动虚线图例栏 (生动解释排、列、宫的三重汇聚) -->
  <div
    v-if="question.technique === 'naked_single' && (hintLevel >= 2 || isCorrect)"
    class="naked-legend-bar"
  >
    <span class="legend-item row-item">🔵 蓝色流光: 第 {{ question.targetCell.r + 1 }} 排</span>
    <span class="legend-item col-item">🟣 紫色流光: 第 {{ question.targetCell.c + 1 }} 列</span>
    <span class="legend-item block-item">🟠 橙色流光: 第 {{ targetBlockIndex + 1 }} 宫</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TrainingQuestion } from "../../types/training";
import { getBlockIndex } from "../../core/training";

const props = defineProps<{
  question: TrainingQuestion;
  hintLevel: 0 | 1 | 2 | 3;
  userVal: number | null;
  isCorrect: boolean;
  isWrongShake: boolean;
  symbolMap: Record<number, string>;
}>();

const emit = defineEmits<{
  (e: "selectTarget"): void;
}>();

const targetBlockIndex = computed<number>(() => {
  return getBlockIndex(props.question.targetCell.r, props.question.targetCell.c);
});

// 是否是已知线索
function isClue(r: number, c: number): boolean {
  return props.question.puzzle[r][c] !== 0;
}

// 是否是目标格
function isTargetCell(r: number, c: number): boolean {
  return (
    r === props.question.targetCell.r &&
    c === props.question.targetCell.c
  );
}

// 摒除法：是否属于目标 2x2 宫城堡
function isCastleUnit(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || (props.hintLevel < 1 && !props.isCorrect)) {
    return false;
  }
  const targetBlock = props.question.hiddenDetails?.unitIndex;
  return getBlockIndex(r, c) === targetBlock;
}

// 摒除法：是否是被激光封锁的空格
function isBlockedCell(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || (props.hintLevel < 2 && !props.isCorrect)) {
    return false;
  }
  const blockedList = props.question.hiddenDetails?.blockedCellsInUnit || [];
  return blockedList.some((cell) => cell.r === r && cell.c === c);
}

// 摒除法：是否是激光发射源
function isLaserSource(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || (props.hintLevel < 2 && !props.isCorrect)) {
    return false;
  }
  const lasers = props.question.hiddenDetails?.laserBeams || [];
  return lasers.some((l) => l.sourceR === r && l.sourceC === c);
}

function handleCellClick(r: number, c: number) {
  if (isTargetCell(r, c)) {
    emit("selectTarget");
  }
}
</script>
