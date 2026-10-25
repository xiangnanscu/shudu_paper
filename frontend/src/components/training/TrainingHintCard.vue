<template>
  <div
    class="training-hint-card"
    :class="`level-${hintLevel > 0 ? hintLevel : 1}`"
  >
    <div class="hint-header">
      <div class="hint-title-group">
        <span>{{ hintLevel === 0 ? '🤔' : hintLevel === 1 ? '💡' : hintLevel === 2 ? '⚡' : '✨' }}</span>
        <span>{{ currentHintTitle }}</span>
      </div>
      <span class="hint-level-tag">
        {{ hintLevel === 0 ? '等待思考' : `引导 ${hintLevel}/3 步` }}
      </span>
    </div>

    <!-- 引导文案内容 -->
    <div class="hint-desc">
      {{ currentHintDescription }}
    </div>

    <!-- 唯余法：四小天王收集池 (数字/水果/动物盘点) -->
    <div
      v-if="question.technique === 'naked_single' && hintLevel >= 1"
      class="naked-chips-pool"
    >
      <div
        v-for="digit in [1, 2, 3, 4]"
        :key="`chip-${digit}`"
        class="naked-chip"
        :class="{
          'chip-seen': isDigitSeen(digit),
          'chip-target': isDigitTarget(digit) && hintLevel === 3,
        }"
      >
        <span>{{ symbolMap[digit] }}</span>
        <template v-if="isDigitSeen(digit)">
          <span>已出现</span>
        </template>
        <template v-else-if="hintLevel === 3">
          <span>⭐ 唯余答案!</span>
        </template>
        <template v-else>
          <span>❓ 缺席</span>
        </template>
      </div>
    </div>

    <!-- 摒除法：房间安全雷达池 -->
    <div
      v-if="question.technique === 'hidden_single' && hintLevel >= 2"
      class="hidden-chips-pool"
    >
      <template
        v-for="(cell, idx) in question.hiddenDetails?.emptyCellsInUnit"
        :key="`room-${idx}`"
      >
        <div
          class="hidden-chip"
          :class="isCellBlocked(cell.r, cell.c) ? 'chip-blocked' : 'chip-safe'"
        >
          <span>房间 ({{ cell.r + 1 }}, {{ cell.c + 1 }}):</span>
          <span>{{ isCellBlocked(cell.r, cell.c) ? '🚫 激光封锁' : '✨ 唯一安全房' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TrainingQuestion } from "../../types/training";

const props = defineProps<{
  question: TrainingQuestion;
  hintLevel: 0 | 1 | 2 | 3;
  symbolMap: Record<number, string>;
}>();

const currentHintTitle = computed<string>(() => {
  if (props.hintLevel === 0) {
    return props.question.technique === "naked_single"
      ? "唯余法思考提示"
      : "摒除法思考提示";
  }
  const step = props.question.hints.find((h) => h.level === props.hintLevel);
  return step ? step.title : "魔法提示";
});

const currentHintDescription = computed<string>(() => {
  if (props.hintLevel === 0) {
    return props.question.technique === "naked_single"
      ? "观察黄色闪烁的小格子，看它的行、列和同一个宫内，其余 3 个伙伴是不是都已经到齐了？"
      : `目标：在提示的区域内找到【${props.symbolMap[props.question.targetValue]}】的家！外部的同伴会发射激光排除其他房间哦~`;
  }
  const step = props.question.hints.find((h) => h.level === props.hintLevel);
  return step ? step.description : "";
});

function isDigitSeen(digit: number): boolean {
  return (props.question.nakedDetails?.seenNumbers || []).includes(digit);
}

function isDigitTarget(digit: number): boolean {
  return digit === props.question.targetValue;
}

function isCellBlocked(r: number, c: number): boolean {
  return (props.question.hiddenDetails?.blockedCellsInUnit || []).some(
    (cell) => cell.r === r && cell.c === c
  );
}
</script>
