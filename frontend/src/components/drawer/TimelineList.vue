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
</script>
