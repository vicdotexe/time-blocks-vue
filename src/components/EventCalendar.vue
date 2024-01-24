<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      backgroundColor: darkMode ? '#121212' : '#fff',
    }"
    ref="rootDiv"
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
      :darkMode="darkMode"
      :scrollToHour="scrollToHour"
      :concurrency-mode="concurrencyMode"
      :hours-past-midnight="hoursPastMidnight"
      :default-event-properties="defaultEventProperties"
      @event-created="emit('event-created', $event)"
      @event-clicked="emit('event-clicked', $event)"
      @event-updated="emit('event-updated', $event)"
    >
      <template #calendarEvent="{ event }">
        <slot name="calendarEvent" :event="(event as CalendarEvent)" />
      </template>

      <template #dayHeader="{ date }">
        <slot name="dayHeader" :date="date" />
      </template>

      <template #timeInterval="{ hour }">
        <slot name="timeInterval" :hour="hour" />
      </template>

      <template #eventTooltip="{ event }">
        <slot name="eventTooltip" :event="(event as CalendarEvent)" />
      </template>

      <template #eventTooltipContent="{ event }">
        <slot name="eventTooltipContent" :event="(event as CalendarEvent)" />
      </template>
    </Week>
  </div>
</template>

<script setup lang="ts">
import Header from "./Header.vue";
import Week from "./Week.vue";
import { CalendarEvent } from "../types";
import { startOfToday } from "date-fns";
import { ref, withDefaults, watch, provide } from "vue";

const rootDiv = ref<HTMLDivElement>();

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    bounds.value = entry.contentRect;
  }
});

const bounds = ref<DOMRect>();
provide("CalendarDiv", rootDiv);

watch(rootDiv, (v) => {
  if (v) {
    if (rootDiv.value) {
      resizeObserver.unobserve(rootDiv.value);
    }
    resizeObserver.observe(v);
  }
});

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
    darkMode?: boolean;
    scrollToHour?: number;
    concurrencyMode?: "stack" | "split";
    hoursPastMidnight?: number;
    defaultEventProperties?: Partial<CalendarEvent>;
  }>(),
  {
    hideWeekends: false,
    intervalHeight: 20,
    intervalMinutes: 15,
    noHeader: false,
    darkMode: true,
    scrollToHour: 5.5,
    concurrencyMode: "stack",
    hoursPastMidnight: 4,
  }
);

const defaultDate = ref(startOfToday());
const defaultMode = ref<"week" | "day">("week");

defineSlots<{
  calendarEvent(props: { event: CalendarEvent }): any;
  dayHeader(props: { date: Date }): any;
  timeInterval(props: { hour: number }): any;
  eventTooltip(props: { event: CalendarEvent }): any;
  eventTooltipContent(props: { event: CalendarEvent }): any;
}>();

function onDateChanged(date: Date) {
  defaultDate.value = date;
  emit("update:date", date);
}

function onModeChanged(mode: "week" | "day") {
  defaultMode.value = mode;
  emit("update:mode", mode);
}
</script>
../types/interfaces
