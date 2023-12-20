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
      @mouse-down-event="(h) => emits('mouseDownEvent', event, h)"
      @mouse-up-event="emits('mouseUpEvent')"
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
import { computed, defineEmits, defineProps } from "vue";

const props = defineProps<{
  date: Date;
  events: $CalendarEvent[];
  intervalHeight: number;
  intervalMinutes: number;
}>();

const filteredEvents = computed(() => {
  return props.events.filter((e) => {
    return (
      e.startDate.getDate() == props.date.getDate() &&
      e.startDate.getMonth() == props.date.getMonth() &&
      e.startDate.getFullYear() == props.date.getFullYear()
    );
  });
});

const emits = defineEmits<{
  (
    e: "mouseDownEvent",
    event: $CalendarEvent,
    handle: "top" | "bottom" | "body"
  ): void;
  (e: "mouseUpEvent"): void;
  (e: "event-clicked", event: $CalendarEvent): void;
}>();
</script>
