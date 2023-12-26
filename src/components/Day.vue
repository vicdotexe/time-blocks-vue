<template>
  <div
    :style="{
      position: 'relative',
      width: '100%',
      minHeight: '100%',
      height: '100%',
      flexGrow: 1,
      borderLeft: `1px solid ${darkMode ? '#333' : 'lightgray'}`,
    }"
  >
    <div
      v-if="isDateToday"
      class="now-indicator"
      :style="{
        top: nowIndicatorTop,
      }"
    >
      <slot name="nowIndicator">
        <div style="height: 2px; background-color: dodgerblue"></div>
      </slot>
    </div>
    <DayEvent
      v-for="event in filteredEvents"
      :key="event.id"
      :event="event"
      :start-date="event.startDate"
      :end-date="event.endDate"
      :intervalHeight="intervalHeight"
      :intervalMinutes="intervalMinutes"
      :concurrencyMode="concurrencyMode"
      @event-mousedown="(h) => emits('event-mousedown', event, h)"
      @event-mouseup="emits('event-mouseup')"
      @event-clicked="emits('event-clicked', event)"
    >
      <template #event="{ event }">
        <slot :event="event"> </slot>
      </template>
    </DayEvent>
  </div>
</template>

<script setup lang="ts">
import DayEvent from "./DayEvent.vue";
import { $CalendarEvent } from "../types/interfaces";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { isSameDay, isToday } from "date-fns";
import {
  calculatePositions,
  processConcurrency,
} from "../helpers/EventSorting";

const props = defineProps<{
  date: Date;
  events: $CalendarEvent[];
  intervalHeight: number;
  intervalMinutes: number;
  darkMode: boolean;
  concurrencyMode: "stack" | "split";
}>();

const now = ref(new Date());

const nowIndicatorTop = computed(() => {
  const minutes = now.value.getHours() * 60 + now.value.getMinutes();
  let top = `${(minutes / props.intervalMinutes) * props.intervalHeight}px`;
  return top;
});

let interval: NodeJS.Timeout;

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date();
  }, 1000 * 60);
});

onUnmounted(() => {
  clearInterval(interval);
});

const isDateToday = computed(() => isToday(props.date));

const filteredEvents = computed(() => {
  let filtered = props.events.filter((e) => isSameDay(e.startDate, props.date));
  return props.concurrencyMode == "stack"
    ? processConcurrency(filtered)
    : calculatePositions(filtered);
});

const emits = defineEmits<{
  (
    e: "event-mousedown",
    event: $CalendarEvent,
    handle: "top" | "bottom" | "body"
  ): void;
  (e: "event-mouseup"): void;
  (e: "event-clicked", event: $CalendarEvent): void;
}>();
</script>

<style scoped lang="scss">
.now-indicator {
  z-index: 50;
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  transform: translateY(-50%);
}
</style>
