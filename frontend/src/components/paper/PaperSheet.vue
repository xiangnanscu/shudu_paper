<template>
  <div
    class="paper-sheet"
    :class="{ 'answers-sheet': isAnswerSheet }"
  >
    <!-- 卷眉 -->
    <PaperHeader
      :config="config"
      :page-index="pageIndex"
      :is-answer-sheet="isAnswerSheet"
      :exam-result="examResult"
    />

    <!-- 3列网格题区 -->
    <div class="paper-grid-container">
      <SudokuCard
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :puzzle="puzzle"
        :board-size="boardSize"
        :cell-font-size="cellFontSize"
        :symbol-map="symbolMap"
        :exam-status="examStatus"
        :user-answers="userAnswers"
        :active-cell="activeCell"
        :is-answer-sheet="isAnswerSheet"
        @select-cell="(elem, pId, r, c) => emit('selectCell', elem, pId, r, c)"
      />
    </div>

    <!-- 卷脚 -->
    <PaperFooter
      :current-page="currentPageNumber"
      :total-sheets="totalSheets"
    />
  </div>
</template>

<script setup lang="ts">
import type { SudokuPuzzle } from "../../types/sudoku";
import type { ExamStatus, UserAnswers, ActiveCell, ExamResult } from "../../types/exam";
import type { PaperConfig } from "../../types/config";
import PaperHeader from "./PaperHeader.vue";
import PaperFooter from "./PaperFooter.vue";
import SudokuCard from "./SudokuCard.vue";

const props = withDefaults(
  defineProps<{
    pageIndex: number;
    currentPageNumber: number;
    totalSheets: number;
    puzzles: SudokuPuzzle[];
    boardSize: string;
    cellFontSize: string;
    symbolMap: Record<number, string>;
    examStatus: ExamStatus;
    userAnswers: UserAnswers;
    activeCell: ActiveCell | null;
    config: PaperConfig;
    examResult: ExamResult | null;
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
