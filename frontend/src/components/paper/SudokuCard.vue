<template>
  <div class="sudoku-card">
    <div class="sudoku-card-header" :style="{ width: boardSize }">
      <div class="sudoku-card-title">
        <span>第 {{ puzzle.id }} 题</span>
      </div>
      <div
        class="sudoku-difficulty-tag"
        :class="{ 'answer-tag': isAnswerSheet }"
      >
        <template v-if="isAnswerSheet">
          答案 · 给{{ puzzle.cluesCount }}数
        </template>
        <template v-else>
          给 {{ puzzle.cluesCount }} 数
        </template>
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
            @select="(elem) => emit('selectCell', elem, puzzle.id, r - 1, c - 1)"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  }>(),
  {
    isAnswerSheet: false,
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
</script>
