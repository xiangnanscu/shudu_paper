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
          <span class="info-line">{{ config.studentClass || "" }}</span>
        </div>
        <div class="info-item">
          <span>姓名：</span>
          <span class="info-line">{{ config.studentName || "" }}</span>
        </div>
      </template>

      <template v-else>
        <div v-if="config.showClass" class="info-item">
          <span>班级：</span>
          <span class="info-line">{{ config.studentClass || "" }}</span>
        </div>
        <div v-if="config.showName" class="info-item">
          <span>姓名：</span>
          <span class="info-line">{{ config.studentName || "" }}</span>
        </div>
        <div v-if="config.showDate" class="info-item">
          <span>日期：</span>
          <span class="info-line">{{ currentDateStr }}</span>
        </div>
        <div v-if="config.showTime" class="info-item">
          <span>用时：</span>
          <span class="info-line">{{ formattedSpentTime }}</span>
        </div>
        <div v-if="config.showScore" class="info-item">
          <span>得分：</span>
          <template v-if="examResult">
            <span class="score-stamp">💯 {{ examResult.score }}分</span>
          </template>
          <template v-else>
            <span class="info-line"></span>
          </template>
        </div>
      </template>
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

const currentDateStr = computed(() => {
  return new Date().toISOString().split("T")[0];
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
