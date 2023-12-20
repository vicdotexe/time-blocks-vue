<template>
  <div
    :style="{
      width: `${width}%`,
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute',
      userSelect: 'none',
      ...leftRight,
      boxSizing: 'border-box',
      padding: '0 1px',
      zIndex: zIndex,
      // opacity: hovering ? 0.9 : 1,
    }"
    @mousedown.stop="onMouseDown('body')"
    @mouseover="hovering = true"
    @mouseleave="hovering = false"
    @click.stop="emits('event-clicked', event)"
  >
    <slot name="event" :event="event">
      <div
        :style="{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'red',
        }"
      >
        {{ event.description }}
        <!-- start and end time in HH:mm -->
        {{ event.startDate.getHours() }}:{{ event.startDate.getMinutes() }} -
        {{ event.endDate.getHours() }}:{{ event.endDate.getMinutes() }}
      </div>
    </slot>
    <div class="handle" style="top: 0px" @mousedown.stop="onMouseDown('top')" />
    <div
      class="handle"
      style="bottom: 0px"
      @mousedown.stop="onMouseDown('bottom')"
    />
  </div>
</template>

<script setup lang="ts">
import { $CalendarEvent, EventInteraction } from "../types/interfaces.ts";
import { computed, defineEmits, defineProps, ref, watch } from "vue";

const hovering = ref(false);
const bringToFront = ref(false);

let interval: NodeJS.Timeout;

watch(hovering, (v) => {
  if (v) {
    interval = setInterval(() => {
      bringToFront.value = true;
    }, 750);
  } else {
    bringToFront.value = false;
    clearInterval(interval);
  }
});

const zIndex = computed(() => (bringToFront.value ? 500 : props.event.zIndex));

const leftRight = computed(() => {
  return props.event.nOfPreviousConcurrentEvents % 2 == 0
    ? { left: "0px" }
    : { right: "0px" };
});

const width = computed(() => {
  if (props.event.description == "boo") {
    console.log(
      props.event.nOfPreviousConcurrentEvents,
      props.event.totalConcurrentEvents
    );
  }

  //calculate percentage from nPrevious
  if (props.event.nOfPreviousConcurrentEvents) {
    return 100 - props.event.nOfPreviousConcurrentEvents * 10;
  } else {
    return 100;
  }
});

const props = defineProps<{
  event: $CalendarEvent;
  intervalHeight: number;
  intervalMinutes: number;
}>();

function onMouseDown(handle: "top" | "bottom" | "body") {
  document.addEventListener("mouseup", onMouseUp);
  emits("mouseDownEvent", handle);
}

function onMouseUp() {
  document.removeEventListener("mouseup", onMouseUp);
  console.log("mouse up");
  emits("mouseUpEvent");
}

const emits = defineEmits<{
  (e: "mouseDownEvent", handle: "top" | "bottom" | "body"): void;
  (e: "mouseUpEvent"): void;
  (e: "event-clicked", event: $CalendarEvent): void;
  (e: "event-interaction", action: EventInteraction): void;
}>();

const top = computed(() => yFromDate(props.event.startDate));
const height = computed(
  () => yFromDate(props.event.endDate) - yFromDate(props.event.startDate)
);

function yFromDate(date: Date) {
  return Math.round(
    (date.getHours() * 60 + date.getMinutes()) *
      (props.intervalHeight / props.intervalMinutes)
  );
}
</script>

<style lang="scss" scoped>
.handle {
  position: absolute;
  left: 0px;
  width: 100%;
  height: 5px;
  background: transparent;
  cursor: ns-resize;
}
</style>
../types/interfaces.ts
