<template>
  <div
    ref="cellRef"
    class="sudoku-cell"
    :class="cellClasses"
    :style="{ fontSize }"
    :data-puzzle-id="puzzleId"
    :data-row="row"
    :data-col="col"
    @click="handleClick"
  >
    <!-- 已知线索格 -->
    <template v-if="clueVal !== 0">
      {{ symbolMap[clueVal] }}
    </template>

    <!-- 答案参考页上的已解答空位 -->
    <template v-else-if="isAnswerSheet">
      {{ symbolMap[ansVal] }}
    </template>

    <!-- 普通答题空格 -->
    <template v-else>
      <!-- 已批改状态 -->
      <template v-if="examStatus === 'submitted'">
        <template v-if="userVal === ansVal">
          <span class="user-val">{{ symbolMap[userVal] }}</span>
        </template>
        <template v-else-if="userVal !== undefined">
          <span class="user-val">{{ symbolMap[userVal] }}</span>
          <span class="correct-hint">{{ symbolMap[ansVal] }}</span>
        </template>
        <template v-else>
          <span class="correct-hint">{{ symbolMap[ansVal] }}</span>
        </template>
      </template>

      <!-- 作答中/待开始状态 -->
      <template v-else>
        <span v-if="userVal !== undefined" class="user-val">
          {{ symbolMap[userVal] }}
        </span>
        <span class="answer-preview">{{ symbolMap[ansVal] }}</span>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ExamStatus } from "../../types/exam";

const props = withDefaults(
  defineProps<{
    puzzleId: number;
    row: number;
    col: number;
    clueVal: number;
    ansVal: number;
    userVal?: number;
    fontSize: string;
    symbolMap: Record<number, string>;
    examStatus: ExamStatus;
    isActive?: boolean;
    isAnswerSheet?: boolean;
  }>(),
  {
    isActive: false,
    isAnswerSheet: false,
  }
);

const emit = defineEmits<{
  (e: "select", elem: HTMLElement): void;
}>();

const cellRef = ref<HTMLElement | null>(null);

const cellClasses = computed(() => {
  if (props.clueVal !== 0) {
    return ["filled-clue"];
  }

  if (props.isAnswerSheet) {
    return ["answer-val-cell"];
  }

  const list: string[] = ["empty"];

  if (props.isActive) {
    list.push("is-active");
  }

  if (props.examStatus === "submitted") {
    if (props.userVal === props.ansVal) {
      list.push("graded-correct");
    } else if (props.userVal !== undefined) {
      list.push("graded-wrong");
    } else {
      list.push("graded-missed");
    }
  }

  return list;
});

function handleClick() {
  if (props.clueVal !== 0 || props.isAnswerSheet) return;
  if (cellRef.value) {
    emit("select", cellRef.value);
  }
}
</script>
