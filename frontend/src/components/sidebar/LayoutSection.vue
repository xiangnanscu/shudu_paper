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
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      卷头
    </div>

    <div class="form-group">
      <label for="paperTitle">🏷️ 主标题</label>
      <input
        id="paperTitle"
        v-model="config.paperTitle"
        type="text"
        class="form-control"
      />
    </div>

    <div class="form-group">
      <label for="paperSubtitle">💬 说明</label>
      <input
        id="paperSubtitle"
        v-model="config.paperSubtitle"
        type="text"
        class="form-control"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="inputStudentName">👤 姓名</label>
        <input
          id="inputStudentName"
          v-model="config.studentName"
          type="text"
          class="form-control"
          placeholder="姓名"
        />
      </div>
      <div class="form-group">
        <label for="inputStudentClass">🏫 班级</label>
        <input
          id="inputStudentClass"
          v-model="config.studentClass"
          type="text"
          class="form-control"
          placeholder="班级"
        />
      </div>
    </div>

    <div class="form-group">
      <label>📋 信息栏</label>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input v-model="config.showName" type="checkbox" /> 👤 姓名
        </label>
        <label class="checkbox-label">
          <input v-model="config.showClass" type="checkbox" /> 🏫 班级
        </label>
        <label class="checkbox-label">
          <input v-model="config.showDate" type="checkbox" /> 📅 日期
        </label>
        <label class="checkbox-label">
          <input v-model="config.showTime" type="checkbox" /> ⏱️ 用时
        </label>
        <label class="checkbox-label">
          <input v-model="config.showScore" type="checkbox" /> 💯 得分
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
