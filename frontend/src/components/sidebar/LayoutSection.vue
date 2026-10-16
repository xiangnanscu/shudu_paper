<template>
  <div class="section-box">
    <div class="section-title">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
      </svg>
      卷头与考生信息
    </div>

    <div class="form-group">
      <label for="paperTitle">试卷主标题</label>
      <input
        id="paperTitle"
        v-model="config.paperTitle"
        type="text"
        class="form-control"
      />
    </div>

    <div class="form-group">
      <label for="paperSubtitle">做题说明 / 规则提示</label>
      <input
        id="paperSubtitle"
        v-model="config.paperSubtitle"
        type="text"
        class="form-control"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="inputStudentName">学生姓名</label>
        <input
          id="inputStudentName"
          v-model="config.studentName"
          type="text"
          class="form-control"
          placeholder="做题人姓名"
        />
      </div>
      <div class="form-group">
        <label for="inputStudentClass">班级</label>
        <input
          id="inputStudentClass"
          v-model="config.studentClass"
          type="text"
          class="form-control"
          placeholder="例如：一年级"
        />
      </div>
    </div>

    <div class="form-group">
      <label>考务信息栏显示</label>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input v-model="config.showName" type="checkbox" /> 姓名
        </label>
        <label class="checkbox-label">
          <input v-model="config.showClass" type="checkbox" /> 班级
        </label>
        <label class="checkbox-label">
          <input v-model="config.showDate" type="checkbox" /> 日期
        </label>
        <label class="checkbox-label">
          <input v-model="config.showTime" type="checkbox" /> 用时
        </label>
        <label class="checkbox-label">
          <input v-model="config.showScore" type="checkbox" /> 得分
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaperConfig } from "../../types/config";

defineProps<{
  config: PaperConfig;
}>();
</script>
