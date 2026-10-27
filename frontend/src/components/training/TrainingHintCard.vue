<template>
  <div
    class="training-hint-card"
    :class="cardLevelClass"
  >
    <div class="hint-header">
      <div class="hint-title-group">
        <span>{{ isCorrect ? '🎉' : hintLevel === 0 ? '🤔' : hintLevel === 1 ? '💡' : hintLevel === 2 ? '⚡' : '✨' }}</span>
        <span>{{ currentHintTitle }}</span>
      </div>
      <span class="hint-level-tag">
        {{ isCorrect ? '✨ 复盘点拨' : hintLevel === 0 ? '等待思考' : `引导 ${hintLevel}/3 步` }}
      </span>
    </div>

    <!-- 引导文案内容 -->
    <div class="hint-desc">
      {{ currentHintDescription }}
    </div>

    <!-- 唯余法：四小天王收集池 (数字/水果/动物盘点) -->
    <div
      v-if="question.technique === 'naked_single' && (hintLevel >= 1 || isCorrect)"
      class="naked-chips-pool"
    >
      <div
        v-for="digit in [1, 2, 3, 4]"
        :key="`chip-${digit}`"
        class="naked-chip"
        :class="{
          'chip-seen': isDigitSeen(digit),
          'chip-target': isDigitTarget(digit) && (hintLevel === 3 || isCorrect),
        }"
      >
        <span>{{ symbolMap[digit] }}</span>
        <template v-if="isDigitTarget(digit) && (hintLevel === 3 || isCorrect)">
          <span>⭐ 唯余此数!</span>
        </template>
        <template v-else-if="isDigitSeen(digit)">
          <span>✓ 已就位</span>
        </template>
        <template v-else>
          <span>❓ 缺席</span>
        </template>
      </div>
    </div>

    <!-- 摒除法：房间安全雷达池 -->
    <div
      v-if="question.technique === 'hidden_single' && (hintLevel >= 2 || isCorrect)"
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
import { getBlockIndex } from "../../core/training";

const props = withDefaults(
  defineProps<{
    question: TrainingQuestion;
    hintLevel: 0 | 1 | 2 | 3;
    symbolMap: Record<number, string>;
    isCorrect?: boolean;
  }>(),
  {
    isCorrect: false,
  }
);

const cardLevelClass = computed<string>(() => {
  if (props.isCorrect) return "level-3";
  if (props.hintLevel === 0) return "level-1";
  return `level-${props.hintLevel}`;
});

const currentHintTitle = computed<string>(() => {
  if (props.isCorrect) {
    return props.question.technique === "naked_single"
      ? "唯余法原理复盘"
      : "摒除法原理复盘";
  }
  if (props.hintLevel === 0) {
    return props.question.technique === "naked_single"
      ? "唯余法观察提示"
      : "摒除法观察提示";
  }
  const step = props.question.hints.find((h) => h.level === props.hintLevel);
  return step ? step.title : "魔法提示";
});

const currentHintDescription = computed<string>(() => {
  const targetSym = props.symbolMap[props.question.targetValue];
  const tr = props.question.targetCell.r + 1;
  const tc = props.question.targetCell.c + 1;
  const tb = getBlockIndex(props.question.targetCell.r, props.question.targetCell.c) + 1;

  if (props.isCorrect) {
    if (props.question.technique === "naked_single") {
      return `复盘点拨：看盘面！🔵 第 ${tr} 排、🟣 第 ${tc} 列和 🟠 第 ${tb} 宫的三色彩色滚动流光交汇在此。同行同列同宫已经凑齐了其余 3 种伙伴，所以这里只能是【${targetSym}】！`;
    } else {
      return `复盘点拨：看盘面！外部已有相同数字发射红色激光封锁了其他房间，小城堡里只有这个安全房间没有被射中，所以【${targetSym}】必须住进这里！`;
    }
  }

  if (props.hintLevel === 0) {
    return props.question.technique === "naked_single"
      ? "观察黄色闪烁的小格子，看它的行、列和同一个宫内，其余 3 个伙伴是不是都已经到齐了？"
      : "观察提示区域所在的小城堡与外部排除情况，想想这里应该填什么？需要帮助可以点击【魔法提示】哦~";
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
