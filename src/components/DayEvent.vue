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
    }"
    @mousedown.stop.left="onMouseDown('body')"
    @mouseover="hovering = true"
    @mouseleave="hovering = false"
    @click.stop.left="emits('event-clicked', event)"
  >
    <div
      :style="{
        width: '100%',
        height: '100%',
      }"
    >
      <slot name="event" :event="event">
        <div
          :style="{
            background: event.color ?? 'lightblue',
          }"
          class="event-card"
        >
          <!-- start and end time in HH:mm -->
          {{ format(event.startDate, "HH:mm a") }}
          -
          {{ format(event.endDate, "HH:mm a") }}
          <br />
          {{ event.description }}
        </div>
      </slot>
    </div>

    <div
      style="
        top: 0px;
        position: absolute;
        left: 0px;
        width: 100%;
        height: 5px;
        background: transparent;
        cursor: ns-resize;
      "
      @mousedown.stop="onMouseDown('top')"
    />
    <div
      style="
        bottom: 0px;
        position: absolute;
        left: 0px;
        width: 100%;
        height: 5px;
        background: transparent;
        cursor: ns-resize;
      "
      @mousedown.stop.left="onMouseDown('bottom')"
    />
  </div>
</template>

<script setup lang="ts">
import { format, differenceInMinutes } from "date-fns";
import { $CalendarEvent } from "../types/interfaces";
import { computed, ref, watch } from "vue";

const hovering = ref(false);
const bringToFront = ref(false);
let interval: NodeJS.Timeout;

const emits = defineEmits<{
  (e: "event-mousedown", handle: "top" | "bottom" | "body"): void;
  (e: "event-mouseup"): void;
  (e: "event-clicked", event: $CalendarEvent): void;
}>();

const props = defineProps<{
  event: $CalendarEvent;
  intervalHeight: number;
  intervalMinutes: number;
}>();

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

const top = computed(() => {
  return Math.round(
    (props.event.startDate.getHours() * 60 +
      props.event.startDate.getMinutes()) *
      (props.intervalHeight / props.intervalMinutes)
  );
});

const height = computed(
  () =>
    differenceInMinutes(props.event.endDate, props.event.startDate) *
    (props.intervalHeight / props.intervalMinutes)
);

const leftRight = computed(() => {
  return props.event.nOfPreviousConcurrentEvents % 2 == 0
    ? { left: "0px" }
    : { right: "0px" };
});

const width = computed(() => {
  if (props.event.nOfPreviousConcurrentEvents) {
    return 100 - props.event.nOfPreviousConcurrentEvents * 10;
  } else {
    return 100;
  }
});

function onMouseDown(handle: "top" | "bottom" | "body") {
  document.addEventListener("mouseup", onMouseUp);
  emits("event-mousedown", handle);
}

function onMouseUp() {
  document.removeEventListener("mouseup", onMouseUp);
  emits("event-mouseup");
}
</script>

<style scoped lang="scss">
.event-card {
  width: 100%;
  height: 100%;
  padding: 0.125rem;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  transition: box-shadow 0.3s ease-in-out;
  overflow: hidden;
}

.event-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.15);
}
</style>
../types/interfaces.ts
