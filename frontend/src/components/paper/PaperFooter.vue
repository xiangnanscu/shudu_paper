<template>
  <div class="paper-footer">
    <span>四宫格数独思维训练 · 专业幼小衔接专注力与逻辑思维体系</span>
    <span>第 {{ currentPage }} 页 / 共 {{ totalSheets }} 页</span>
    <span>批阅人：________</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number;
  totalSheets: number;
}>();
</script>
