<template>
  <div>
    <!-- 移动端侧边栏遮罩 -->
    <div
      class="sidebar-backdrop"
      :class="{ active: isOpen }"
      @click="emit('close')"
    ></div>

    <!-- 左侧控制面板 (移动端支持抽屉式滑出) -->
    <aside class="sidebar" :class="{ 'drawer-open': isOpen }">
      <div class="sidebar-header">
        <button
          class="sidebar-close-btn"
          type="button"
          aria-label="关闭"
          @click="emit('close')"
        >
          ✕
        </button>
        <h1>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 12h18" />
            <path d="M12 3v18" />
            <path d="M7 8h.01" />
            <path d="M17 16h.01" />
          </svg>
          设置
        </h1>
      </div>

      <div class="sidebar-body">
        <!-- 规格 -->
        <SpecSection
          :config="config"
          @change-structure="emit('changeStructure')"
        />

        <!-- 卷头 -->
        <LayoutSection :config="config" />

        <!-- 答案 -->
        <AnswerSection :config="config" />
      </div>

      <!-- 底部操作按钮 -->
      <div class="sidebar-footer">
        <div class="footer-btn-row">
          <button
            type="button"
            class="btn btn-primary"
            title="打印试卷或另存为 PDF"
            @click="emit('print')"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
              />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            打印 / PDF
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            title="换一批题目"
            @click="emit('regenerate')"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            换一批
          </button>
        </div>

        <button
          v-if="!isStandalone && canInstall"
          type="button"
          class="btn btn-outline-install"
          title="安装应用"
          @click="promptInstall"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          安装应用
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { PaperConfig } from "../../types/config";
import SpecSection from "./SpecSection.vue";
import LayoutSection from "./LayoutSection.vue";
import AnswerSection from "./AnswerSection.vue";
import { usePWAInstall } from "../../composables/usePWAInstall";

const { canInstall, isStandalone, promptInstall } = usePWAInstall();

defineProps<{
  config: PaperConfig;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "print"): void;
  (e: "regenerate"): void;
  (e: "changeStructure"): void;
}>();
</script>
