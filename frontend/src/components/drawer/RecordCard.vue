<template>
  <div class="record-card">
    <div class="record-left">
      <!-- 微信小程序风格彩色分数圈 -->
      <div class="score-circle" :class="scoreCircleClass">
        {{ record.score }}
      </div>

      <div class="record-details">
        <div class="record-title">
          <span>{{ difficultyText }}</span>
          <span class="cloud-tag">☁️ 云端已同步</span>
        </div>
        <div class="record-meta">
          <span>{{ record.total_puzzles ?? record.totalPuzzles ?? 0 }} 题</span>
          <span>·</span>
          <span>用时 {{ formattedDuration }}</span>
          <span>·</span>
          <span>{{ timeStr }}</span>
        </div>
      </div>
    </div>

    <div class="record-actions">
      <button
        type="button"
        class="btn-record-action btn-del"
        title="删除此条记录"
        @click="emit('delete', record.id)"
      >
        删除
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
  (e: "delete", id: string): void;
}>();

const scoreCircleClass = computed(() => {
  const s = props.record.score;
  if (s === 100) return "score-perfect";
  if (s >= 90) return "score-high";
  if (s >= 60) return "score-mid";
  return "score-low";
});

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
