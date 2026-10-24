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
          <span class="info-line">{{ displayDateStr }}</span>
        </div>
        <div v-if="config.showTime" class="info-item">
          <span>用时：</span>
          <span class="info-line">{{ formattedSpentTime }}</span>
        </div>
        <div v-if="config.showScore" class="info-item">
          <span>得分：</span>
          <template v-if="examResult">
            <span class="score-handwritten">{{ examResult.score }}分</span>
          </template>
          <template v-else>
            <span class="info-line"></span>
          </template>
        </div>
      </template>
    </div>

    <!-- 卷眉右上角：老师红笔批改大分数 (大字号、鲜艳红字、满分双横线、评语印章，打印贴墙极其亮眼) -->
    <div
      v-if="examResult && !isAnswerSheet && pageIndex === 0"
      class="teacher-grade-badge"
    >
      <div class="teacher-score-wrapper">
        <span class="teacher-score-num">{{ examResult.score }}</span>
        <span class="teacher-score-unit">分</span>
      </div>
      <!-- 经典老师批改红线 (100分专属双横线，其他分数单横线) -->
      <div
        class="teacher-score-lines"
        :class="{ 'is-perfect': examResult.score === 100 }"
      ></div>
      <!-- 老师激励评语章 -->
      <div class="teacher-praise-seal">
        {{ praiseComment }}
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

const displayDateStr = computed(() => {
  if (props.examResult?.createdAt) {
    try {
      const d = new Date(props.examResult.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch {}
  }
  return new Date().toISOString().split("T")[0];
});

const praiseComment = computed(() => {
  if (!props.examResult) return "";
  const s = props.examResult.score;
  if (s === 100) return "💯 满分 · 太棒了!";
  if (s >= 90) return "⭐ 优秀 · 敏捷!";
  if (s >= 80) return "👍 良好 · 棒!";
  if (s >= 60) return "✓ 及格 · 继续努力!";
  return "💪 加油 · 每天进步!";
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
