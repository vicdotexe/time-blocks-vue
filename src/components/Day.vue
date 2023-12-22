<template>
  <div
    :style="{
      position: 'relative',
      width: '100%',
      minHeight: '100%',
      height: '100%',
      flexGrow: 1,
      borderLeft: '1px solid lightgray',
    }"
  >
    <DayEvent
      v-for="event in filteredEvents"
      :key="event.id"
      :event="event"
      :start-date="event.startDate"
      :end-date="event.endDate"
      :intervalHeight="intervalHeight"
      :intervalMinutes="intervalMinutes"
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
import { computed } from "vue";
import { isSameDay } from "date-fns";

const props = defineProps<{
  date: Date;
  events: $CalendarEvent[];
  intervalHeight: number;
  intervalMinutes: number;
}>();

const filteredEvents = computed(() =>
  props.events.filter((e) => isSameDay(e.startDate, props.date))
);

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
