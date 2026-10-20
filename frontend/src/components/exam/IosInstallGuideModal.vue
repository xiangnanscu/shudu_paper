<template>
  <div v-if="visible" class="ios-guide-overlay" @click.self="emit('close')">
    <div class="ios-guide-card">
      <div class="ios-guide-header">
        <div class="ios-guide-title-box">
          <span class="ios-guide-icon">📲</span>
          <h3 class="ios-guide-title">安装到 iPad / iPhone 桌面</h3>
        </div>
        <button
          type="button"
          class="ios-guide-close-btn"
          title="关闭"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <p class="ios-guide-desc">
        将本系统添加到主屏幕，即可像原生 App 一样享受无浏览器地址栏的全屏沉浸体验，并支持随时随地离线刷题！
      </p>

      <div class="ios-guide-steps">
        <div class="ios-step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-text">
              点击 Safari 底部或顶部工具栏中的
              <span class="highlight-badge">
                <svg
                  class="safari-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                分享
              </span>
              图标
            </div>
          </div>
        </div>

        <div class="ios-step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <div class="step-text">
              在弹出的操作面板中滑动，找到并选择
              <span class="highlight-badge">
                <svg
                  class="safari-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                添加到主屏幕
              </span>
            </div>
          </div>
        </div>

        <div class="ios-step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <div class="step-text">
              确认名称为“四宫格数独”，点击右上角
              <span class="highlight-badge bold">添加</span>
              完成安装
            </div>
          </div>
        </div>
      </div>

      <div class="ios-features-pill">
        <span>✨ 全屏沉浸</span>
        <span>⚡ 离线可用</span>
        <span>🧩 平板手触优化</span>
      </div>

      <div class="ios-guide-footer">
        <button type="button" class="btn btn-primary btn-full" @click="emit('close')">
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<style scoped>
.ios-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.ios-guide-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideUp 0.25s ease-out;
}

.ios-guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ios-guide-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ios-guide-icon {
  font-size: 1.5rem;
}

.ios-guide-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.ios-guide-close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  line-height: 1;
  transition: all 0.15s ease;
}

.ios-guide-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.ios-guide-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}

.ios-guide-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.ios-step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-content {
  flex: 1;
}

.step-text {
  font-size: 0.9rem;
  color: #1e293b;
  line-height: 1.5;
}

.highlight-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2563eb;
  font-weight: 600;
  vertical-align: baseline;
  margin: 0 2px;
}

.highlight-badge.bold {
  color: #059669;
}

.safari-icon {
  width: 14px;
  height: 14px;
}

.ios-features-pill {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 0.8rem;
  color: #059669;
  font-weight: 600;
  background: #ecfdf5;
  padding: 8px 12px;
  border-radius: 8px;
}

.ios-guide-footer {
  margin-top: 4px;
}

.btn-full {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
