<template>
  <div
    v-if="isOpen && puzzle"
    class="single-redo-backdrop"
    @click.self="handleClose"
  >
    <div class="single-redo-modal">
      <!-- 顶部状态栏 -->
      <div class="single-redo-header">
        <div class="single-redo-header-left">
          <span class="single-redo-title">第 {{ puzzle.id }} 题 · 单题订正</span>
          <span class="review-tag">
            {{ difficultyText }}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="single-redo-timer">
            <span>⏱️</span>
            <span>{{ formattedTimer }}</span>
          </div>
          <button
            type="button"
            class="review-close-btn"
            aria-label="关闭"
            @click="handleClose"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 盘面与操作区 -->
      <div class="single-redo-body">
        <!-- 4x4 交互大盘面 -->
        <div
          class="single-redo-board"
          :class="{ shake: isShaking }"
        >
          <template v-for="r in 4" :key="`row-${r}`">
            <template v-for="c in 4" :key="`col-${c}`">
              <div
                class="single-redo-cell"
                :class="[
                  c === 2 ? 'col-border' : '',
                  r === 2 ? 'row-border' : '',
                  isClue(r - 1, c - 1) ? 'clue-cell' : 'empty-cell',
                  isSelected(r - 1, c - 1) ? 'is-selected' : '',
                  checkedState[`${r - 1}_${c - 1}`] === 'wrong' ? 'is-wrong' : '',
                  checkedState[`${r - 1}_${c - 1}`] === 'correct' ? 'is-correct' : '',
                ]"
                @click="handleSelectCell(r - 1, c - 1)"
              >
                <!-- 初始已知数 -->
                <template v-if="isClue(r - 1, c - 1)">
                  {{ symbolMap[puzzle.puzzle[r - 1][c - 1]] }}
                </template>

                <!-- 用户作答数 -->
                <template v-else-if="answers[`${r - 1}_${c - 1}`]">
                  <span>{{ symbolMap[answers[`${r - 1}_${c - 1}`]] }}</span>
                </template>

                <!-- 提示参考答案 -->
                <span
                  v-if="showAnswerHint && !isClue(r - 1, c - 1)"
                  class="redo-ans-hint"
                >
                  {{ symbolMap[puzzle.solution[r - 1][c - 1]] }}
                </span>
              </div>
            </template>
          </template>
        </div>

        <!-- 诊断与鼓励反馈卡片 -->
        <div
          class="single-redo-feedback"
          :class="feedbackClass"
        >
          <span>{{ feedbackIcon }}</span>
          <span>{{ feedbackText }}</span>
        </div>

        <!-- 底部大号触控虚拟键盘 -->
        <div class="single-redo-keypad">
          <button
            v-for="num in 4"
            :key="num"
            type="button"
            class="single-redo-key-btn"
            @click="fillValue(num)"
          >
            {{ symbolMap[num] }}
          </button>
          <button
            type="button"
            class="single-redo-key-btn erase-key"
            aria-label="擦除"
            @click="clearCurrentCell"
          >
            ⌫
          </button>
        </div>

        <!-- 辅助工具与提交控制栏 -->
        <div class="single-redo-tools">
          <template v-if="isCompleted">
            <button
              type="button"
              class="tool-btn success-done"
              @click="handleFinishSuccess"
            >
              🎉 完成订正并保存
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="tool-btn"
              title="重新清空此题填数"
              @click="clearAll"
            >
              ↺ 清空
            </button>

            <button
              v-if="hasWrongCells"
              type="button"
              class="tool-btn"
              style="color: #dc2626; border-color: #fca5a5; background: #fff5f5;"
              title="仅抹去填错的格子，保留做对的格子"
              @click="clearErrors"
            >
              ⌫ 仅清错格
            </button>

            <button
              type="button"
              class="tool-btn"
              :style="showAnswerHint ? 'background: #f0fdf4; border-color: #86efac; color: #16a34a;' : ''"
              @click="showAnswerHint = !showAnswerHint"
            >
              💡 {{ showAnswerHint ? '隐藏答案' : '参考答案' }}
            </button>

            <button
              type="button"
              class="tool-btn primary"
              @click="checkAnswers(true)"
            >
              ✓ 检查作答
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import { formatTime } from "../../composables/useExamTimer";

const props = defineProps<{
  isOpen: boolean;
  puzzle: SudokuPuzzle | null;
  symbolMap: Record<number, string>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "success",
    payload: {
      puzzleId: number;
      timeSpent: number;
      userAnswers: Record<string, number>;
    }
  ): void;
}>();

// 内部状态
const selectedCell = ref<{ r: number; c: number } | null>(null);
const answers = ref<Record<string, number>>({});
const checkedState = ref<Record<string, "correct" | "wrong">>({});
const isCompleted = ref(false);
const isShaking = ref(false);
const showAnswerHint = ref(false);
const elapsedSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

// 计时器格式化
const formattedTimer = computed(() => formatTime(elapsedSeconds.value));

// 难度标签
const difficultyText = computed(() => {
  if (!props.puzzle) return "";
  if (props.puzzle.difficultyTier) {
    const tierNames: Record<string, string> = {
      easy: "简单",
      medium: "适中",
      hard: "困难",
    };
    const tier = tierNames[props.puzzle.difficultyTier] || "";
    return `${tier} · 给 ${props.puzzle.cluesCount} 数`;
  }
  if (props.puzzle.hypoType === "direct") return "假设·直接排除";
  if (props.puzzle.hypoType === "deep") return "假设·深度尝试";
  return `给 ${props.puzzle.cluesCount} 数`;
});

// 是否为初始已知数格
function isClue(r: number, c: number): boolean {
  if (!props.puzzle) return false;
  return props.puzzle.puzzle[r][c] !== 0;
}

// 是否为选中格
function isSelected(r: number, c: number): boolean {
  return selectedCell.value?.r === r && selectedCell.value?.c === c;
}

// 检查是否存在错格
const hasWrongCells = computed(() => {
  return Object.values(checkedState.value).some((status) => status === "wrong");
});

// 状态反馈计算
const feedbackClass = computed(() => {
  if (isCompleted.value) return "success";
  if (hasWrongCells.value) return "warning";
  return "normal";
});

const feedbackIcon = computed(() => {
  if (isCompleted.value) return "🌟";
  if (hasWrongCells.value) return "❌";
  return "💡";
});

const feedbackText = computed(() => {
  if (isCompleted.value) {
    return `太棒了！逻辑完全正确，耗时 ${formattedTimer.value}！`;
  }
  if (hasWrongCells.value) {
    const wrongCount = Object.values(checkedState.value).filter(
      (s) => s === "wrong"
    ).length;
    return `发现 ${wrongCount} 处填错啦，可以点击【仅清错格】再试一次哦！`;
  }
  return "点击空格选择数字填入，每行、每列及每个2x2小宫填入1-4不重复。";
});

// 重置并初始化题目作答
function initPuzzle() {
  answers.value = {};
  checkedState.value = {};
  isCompleted.value = false;
  isShaking.value = false;
  showAnswerHint.value = false;
  elapsedSeconds.value = 0;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (props.isOpen && props.puzzle) {
    // 聚焦第一个空格
    focusFirstEmptyCell();
    // 启动秒表
    timerInterval = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }
}

// 自动定位首个空格
function focusFirstEmptyCell() {
  if (!props.puzzle) return;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (props.puzzle.puzzle[r][c] === 0) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }
  selectedCell.value = null;
}

// 自动跳至下一个空格
function focusNextEmptyCell(currR: number, currC: number) {
  if (!props.puzzle) return;
  let started = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!started) {
        if (r === currR && c === currC) {
          started = true;
        }
        continue;
      }
      if (props.puzzle.puzzle[r][c] === 0 && !answers.value[`${r}_${c}`]) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }
}

// 格位点击
function handleSelectCell(r: number, c: number) {
  if (isClue(r, c) || isCompleted.value) return;
  selectedCell.value = { r, c };
}

// 填入数字
function fillValue(val: number) {
  if (!selectedCell.value || isCompleted.value || !props.puzzle) return;
  const { r, c } = selectedCell.value;
  const key = `${r}_${c}`;

  answers.value[key] = val;
  delete checkedState.value[key];

  // 自动寻找下一个待填空格
  focusNextEmptyCell(r, c);

  // 检查是否全盘空格均已填满，若是则自动触发检验
  checkAllHolesFilled();
}

// 擦除当前格
function clearCurrentCell() {
  if (!selectedCell.value || isCompleted.value) return;
  const { r, c } = selectedCell.value;
  const key = `${r}_${c}`;
  delete answers.value[key];
  delete checkedState.value[key];
}

// 清空所有作答
function clearAll() {
  answers.value = {};
  checkedState.value = {};
  isCompleted.value = false;
  focusFirstEmptyCell();
}

// 仅清除错误格
function clearErrors() {
  Object.keys(checkedState.value).forEach((key) => {
    if (checkedState.value[key] === "wrong") {
      delete answers.value[key];
      delete checkedState.value[key];
    }
  });
  focusFirstEmptyCell();
}

// 检查是否所有空格均已填写
function checkAllHolesFilled() {
  if (!props.puzzle) return;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (props.puzzle.puzzle[r][c] === 0) {
        if (!answers.value[`${r}_${c}`]) {
          return; // 仍有空格未填
        }
      }
    }
  }
  // 全满，自动触发检查
  checkAnswers(false);
}

// 校验作答
function checkAnswers(isManual = true) {
  if (!props.puzzle || isCompleted.value) return;

  let allCorrect = true;
  let hasWrong = false;
  const nextChecked: Record<string, "correct" | "wrong"> = {};

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (props.puzzle.puzzle[r][c] === 0) {
        const key = `${r}_${c}`;
        const uVal = answers.value[key];
        const sVal = props.puzzle.solution[r][c];

        if (!uVal) {
          allCorrect = false;
        } else if (uVal === sVal) {
          nextChecked[key] = "correct";
        } else {
          nextChecked[key] = "wrong";
          allCorrect = false;
          hasWrong = true;
        }
      }
    }
  }

  checkedState.value = nextChecked;

  if (allCorrect) {
    isCompleted.value = true;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } else if (hasWrong) {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, 400);
  } else if (isManual) {
    // 尚未全填完且无错
  }
}

// 挑战成功后完成订正
function handleFinishSuccess() {
  if (!props.puzzle) return;
  emit("success", {
    puzzleId: props.puzzle.id,
    timeSpent: elapsedSeconds.value,
    userAnswers: { ...answers.value },
  });
  handleClose();
}

// 关闭弹窗
function handleClose() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  emit("close");
}

// 键盘快捷键监听
function handleKeyDown(e: KeyboardEvent) {
  if (!props.isOpen || !props.puzzle) return;

  // ESC 关闭
  if (e.key === "Escape") {
    e.stopPropagation();
    e.preventDefault();
    handleClose();
    return;
  }

  if (isCompleted.value) {
    if (e.key === "Enter") {
      e.stopPropagation();
      e.preventDefault();
      handleFinishSuccess();
    }
    return;
  }

  // 数字 1-4
  if (["1", "2", "3", "4"].includes(e.key)) {
    e.stopPropagation();
    e.preventDefault();
    fillValue(Number(e.key));
    return;
  }

  // 字母 A-D / a-d
  const keyUpper = e.key.toUpperCase();
  if (["A", "B", "C", "D"].includes(keyUpper)) {
    e.stopPropagation();
    e.preventDefault();
    const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
    fillValue(map[keyUpper]);
    return;
  }

  // 擦除退格
  if (["Backspace", "Delete", "0"].includes(e.key)) {
    e.stopPropagation();
    e.preventDefault();
    clearCurrentCell();
    return;
  }

  // 方向键导航
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    if (!selectedCell.value) return;
    e.stopPropagation();
    e.preventDefault();

    let { r, c } = selectedCell.value;
    const delta: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    const [dr, dc] = delta[e.key];
    for (let step = 1; step <= 4; step++) {
      const nr = (r + dr * step + 4) % 4;
      const nc = (c + dc * step + 4) % 4;
      if (props.puzzle.puzzle[nr][nc] === 0) {
        selectedCell.value = { r: nr, c: nc };
        break;
      }
    }
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      initPuzzle();
    } else if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown, true);
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  window.removeEventListener("keydown", handleKeyDown, true);
});
</script>
