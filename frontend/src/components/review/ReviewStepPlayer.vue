<template>
  <div class="step-player-container">
    <!-- 如果无步骤数据 -->
    <div v-if="!steps || steps.length === 0" class="no-steps-placeholder">
      <div style="font-size: 36px;">⏳</div>
      <h4>暂无分步推演轨迹</h4>
      <p>
        这份试卷为早期作答记录，当时尚未启用步骤追踪功能。
        您可以点击顶部的<b>【重做此试卷】</b>重新挑战，系统将全程记录孩子的每一步思考轨迹！
      </p>
    </div>

    <!-- 正常推演播放器 -->
    <template v-else>
      <!-- 顶部控制条与题号筛选 -->
      <div class="step-player-topbar">
        <div class="player-puzzle-selector">
          <span>回放题目：</span>
          <select v-model="selectedPuzzleId">
            <option :value="0">全卷连续推演 (共 {{ steps.length }} 步)</option>
            <option
              v-for="p in puzzles"
              :key="p.id"
              :value="p.id"
            >
              第 {{ p.id }} 题 ({{ getPuzzleStepCount(p.id) }} 步{{ isPuzzleWrong(p) ? ' · 错' : '' }})
            </option>
          </select>
        </div>

        <div class="player-step-counter">
          <span>步骤：{{ currentStepIndex }} / {{ activeSteps.length }}</span>
          <span v-if="currentStep" style="margin-left: 12px; font-weight: normal; font-size: 0.8rem; color: #64748b;">
            耗时 {{ formatDuration(currentStep.timeOffset) }}
          </span>
        </div>
      </div>

      <!-- 回放主体区域：左侧盘面与控制台，右侧步骤日志 -->
      <div class="step-player-main">
        <!-- 左侧：盘面与控制器 -->
        <div class="step-player-board-panel">
          <!-- 题目与题型标签 -->
          <div style="display: flex; align-items: center; justify-content: space-between; width: 260px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; font-size: 1rem; color: #0f172a;">
                第 {{ currentDisplayPuzzle.id }} 题
              </span>
              <button
                type="button"
                class="btn-redo-puzzle-player"
                @click="emit('redoPuzzle', currentDisplayPuzzle)"
              >
                ↺ 重做
              </button>
            </div>
            <span class="review-tag">
              {{ difficultyTagText }}
            </span>
          </div>

          <!-- 4x4 盘面展示 (单格放大以提供极佳复盘体验) -->
          <div
            class="sudoku-board"
            style="width: 260px; height: 260px; position: relative;"
          >
            <template v-for="r in 4" :key="r">
              <template v-for="c in 4" :key="c">
                <div
                  class="sudoku-cell"
                  :class="getCellClass(r - 1, c - 1)"
                  style="font-size: 32px;"
                  :title="getCellTitle(r - 1, c - 1)"
                >
                  <!-- 初始已知数 -->
                  <template v-if="currentDisplayPuzzle.puzzle[r - 1][c - 1] !== 0">
                    {{ symbolMap[currentDisplayPuzzle.puzzle[r - 1][c - 1]] }}
                  </template>

                  <!-- 用户在该步骤时已填的数 -->
                  <template v-else-if="currentAnswers[`${r - 1}_${c - 1}`] !== undefined">
                    <span class="user-val">
                      {{ symbolMap[currentAnswers[`${r - 1}_${c - 1}`]] }}
                    </span>
                    <!-- 若该步在此格且填错，右下角标出正确答案 -->
                    <span
                      v-if="isCellCurrentWrong(r - 1, c - 1)"
                      class="correct-hint"
                      style="font-size: 13px;"
                    >
                      {{ symbolMap[currentDisplayPuzzle.solution[r - 1][c - 1]] }}
                    </span>
                  </template>

                  <!-- 步骤序号角标 -->
                  <span
                    v-if="cellStepNumber[`${r - 1}_${c - 1}`]"
                    class="step-badge"
                    :class="getCellBadgeClass(r - 1, c - 1)"
                  >
                    {{ cellStepNumber[`${r - 1}_${c - 1}`] }}
                  </span>
                </div>
              </template>
            </template>
          </div>

          <!-- 智能诊断卡片 (规则冲突与错因分析) -->
          <div
            class="step-diagnosis-card"
            :class="diagnosisCardClass"
          >
            <div class="diag-icon">{{ diagnosisIcon }}</div>
            <div class="diag-body" style="flex: 1;">
              <strong>{{ diagnosisTitle }}</strong>
              <div>{{ diagnosisMessage }}</div>
              <div v-if="diagnosisCardClass === 'diag-wrong'" style="margin-top: 8px;">
                <button
                  type="button"
                  class="btn-redo-puzzle-player"
                  style="background: #ffffff; border-color: #fca5a5; color: #b91c1c;"
                  @click="emit('redoPuzzle', currentDisplayPuzzle)"
                >
                  ↺ 亲自订正此题
                </button>
              </div>
            </div>
          </div>

          <!-- 控制台操作栏 -->
          <div class="player-controller-bar">
            <!-- 进度滑块 -->
            <div class="player-slider-row">
              <span style="font-size: 0.8rem; color: #64748b; font-family: monospace;">0</span>
              <input
                v-model.number="currentStepIndex"
                type="range"
                min="0"
                :max="activeSteps.length"
                class="player-slider"
                @input="pause"
              />
              <span style="font-size: 0.8rem; color: #64748b; font-family: monospace;">
                {{ activeSteps.length }}
              </span>
            </div>

            <!-- 控制按钮 -->
            <div class="player-buttons-row">
              <button
                type="button"
                class="player-btn"
                :disabled="currentStepIndex <= 0"
                title="回到初始盘面"
                @click="goToStep(0)"
              >
                ⏮ 初始
              </button>
              <button
                type="button"
                class="player-btn"
                :disabled="currentStepIndex <= 0"
                title="上一步"
                @click="prevStep"
              >
                ◀ 上一步
              </button>
              <button
                type="button"
                class="player-btn btn-play-pause"
                @click="togglePlay"
              >
                {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
              </button>
              <button
                type="button"
                class="player-btn"
                :disabled="currentStepIndex >= activeSteps.length"
                title="下一步"
                @click="nextStep"
              >
                下一步 ▶
              </button>
              <button
                type="button"
                class="player-btn"
                :disabled="currentStepIndex >= activeSteps.length"
                title="跳到最后一步"
                @click="goToStep(activeSteps.length)"
              >
                终局 ⏭
              </button>

              <select v-model.number="playSpeed" class="speed-select" title="播放速度">
                <option :value="1500">慢速 (0.8x)</option>
                <option :value="1000">正常 (1.0x)</option>
                <option :value="600">快速 (1.5x)</option>
                <option :value="350">极速 (2.5x)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 右侧：步骤流水清单 -->
        <div class="step-log-panel">
          <div class="step-log-header">
            <span>作答步骤明细流水</span>
            <span style="font-size: 0.75rem; color: #64748b;">
              点击条目可快速跳转
            </span>
          </div>

          <div ref="logListRef" class="step-log-list">
            <div
              v-for="(s, idx) in activeSteps"
              :key="s.step"
              :ref="(el) => { if (idx + 1 === currentStepIndex) activeLogItemRef = el as HTMLElement }"
              class="step-log-item"
              :class="{ active: currentStepIndex === idx + 1 }"
              @click="goToStep(idx + 1)"
            >
              <div class="step-log-left">
                <span class="step-log-num">{{ s.step }}</span>
                <div>
                  <div style="font-weight: 600; color: #0f172a;">
                    第 {{ s.puzzleId }} 题 [{{ s.r + 1 }}行{{ s.c + 1 }}列]
                  </div>
                  <div style="font-size: 0.7rem; color: #94a3b8;">
                    {{ formatDuration(s.timeOffset) }}
                  </div>
                </div>
              </div>

              <div>
                <span
                  v-if="s.val === 0"
                  class="step-log-tag tag-del"
                >
                  ⌫ 清除
                </span>
                <span
                  v-else-if="s.isCorrect"
                  class="step-log-tag tag-ok"
                >
                  填 {{ symbolMap[s.val] }} · 对
                </span>
                <span
                  v-else
                  class="step-log-tag tag-err"
                >
                  填 {{ symbolMap[s.val] }} · 错 (正解{{ symbolMap[s.solutionVal || 0] }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { AnswerStep } from "../../types/exam";

const props = withDefaults(
  defineProps<{
    puzzles: SudokuPuzzle[];
    steps: AnswerStep[];
    symbolMap: Record<number, string>;
    initialPuzzleId?: number;
  }>(),
  {
    initialPuzzleId: 0,
  }
);

const emit = defineEmits<{
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
}>();

const selectedPuzzleId = ref<number>(props.initialPuzzleId || 0);
const currentStepIndex = ref<number>(0);
const isPlaying = ref<boolean>(false);
const playSpeed = ref<number>(1000);
const activeLogItemRef = ref<HTMLElement | null>(null);
const logListRef = ref<HTMLElement | null>(null);

let playTimer: any = null;

// 根据题号筛选激活的步骤列表
const activeSteps = computed<AnswerStep[]>(() => {
  if (!props.steps || props.steps.length === 0) return [];
  if (selectedPuzzleId.value === 0) {
    return props.steps;
  }
  return props.steps.filter((s) => s.puzzleId === selectedPuzzleId.value);
});

// 当前步骤数据对象
const currentStep = computed<AnswerStep | null>(() => {
  if (currentStepIndex.value <= 0 || currentStepIndex.value > activeSteps.value.length) {
    return null;
  }
  return activeSteps.value[currentStepIndex.value - 1];
});

// 当前展示的题目
const currentDisplayPuzzle = computed<SudokuPuzzle>(() => {
  if (selectedPuzzleId.value !== 0) {
    const found = props.puzzles.find((p) => p.id === selectedPuzzleId.value);
    if (found) return found;
  }
  if (currentStep.value) {
    const found = props.puzzles.find((p) => p.id === currentStep.value!.puzzleId);
    if (found) return found;
  }
  return props.puzzles[0] || {
    id: 1,
    targetClues: 8,
    cluesCount: 8,
    puzzle: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    solution: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]],
  };
});

// 还原当前步推演下的当前盘面答案状态
const currentAnswers = computed<Record<string, number>>(() => {
  const ans: Record<string, number> = {};
  const targetPuzzleId = currentDisplayPuzzle.value.id;

  for (let i = 0; i < currentStepIndex.value; i++) {
    const s = activeSteps.value[i];
    if (s.puzzleId === targetPuzzleId) {
      const key = `${s.r}_${s.c}`;
      if (s.val === 0) {
        delete ans[key];
      } else {
        ans[key] = s.val;
      }
    }
  }

  return ans;
});

// 还原每个格子在当前步时的最新步骤号
const cellStepNumber = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  const targetPuzzleId = currentDisplayPuzzle.value.id;

  for (let i = 0; i < currentStepIndex.value; i++) {
    const s = activeSteps.value[i];
    if (s.puzzleId === targetPuzzleId) {
      const key = `${s.r}_${s.c}`;
      if (s.val > 0) {
        map[key] = s.step;
      } else {
        delete map[key];
      }
    }
  }

  return map;
});

// 冲突格位检测
const conflictCells = computed<Array<{ r: number; c: number }>>(() => {
  const step = currentStep.value;
  if (!step || step.val === 0 || step.isCorrect !== false) return [];
  if (step.puzzleId !== currentDisplayPuzzle.value.id) return [];

  const conflicts: Array<{ r: number; c: number }> = [];
  const p = currentDisplayPuzzle.value;
  const val = step.val;
  const { r: curR, c: curC } = step;

  // 1. 同行检查
  for (let c = 0; c < 4; c++) {
    if (c === curC) continue;
    const clue = p.puzzle[curR][c];
    const userVal = currentAnswers.value[`${curR}_${c}`];
    if (clue === val || userVal === val) {
      conflicts.push({ r: curR, c });
    }
  }

  // 2. 同列检查
  for (let r = 0; r < 4; r++) {
    if (r === curR) continue;
    const clue = p.puzzle[r][curC];
    const userVal = currentAnswers.value[`${r}_${curC}`];
    if (clue === val || userVal === val) {
      conflicts.push({ r, c: curC });
    }
  }

  // 3. 同宫检查 (2x2)
  const blockRow = Math.floor(curR / 2) * 2;
  const blockCol = Math.floor(curC / 2) * 2;
  for (let r = blockRow; r < blockRow + 2; r++) {
    for (let c = blockCol; c < blockCol + 2; c++) {
      if (r === curR && c === curC) continue;
      const clue = p.puzzle[r][c];
      const userVal = currentAnswers.value[`${r}_${c}`];
      if (clue === val || userVal === val) {
        if (!conflicts.some((item) => item.r === r && item.c === c)) {
          conflicts.push({ r, c });
        }
      }
    }
  }

  return conflicts;
});

// 智能诊断信息生成
const diagnosisCardClass = computed(() => {
  if (currentStepIndex.value === 0) return "diag-clear";
  const s = currentStep.value;
  if (!s) return "diag-clear";
  if (s.val === 0) return "diag-clear";
  return s.isCorrect ? "diag-correct" : "diag-wrong";
});

const diagnosisIcon = computed(() => {
  if (currentStepIndex.value === 0) return "🏁";
  const s = currentStep.value;
  if (!s) return "💡";
  if (s.val === 0) return "⌫";
  return s.isCorrect ? "✓" : "❌";
});

const diagnosisTitle = computed(() => {
  if (currentStepIndex.value === 0) {
    return "开局初始盘面 (未填数)";
  }
  const s = currentStep.value;
  if (!s) return "请选择步骤";
  if (s.val === 0) {
    return `第 ${s.step} 步：擦除清除数字`;
  }
  if (s.isCorrect) {
    return `第 ${s.step} 步：填入 ${props.symbolMap[s.val]} (推导正确)`;
  }

  // 错误诊断
  if (conflictCells.value.length > 0) {
    return `第 ${s.step} 步：发现数独规则冲突！`;
  }
  return `第 ${s.step} 步：填入 ${props.symbolMap[s.val]} (推导失误)`;
});

const difficultyTagText = computed(() => {
  const p = currentDisplayPuzzle.value;
  if (!p) return "";
  if (p.difficultyTier) {
    const map: Record<string, string> = {
      easy: "简单",
      medium: "适中",
      hard: "困难",
    };
    return `${map[p.difficultyTier] || ""} · 给 ${p.cluesCount} 数`;
  }
  if (p.hypoType === "direct") return "假设·直接排除";
  if (p.hypoType === "deep") return "假设·深度尝试";
  return `给 ${p.cluesCount} 数`;
});

const diagnosisMessage = computed(() => {
  if (currentStepIndex.value === 0) {
    return "点击【下一步】或【播放】，逐步查看孩子填入数字的具体过程与思路。";
  }
  const s = currentStep.value;
  if (!s) return "";
  if (s.val === 0) {
    return `在第 ${s.r + 1} 行第 ${s.c + 1} 列清除了先前填入的数字，进行了自我纠错。`;
  }
  if (s.isCorrect) {
    return `在第 ${s.r + 1} 行第 ${s.c + 1} 列填入数字 ${props.symbolMap[s.val]}，与唯一解完全一致。`;
  }

  // 错误消息深度分析
  const p = currentDisplayPuzzle.value;
  const trueVal = props.symbolMap[p.solution[s.r][s.c]];
  if (conflictCells.value.length > 0) {
    const listStr = conflictCells.value
      .map((c) => `[${c.r + 1}行${c.c + 1}列]`)
      .join("、");
    return `此格填入 ${props.symbolMap[s.val]} 与同行/同列/同宫的 ${listStr} 发生撞车，违背了不重复原则！正确答案应为 ${trueVal}。`;
  }
  return `此格填入 ${props.symbolMap[s.val]}，正确答案应为 ${trueVal}。此处可能是过早进行无根据猜数，引发了连锁推导错误。`;
});

function getCellClass(r: number, c: number) {
  const p = currentDisplayPuzzle.value;
  if (p.puzzle[r][c] !== 0) {
    return ["filled-clue"];
  }

  const list: string[] = ["empty"];
  const step = currentStep.value;

  // 判断是否为当前正在操作的格子
  if (step && step.puzzleId === p.id && step.r === r && step.c === c) {
    list.push("step-active-cell");
  }

  // 判断是否为冲突高亮格子
  if (conflictCells.value.some((cell) => cell.r === r && cell.c === c)) {
    list.push("step-conflict-cell");
  }

  // 批改色彩
  const userVal = currentAnswers.value[`${r}_${c}`];
  if (userVal !== undefined) {
    const trueVal = p.solution[r][c];
    if (userVal === trueVal) {
      list.push("graded-correct");
    } else {
      list.push("graded-wrong");
    }
  }

  return list;
}

function getCellBadgeClass(r: number, c: number) {
  const userVal = currentAnswers.value[`${r}_${c}`];
  const trueVal = currentDisplayPuzzle.value.solution[r][c];
  if (userVal === trueVal) return "badge-correct";
  return "badge-wrong";
}

function isCellCurrentWrong(r: number, c: number) {
  const step = currentStep.value;
  if (!step || step.puzzleId !== currentDisplayPuzzle.value.id) return false;
  return step.r === r && step.c === c && step.val > 0 && !step.isCorrect;
}

function getCellTitle(r: number, c: number): string {
  const p = currentDisplayPuzzle.value;
  if (p.puzzle[r][c] !== 0) return `已知数: ${props.symbolMap[p.puzzle[r][c]]}`;
  const u = currentAnswers.value[`${r}_${c}`];
  if (u !== undefined) {
    return `已填: ${props.symbolMap[u]} (正解: ${props.symbolMap[p.solution[r][c]]})`;
  }
  return "空格";
}

function getPuzzleStepCount(puzzleId: number): number {
  return props.steps.filter((s) => s.puzzleId === puzzleId).length;
}

function isPuzzleWrong(puzzle: SudokuPuzzle): boolean {
  return props.steps.some(
    (s) => s.puzzleId === puzzle.id && s.val > 0 && s.isCorrect === false
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 控制器交互方法
function goToStep(index: number) {
  currentStepIndex.value = Math.max(0, Math.min(index, activeSteps.value.length));
  scrollToActiveLog();
}

function nextStep() {
  if (currentStepIndex.value < activeSteps.value.length) {
    currentStepIndex.value++;
    scrollToActiveLog();
  } else {
    pause();
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
    scrollToActiveLog();
  }
}

function togglePlay() {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
}

function play() {
  if (currentStepIndex.value >= activeSteps.value.length) {
    currentStepIndex.value = 0;
  }
  isPlaying.value = true;
  scheduleNextStep();
}

function pause() {
  isPlaying.value = false;
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

function scheduleNextStep() {
  if (!isPlaying.value) return;
  playTimer = setTimeout(() => {
    if (!isPlaying.value) return;
    if (currentStepIndex.value < activeSteps.value.length) {
      currentStepIndex.value++;
      scrollToActiveLog();
      scheduleNextStep();
    } else {
      pause();
    }
  }, playSpeed.value);
}

function scrollToActiveLog() {
  nextTick(() => {
    if (activeLogItemRef.value && logListRef.value) {
      activeLogItemRef.value.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
}

// 切换题目时重置步数
watch(selectedPuzzleId, () => {
  pause();
  currentStepIndex.value = 0;
});

// 当初始题目发生变化时同步
watch(
  () => props.initialPuzzleId,
  (newId) => {
    if (newId !== undefined) {
      selectedPuzzleId.value = newId;
    }
  }
);

onUnmounted(() => {
  pause();
});
</script>
