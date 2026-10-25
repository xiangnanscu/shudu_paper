<template>
  <div class="sudoku-card" :class="cardClasses">
    <div class="sudoku-card-header" :style="{ width: boardSize }">
      <div class="sudoku-card-title">
        <span>第 {{ puzzle.id }} 题</span>
        <!-- 批改状态下题号旁老师标记 -->
        <template v-if="examStatus === 'submitted' && !isAnswerSheet">
          <span
            v-if="isCorrected"
            class="teacher-puzzle-tag tag-corrected"
            title="该题已完成订正"
          >
            ✓ 订正对
          </span>
          <span
            v-else-if="isAllCorrect"
            class="teacher-puzzle-tag tag-correct"
            title="该题全对"
          >
            ✓ 全对
          </span>
          <span
            v-else-if="isWrong"
            class="teacher-puzzle-tag tag-wrong"
            title="该题有错误"
          >
            ✕ 需订正
          </span>
        </template>
      </div>
      <div
        v-if="isAnswerSheet"
        class="sudoku-difficulty-tag answer-tag"
      >
        答案
      </div>
    </div>

    <div
      class="sudoku-board"
      :style="{ width: boardSize, height: boardSize }"
    >
      <template v-for="r in 4" :key="r">
        <template v-for="c in 4" :key="c">
          <SudokuCell
            :puzzle-id="puzzle.id"
            :row="r - 1"
            :col="c - 1"
            :clue-val="puzzle.puzzle[r - 1][c - 1]"
            :ans-val="puzzle.solution[r - 1][c - 1]"
            :user-val="userAnswers[`${puzzle.id}_${r - 1}_${c - 1}`]"
            :font-size="cellFontSize"
            :symbol-map="symbolMap"
            :exam-status="examStatus"
            :is-active="
              activeCell?.puzzleId === puzzle.id &&
              activeCell?.r === r - 1 &&
              activeCell?.c === c - 1
            "
            :is-answer-sheet="isAnswerSheet"
            :is-puzzle-all-correct="isAllCorrect || isCorrected"
            :step-index="stepMap?.[`${puzzle.id}_${r - 1}_${c - 1}`]"
            :show-step-badge="showStepBadge"
            @select="(elem) => emit('selectCell', elem, puzzle.id, r - 1, c - 1)"
          />
        </template>
      </template>

      <!-- 老师批改的大红勾 (全对题或订正对的题目展示，震撼大勾，激励孩子，打印贴墙倍有面子) -->
      <div
        v-if="examStatus === 'submitted' && !isAnswerSheet && (isAllCorrect || isCorrected)"
        class="teacher-big-check"
        :class="{ 'is-corrected': isCorrected }"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" class="teacher-check-svg">
          <path
            d="M 16 52 C 24 60 32 70 41 82 C 54 54 70 30 89 12"
            fill="none"
            stroke="#dc2626"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="teacher-check-path"
          />
        </svg>
        <span v-if="isCorrected" class="teacher-check-sub">订正✓</span>
      </div>
    </div>

    <!-- 每道题下方预留 1.5 倍数字宫格高度的空白区域，为数字填写弹出框预留空间 -->
    <div
      v-if="showBottomSpacer"
      class="sudoku-card-bottom-spacer"
      :style="{ height: bottomSpacerHeight, width: boardSize }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { ExamStatus, UserAnswers, ActiveCell } from "../../types/exam";
import SudokuCell from "./SudokuCell.vue";

const props = withDefaults(
  defineProps<{
    puzzle: SudokuPuzzle;
    boardSize: string;
    cellFontSize: string;
    symbolMap: Record<number, string>;
    examStatus: ExamStatus;
    userAnswers: UserAnswers;
    activeCell: ActiveCell | null;
    isAnswerSheet?: boolean;
    stepMap?: Record<string, number>;
    showStepBadge?: boolean;
    correctedPuzzleIds?: Set<number>;
    showBottomSpacer?: boolean;
  }>(),
  {
    isAnswerSheet: false,
    showStepBadge: false,
    showBottomSpacer: false,
  }
);

const emit = defineEmits<{
  (
    e: "selectCell",
    elem: HTMLElement,
    puzzleId: number,
    r: number,
    c: number
  ): void;
}>();

const isAllCorrect = computed(() => {
  if (props.isAnswerSheet || props.examStatus !== "submitted") return false;
  let hasHoles = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (props.puzzle.puzzle[r][c] === 0) {
        hasHoles = true;
        const key = `${props.puzzle.id}_${r}_${c}`;
        const uVal = props.userAnswers[key];
        const sVal = props.puzzle.solution[r][c];
        if (uVal !== sVal) {
          return false;
        }
      }
    }
  }
  return hasHoles;
});

const isWrong = computed(() => {
  if (props.isAnswerSheet || props.examStatus !== "submitted") return false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (props.puzzle.puzzle[r][c] === 0) {
        const key = `${props.puzzle.id}_${r}_${c}`;
        const uVal = props.userAnswers[key];
        const sVal = props.puzzle.solution[r][c];
        if (uVal !== sVal) {
          return true;
        }
      }
    }
  }
  return false;
});

const isCorrected = computed(() => {
  return props.correctedPuzzleIds?.has(props.puzzle.id) ?? false;
});

const cardClasses = computed(() => {
  return {
    "is-all-correct": isAllCorrect.value,
    "is-wrong": isWrong.value,
    "is-corrected": isCorrected.value,
  };
});

// 每道题为 4x4 四宫格，单个数字宫格高度为 boardSize / 4
// 1.5 倍数字宫格高度 = 1.5 * (boardSize / 4) = boardSize * 0.375
const bottomSpacerHeight = computed(() => {
  const sizeNum = parseFloat(props.boardSize);
  if (isNaN(sizeNum) || sizeNum <= 0) return "0px";
  return `${sizeNum * 0.375}px`;
});
</script>
