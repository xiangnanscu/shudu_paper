<template>
  <div class="top-exam-bar" :class="`is-${examStatus}`">
    <!-- 状态 1：ready (待开始) -->
    <!-- 纯粹准备态：
         左侧：⚙️ 设置（移动端抽屉唤起入口）、📄 卷面/📱 单题 视图切换
         右侧：📊 记录、▶ 开始做题（醒目蓝色 CTA）
         彻底移除：00:00、待开始标签、未开始的进度条、安装按钮 -->
    <template v-if="examStatus === 'ready'">
      <div class="topbar-group topbar-group-left">
        <button
          class="topbar-btn topbar-btn-sidebar"
          type="button"
          title="打开出题与排版设置"
          @click="emit('openSidebar')"
        >
          <span>⚙️ 设置</span>
        </button>

        <button
          class="topbar-btn"
          type="button"
          :title="viewMode === 'single' ? '切换为 A4 整卷排版预览' : '切换为单题专注做题'"
          @click="emit('toggleViewMode')"
        >
          <span>{{ viewMode === 'single' ? '📄 卷面' : '📱 单题' }}</span>
        </button>
      </div>

      <div class="topbar-group topbar-group-right">
        <button
          class="topbar-btn"
          type="button"
          title="查看做题历史记录与统计"
          @click="emit('openDrawer')"
        >
          <span>📊 记录</span>
        </button>

        <button
          class="topbar-btn topbar-btn-primary"
          type="button"
          @click="emit('startExam')"
        >
          <span>▶ 开始做题</span>
        </button>
      </div>
    </template>

    <!-- 状态 2：doing (在线作答中) -->
    <!-- 纯粹沉浸态：
         左侧：📄 卷面/📱 单题 切换、⏱️ 实时等宽跳动计时器、紧凑做题进度指示
         右侧：✓ 交卷评分（翡翠绿主操作）
         彻底隐藏：设置、做题记录、安装按钮、“在线作答中”无意义文字标签
         全屏专注，单行无折行！ -->
    <template v-else-if="examStatus === 'doing'">
      <div class="topbar-group topbar-group-left">
        <button
          class="topbar-btn"
          type="button"
          :title="viewMode === 'single' ? '切换为 A4 整卷排版预览' : '切换为单题专注做题'"
          @click="emit('toggleViewMode')"
        >
          <span>{{ viewMode === 'single' ? '📄 卷面' : '📱 单题' }}</span>
        </button>

        <!-- 实时计时器 (等宽数字、清爽微蓝药丸，与按钮高度严格对齐) -->
        <div class="topbar-timer-pill" title="答题累计用时">
          <span class="timer-icon">⏱️</span>
          <span class="timer-digits">{{ formattedTime }}</span>
        </div>

        <!-- 紧凑单行进度条 (已填 12/24) -->
        <div class="topbar-progress-pill" title="整卷填空完成度">
          <span class="progress-label">{{ filledCount }}/{{ totalHoles }}</span>
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="topbar-group topbar-group-right">
        <button
          class="topbar-btn topbar-btn-submit"
          type="button"
          @click="emit('submitExam')"
        >
          <span>✓ 交卷评分</span>
        </button>
      </div>
    </template>

    <!-- 状态 3：submitted (已交卷批改) -->
    <!-- 复盘评价态：
         左侧：⚙️ 设置、📄 卷面/📱 单题 切换、⏱️ 本次答题总耗时
         右侧：🖨️ 打印批改卷、↺ 重新作答、📊 记录 -->
    <template v-else-if="examStatus === 'submitted'">
      <div class="topbar-group topbar-group-left">
        <button
          class="topbar-btn topbar-btn-sidebar"
          type="button"
          title="打开出题与排版设置"
          @click="emit('openSidebar')"
        >
          <span>⚙️ 设置</span>
        </button>

        <button
          class="topbar-btn"
          type="button"
          :title="viewMode === 'single' ? '切换为 A4 整卷排版预览' : '切换为单题专注做题'"
          @click="emit('toggleViewMode')"
        >
          <span>{{ viewMode === 'single' ? '📄 卷面' : '📱 单题' }}</span>
        </button>

        <div class="topbar-timer-pill is-finished" title="本次答题总耗时">
          <span class="timer-icon">⏱️</span>
          <span class="timer-digits">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="topbar-group topbar-group-right">
        <button
          class="topbar-btn topbar-btn-print"
          type="button"
          title="打印老师批改样式的试卷，可贴在墙上激励孩子"
          @click="emit('printExam')"
        >
          <span>🖨️ 打印批改卷</span>
        </button>

        <button
          class="topbar-btn"
          type="button"
          title="重新作答当前试卷"
          @click="emit('restartExam')"
        >
          <span>↺ 重做</span>
        </button>

        <button
          class="topbar-btn"
          type="button"
          title="查看做题历史记录与统计"
          @click="emit('openDrawer')"
        >
          <span>📊 记录</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamStatus } from "../../types/exam";

const props = withDefaults(
  defineProps<{
    examStatus: ExamStatus;
    formattedTime: string;
    filledCount: number;
    totalHoles: number;
    viewMode?: "single" | "paper";
  }>(),
  {
    viewMode: "single",
  }
);

const emit = defineEmits<{
  (e: "openSidebar"): void;
  (e: "startExam"): void;
  (e: "submitExam"): void;
  (e: "restartExam"): void;
  (e: "openDrawer"): void;
  (e: "toggleViewMode"): void;
  (e: "printExam"): void;
}>();

const progressPercentage = computed(() => {
  if (props.totalHoles <= 0) return 0;
  return Math.min(100, Math.round((props.filledCount / props.totalHoles) * 100));
});
</script>
