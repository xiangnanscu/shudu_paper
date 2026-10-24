<template>
  <div v-if="currentPuzzle" class="mobile-single-exam-wrapper">
    <!-- 顶部卡片：题号信息与状态 -->
    <div class="mobile-exam-header-card">
      <div class="mobile-header-left">
        <span class="mobile-puzzle-number">第 {{ currentIndex + 1 }} 题</span>
        <span class="mobile-puzzle-total">/ 共 {{ totalPuzzles }} 题</span>
        <span class="mobile-puzzle-tag">{{ difficultyText }}</span>
      </div>

      <div class="mobile-header-right">
        <!-- 批改状态下显示本题对错 -->
        <template v-if="examStatus === 'submitted'">
          <span
            class="mobile-status-pill"
            :class="isPuzzleAllCorrect ? 'status-correct' : 'status-wrong'"
          >
            {{ isPuzzleAllCorrect ? '✓ 本题正确' : '✗ 存在错格' }}
          </span>
        </template>
        <!-- 作答状态下显示填写进度 -->
        <template v-else>
          <span
            class="mobile-status-pill"
            :class="{ 'is-complete': isCurrentPuzzleFilled }"
          >
            {{ isCurrentPuzzleFilled ? '✓ 已填满' : `已填 ${currentFilledCount}/${currentHolesCount} 格` }}
          </span>
        </template>

        <!-- 模式切换入口 -->
        <button
          type="button"
          class="btn-header-view-toggle"
          title="切换为整卷纸张排版预览"
          @click="emit('toggleViewMode')"
        >
          📄 预览整卷
        </button>
      </div>
    </div>

    <!-- 中间 4x4 大号触控盘面卡片 (支持左右滑动切题) -->
    <div
      class="mobile-board-card"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="mobile-sudoku-board">
        <template v-for="r in 4" :key="`r-${r}`">
          <template v-for="c in 4" :key="`c-${c}`">
            <div
              class="mobile-sudoku-cell"
              :class="[
                c === 2 ? 'col-border' : '',
                r === 2 ? 'row-border' : '',
                isClue(r - 1, c - 1) ? 'is-clue' : 'is-empty',
                isSelected(r - 1, c - 1) ? 'is-selected' : '',
                getCellStatusClass(r - 1, c - 1),
              ]"
              @click="handleCellClick(r - 1, c - 1)"
            >
              <!-- 初始已知数线索 -->
              <template v-if="isClue(r - 1, c - 1)">
                <span class="cell-symbol">{{ symbolMap[currentPuzzle.puzzle[r - 1][c - 1]] }}</span>
              </template>

              <!-- 用户填入的答案 -->
              <template v-else-if="getUserVal(r - 1, c - 1)">
                <span class="cell-symbol user-val">{{ symbolMap[getUserVal(r - 1, c - 1)] }}</span>
              </template>

              <!-- 批改状态下错误格或漏填格的标准答案提示 -->
              <span
                v-if="examStatus === 'submitted' && isShowAnswerHint(r - 1, c - 1)"
                class="mobile-cell-hint"
              >
                {{ symbolMap[currentPuzzle.solution[r - 1][c - 1]] }}
              </span>
            </div>
          </template>
        </template>

        <!-- 老师批改大红勾 (手机单题全对时展现大红勾激励) -->
        <div
          v-if="examStatus === 'submitted' && isPuzzleAllCorrect"
          class="teacher-big-check"
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" class="teacher-check-svg">
            <path
              d="M 16 52 C 24 60 32 70 41 82 C 54 54 70 30 89 12"
              fill="none"
              stroke="#dc2626"
              stroke-width="8.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="teacher-check-path"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- 底部操作与输入区 -->
    <div class="mobile-action-area">
      <!-- 答题模式：大号触控虚拟键盘 -->
      <template v-if="examStatus !== 'submitted'">
        <div class="mobile-keypad">
          <button
            v-for="val in [1, 2, 3, 4]"
            :key="val"
            type="button"
            class="mobile-keypad-btn"
            @click="handleKeypadFill(val)"
          >
            {{ symbolMap[val] }}
          </button>
          <button
            type="button"
            class="mobile-keypad-btn btn-erase"
            aria-label="擦除当前格填数"
            @click="handleKeypadFill(0)"
          >
            ⌫
          </button>
        </div>
      </template>

      <!-- 批改状态：错题反馈与一键订正重做 -->
      <template v-else>
        <div
          class="mobile-review-feedback"
          :class="isPuzzleAllCorrect ? 'feedback-perfect' : 'feedback-has-wrong'"
        >
          <div class="mobile-review-feedback-content">
            <span class="feedback-icon">{{ isPuzzleAllCorrect ? '🌟' : '❌' }}</span>
            <span class="feedback-text">
              {{ isPuzzleAllCorrect ? '太棒了！本题逻辑推理完全正确！' : `本题有 ${currentWrongCount} 处填错` }}
            </span>
          </div>

          <!-- 错题订正按钮 -->
          <button
            v-if="!isPuzzleAllCorrect && !isCorrected"
            type="button"
            class="btn-mobile-redo"
            @click="handleRedoCurrentPuzzle"
          >
            🛠️ 订正此题
          </button>
          <span v-else-if="isCorrected" class="badge-corrected-inline">
            ✨ 已订正掌握
          </span>
        </div>
      </template>

      <!-- 题目翻页与题号快速滑轨 -->
      <div class="mobile-nav-bar">
        <button
          type="button"
          class="btn-mobile-nav"
          :disabled="currentIndex === 0"
          @click="prevPuzzle"
        >
          ◀ 上一题
        </button>

        <!-- 题号快速切换滑轨 (快速直达任意题) -->
        <div class="mobile-puzzle-dots">
          <button
            v-for="(p, idx) in puzzles"
            :key="p.id"
            type="button"
            class="mobile-dot-btn"
            :class="[
              idx === currentIndex ? 'active' : '',
              getDotStatusClass(idx),
            ]"
            :title="`第 ${idx + 1} 题`"
            @click="goToPuzzle(idx)"
          >
            {{ idx + 1 }}
          </button>
        </div>

        <!-- 下一题 / 交卷按钮 -->
        <button
          v-if="currentIndex < totalPuzzles - 1"
          type="button"
          class="btn-mobile-nav primary"
          @click="nextPuzzle"
        >
          下一题 ▶
        </button>
        <button
          v-else-if="examStatus === 'doing'"
          type="button"
          class="btn-mobile-nav submit-highlight"
          @click="emit('submitExam')"
        >
          ✓ 交卷评分
        </button>
        <button
          v-else
          type="button"
          class="btn-mobile-nav"
          disabled
        >
          已是末题
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { ExamStatus, UserAnswers, ExamResult } from "../../types/exam";

const props = defineProps<{
  puzzles: SudokuPuzzle[];
  examStatus: ExamStatus;
  userAnswers: UserAnswers;
  symbolMap: Record<number, string>;
  examResult: ExamResult | null;
  correctedPuzzleIds: Set<number>;
}>();

const emit = defineEmits<{
  (e: "startExam"): void;
  (e: "submitExam"): void;
  (
    e: "fill",
    payload: { puzzleId: number; r: number; c: number; val: number }
  ): void;
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
  (e: "toggleViewMode"): void;
}>();

// 内部状态
const currentIndex = ref(0);
const selectedCell = ref<{ r: number; c: number } | null>(null);

// 触控滑动手势支持
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.changedTouches.length > 0) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    // 水平滑动距离超过 45px 且大于垂直位移时触发切题
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        nextPuzzle();
      } else {
        prevPuzzle();
      }
    }
  }
}

// 题目数量与当前题目
const totalPuzzles = computed(() => props.puzzles.length);
const currentPuzzle = computed<SudokuPuzzle | null>(() => {
  if (!props.puzzles || props.puzzles.length === 0) return null;
  return props.puzzles[currentIndex.value] || props.puzzles[0];
});

// 难度标签文字
const difficultyText = computed(() => {
  if (!currentPuzzle.value) return "";
  if (currentPuzzle.value.hypoType === "direct") return "假设·直显";
  if (currentPuzzle.value.hypoType === "deep") return "假设·深度";
  return `给 ${currentPuzzle.value.cluesCount} 数`;
});

// 是否为已知线索格
function isClue(r: number, c: number): boolean {
  if (!currentPuzzle.value) return false;
  return currentPuzzle.value.puzzle[r][c] !== 0;
}

// 获取用户作答数
function getUserVal(r: number, c: number): number {
  if (!currentPuzzle.value) return 0;
  const key = `${currentPuzzle.value.id}_${r}_${c}`;
  return props.userAnswers[key] || 0;
}

// 是否为当前选中格
function isSelected(r: number, c: number): boolean {
  return selectedCell.value?.r === r && selectedCell.value?.c === c;
}

// 单元格批改状态类名
function getCellStatusClass(r: number, c: number): string {
  if (props.examStatus !== "submitted" || isClue(r, c) || !currentPuzzle.value) {
    return "";
  }
  const uVal = getUserVal(r, c);
  const sVal = currentPuzzle.value.solution[r][c];

  if (uVal === sVal) {
    return "is-graded-correct";
  } else if (uVal > 0 && uVal !== sVal) {
    return "is-graded-wrong";
  } else {
    return "is-graded-missed";
  }
}

// 是否显示标准答案提示（错题或漏填）
function isShowAnswerHint(r: number, c: number): boolean {
  if (props.examStatus !== "submitted" || isClue(r, c) || !currentPuzzle.value) {
    return false;
  }
  const uVal = getUserVal(r, c);
  const sVal = currentPuzzle.value.solution[r][c];
  return uVal !== sVal;
}

// 本题总空格数
const currentHolesCount = computed(() => {
  if (!currentPuzzle.value) return 0;
  let count = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0) count++;
    }
  }
  return count;
});

// 本题已填写空格数
const currentFilledCount = computed(() => {
  if (!currentPuzzle.value) return 0;
  let count = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0 && getUserVal(r, c) > 0) {
        count++;
      }
    }
  }
  return count;
});

// 本题是否已填满
const isCurrentPuzzleFilled = computed(() => {
  return currentHolesCount.value > 0 && currentFilledCount.value === currentHolesCount.value;
});

// 本题错误格数统计
const currentWrongCount = computed(() => {
  if (props.examStatus !== "submitted" || !currentPuzzle.value) return 0;
  let count = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0) {
        const uVal = getUserVal(r, c);
        const sVal = currentPuzzle.value.solution[r][c];
        if (uVal !== sVal) count++;
      }
    }
  }
  return count;
});

// 本题是否全对
const isPuzzleAllCorrect = computed(() => {
  return props.examStatus === "submitted" && currentWrongCount.value === 0;
});

// 本题是否已订正成功
const isCorrected = computed(() => {
  if (!currentPuzzle.value) return false;
  return props.correctedPuzzleIds.has(currentPuzzle.value.id);
});

// 自动定位本题第一个空格
function focusFirstEmptyCell() {
  if (!currentPuzzle.value) return;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }
  selectedCell.value = null;
}

// 自动寻找下一个待填空格（优先找未填空格，若都填了则向后顺序移动）
function focusNextCell(currR: number, currC: number) {
  if (!currentPuzzle.value) return;

  // 1. 先寻找当前格后面的第一个【未填空格】
  for (let r = currR; r < 4; r++) {
    const startCol = r === currR ? currC + 1 : 0;
    for (let c = startCol; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0 && !getUserVal(r, c)) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }

  // 2. 若后面没有未填空格，从头回绕寻找之前的【未填空格】
  for (let r = 0; r <= currR; r++) {
    const endCol = r === currR ? currC : 4;
    for (let c = 0; c < endCol; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0 && !getUserVal(r, c)) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }

  // 3. 全盘所有空格均已有值，简单移到下一个空格
  for (let r = currR; r < 4; r++) {
    const startCol = r === currR ? currC + 1 : 0;
    for (let c = startCol; c < 4; c++) {
      if (currentPuzzle.value.puzzle[r][c] === 0) {
        selectedCell.value = { r, c };
        return;
      }
    }
  }
}

// 点击单元格
function handleCellClick(r: number, c: number) {
  if (isClue(r, c)) return;

  if (props.examStatus === "ready") {
    // 尚未开始答题，先触发开始
    emit("startExam");
  }

  selectedCell.value = { r, c };
}

// 虚拟键盘填入
function handleKeypadFill(val: number) {
  if (!currentPuzzle.value) return;

  // 状态就绪时点击键盘直接触发开始
  if (props.examStatus === "ready") {
    emit("startExam");
  }

  // 若尚未选中任何格子，默认聚焦本题首个空格
  if (!selectedCell.value) {
    focusFirstEmptyCell();
  }
  if (!selectedCell.value) return;

  const { r, c } = selectedCell.value;

  emit("fill", {
    puzzleId: currentPuzzle.value.id,
    r,
    c,
    val,
  });

  if (val > 0) {
    focusNextCell(r, c);
  }
}

// 切换题目
function goToPuzzle(index: number) {
  if (index < 0 || index >= props.puzzles.length) return;
  currentIndex.value = index;
  focusFirstEmptyCell();
}

function prevPuzzle() {
  if (currentIndex.value > 0) {
    goToPuzzle(currentIndex.value - 1);
  }
}

function nextPuzzle() {
  if (currentIndex.value < props.puzzles.length - 1) {
    goToPuzzle(currentIndex.value + 1);
  }
}

// 错题订正
function handleRedoCurrentPuzzle() {
  if (currentPuzzle.value) {
    emit("redoPuzzle", currentPuzzle.value);
  }
}

// 题号导航胶囊状态
function getDotStatusClass(idx: number): string {
  const p = props.puzzles[idx];
  if (!p) return "";

  // 已交卷状态
  if (props.examStatus === "submitted") {
    if (props.correctedPuzzleIds.has(p.id)) {
      return "dot-corrected";
    }

    let allCorrect = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (p.puzzle[r][c] === 0) {
          const key = `${p.id}_${r}_${c}`;
          if (props.userAnswers[key] !== p.solution[r][c]) {
            allCorrect = false;
            break;
          }
        }
      }
      if (!allCorrect) break;
    }
    return allCorrect ? "dot-correct" : "dot-wrong";
  }

  // 作答中或未交卷状态
  let isFilled = true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (p.puzzle[r][c] === 0) {
        const key = `${p.id}_${r}_${c}`;
        if (!props.userAnswers[key]) {
          isFilled = false;
          break;
        }
      }
    }
    if (!isFilled) break;
  }
  return isFilled ? "dot-filled" : "";
}

// 监听试卷题目数据或状态重置，自动重置题号并聚焦首空格
watch(
  () => props.puzzles,
  (newPuzzles, oldPuzzles) => {
    if (newPuzzles !== oldPuzzles) {
      currentIndex.value = 0;
    }
    if (currentIndex.value >= newPuzzles.length) {
      currentIndex.value = 0;
    }
    focusFirstEmptyCell();
  },
  { deep: false }
);

// 当重新开始答题时也自动回到第 1 题
watch(
  () => props.examStatus,
  (newStatus, oldStatus) => {
    if (newStatus === "doing" && oldStatus === "ready") {
      focusFirstEmptyCell();
    }
  }
);

// 键盘事件监听（支持外接键盘 1-4, Backspace, 左右方向键）
function handleKeyDown(e: KeyboardEvent) {
  // 当有输入框聚焦或模态窗打开时忽略
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
    return;
  }

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prevPuzzle();
    return;
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    nextPuzzle();
    return;
  }

  if (["1", "2", "3", "4"].includes(e.key)) {
    e.preventDefault();
    handleKeypadFill(Number(e.key));
    return;
  }

  const keyUpper = e.key.toUpperCase();
  if (["A", "B", "C", "D"].includes(keyUpper)) {
    e.preventDefault();
    const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
    handleKeypadFill(map[keyUpper]);
    return;
  }

  if (["Backspace", "Delete", "0"].includes(e.key)) {
    e.preventDefault();
    handleKeypadFill(0);
    return;
  }
}

onMounted(() => {
  focusFirstEmptyCell();
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>
