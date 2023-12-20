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
      :date="date"
      :mode="mode"
      @date-changed="(e) => emits('update:date', e)"
      @mode-changed="(e) => emits('update:mode', e)"
    />

    <Week
      :date="date"
      :hideWeekends="hideWeekends"
      :mode="mode"
      :interval-height="intervalHeight"
      :interval-minutes="intervalMinutes"
      :events="events"
      @onEventCreation="(e) => emits('onEventCreation', e)"
      @event-clicked="(e) => emits('event-clicked', e)"
      @event-updated="(e) => emits('event-updated', e)"
    >
      <template #default="{ event }">
        <slot name="calendarEvent" :event="event"></slot>
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
import { CalendarEvent } from "../types/interfaces";

const emits = defineEmits<{
  (e: "onEventCreation", event: CalendarEvent): void;
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
  }>(),
  {
    date: () => new Date(),
    mode: "week",
    hideWeekends: false,
    intervalHeight: 20,
    intervalMinutes: 15,
  }
);
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
