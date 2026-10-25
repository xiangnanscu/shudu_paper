import { ref, computed, watch } from "vue";
import type { SymbolType } from "../types/sudoku";
import type {
  TrainingMode,
  TrainingQuestion,
  TrainingStats,
} from "../types/training";
import { generateTrainingQuestion } from "../core/training";

const STORAGE_KEY_STATS = "shudu_training_stats";

function loadSavedStats(): TrainingStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load training stats from localStorage", e);
  }
  return {
    totalSolved: 0,
    currentStreak: 0,
    bestStreak: 0,
    nakedSolved: 0,
    hiddenSolved: 0,
    stars: 0,
  };
}

function saveStats(stats: TrainingStats) {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save training stats", e);
  }
}

export function useTraining(initialSymbolType: SymbolType = "numbers") {
  const mode = ref<TrainingMode>("naked");
  const symbolType = ref<SymbolType>(initialSymbolType);
  const currentQuestion = ref<TrainingQuestion | null>(null);

  // 提示等级: 0 (无提示), 1 (文字点拨), 2 (激光/十字雷达全开), 3 (真相揭晓)
  const hintLevel = ref<0 | 1 | 2 | 3>(0);

  // 用户作答状态
  const userSelectedVal = ref<number | null>(null);
  const isAnswered = ref<boolean>(false);
  const isCorrect = ref<boolean>(false);
  const feedbackMessage = ref<string>("");

  // 动画状态
  const isWrongShake = ref<boolean>(false);
  const isSuccessPop = ref<boolean>(false);

  // 图文小百科教程模态窗
  const isTutorialOpen = ref<boolean>(false);

  // 统计数据
  const stats = ref<TrainingStats>(loadSavedStats());

  // 初始化或生成新题目
  function nextQuestion() {
    hintLevel.value = 0;
    userSelectedVal.value = null;
    isAnswered.value = false;
    isCorrect.value = false;
    feedbackMessage.value = "";
    isWrongShake.value = false;
    isSuccessPop.value = false;

    currentQuestion.value = generateTrainingQuestion(mode.value, symbolType.value);
  }

  // 逐步点拨提示
  function requestHint() {
    if (hintLevel.value < 3) {
      hintLevel.value = (hintLevel.value + 1) as 1 | 2 | 3;
    }
  }

  // 重置提示
  function resetHint() {
    hintLevel.value = 0;
  }

  // 提交作答
  function submitAnswer(val: number) {
    if (!currentQuestion.value || isAnswered.value) return;

    userSelectedVal.value = val;
    isAnswered.value = true;

    if (val === currentQuestion.value.targetValue) {
      isCorrect.value = true;
      isSuccessPop.value = true;
      feedbackMessage.value = "太棒啦！回答完全正确！🌟";

      // 更新统计
      stats.value.totalSolved++;
      stats.value.currentStreak++;
      if (stats.value.currentStreak > stats.value.bestStreak) {
        stats.value.bestStreak = stats.value.currentStreak;
      }
      stats.value.stars += hintLevel.value === 0 ? 3 : hintLevel.value === 1 ? 2 : 1;

      if (currentQuestion.value.technique === "naked_single") {
        stats.value.nakedSolved++;
      } else {
        stats.value.hiddenSolved++;
      }
      saveStats(stats.value);
    } else {
      isCorrect.value = false;
      isWrongShake.value = true;
      stats.value.currentStreak = 0;
      feedbackMessage.value = "不对哦~ 再仔细观察一下，或者点击【💡 魔法提示】试一试！";
      saveStats(stats.value);

      setTimeout(() => {
        isWrongShake.value = false;
        // 允许重新尝试
        isAnswered.value = false;
        userSelectedVal.value = null;
      }, 1200);
    }
  }

  // 切换训练模式
  function switchMode(newMode: TrainingMode) {
    if (mode.value === newMode) return;
    mode.value = newMode;
    nextQuestion();
  }

  // 切换符号集
  function switchSymbolType(newSymbolType: SymbolType) {
    symbolType.value = newSymbolType;
    if (currentQuestion.value) {
      // 重新生成当前题目的分级引导文案
      const q = currentQuestion.value;
      if (q.technique === "naked_single") {
        currentQuestion.value = generateTrainingQuestion("naked", symbolType.value);
      } else {
        currentQuestion.value = generateTrainingQuestion("hidden", symbolType.value);
      }
    }
  }

  return {
    mode,
    symbolType,
    currentQuestion,
    hintLevel,
    userSelectedVal,
    isAnswered,
    isCorrect,
    feedbackMessage,
    isWrongShake,
    isSuccessPop,
    isTutorialOpen,
    stats,
    nextQuestion,
    requestHint,
    resetHint,
    submitAnswer,
    switchMode,
    switchSymbolType,
  };
}
