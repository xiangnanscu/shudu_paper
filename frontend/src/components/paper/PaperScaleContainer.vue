<template>
  <div
    ref="containerRef"
    class="paper-scale-container"
    :style="scaleStyle"
  >
    <div id="pagesWrapper">
      <!-- 试题页 -->
      <PaperSheet
        v-for="(pagePuzzles, idx) in puzzlesData"
        :key="'exam-page-' + idx"
        :page-index="idx"
        :current-page-number="idx + 1"
        :total-sheets="totalSheets"
        :puzzles="pagePuzzles"
        :board-size="boardSize"
        :cell-font-size="cellFontSize"
        :symbol-map="symbolMap"
        :exam-status="examStatus"
        :user-answers="userAnswers"
        :active-cell="activeCell"
        :config="config"
        :exam-result="examResult"
        :is-answer-sheet="false"
        @select-cell="(elem, pId, r, c) => emit('selectCell', elem, pId, r, c)"
        @redo-puzzle="(puzzle) => emit('redoPuzzle', puzzle)"
      />

      <!-- 附录答案页 -->
      <template v-if="config.appendAnswerPage">
        <PaperSheet
          v-for="(pagePuzzles, idx) in puzzlesData"
          :key="'answer-page-' + idx"
          :page-index="idx"
          :current-page-number="puzzlesData.length + idx + 1"
          :total-sheets="totalSheets"
          :puzzles="pagePuzzles"
          :board-size="boardSize"
          :cell-font-size="cellFontSize"
          :symbol-map="symbolMap"
          :exam-status="examStatus"
          :user-answers="userAnswers"
          :active-cell="activeCell"
          :config="config"
          :exam-result="examResult"
          :is-answer-sheet="true"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { ExamStatus, UserAnswers, ActiveCell, ExamResult } from "../../types/exam";
import type { PaperConfig } from "../../types/config";
import PaperSheet from "./PaperSheet.vue";

const props = defineProps<{
  puzzlesData: SudokuPuzzle[][];
  boardSize: string;
  cellFontSize: string;
  symbolMap: Record<number, string>;
  examStatus: ExamStatus;
  userAnswers: UserAnswers;
  activeCell: ActiveCell | null;
  config: PaperConfig;
  examResult: ExamResult | null;
  scale: number;
  containerHeight: string;
  containerMarginBottom: string;
}>();

const emit = defineEmits<{
  (
    e: "selectCell",
    elem: HTMLElement,
    puzzleId: number,
    r: number,
    c: number
  ): void;
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const totalSheets = computed(() => {
  const pages = props.puzzlesData.length;
  return props.config.appendAnswerPage ? pages * 2 : pages;
});

const scaleStyle = computed(() => {
  if (props.scale === 1) {
    return {
      transform: "none",
      height: "auto",
      marginBottom: "0",
    };
  }
  return {
    transform: `scale(${props.scale})`,
    transformOrigin: "top center",
    height: props.containerHeight,
    marginBottom: props.containerMarginBottom,
  };
});

defineExpose({
  containerRef,
});
</script>
