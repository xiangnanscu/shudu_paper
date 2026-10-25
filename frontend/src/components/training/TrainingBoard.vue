<template>
  <div
    class="training-board-wrapper"
    :class="{ 'shake-anim': isWrongShake }"
  >
    <div class="training-board-grid">
      <!-- 激光射线层 (摒除法提示开启时展现) -->
      <template v-if="question.technique === 'hidden_single' && hintLevel >= 2">
        <template v-for="(laser, idx) in question.hiddenDetails?.laserBeams" :key="`laser-${idx}`">
          <!-- 行激光 -->
          <div
            v-if="laser.direction === 'row'"
            class="laser-beam-overlay beam-row"
            :style="{
              top: `calc(${laser.lineIndex * 25}% + 12.5% - 3px)`,
              left: '0%',
              width: '100%',
            }"
          ></div>
          <!-- 列激光 -->
          <div
            v-else
            class="laser-beam-overlay beam-col"
            :style="{
              left: `calc(${laser.lineIndex * 25}% + 12.5% - 3px)`,
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
              isRadarPeer(r - 1, c - 1) ? 'is-radar-peer' : '',
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

      <!-- 答对庆祝大红勾与弹跳效果 -->
      <div v-if="isSuccessPop" class="success-celebrate-overlay">
        <div class="celebrate-icon">🌟</div>
        <div class="celebrate-text">太棒啦！锁定正解！</div>
      </div>
    </div>
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
  isSuccessPop: boolean;
  isWrongShake: boolean;
  symbolMap: Record<number, string>;
}>();

const emit = defineEmits<{
  (e: "selectTarget"): void;
}>();

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

// 唯余法：是否属于目标格的十字雷达范围 (同行、同列、同宫)
function isRadarPeer(r: number, c: number): boolean {
  if (props.question.technique !== "naked_single" || props.hintLevel < 2) return false;
  if (isTargetCell(r, c)) return false;

  const tr = props.question.targetCell.r;
  const tc = props.question.targetCell.c;
  const targetBlock = getBlockIndex(tr, tc);

  return r === tr || c === tc || getBlockIndex(r, c) === targetBlock;
}

// 摒除法：是否属于目标 2x2 宫城堡
function isCastleUnit(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || props.hintLevel < 1) return false;
  const targetBlock = props.question.hiddenDetails?.unitIndex;
  return getBlockIndex(r, c) === targetBlock;
}

// 摒除法：是否是被激光封锁的空格
function isBlockedCell(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || props.hintLevel < 2) return false;
  const blockedList = props.question.hiddenDetails?.blockedCellsInUnit || [];
  return blockedList.some((cell) => cell.r === r && cell.c === c);
}

// 摒除法：是否是激光发射源
function isLaserSource(r: number, c: number): boolean {
  if (props.question.technique !== "hidden_single" || props.hintLevel < 2) return false;
  const lasers = props.question.hiddenDetails?.laserBeams || [];
  return lasers.some((l) => l.sourceR === r && l.sourceC === c);
}

function handleCellClick(r: number, c: number) {
  if (isTargetCell(r, c)) {
    emit("selectTarget");
  }
}
</script>
