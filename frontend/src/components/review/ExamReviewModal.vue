<template>
  <div
    v-if="isOpen"
    class="review-backdrop"
    @click.self="emit('close')"
  >
    <div class="review-modal">
      <!-- 头部：考务看板与操作栏 -->
      <div class="review-header">
        <div class="review-header-left">
          <!-- 分数徽章 -->
          <div
            v-if="record"
            class="review-score-badge"
            :class="scoreBadgeClass"
          >
            {{ record.score }}
          </div>

          <div class="review-info-main">
            <div class="review-title-row">
              <h3>试卷复盘与作答详情</h3>
              <span v-if="record" class="review-tag">
                {{ difficultyText }}
              </span>
            </div>

            <div v-if="record" class="review-meta-row">
              <span>共 {{ record.total_puzzles ?? record.totalPuzzles ?? record.puzzles.length }} 题</span>
              <span>·</span>
              <span>全对 {{ record.correct_puzzles ?? record.correctPuzzles ?? 0 }} 题</span>
              <span>·</span>
              <span>做对 {{ record.correct_holes ?? record.correctHoles ?? 0 }}/{{ record.total_holes ?? record.totalHoles ?? 0 }} 空</span>
              <span>·</span>
              <span>用时 {{ formattedDuration }}</span>
              <span>·</span>
              <span>{{ createdTimeStr }}</span>
            </div>
          </div>
        </div>

        <div class="review-header-actions">
          <button
            v-if="record"
            type="button"
            class="btn-print-review-exam"
            title="直接打印老师批改样式的试卷，可贴在墙上激励孩子"
            @click="emit('print', record)"
          >
            🖨️ 打印批改试卷
          </button>
          <button
            v-if="record"
            type="button"
            class="btn-redo-exam"
            @click="emit('redo', record)"
          >
            ↺ 重做此试卷
          </button>
          <button
            type="button"
            class="review-close-btn"
            aria-label="关闭"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Tab 切换分段器 -->
      <div v-if="record && !loading" class="review-tabs-bar">
        <div class="review-nav-tabs">
          <button
            type="button"
            class="review-tab-btn"
            :class="{ active: currentTab === 'overview' }"
            @click="currentTab = 'overview'"
          >
            <span>📑 试卷作答总览</span>
          </button>
          <button
            type="button"
            class="review-tab-btn"
            :class="{ active: currentTab === 'player' }"
            @click="currentTab = 'player'"
          >
            <span>⏱️ 填数步骤推演回放</span>
            <span
              v-if="record.steps && record.steps.length > 0"
              style="font-size: 0.75rem; background: #e0e7ff; color: #3730a3; padding: 1px 6px; border-radius: 10px;"
            >
              {{ record.steps.length }}步
            </span>
          </button>
        </div>

        <div style="font-size: 0.8rem; color: #64748b;">
          💡 帮助孩子逐题剖析推导过程，精准击破逻辑难点
        </div>
      </div>

      <!-- 内容主体区 -->
      <div class="review-content">
        <!-- 加载中状态 -->
        <div v-if="loading" style="text-align: center; padding: 60px 20px;">
          <div class="cloud-spinner" style="margin: 0 auto 16px;"></div>
          <p style="color: #64748b; font-size: 0.9rem;">正在载入试卷完整题目与作答轨迹...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="loadError" style="text-align: center; padding: 50px 20px; color: #dc2626;">
          <p>⚠️ {{ loadError }}</p>
          <button
            type="button"
            class="btn btn-secondary"
            style="margin-top: 12px;"
            @click="emit('close')"
          >
            关闭
          </button>
        </div>

        <!-- 无效数据状态 -->
        <div v-else-if="!record || !record.puzzles || record.puzzles.length === 0" style="text-align: center; padding: 50px 20px; color: #64748b;">
          <p>未获取到该试卷的题目数据</p>
        </div>

        <!-- 视图 A：试卷总览 -->
        <ReviewPaperOverview
          v-else-if="currentTab === 'overview'"
          :puzzles="record.puzzles"
          :user-answers="record.userAnswers"
          :steps="record.steps"
          :symbol-map="symbolMap"
          :corrected-puzzle-ids="correctedPuzzleIds"
          :record="record"
          :paper-config="paperConfig"
          :exam-result="examResult"
          @inspect-puzzle="handleInspectPuzzle"
          @redo-puzzle="(puzzle) => emit('redoPuzzle', puzzle)"
          @print="emit('print', record)"
        />

        <!-- 视图 B：步骤推演播放器 -->
        <ReviewStepPlayer
          v-else-if="currentTab === 'player'"
          :puzzles="record.puzzles"
          :steps="record.steps"
          :symbol-map="symbolMap"
          :initial-puzzle-id="inspectingPuzzleId"
          @redo-puzzle="(puzzle) => emit('redoPuzzle', puzzle)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ExamRecordDetail } from "../../types/record";
import type { SudokuPuzzle } from "../../types/sudoku";
import type { PaperConfig } from "../../types/config";
import type { ExamResult } from "../../types/exam";
import ReviewPaperOverview from "./ReviewPaperOverview.vue";
import ReviewStepPlayer from "./ReviewStepPlayer.vue";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    loading: boolean;
    loadError: string | null;
    record: ExamRecordDetail | null;
    symbolMap: Record<number, string>;
    correctedPuzzleIds?: Set<number>;
    paperConfig?: PaperConfig;
    examResult?: ExamResult | null;
  }>(),
  {
    correctedPuzzleIds: () => new Set<number>(),
    paperConfig: undefined,
    examResult: undefined,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "redo", record: ExamRecordDetail): void;
  (e: "redoPuzzle", puzzle: SudokuPuzzle): void;
  (e: "print", record: ExamRecordDetail): void;
}>();

const currentTab = ref<"overview" | "player">("overview");
const inspectingPuzzleId = ref<number>(0);

// 打开弹窗或重置时默认总览
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      currentTab.value = "overview";
      inspectingPuzzleId.value = 0;
    }
  }
);

function handleInspectPuzzle(puzzleId: number) {
  inspectingPuzzleId.value = puzzleId;
  currentTab.value = "player";
}

const scoreBadgeClass = computed(() => {
  if (!props.record) return "score-mid";
  const s = props.record.score;
  if (s === 100) return "score-perfect";
  if (s >= 90) return "score-high";
  if (s >= 60) return "score-mid";
  return "score-low";
});

const difficultyText = computed(() => {
  if (!props.record) return "数独练习";
  const diffLabels: Record<string, string> = {
    easy: "简单 (基础唯余)",
    medium: "适中 (综合进阶)",
    hard: "困难 (深度推演)",
    mixed_page: "阶梯递进",
    random: "随机练习",
    starter: "入门级 (13-14数)",
    medium_hypo_direct: "中级假设·直接排除",
    medium_hypo_deep: "中级假设·深度尝试",
    medium_hypo_mixed: "中级假设·综合专项",
  };
  return diffLabels[props.record.difficulty] || "数独练习";
});

const formattedDuration = computed(() => {
  if (!props.record) return "0秒";
  const sec = props.record.time_spent ?? props.record.timeSpent ?? 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
});

const createdTimeStr = computed(() => {
  if (!props.record) return "";
  const raw = props.record.created_at || props.record.createdAt;
  if (!raw) return "";
  const d = new Date(raw);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
});
</script>
