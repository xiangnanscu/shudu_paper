<template>
  <div class="review-overview-container">
    <!-- 顶部控制条 -->
    <div class="review-overview-controls">
      <label class="overview-toggle-label">
        <input
          v-model="showStepBadge"
          type="checkbox"
          :disabled="!hasSteps"
        />
        <span>显示填数顺序序号</span>
        <span
          v-if="!hasSteps"
          style="font-size: 0.75rem; color: #94a3b8; font-weight: normal;"
        >
          (早期作答记录无步骤)
        </span>
      </label>

      <div class="overview-filter-group">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          全部题目 ({{ puzzles.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterType === 'wrong' }"
          @click="filterType = 'wrong'"
        >
          仅看错题 ({{ wrongPuzzlesCount }})
        </button>
      </div>
    </div>

    <!-- 试卷题目网格 -->
    <div class="review-puzzles-grid">
      <div
        v-for="puzzle in displayedPuzzles"
        :key="puzzle.id"
        class="review-puzzle-wrapper"
        :class="{ 'has-wrong': isPuzzleWrong(puzzle) }"
      >
        <SudokuCard
          :puzzle="puzzle"
          board-size="190px"
          cell-font-size="24px"
          :symbol-map="symbolMap"
          exam-status="submitted"
          :user-answers="userAnswers"
          :active-cell="null"
          :step-map="finalStepMap"
          :show-step-badge="showStepBadge && hasSteps"
        />

        <div class="review-puzzle-action-bar">
          <button
            type="button"
            class="btn-redo-puzzle"
            :class="{
              'is-corrected': correctedPuzzleIds?.has(puzzle.id),
              'is-wrong': isPuzzleWrong(puzzle) && !correctedPuzzleIds?.has(puzzle.id)
            }"
            @click="emit('redoPuzzle', puzzle)"
          >
            <template v-if="correctedPuzzleIds?.has(puzzle.id)">
              ✓ 已订正 (再练一次)
            </template>
            <template v-else-if="isPuzzleWrong(puzzle)">
              ↺ 重做此错题
            </template>
            <template v-else>
              ↺ 单题重做
            </template>
          </button>

          <button
            v-if="hasSteps"
            type="button"
            class="btn-inspect-puzzle"
            @click="emit('inspectPuzzle', puzzle.id)"
          >
            🔍 分步推演
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { UserAnswers, AnswerStep } from "../../types/exam";
import SudokuCard from "../paper/SudokuCard.vue";

const props = withDefaults(
  defineProps<{
    puzzles: SudokuPuzzle[];
    userAnswers: UserAnswers;
    steps?: AnswerStep[];
    symbolMap: Record<number, string>;
    correctedPuzzleIds?: Set<number>;
  }>(),
  {
    steps: () => [],
    correctedPuzzleIds: () => new Set<number>(),
  }
);

const emit = defineEmits<{
  (e: "inspectPuzzle", puzzleId: number): void;
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
}>();

const showStepBadge = ref(true);
const filterType = ref<"all" | "wrong">("all");

const hasSteps = computed(() => {
  return Array.isArray(props.steps) && props.steps.length > 0;
});

// 计算最终每个格子生效的步骤序号映射
const finalStepMap = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  if (!hasSteps.value) return map;

  props.steps.forEach((s) => {
    const key = `${s.puzzleId}_${s.r}_${s.c}`;
    if (s.val > 0) {
      map[key] = s.step;
    } else {
      delete map[key];
    }
  });

  return map;
});

// 判断单道题是否存在错误或漏填
function isPuzzleWrong(puzzle: SudokuPuzzle): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (puzzle.puzzle[r][c] === 0) {
        const key = `${puzzle.id}_${r}_${c}`;
        const uVal = props.userAnswers[key];
        const sVal = puzzle.solution[r][c];
        if (uVal !== sVal) {
          return true;
        }
      }
    }
  }
  return false;
}

const wrongPuzzlesCount = computed(() => {
  return props.puzzles.filter(isPuzzleWrong).length;
});

const displayedPuzzles = computed(() => {
  if (filterType.value === "wrong") {
    return props.puzzles.filter(isPuzzleWrong);
  }
  return props.puzzles;
});
</script>
