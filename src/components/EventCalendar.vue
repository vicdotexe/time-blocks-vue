<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'nowrap',
    }"
    class="test"
  >
    <Header
      v-if="!noHeader"
      :date="date ?? defaultDate"
      :mode="mode ?? defaultMode"
      @date-changed="onDateChanged"
      @mode-changed="onModeChanged"
    />

    <Week
      :date="date ?? defaultDate"
      :hideWeekends="hideWeekends"
      :mode="mode ?? defaultMode"
      :interval-height="intervalHeight"
      :interval-minutes="intervalMinutes"
      :events="events"
      @event-created="emit('event-created', $event)"
      @event-clicked="emit('event-clicked', $event)"
      @event-updated="emit('event-updated', $event)"
    >
      <template #default="{ event }">
        <slot name="calendarEvent" :event="(event as CalendarEvent)"></slot>
      </template>

      <template #dayHeader="{ date }">
        <slot name="dayHeader" :date="date"></slot>
      </template>
    </Week>
  </div>
</template>

<script setup lang="ts">
import Header from "./Header.vue";
import Week from "./Week.vue";
import { CalendarEvent } from "../types";
import { startOfToday } from "date-fns";
import { ref, withDefaults } from "vue";

const emit = defineEmits<{
  (e: "event-created", event: CalendarEvent): void;
  (e: "event-clicked", event: CalendarEvent): void;
  (e: "update:date", date: Date): void;
  (e: "update:mode", mode: "week" | "day"): void;
  (e: "event-updated", event: CalendarEvent): void;
}>();

withDefaults(
  defineProps<{
    date?: Date;
    mode?: "week" | "day";
    intervalHeight?: number;
    intervalMinutes?: number;
    events: CalendarEvent[];
    hideWeekends?: boolean;
    noHeader?: boolean;
  }>(),
  {
    hideWeekends: false,
    intervalHeight: 20,
    intervalMinutes: 15,
    noHeader: false,
  }
);

const defaultDate = ref(startOfToday());
const defaultMode = ref<"week" | "day">("week");

function onDateChanged(date: Date) {
  defaultDate.value = date;
  emit("update:date", date);
}

function onModeChanged(mode: "week" | "day") {
  defaultMode.value = mode;
  emit("update:mode", mode);
}
</script>

<style lang="scss">
.test {
  box-sizing: border-box;
}
* {
  box-sizing: inherit;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
.read-the-docs {
  color: #888;
}
</style>
../types/interfaces
