<template>
  <div class="training-container">
    <!-- 顶部状态导航栏 (针对移动端自适应分层，桌面端平铺一行) -->
    <header class="training-header">
      <div class="training-header-top-row">
        <button
          type="button"
          class="btn-back-paper"
          title="返回主试卷模式"
          @click="emit('backToPaper')"
        >
          <span>← 试卷模式</span>
        </button>

        <div class="training-header-right">
          <!-- 连胜统计 -->
          <div class="training-stat-badge streak-badge" title="当前连续答对题数">
            <span>🔥</span>
            <span>连对 {{ stats.currentStreak }}</span>
          </div>

          <!-- 星星奖励 -->
          <div class="training-stat-badge star-badge" title="累计获得思维之星">
            <span>⭐</span>
            <span>{{ stats.stars }}</span>
          </div>

          <!-- 小百科教程入口 -->
          <button
            type="button"
            class="btn-tutorial-open"
            title="查看唯余与摒除技巧图解"
            @click="isTutorialOpen = true"
          >
            <span>📖</span>
            <span>小百科</span>
          </button>
        </div>
      </div>

      <!-- 技巧分类选择胶囊 (移动端第二行全宽平铺，桌面端自然排列在中间) -->
      <div class="training-mode-pills">
        <button
          type="button"
          class="mode-pill-btn"
          :class="{ active: mode === 'naked' }"
          @click="switchMode('naked')"
        >
          🔍 唯余专项
        </button>
        <button
          type="button"
          class="mode-pill-btn"
          :class="{ active: mode === 'hidden' }"
          @click="switchMode('hidden')"
        >
          ⚡ 摒除专项
        </button>
        <button
          type="button"
          class="mode-pill-btn"
          :class="{ active: mode === 'mixed' }"
          @click="switchMode('mixed')"
        >
          🎯 综合实战
        </button>
      </div>
    </header>

    <!-- 训练主体区域 -->
    <main class="training-main">
      <!-- 题目说明与符号切换栏 -->
      <div class="training-task-card">
        <div class="task-card-info">
          <div
            class="task-tag"
            :class="currentQuestion?.technique === 'naked_single' ? 'tag-naked' : 'tag-hidden'"
          >
            {{ currentQuestion?.technique === 'naked_single' ? '🔍 唯余法训练' : '⚡ 摒除法训练' }}
          </div>
          <div class="task-title-text">
            {{ taskTitle }}
          </div>
        </div>

        <!-- 符号快速切换器 -->
        <div class="task-symbol-selector" title="切换题型符号">
          <button
            v-for="sym in availableSymbols"
            :key="sym.key"
            type="button"
            class="symbol-tab-btn"
            :class="{ active: symbolType === sym.key }"
            :title="sym.label"
            @click="switchSymbolType(sym.key)"
          >
            {{ sym.icon }}
          </button>
        </div>
      </div>

      <!-- 答对轻量提示横幅 (绝不遮挡题盘，方便孩子仔细复盘) -->
      <div v-if="isCorrect" class="success-floating-banner">
        <span>🎉</span>
        <span>太棒啦！锁定正解！可查看下方复盘提示</span>
      </div>

      <!-- 4x4 生动数独盘面 (绝无全屏遮挡，支持唯余三色流光与摒除激光) -->
      <TrainingBoard
        v-if="currentQuestion"
        :question="currentQuestion"
        :hint-level="hintLevel"
        :user-val="userSelectedVal"
        :is-correct="isCorrect"
        :is-wrong-shake="isWrongShake"
        :symbol-map="currentSymbolMap"
        @select-target="handleSelectTarget"
      />

      <!-- 生动形象的分级引导与复盘卡片 -->
      <TrainingHintCard
        v-if="currentQuestion"
        :question="currentQuestion"
        :hint-level="hintLevel"
        :symbol-map="currentSymbolMap"
        :is-correct="isCorrect"
      />

      <!-- 底部输入与操作区 -->
      <div class="training-action-area">
        <!-- 大号触控虚拟键盘 (1-4 或对应符号) -->
        <div class="training-keypad">
          <button
            v-for="val in [1, 2, 3, 4]"
            :key="val"
            type="button"
            class="training-keypad-btn"
            :disabled="isCorrect"
            @click="submitAnswer(val)"
          >
            {{ currentSymbolMap[val] }}
          </button>
        </div>

        <!-- 工具按钮行：魔法提示与下一题 -->
        <div class="training-tools-row">
          <button
            type="button"
            class="btn-training-tool btn-magic-hint"
            :disabled="isCorrect"
            @click="requestHint"
          >
            <span>💡</span>
            <span>{{ hintButtonText }}</span>
          </button>

          <button
            type="button"
            class="btn-training-tool btn-next-question"
            :class="{ 'is-correct-next': isCorrect }"
            @click="nextQuestion"
          >
            <span>{{ isCorrect ? '🎉 下一题 →' : '⏭️ 换一题' }}</span>
          </button>
        </div>
      </div>
    </main>

    <!-- 技巧小百科图文弹窗 -->
    <TrainingTutorialModal
      :is-open="isTutorialOpen"
      @close="isTutorialOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { SymbolType } from "../../types/sudoku";
import { SYMBOL_SETS } from "../../core/symbols";
import { useTraining } from "../../composables/useTraining";
import TrainingBoard from "./TrainingBoard.vue";
import TrainingHintCard from "./TrainingHintCard.vue";
import TrainingTutorialModal from "./TrainingTutorialModal.vue";

const props = withDefaults(
  defineProps<{
    initialSymbolType?: SymbolType;
  }>(),
  {
    initialSymbolType: "numbers",
  }
);

const emit = defineEmits<{
  (e: "backToPaper"): void;
}>();

const {
  mode,
  symbolType,
  currentQuestion,
  hintLevel,
  userSelectedVal,
  isCorrect,
  isWrongShake,
  isTutorialOpen,
  stats,
  nextQuestion,
  requestHint,
  submitAnswer,
  switchMode,
  switchSymbolType,
} = useTraining(props.initialSymbolType);

const availableSymbols: Array<{ key: SymbolType; label: string; icon: string }> = [
  { key: "numbers", label: "经典数字", icon: "123" },
  { key: "fruits", label: "水果乐园", icon: "🍎" },
  { key: "animals", label: "萌趣动物", icon: "🐱" },
  { key: "shapes", label: "几何图形", icon: "●" },
  { key: "letters", label: "英文字母", icon: "ABC" },
];

const currentSymbolMap = computed<Record<number, string>>(() => {
  return SYMBOL_SETS[symbolType.value] || SYMBOL_SETS.numbers;
});

const taskTitle = computed<string>(() => {
  if (!currentQuestion.value) return "正在生成题目...";
  if (currentQuestion.value.technique === "naked_single") {
    return "找出黄色闪烁格子的唯一可能数！";
  } else {
    const val = currentQuestion.value.targetValue;
    const sym = currentSymbolMap.value[val];
    return `给【${sym}】在城堡中找到唯一的安全房间！`;
  }
});

const hintButtonText = computed<string>(() => {
  if (hintLevel.value === 0) return "💡 魔法提示 (0/3)";
  if (hintLevel.value === 1) return "💡 展开雷达 (1/3)";
  if (hintLevel.value === 2) return "💡 揭晓答案 (2/3)";
  return "✨ 提示已完全展开";
});

function handleSelectTarget() {
  if (hintLevel.value === 0) {
    requestHint();
  }
}

onMounted(() => {
  nextQuestion();
});
</script>
