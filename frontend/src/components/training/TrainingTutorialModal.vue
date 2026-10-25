<template>
  <div v-if="isOpen" class="tutorial-modal-overlay" @click.self="emit('close')">
    <div class="tutorial-modal-card">
      <div class="tutorial-modal-header">
        <div class="tutorial-modal-title">
          <span>📖</span>
          <span>数独两大基础技巧小百科</span>
        </div>
        <button
          type="button"
          class="btn-close-modal"
          aria-label="关闭"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="tutorial-modal-body">
        <!-- 唯余法图解卡片 -->
        <div class="tutorial-section">
          <div class="tutorial-section-header">
            <span>🔍</span>
            <span>技巧一：唯余法（单元格余数）</span>
            <span class="tutorial-badge badge-naked">看格子</span>
          </div>
          <div class="tutorial-text">
            <strong>核心口诀：</strong>站在一个格子里，向十字路口和家里看，缺谁就是谁！
          </div>
          <div class="tutorial-analogy-box">
            <strong>生动比喻：</strong><br />
            想象 4 个小伙伴（1、2、3、4）一起玩聚会游戏。
            这个空格子看看自己的<b>同行</b>、<b>同列</b>和<b>同一个 2x2 城堡</b>，发现已经住下了 1、2、3。
            既然大家不能重复，那这个空格子里除了 4，谁也住不进去了！这就是【唯余】。
          </div>
        </div>

        <!-- 摒除法图解卡片 -->
        <div class="tutorial-section">
          <div class="tutorial-section-header">
            <span>⚡</span>
            <span>技巧二：摒除法（激光探照排除）</span>
            <span class="tutorial-badge badge-hidden">看区域与数字</span>
          </div>
          <div class="tutorial-text">
            <strong>核心口诀：</strong>给具体的数字找房间，外部激光扫射封锁，只剩唯一安全房！
          </div>
          <div class="tutorial-analogy-box box-hidden">
            <strong>生动比喻：</strong><br />
            假设我们要给【数字 3】在左上角城堡安个家。城堡里有 2 个空房间，到底住哪间呢？<br />
            看城堡外面！其他地方的数字 3 像发射激光一样射穿了其中一个房间（同一行同一列不能重复），导致那个房间被封锁！<br />
            于是，城堡里只剩下<b>最后一个安全房间</b>给数字 3 了！这就是【摒除】。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>
