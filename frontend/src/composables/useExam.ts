import { ref, computed } from "vue";
import type { SudokuPuzzle } from "../types/sudoku";
import type { ExamStatus, UserAnswers, ExamResult, AnswerStep } from "../types/exam";
import type { PaperConfig } from "../types/config";

export function useExam() {
  const status = ref<ExamStatus>("ready");
  const userAnswers = ref<UserAnswers>({});
  const answerSteps = ref<AnswerStep[]>([]);
  const currentResult = ref<ExamResult | null>(null);
  const isScoreModalOpen = ref(false);

  // 已填写空格数
  const filledCount = computed(() => Object.keys(userAnswers.value).length);

  // 开始做题
  function startExam() {
    status.value = "doing";
    answerSteps.value = [];
  }

  // 填写或清除单元格数值，并记录步骤流水
  function fillCell(
    puzzleId: number,
    r: number,
    c: number,
    val: number,
    timeOffset: number = 0,
    solutionVal?: number
  ) {
    const key = `${puzzleId}_${r}_${c}`;
    const prevVal = userAnswers.value[key] || 0;

    // 若值未变则无需重复记录
    if (val === prevVal) return;

    if (val === 0) {
      delete userAnswers.value[key];
    } else {
      userAnswers.value[key] = val;
    }

    // 记录每一步的操作
    const stepNum = answerSteps.value.length + 1;
    answerSteps.value.push({
      step: stepNum,
      puzzleId,
      r,
      c,
      val,
      prevVal,
      timeOffset,
      timestamp: Date.now(),
      isCorrect: val > 0 && solutionVal !== undefined ? val === solutionVal : undefined,
      solutionVal,
    });
  }

  // 重新开始当前这一套题
  function restartCurrentExam() {
    userAnswers.value = {};
    answerSteps.value = [];
    currentResult.value = null;
    isScoreModalOpen.value = false;
    status.value = "doing";
  }

  // 重置做题状态为初始就绪态（用于换一套新题）
  function resetExam() {
    userAnswers.value = {};
    answerSteps.value = [];
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

    // 题目快速查找字典
    const puzzleMap = new Map<number, SudokuPuzzle>();
    flatPuzzles.forEach((p) => puzzleMap.set(p.id, p));

    // 为每个步骤补充正误判定与标准答案
    const gradedSteps = answerSteps.value.map((s) => {
      const p = puzzleMap.get(s.puzzleId);
      const trueVal = p ? p.solution[s.r][s.c] : s.solutionVal;
      return {
        ...s,
        solutionVal: trueVal,
        isCorrect: s.val > 0 && trueVal !== undefined ? s.val === trueVal : false,
      };
    });

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
        steps: gradedSteps,
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
    answerSteps,
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
