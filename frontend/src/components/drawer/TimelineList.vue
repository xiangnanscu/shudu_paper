<template>
  <div class="timeline-container">
    <div
      v-for="group in groups"
      :key="group.key"
      class="timeline-section"
    >
      <div class="timeline-header">
        {{ group.label }} ({{ group.list.length }}次)
      </div>
      <RecordCard
        v-for="rec in group.list"
        :key="rec.id"
        :record="rec"
        @view-detail="(id) => emit('viewDetail', id)"
        @redo="(id) => emit('redo', id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineGroup } from "../../composables/useCloudRecords";
import RecordCard from "./RecordCard.vue";

defineProps<{
  groups: TimelineGroup[];
}>();

const emit = defineEmits<{
  (e: "viewDetail", recordId: string): void;
  (e: "redo", recordId: string): void;
}>();
</script>
