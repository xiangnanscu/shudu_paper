<template>
  <div class="stat-summary-card">
    <div class="summary-title">📈 我的数独练习档案</div>
    <div class="stat-grid">
      <div class="stat-item">
        <div class="stat-num">{{ stats.totalRecords }}</div>
        <div class="stat-label">练习总次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ stats.maxScore }}</div>
        <div class="stat-label">最高得分</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ stats.avgScore }}</div>
        <div class="stat-label">平均分</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">
          {{ totalTime.num }}<span class="stat-unit">{{ totalTime.unit }}</span>
        </div>
        <div class="stat-label">累计用时</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamStats } from "../../types/record";

const props = defineProps<{
  stats: ExamStats;
}>();

const totalTime = computed(() => {
  const sec = props.stats.totalTimeSpent || 0;
  const mins = Math.round(sec / 60);
  return mins > 0 ? { num: mins, unit: "分钟" } : { num: sec, unit: "秒" };
});
</script>
