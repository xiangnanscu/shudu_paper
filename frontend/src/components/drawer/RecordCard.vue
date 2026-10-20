<template>
  <div class="record-card" @click="emit('viewDetail', record.id)">
    <div class="record-main">
      <!-- 微信小程序风格彩色分数圈 -->
      <div class="score-circle" :class="scoreCircleClass">
        <span class="score-num">{{ record.score }}</span>
        <span class="score-unit">分</span>
      </div>

      <div class="record-info">
        <div class="record-title">
          <span class="record-name">{{ difficultyText }}</span>
          <span class="cloud-tag">☁️ 云端已同步</span>
        </div>
        <div class="record-meta">
          <span>{{ totalPuzzles }} 题</span>
          <i class="meta-dot"></i>
          <span>用时 {{ formattedDuration }}</span>
          <i class="meta-dot"></i>
          <span class="meta-time">{{ timeStr }}</span>
        </div>
      </div>
    </div>

    <!-- 底部操作区：与内容分隔，避免按钮与文字挤压 -->
    <div class="record-footer" @click.stop>
      <!-- 做错的试卷高亮提供重做错卷按钮 -->
      <button
        v-if="isWrongExam"
        type="button"
        class="btn-record-redo"
        title="重新挑战此套做错的试卷"
        @click="emit('redo', record.id)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7"></path>
          <polyline points="3 4 3 9 8 9"></polyline>
        </svg>
        重新挑战
      </button>

      <button
        type="button"
        class="btn-record-view"
        title="查看试卷详情与步骤复盘"
        @click="emit('viewDetail', record.id)"
      >
        查看复盘
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 6 15 12 9 18"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamRecordEntity } from "../../types/record";

const props = defineProps<{
  record: ExamRecordEntity;
}>();

const emit = defineEmits<{
  (e: "viewDetail", recordId: string): void;
  (e: "redo", recordId: string): void;
}>();

const isWrongExam = computed(() => {
  if (props.record.score < 100) return true;
  const tot = props.record.total_puzzles ?? props.record.totalPuzzles;
  const cor = props.record.correct_puzzles ?? props.record.correctPuzzles;
  if (tot !== undefined && cor !== undefined && cor < tot) return true;
  return false;
});

const scoreCircleClass = computed(() => {
  const s = props.record.score;
  if (s === 100) return "score-perfect";
  if (s >= 90) return "score-high";
  if (s >= 60) return "score-mid";
  return "score-low";
});

const totalPuzzles = computed(
  () => props.record.total_puzzles ?? props.record.totalPuzzles ?? 0
);

const difficultyText = computed(() => {
  const diffLabels: Record<string, string> = {
    starter: "入门级 (13-14数)",
    easy: "初级 (9-12数)",
    medium: "中级 (6-8数)",
    medium_hypo_direct: "中级假设·直接排除",
    medium_hypo_deep: "中级假设·深度尝试",
    medium_hypo_mixed: "中级假设·综合专项",
    hard: "高级 (4-5数)",
    mixed_page: "阶梯递进",
    random: "随机混合",
  };
  return diffLabels[props.record.difficulty] || "数独练习";
});

const formattedDuration = computed(() => {
  const sec = props.record.time_spent ?? props.record.timeSpent ?? 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
});

const timeStr = computed(() => {
  const raw = props.record.created_at || props.record.createdAt;
  if (!raw) return "";
  const d = new Date(raw);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
});
</script>
