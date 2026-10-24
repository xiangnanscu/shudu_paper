<template>
  <div class="paper-header">
    <div class="paper-title">
      {{ config.paperTitle }}<template v-if="isAnswerSheet"> · 参考答案</template>
    </div>
    <div class="paper-subtitle">
      <template v-if="isAnswerSheet">
        (对照第 {{ pageIndex + 1 }} 页试题进行自测、批改与复盘，浅色标注位为标准答案)
      </template>
      <template v-else>
        {{ config.paperSubtitle }}
      </template>
    </div>

    <!-- 考务信息栏 -->
    <div v-if="hasAnyInfo" class="paper-info-bar">
      <template v-if="isAnswerSheet">
        <div class="info-item">
          <span>校对页：</span>
          <span class="info-line wide">第 {{ pageIndex + 1 }} 页对应答案</span>
        </div>
        <div class="info-item">
          <span>班级：</span>
          <span class="info-line">{{ displayStudentClass }}</span>
        </div>
        <div class="info-item">
          <span>姓名：</span>
          <span class="info-line">{{ displayStudentName }}</span>
        </div>
      </template>

      <template v-else>
        <div v-if="config.showClass" class="info-item">
          <span>班级：</span>
          <span class="info-line">{{ displayStudentClass }}</span>
        </div>
        <div v-if="config.showName" class="info-item">
          <span>姓名：</span>
          <span class="info-line">{{ displayStudentName }}</span>
        </div>
        <div v-if="config.showDate" class="info-item">
          <span>日期：</span>
          <span class="info-line date-line">{{ displayDateStr }}</span>
        </div>
        <div v-if="config.showTime" class="info-item">
          <span>用时：</span>
          <span class="info-line time-line">{{ formattedSpentTime }}</span>
        </div>
        <!-- 得分：仅在未批改的空白试卷上展示供线下手写打分的下划线；已交卷批改后由右上角大红分呈现，避免空间拥挤和文字遮挡 -->
        <div v-if="config.showScore && !examResult" class="info-item">
          <span>得分：</span>
          <span class="info-line"></span>
        </div>
      </template>
    </div>

    <!-- 卷眉右上角：老师红笔批改大分数 (大字号手写感红字、潇洒手绘双横线、评语小印章，位置独立于考务栏) -->
    <div
      v-if="examResult && !isAnswerSheet && pageIndex === 0"
      class="teacher-grade-badge"
    >
      <!-- 老师激励评语章 (斜斜盖在大分左侧，如同一枚红色小印章) -->
      <div class="teacher-praise-seal">
        <span class="seal-text">{{ praiseComment }}</span>
      </div>

      <!-- 大红分主体与手绘横线 -->
      <div class="teacher-score-block">
        <div class="teacher-score-wrapper">
          <span class="teacher-score-num">{{ examResult.score }}</span>
          <span class="teacher-score-unit">分</span>
        </div>
        <!-- 老师红笔潇洒手绘双横线 (不论分数高低，老师批卷打分下方均划两条红线定分) -->
        <svg
          class="teacher-lines-svg"
          viewBox="0 0 100 16"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 2 4 C 28 2, 65 6, 98 3"
            fill="none"
            stroke="#dc2626"
            stroke-width="3.2"
            stroke-linecap="round"
          />
          <path
            d="M 6 12 C 32 10, 72 14, 96 11"
            fill="none"
            stroke="#dc2626"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PaperConfig } from "../../types/config";
import type { ExamResult } from "../../types/exam";

const props = withDefaults(
  defineProps<{
    config: PaperConfig;
    pageIndex: number;
    isAnswerSheet?: boolean;
    examResult: ExamResult | null;
  }>(),
  {
    isAnswerSheet: false,
  }
);

const displayStudentName = computed(() => {
  return props.examResult?.studentName || props.config.studentName || "";
});

const displayStudentClass = computed(() => {
  return props.examResult?.studentClass || props.config.studentClass || "";
});

/**
 * 格式化为中文年月日格式，如：2026年10月24日
 */
function formatToChineseDate(dateInput?: string | null): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
  }
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日`;
}

const displayDateStr = computed(() => {
  return formatToChineseDate(props.examResult?.createdAt);
});

const praiseComment = computed(() => {
  if (!props.examResult) return "";
  const s = props.examResult.score;
  if (s === 100) return "满分 · 太棒了!";
  if (s >= 90) return "优秀 · 敏捷!";
  if (s >= 80) return "良好 · 棒!";
  if (s >= 60) return "及格 · 继续努力!";
  return "加油 · 每天进步!";
});

const hasAnyInfo = computed(() => {
  if (props.isAnswerSheet) return true;
  return (
    props.config.showName ||
    props.config.showClass ||
    props.config.showDate ||
    props.config.showTime ||
    props.config.showScore
  );
});

const formattedSpentTime = computed(() => {
  if (!props.examResult) return "";
  const sec = props.examResult.timeSpent;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
});
</script>
