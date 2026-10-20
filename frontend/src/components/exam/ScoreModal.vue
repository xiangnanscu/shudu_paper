<template>
  <div
    class="modal-backdrop"
    :class="{ active: isOpen }"
    @click.self="emit('close')"
  >
    <div v-if="result" class="score-modal">
      <!-- 头部得分与评价 -->
      <div class="score-modal-header">
        <div class="score-modal-trophy">{{ evaluation.trophy }}</div>
        <div class="score-modal-num">
          {{ result.score }}<span>分</span>
        </div>
        <div class="score-modal-eval">{{ evaluation.text }}</div>
      </div>

      <!-- 数据统计区 -->
      <div class="score-modal-body">
        <div class="modal-stats-row">
          <div class="modal-stat-box">
            <div class="val">{{ formattedTime }}</div>
            <div class="lbl">答题用时</div>
          </div>
          <div class="modal-stat-box">
            <div class="val">{{ accuracyRate }}%</div>
            <div class="lbl">答题正确率</div>
          </div>
          <div class="modal-stat-box">
            <div class="val">{{ result.correctHoles }} / {{ result.totalHoles }}</div>
            <div class="lbl">正确格数</div>
          </div>
          <div class="modal-stat-box">
            <div class="val">{{ result.correctPuzzles }} / {{ result.totalPuzzles }}</div>
            <div class="lbl">全对题数</div>
          </div>
        </div>

        <!-- 云端保存状态提示卡 -->
        <div class="cloud-sync-status-card" :class="syncStatus">
          <span>{{ syncStatusText }}</span>
          <button
            v-if="syncStatus === 'error'"
            type="button"
            class="btn-retry-sync"
            @click="emit('retrySync')"
          >
            重试上传
          </button>
        </div>
      </div>

      <!-- 操作按钮组 -->
      <div class="score-modal-footer">
        <button
          type="button"
          class="btn btn-primary"
          @click="emit('close')"
        >
          🔍 查看卷面批改详情
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="emit('restart')"
        >
          ↺ 再做一次这套题
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          @click="emit('regenerate')"
        >
          ⚡ 换一套新试卷
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamResult } from "../../types/exam";
import { formatTime } from "../../composables/useExamTimer";

const props = defineProps<{
  isOpen: boolean;
  result: ExamResult | null;
  syncStatus: "idle" | "syncing" | "success" | "error" | "offline_saved";
  syncError: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "restart"): void;
  (e: "regenerate"): void;
  (e: "retrySync"): void;
}>();

const formattedTime = computed(() => {
  if (!props.result) return "00:00";
  return formatTime(props.result.timeSpent);
});

const accuracyRate = computed(() => {
  if (!props.result || props.result.totalHoles <= 0) return 0;
  return Math.round((props.result.correctHoles / props.result.totalHoles) * 100);
});

const evaluation = computed(() => {
  const score = props.result?.score ?? 0;
  if (score === 100) {
    return {
      trophy: "🏆",
      text: "🎉 太棒了！全部正确，数独逻辑小天才！",
    };
  } else if (score >= 90) {
    return {
      trophy: "🌟",
      text: "非常优秀！思维敏捷，解题神速！",
    };
  } else if (score >= 80) {
    return {
      trophy: "🎖️",
      text: "真不错！稍加细心就能拿满分！",
    };
  } else if (score >= 60) {
    return {
      trophy: "👍",
      text: "及格啦！多加练习会越来越厉害！",
    };
  } else {
    return {
      trophy: "💪",
      text: "继续加油！仔细检查每一行每一列哦！",
    };
  }
});

const syncStatusText = computed(() => {
  switch (props.syncStatus) {
    case "syncing":
      return "⏳ 正在同步保存到云端数据库...";
    case "success":
      return "☁️ 成绩已成功保存至云端数据库";
    case "offline_saved":
      return "💾 离线模式：成绩已安全暂存本机，连网后将自动同步";
    case "error":
      return "⚠️ 云端保存失败，请检查网络连接";
    default:
      return "";
  }
});
</script>
