<template>
  <div class="top-exam-bar">
    <div class="exam-info-group">
      <!-- 移动端侧边栏切换按钮 -->
      <button
        class="btn-mobile-sidebar"
        type="button"
        title="设置试卷参数"
        @click="emit('openSidebar')"
      >
        <span>⚙️ 设置</span>
      </button>

      <!-- 做题状态胶囊 -->
      <div class="exam-status-badge" :class="statusBadgeClass">
        <span>{{ statusIcon }}</span>
        <span>{{ statusText }}</span>
      </div>

      <!-- 实时计时器 -->
      <div class="exam-timer" title="答题累计用时">
        <span>⏱️</span>
        <span>{{ formattedTime }}</span>
      </div>

      <!-- 答题进度 -->
      <div class="exam-progress">
        <span>已填 {{ filledCount }}/{{ totalHoles }}</span>
        <div class="exam-progress-bar-bg">
          <div
            class="exam-progress-bar-fill"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 考务操作按钮组 -->
    <div class="exam-actions-group">
      <!-- 待开始状态显示“开始做题” -->
      <button
        v-if="examStatus === 'ready'"
        class="btn-start-exam"
        type="button"
        @click="emit('startExam')"
      >
        <span>▶ 开始做题</span>
      </button>

      <!-- 作答中状态显示“交卷评分” -->
      <button
        v-else-if="examStatus === 'doing'"
        class="btn-submit-exam"
        type="button"
        @click="emit('submitExam')"
      >
        <span>✓ 交卷评分</span>
      </button>

      <!-- 已提交批改状态显示“再做一次” -->
      <button
        v-else-if="examStatus === 'submitted'"
        class="btn btn-secondary"
        type="button"
        @click="emit('restartExam')"
      >
        <span>↺ 重新作答</span>
      </button>

      <!-- PWA 安装按钮 (仅在非 Standalone 且可安装时显示) -->
      <button
        v-if="!isStandalone && canInstall"
        class="btn-install-pwa"
        type="button"
        title="安装应用到平板或电脑桌面"
        @click="promptInstall"
      >
        <span>📥 安装</span>
      </button>

      <!-- 历史记录侧栏按钮 -->
      <button
        class="btn-drawer-toggle"
        type="button"
        title="查看历史答题记录与统计"
        @click="emit('openDrawer')"
      >
        <span>📊 记录</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamStatus } from "../../types/exam";
import { usePWAInstall } from "../../composables/usePWAInstall";

const { canInstall, isStandalone, promptInstall } = usePWAInstall();

const props = defineProps<{
  examStatus: ExamStatus;
  formattedTime: string;
  filledCount: number;
  totalHoles: number;
}>();

const emit = defineEmits<{
  (e: "openSidebar"): void;
  (e: "startExam"): void;
  (e: "submitExam"): void;
  (e: "restartExam"): void;
  (e: "openDrawer"): void;
}>();

const statusBadgeClass = computed(() => {
  return `status-${props.examStatus}`;
});

const statusIcon = computed(() => {
  switch (props.examStatus) {
    case "ready":
      return "⏸️";
    case "doing":
      return "📝";
    case "submitted":
      return "✅";
  }
});

const statusText = computed(() => {
  switch (props.examStatus) {
    case "ready":
      return "待开始";
    case "doing":
      return "在线作答中";
    case "submitted":
      return "已交卷·已批改";
  }
});

const progressPercentage = computed(() => {
  if (props.totalHoles <= 0) return 0;
  return Math.min(100, Math.round((props.filledCount / props.totalHoles) * 100));
});
</script>
