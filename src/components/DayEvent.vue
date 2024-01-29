<template>
  <div
    :style="{
      width: `${width}%`,
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute',
      userSelect: 'none',
      ...leftRight,
      padding: '0 1px',
      zIndex: zIndex,
    }"
    @mousedown.stop.left="onMouseDown('body')"
    @mousemove="onMouseMove"
    @mouseover="onMouseEnter"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.stop.left="emits('event-clicked', event)"
  >
    <div
      :style="{
        width: '100%',
        height: '100%',
      }"
      class="event-card-root"
    >
      <slot name="event" :event="event">
        <div
          :style="{
            background: event.color ?? 'lightblue',
            display: 'flex',
            filter: '',
          }"
          class="event-card"
        >
          <div
            :style="{
              background: event.color,
              filter: 'saturate(75%) brightness(150%)',
              minWidth: '5px',
              maxWidth: '5px',
              height: '100%',
            }"
          ></div>
          <div style="padding: 0.25rem">
            {{ format(event.startDate, "hh:mm a") }}
            -
            {{ format(event.endDate, "hh:mm a") }}
            <br />
            {{ event.description }}
          </div>
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

    <div
      :style="{
        position: 'fixed',
        top: `${tooltipLocation.y}px`,
        left: `${tooltipLocation.x}px`,
        transform: `translateX(-${tooltipOffset}px)`,
        visibility: showTooltip ? 'visible' : 'hidden',
        zIndex: 100,
      }"
      ref="tooltip"
    >
      <slot name="eventTooltip" :event="event">
        <div
          class="tooltip"
          :style="{
            background: config.darkMode ? '#333' : 'white',
            color: config.darkMode ? 'white' : 'black',
            borderColor: config.darkMode ? 'white' : 'black',
          }"
        >
          <slot name="eventTooltipContent" :event="event">
            <div class="tooltip-content">
              {{ format(event.startDate, "E M/d") }}
              <br />
              {{ format(event.startDate, "hh:mm a") }}
              -
              {{ format(event.endDate, "hh:mm a") }}
              <br />
              {{ event.description }}
            </div>
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, differenceInMinutes } from "date-fns";
import { $CalendarEvent } from "../types/interfaces";
import {
  computed,
  reactive,
  ref,
  watch,
  inject,
  Ref,
  onMounted,
  onUnmounted,
  ComputedRef,
} from "vue";
import { CalendarConfig } from "./EventCalendar.vue";

const calendarDiv = inject("CalendarDiv") as Ref<HTMLDivElement | null>;
const config = inject("CalendarConfig") as ComputedRef<CalendarConfig>;

const tooltip = ref<HTMLDivElement | null>(null);

const hovering = ref(false);
const bringToFront = ref(false);
const showTooltip = ref(false);
const tooltipLocation = reactive({ x: 0, y: 0 });
const lastMouseLocation: { x: number; y: number } = { x: 0, y: 0 };

let tooltipTimeout: NodeJS.Timeout;

const emits = defineEmits<{
  (e: "event-mousedown", handle: "top" | "bottom" | "body"): void;
  (e: "event-mouseup"): void;
  (e: "event-clicked", event: $CalendarEvent): void;
}>();

const props = defineProps<{
  event: $CalendarEvent;
}>();

watch(hovering, (v) => {
  if (v) {
    setTimeout(() => {
      if (!hovering.value) return;
      bringToFront.value = true;
    }, 650);
  } else {
    bringToFront.value = false;
    showTooltip.value = false;
  }
});

onMounted(() => {
  addEventListener("wheel", onMouseWheel);
});

onUnmounted(() => {
  removeEventListener("wheel", onMouseWheel);
});

const zIndex = computed(() => (bringToFront.value ? 99 : props.event.zIndex));

const top = computed(() => {
  return Math.round(
    (props.event.startDate.getHours() * 60 +
      props.event.startDate.getMinutes()) *
      (config.value.intervalHeight / config.value.intervalMinutes)
  );
});

const height = computed(() => {
  let h =
    differenceInMinutes(props.event.endDate, props.event.startDate) *
    (config.value.intervalHeight / config.value.intervalMinutes);
  return Math.max(h, config.value.intervalHeight * 0.5);
});

const leftRight = computed(() => {
  if (config.value.concurrencyMode == "split") {
    return {
      left: `${props.event.left}%`,
    };
  } else {
    return { right: "0px" };
  }
});

const width = computed(() => {
  if (config.value.concurrencyMode == "stack") {
    if (props.event.nOfPreviousConcurrentEvents) {
      return 100 - props.event.nOfPreviousConcurrentEvents * 10;
    } else {
      return 100;
    }
  } else {
    return props.event.width;
  }
});

function onMouseEnter(e: MouseEvent) {
  lastMouseLocation.x = e.clientX;
  lastMouseLocation.y = e.clientY;
  hovering.value = true;
}

function onMouseLeave() {
  hovering.value = false;
  showTooltip.value = false;
}

function onMouseMove(e: MouseEvent) {
  lastMouseLocation.x = e.clientX;
  lastMouseLocation.y = e.clientY;
  restartTooltip();
}

function onMouseDown(handle: "top" | "bottom" | "body") {
  showTooltip.value = false;
  document.addEventListener("mouseup", onMouseUp);
  emits("event-mousedown", handle);
}

function onMouseUp() {
  document.removeEventListener("mouseup", onMouseUp);
  emits("event-mouseup");
}

function onMouseWheel() {
  restartTooltip();
}

function restartTooltip() {
  showTooltip.value = false;

  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    if (!hovering.value) {
      showTooltip.value = false;
      return;
    }

    showTooltip.value = true;
    tooltipLocation.x = lastMouseLocation.x + 16;
    tooltipLocation.y = lastMouseLocation.y + 16;

    // contain tooltip within the bounds of the calendar
    if (tooltip.value && calendarDiv.value) {
      const { width, height } = tooltip.value.getBoundingClientRect();
      const { right: calendarRight, bottom: calendarBottom } =
        calendarDiv.value.getBoundingClientRect();

      const tooltipRight = tooltipLocation.x + width;
      const tooltipBottom = tooltipLocation.y + height;

      if (tooltipRight > calendarRight) {
        tooltipLocation.x -= tooltipRight - calendarRight;
      }

      if (tooltipBottom > calendarBottom) {
        tooltipLocation.y -= tooltipBottom - calendarBottom;
      }
    }
  }, 650);
}

const tooltipOffset = ref(0);
</script>

<style scoped lang="scss">
.event-card {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease-in-out;
}

.event-card * {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 14px;
}

.event-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.15);
}
.event-card-root > * {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.tooltip {
  background-color: #3f3f3f;
  border-radius: 2px;
  border: 1px solid white;
  color: white;
}

.tooltip-content {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 14px;
  width: 200px;
  margin: 4px;
}
</style>
../types/interfaces.ts
