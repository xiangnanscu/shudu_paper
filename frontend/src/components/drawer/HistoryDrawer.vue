<template>
  <div
    class="drawer-backdrop"
    :class="{ active: isOpen }"
    @click.self="emit('close')"
  >
    <div class="wechat-drawer">
      <div class="drawer-header">
        <h2>
          <span>📊</span>
          <span>做题历史与成长档案</span>
        </h2>
        <button
          class="drawer-close-btn"
          type="button"
          aria-label="关闭抽屉"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="drawer-body">
        <!-- 顶部四维统计大卡片 -->
        <StatSummaryCard :stats="stats" />

        <!-- 加载中状态 -->
        <div v-if="loading" class="cloud-loading-state">
          <div class="cloud-spinner"></div>
          <p>正在从云端读取历史做题记录...</p>
        </div>

        <!-- 加载失败状态 -->
        <div v-else-if="loadError" class="record-empty-state" style="color: #ef4444;">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>云端做题记录加载失败</p>
          <p style="font-size: 0.75rem; margin-top: 4px; opacity: 0.7;">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="btn btn-secondary"
            style="margin-top: 10px; font-size: 0.8rem; padding: 6px 14px;"
            @click="emit('reload')"
          >
            重新拉取
          </button>
        </div>

        <!-- 空数据状态 -->
        <div v-else-if="groupedRecords.length === 0" class="record-empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          </svg>
          <p>暂无云端做题记录</p>
          <p style="font-size: 0.75rem; margin-top: 4px; opacity: 0.7;">
            完成试卷并交卷后，记录将实时保存至云端数据库
          </p>
        </div>

        <!-- 历史记录时间线列表 -->
        <TimelineList
          v-else
          :groups="groupedRecords"
          @delete="(id) => emit('delete', id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExamStats } from "../../types/record";
import type { TimelineGroup } from "../../composables/useCloudRecords";
import StatSummaryCard from "./StatSummaryCard.vue";
import TimelineList from "./TimelineList.vue";

defineProps<{
  isOpen: boolean;
  loading: boolean;
  loadError: string | null;
  stats: ExamStats;
  groupedRecords: TimelineGroup[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "reload"): void;
  (e: "delete", id: string): void;
}>();
</script>
