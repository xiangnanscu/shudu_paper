import { ref, computed } from "vue";
import type { SudokuPuzzle } from "../types/sudoku";
import type { ExamStatus, UserAnswers, ExamResult } from "../types/exam";
import type { PaperConfig } from "../types/config";

export function useExam() {
  const status = ref<ExamStatus>("ready");
  const userAnswers = ref<UserAnswers>({});
  const currentResult = ref<ExamResult | null>(null);
  const isScoreModalOpen = ref(false);

  // 已填写空格数
  const filledCount = computed(() => Object.keys(userAnswers.value).length);

  // 开始做题
  function startExam() {
    status.value = "doing";
  }

  // 填写或清除单元格数值
  function fillCell(puzzleId: number, r: number, c: number, val: number) {
    const key = `${puzzleId}_${r}_${c}`;
    if (val === 0) {
      delete userAnswers.value[key];
    } else {
      userAnswers.value[key] = val;
    }
  }

  // 重新开始当前这一套题
  function restartCurrentExam() {
    userAnswers.value = {};
    currentResult.value = null;
    isScoreModalOpen.value = false;
    status.value = "doing";
  }

  // 重置做题状态为初始就绪态（用于换一套新题）
  function resetExam() {
    userAnswers.value = {};
    currentResult.value = null;
    isScoreModalOpen.value = false;
    status.value = "ready";
  }

  // 交卷评分
  function submitExam(
    flatPuzzles: SudokuPuzzle[],
    totalHoles: number,
    elapsedSeconds: number,
    config: PaperConfig
  ): ExamResult | null {
    if (filledCount.value < totalHoles) {
      const unDone = totalHoles - filledCount.value;
      if (!confirm(`还有 ${unDone} 个空格未填写，确定现在交卷评分吗？`)) {
        return null;
      }
    }

    status.value = "submitted";

    // 评分统计
    let correctHoles = 0;
    let wrongHoles = 0;
    let correctPuzzles = 0;

    flatPuzzles.forEach((item) => {
      const { id, puzzle, solution } = item;
      let puzzleAllCorrect = true;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (puzzle[r][c] === 0) {
            const key = `${id}_${r}_${c}`;
            const userVal = userAnswers.value[key];
            const trueVal = solution[r][c];

            if (userVal === trueVal) {
              correctHoles++;
            } else {
              wrongHoles++;
              puzzleAllCorrect = false;
            }
          }
        }
      }

      if (puzzleAllCorrect) {
        correctPuzzles++;
      }
    });

    // 100 分制计算
    const score =
      totalHoles > 0 ? Math.round((correctHoles / totalHoles) * 100) : 100;

    const result: ExamResult = {
      score,
      timeSpent: elapsedSeconds,
      totalPuzzles: flatPuzzles.length,
      correctPuzzles,
      totalHoles,
      correctHoles,
      wrongHoles,
      difficulty: config.difficulty,
      symbolType: config.symbolType,
      studentName: config.studentName || "",
      studentClass: config.studentClass || "",
      pagesCount: config.pagesCount,
      rowsPerPage: config.rowsPerPage,
      createdAt: new Date().toISOString(),
      detailJson: {
        puzzles: flatPuzzles,
        userAnswers: { ...userAnswers.value },
      },
    };

    currentResult.value = result;
    isScoreModalOpen.value = true;
    return result;
  }

  function closeScoreModal() {
    isScoreModalOpen.value = false;
  }

  return {
    status,
    userAnswers,
    currentResult,
    isScoreModalOpen,
    filledCount,
    startExam,
    fillCell,
    restartCurrentExam,
    resetExam,
    submitExam,
    closeScoreModal,
  };
}
