<template>
  <div class="review-overview-container">
    <!-- 老师批改试卷抬头卡片 (真实考卷质感，大红分数、姓名班级、双横线与评语印章) -->
    <div v-if="record" class="review-teacher-header-card">
      <div class="review-paper-header-left">
        <div class="review-paper-title">
          {{ displayTitle }}
        </div>
        <div class="review-paper-meta-items">
          <div v-if="record.student_class || record.studentClass" class="paper-meta-col">
            <span class="meta-col-lbl">班级：</span>
            <span class="meta-col-val">{{ record.student_class || record.studentClass }}</span>
          </div>
          <div v-if="record.student_name || record.studentName" class="paper-meta-col">
            <span class="meta-col-lbl">姓名：</span>
            <span class="meta-col-val">{{ record.student_name || record.studentName }}</span>
          </div>
          <div class="paper-meta-col">
            <span class="meta-col-lbl">日期：</span>
            <span class="meta-col-val">{{ displayDate }}</span>
          </div>
          <div class="paper-meta-col">
            <span class="meta-col-lbl">用时：</span>
            <span class="meta-col-val">{{ formattedDuration }}</span>
          </div>
        </div>
      </div>

      <!-- 右上角老师批改大红分 (大字号、满分双横线、评语印章) -->
      <div class="review-teacher-score-stamp">
        <div class="review-score-num-box">
          <span class="review-score-val">{{ record.score }}</span>
          <span class="review-score-unit">分</span>
        </div>
        <!-- 经典红线 (满分双横线) -->
        <div
          class="review-score-lines"
          :class="{ 'is-perfect': record.score === 100 }"
        ></div>
        <div class="review-score-praise">
          {{ praiseComment }}
        </div>
      </div>
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
import type { UserAnswers, AnswerStep } from "../../types/exam";
import type { ExamRecordDetail } from "../../types/record";
import SudokuCard from "../paper/SudokuCard.vue";

const props = withDefaults(
  defineProps<{
    puzzles: SudokuPuzzle[];
    userAnswers: UserAnswers;
    steps?: AnswerStep[];
    symbolMap: Record<number, string>;
    correctedPuzzleIds?: Set<number>;
    record?: ExamRecordDetail | null;
  }>(),
  {
    steps: () => [],
    correctedPuzzleIds: () => new Set<number>(),
    record: null,
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

const displayTitle = computed(() => {
  const diffLabels: Record<string, string> = {
    starter: "入门级 (13-14数)",
    easy: "初级 (9-12数)",
    medium: "中级 (6-8数)",
    medium_hypo_direct: "中级假设专项训练卷",
    medium_hypo_deep: "中级假设·深度尝试训练卷",
    medium_hypo_mixed: "中级假设·综合专项训练卷",
    hard: "高级 (4-5数) 挑战卷",
    mixed_page: "阶梯递进训练卷",
    random: "随机混合数独卷",
  };
  const diff = props.record?.difficulty || "";
  return `四宫格数独 · ${diffLabels[diff] || "练习卷"} · 批改详情`;
});

const displayDate = computed(() => {
  const raw = props.record?.created_at || props.record?.createdAt;
  if (!raw) return "";
  try {
    const d = new Date(raw);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  } catch {
    return "";
  }
});

const formattedDuration = computed(() => {
  if (!props.record) return "0秒";
  const sec = props.record.time_spent ?? props.record.timeSpent ?? 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
});

const praiseComment = computed(() => {
  if (!props.record) return "";
  const s = props.record.score;
  if (s === 100) return "💯 满分 · 太棒了!";
  if (s >= 90) return "⭐ 优秀 · 敏捷!";
  if (s >= 80) return "👍 良好 · 棒!";
  if (s >= 60) return "✓ 及格 · 继续努力!";
  return "💪 加油 · 每天进步!";
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
