<template>
  <div class="review-overview-container">
    <!-- 老师红笔批改试卷抬头卡片 (与交卷后试卷完全一致的排版，右上醒目大红分、双横线与评语印章) -->
    <div v-if="record" class="review-paper-header-card">
      <PaperHeader
        :config="resolvedPaperConfig"
        :page-index="0"
        :is-answer-sheet="false"
        :exam-result="overviewExamResult"
      />
    </div>

    <!-- 顶部控制条 -->
    <div class="review-overview-controls">
      <div class="overview-left-actions">
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
            (早期记录无步骤)
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

      <button
        v-if="record"
        type="button"
        class="btn-print-wall"
        title="打印老师批改样式的试卷，贴在墙上激励孩子持续努力"
        @click="emit('print')"
      >
        🖨️ 打印批改试卷 (可贴墙)
      </button>
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
          :corrected-puzzle-ids="correctedPuzzleIds"
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
import type { UserAnswers, AnswerStep, ExamResult } from "../../types/exam";
import type { ExamRecordDetail } from "../../types/record";
import type { PaperConfig } from "../../types/config";
import PaperHeader from "../paper/PaperHeader.vue";
import SudokuCard from "../paper/SudokuCard.vue";

const props = withDefaults(
  defineProps<{
    puzzles: SudokuPuzzle[];
    userAnswers: UserAnswers;
    steps?: AnswerStep[];
    symbolMap: Record<number, string>;
    correctedPuzzleIds?: Set<number>;
    record?: ExamRecordDetail | null;
    paperConfig?: PaperConfig;
    examResult?: ExamResult | null;
  }>(),
  {
    steps: () => [],
    correctedPuzzleIds: () => new Set<number>(),
    record: null,
    paperConfig: undefined,
    examResult: undefined,
  }
);

const emit = defineEmits<{
  (e: "inspectPuzzle", puzzleId: number): void;
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
  (e: "print"): void;
}>();

const showStepBadge = ref(true);
const filterType = ref<"all" | "wrong">("all");

const hasSteps = computed(() => {
  return Array.isArray(props.steps) && props.steps.length > 0;
});

const resolvedPaperConfig = computed<PaperConfig>(() => {
  if (props.paperConfig) return props.paperConfig;
  const r = props.record;
  return {
    pagesCount: 1,
    rowsPerPage: (r?.rows_per_page ?? r?.rowsPerPage ?? 2) as 2 | 3,
    difficulty: (r?.difficulty ?? "medium") as any,
    symbolType: (r?.symbol_type ?? r?.symbolType ?? "numbers") as any,
    paperTitle: "四宫格数独思维训练",
    paperSubtitle: "培养专注力 · 建立数感 · 锻炼逻辑推理",
    studentName: r?.student_name ?? r?.studentName ?? "",
    studentClass: r?.student_class ?? r?.studentClass ?? "",
    showName: true,
    showClass: true,
    showDate: true,
    showTime: true,
    showScore: true,
    appendAnswerPage: false,
    showAnswers: false,
  };
});

const overviewExamResult = computed<ExamResult | null>(() => {
  if (props.examResult) return props.examResult;
  const r = props.record;
  if (!r) return null;
  const totalHoles = r.total_holes ?? r.totalHoles ?? 0;
  const correctHoles = r.correct_holes ?? r.correctHoles ?? 0;
  return {
    score: r.score ?? 0,
    timeSpent: r.time_spent ?? r.timeSpent ?? 0,
    totalPuzzles: r.total_puzzles ?? r.totalPuzzles ?? (r.puzzles ? r.puzzles.length : 0),
    correctPuzzles: r.correct_puzzles ?? r.correctPuzzles ?? 0,
    totalHoles,
    correctHoles,
    wrongHoles: totalHoles - correctHoles,
    difficulty: (r.difficulty ?? "medium") as any,
    symbolType: (r.symbol_type ?? r.symbolType ?? "numbers") as any,
    studentName: r.student_name ?? r.studentName ?? "",
    studentClass: r.student_class ?? r.studentClass ?? "",
    pagesCount: 1,
    rowsPerPage: (r.rows_per_page ?? r.rowsPerPage ?? 2) as 2 | 3,
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
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
