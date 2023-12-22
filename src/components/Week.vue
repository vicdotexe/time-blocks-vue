<template>
  <div
    class="scrollbar-and-hide"
    :style="{
      width: '100%',
      height: '100%',
      userSelect: 'none',
    }"
    @mouseup.left="onMouseUp"
  >
    <!-- Wrapper for day headers -->
    <div
      style="
        display: flex;
        width: 100%;
        border-bottom: 1px solid lightgray;
        border-top: 1px solid lightgray;
        position: sticky;
        top: 0;
        z-index: 1000;
        font-size: small;
      "
    >
      <!-- Fill space above time column
       todo: remove hard coded width -->
      <div style="min-width: 60px; max-width: 60px" />

      <!-- Header for each day -->
      <div
        v-for="date in range"
        :key="date.toString()"
        style="width: 100%; position: relative; color: dimgray"
      >
        <slot name="dayHeader" :date="date">
          <div
            style="
              display: flex;
              justify-content: center;
              align-items: end;
              margin-bottom: 0.25rem;
            "
          >
            <div style="font-size: x-large">
              {{
                date.toLocaleDateString("en-US", {
                  day: "numeric",
                })
              }}
            </div>
            <div
              style="
                margin-left: 0.25rem;
                display: flex;
                flex-direction: column;
                line-height: 1;
                font-size: small;
              "
            >
              <div style="font-weight: 500">
                {{
                  date.toLocaleDateString("en-US", {
                    weekday: "short",
                  })
                }}
              </div>
              <div style="letter-spacing: 0.4px">{{ getTotalTime(date) }}</div>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- Wrapper for time interval column and day column(s) -->
    <div
      :style="{
        position: 'relative',
        display: 'flex',
        height: `${24 * intervalHeight * (60 / intervalMinutes)}px`,
        width: '100%',
      }"
    >
      <!-- Time interval column
       todo: remove hard coded width -->
      <div style="min-width: 60px; min-height: 100%; position: relative">
        <div
          v-for="hour in 24"
          :style="{
            width: '100%',
            position: 'absolute',
            top: `${hour * intervalHeight * (60 / intervalMinutes)}px`,
            transform: 'translateY(-50%)',
          }"
        >
          <slot name="timeInterval" :hour="hour">
            <div
              style="
                position: relative;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.4px;
                color: gray;
                font-family: 'Roboto', sans-serif;
                text-align: end;
                margin-right: 0.25rem;
              "
            >
              {{
                `${hour <= 12 ? hour : ((hour - 1) % 12) + 1}:00 ${
                  hour <= 12 || 24 ? "AM" : "PM"
                }`
              }}
            </div>
          </slot>
        </div>
      </div>

      <!-- Main div for day column(s) -->
      <div
        style="
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          position: relative;
        "
        ref="rootDiv"
        @mousemove="onMouseMove"
        @mousedown.left="createEvent"
      >
        <!-- Horizontal hour lines -->
        <div
          v-for="hour in 24"
          :style="{
            borderTop: '1px solid lightgray',
            width: '100%',
            position: 'absolute',
            top: `${hour * intervalHeight * (60 / intervalMinutes)}px`,
          }"
        />

        <Day
          v-for="date in range"
          :date="date"
          :key="date.toString()"
          :events="$events"
          :interval-height="intervalHeight"
          :interval-minutes="intervalMinutes"
          @event-mousedown="onMouseDown"
          @event-clicked="onEventClicked"
        >
          <template #default="{ event }">
            <slot :event="event"></slot>
          </template>
        </Day>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Day from "./Day.vue";
import { getWeekDays } from "../helpers/DateHelper";
import { Interval, $CalendarEvent, CalendarEvent } from "../types";
import { computed, ref, reactive } from "vue";
import { addMinutes, subMinutes } from "date-fns";
import { processConcurrency } from "../helpers/EventSorting";
import { mergeTime } from "../helpers/DateHelper";
import { guid } from "../helpers/Utility";

const emits = defineEmits<{
  (e: "event-created", event: CalendarEvent): void;
  (e: "event-clicked", event: CalendarEvent): void;
  (e: "event-updated", event: CalendarEvent): void;
}>();

const props = defineProps<{
  date: Date;
  mode: "week" | "day";
  intervalHeight: number;
  intervalMinutes: number;
  events: CalendarEvent[];
  hideWeekends: boolean;
}>();

let startY = 0;
let startState: $CalendarEvent | null = null;
let isDragging = false;
let activeEvent: $CalendarEvent | null = null;
let activeHandle: "top" | "bottom" | "body" | null = null;
let creatingEvent = false;

const rootDiv = ref();
const newEvent = ref<$CalendarEvent | null>(null);
const mousePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const $events = computed(() => {
  return processConcurrency([
    ...(props.events as $CalendarEvent[]),
    ...(newEvent.value ? [newEvent.value] : []),
  ]);
});

const range = computed(() =>
  props.mode == "day"
    ? [props.date]
    : getWeekDays(props.date, !props.hideWeekends)
);

const mouseDay = computed(() => {
  const totalWidth = rootDiv.value?.clientWidth ?? 0;
  const columnWidth = totalWidth / range.value.length;
  const currentColumn = Math.floor(mousePosition.value.x / columnWidth);
  return range.value[currentColumn];
});

const mouseInterval = computed<Interval>(() => {
  let index = Math.floor(mouseMinutes.value / props.intervalMinutes);
  let startPixel = index * props.intervalHeight;
  let endPixel = startPixel + props.intervalHeight - 1;
  let startMinutes = index * props.intervalMinutes;
  let endMinutes = startMinutes + props.intervalMinutes;
  let startDate = new Date(props.date);
  startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  let endDate = new Date(props.date);
  endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  return {
    index,
    startMinutes,
    startDate,
    startPixel,
    endMinutes,
    endDate,
    endPixel,
  };
});

const mouseMinutes = computed(() => {
  const mouseY = mousePosition.value.y;
  const intervalRatio = mouseY / props.intervalHeight;
  const minutes = intervalRatio * props.intervalMinutes;
  return Math.floor(minutes);
});

function onMouseDown(event: $CalendarEvent, handle: "top" | "bottom" | "body") {
  activeEvent = event;
  startY = mousePosition.value.y;
  startState = { ...event };
  isDragging = true;
  activeHandle = handle;
}

function onMouseUp() {
  if (creatingEvent && newEvent.value) {
    emits("event-created", { ...newEvent.value });
  }

  if (activeEvent && !creatingEvent) {
    emits("event-updated", activeEvent);
  }

  isDragging = false;
  creatingEvent = false;
  newEvent.value = null;
}

function onMouseMove(event: MouseEvent) {
  if (!updateMousePosition(event) || !isDragging) return;

  if (creatingEvent) {
    manipulateNewEvent();
  } else {
    manipulateExistingEvent();
  }
}

function onEventClicked(event: $CalendarEvent) {
  // Prevents drag interaction from firing a click
  if (mousePosition.value.y != startY) return;
  emits("event-clicked", event);
}

function updateMousePosition(event: MouseEvent): boolean {
  if (!rootDiv.value) {
    return false;
  }

  const scrollLeft = rootDiv.value.scrollLeft ?? 0;
  const scrollTop = rootDiv.value.scrollTop ?? 0;

  const { left, top } = rootDiv.value.getBoundingClientRect();
  mousePosition.value.x = event.clientX - left + scrollLeft;
  mousePosition.value.y = event.clientY - top + scrollTop;
  return true;
}

function manipulateNewEvent() {
  let mouseInterval = getIntervalFromY(mousePosition.value.y);
  mouseInterval.startDate = mergeTime(
    startState!.startDate,
    mouseInterval.startDate
  );
  mouseInterval.endDate = mergeTime(
    startState!.startDate,
    mouseInterval.endDate
  );

  if (mouseInterval.startDate >= startState!.startDate) {
    newEvent.value!.startDate = startState!.startDate;
    newEvent.value!.endDate = mouseInterval.endDate;
  } else {
    newEvent.value!.startDate = mouseInterval.startDate;
    newEvent.value!.endDate = startState!.startDate;
  }
}

function manipulateExistingEvent() {
  if (!startState || !activeEvent) return;

  let initialTop = yFromDate(startState.startDate);
  let initialBottom = yFromDate(startState.endDate);
  let initialHeight = initialBottom - initialTop;

  if (activeHandle == "body") {
    const dy = mousePosition.value.y - startY;
    const day = mouseDay.value;

    let newTop = initialTop + dy;
    newTop = Math.max(getIntervalFromY(newTop).startPixel, 0);

    let newStart = getDateFromY(newTop);
    newStart = mergeTime(day, newStart);

    let newEnd = getDateFromY(newTop + initialHeight);
    newEnd = mergeTime(day, newEnd);

    if (newEnd < newStart) {
      return;
    }

    activeEvent.startDate = mergeTime(day, newStart);
    activeEvent.endDate = mergeTime(day, newEnd);
  } else {
    let y =
      mousePosition.value.y - (mousePosition.value.y % props.intervalHeight);
    if (
      mousePosition.value.y % props.intervalHeight >
      props.intervalHeight / 2
    ) {
      y += props.intervalHeight;
    }
    const newDate = mergeTime(activeEvent.endDate, getDateFromY(y));

    if (
      activeHandle == "top" &&
      newDate <= subMinutes(activeEvent.endDate, props.intervalMinutes)
    ) {
      activeEvent.startDate = newDate;
    } else if (
      activeHandle == "bottom" &&
      newDate >= addMinutes(activeEvent.startDate, props.intervalMinutes)
    ) {
      activeEvent.endDate = newDate;
    }
  }
}

function getIntervalFromY(y: number) {
  let index = Math.floor(y / props.intervalHeight);
  let startPixel = index * props.intervalHeight;
  let endPixel = startPixel + props.intervalHeight - 1;
  let startMinutes = index * props.intervalMinutes;
  let endMinutes = startMinutes + props.intervalMinutes;
  let startDate = new Date(props.date);
  startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  let endDate = new Date(props.date);
  endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  return {
    index,
    startMinutes,
    startDate,
    startPixel,
    endMinutes,
    endDate,
    endPixel,
  };
}

function getDateFromY(y: number): Date {
  let minutes = (y / props.intervalHeight) * props.intervalMinutes;
  let date = new Date(props.date);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function yFromDate(date: Date) {
  let startMinutes = date.getHours() * 60 + date.getMinutes();
  return (startMinutes * props.intervalHeight) / props.intervalMinutes;
}

function getTotalTime(date: Date) {
  let ms = $events.value.reduce((acc, e) => {
    if (
      e.startDate.getDate() == date.getDate() &&
      e.startDate.getMonth() == date.getMonth() &&
      e.startDate.getFullYear() == date.getFullYear()
    ) {
      return acc + (e.endDate.getTime() - e.startDate.getTime());
    }
    return acc;
  }, 0);
  let time = new Date(ms).toISOString().substr(11, 5);
  return time;
}

function createEvent() {
  let event: $CalendarEvent = reactive({
    id: guid(),
    startDate: mergeTime(mouseDay.value, mouseInterval.value.startDate),
    endDate: mergeTime(mouseDay.value, mouseInterval.value.endDate),
    zIndex: 5000,
    nOfPreviousConcurrentEvents: 0,
    totalConcurrentEvents: 0,
  });
  creatingEvent = true;
  isDragging = true;
  startY = mousePosition.value.y;
  newEvent.value = event;
  startState = { ...event };
}
</script>

<style lang="scss">
.scrollbar-and-hide {
  /* Enable scrolling */
  overflow-y: auto;

  /* Hide scrollbar for Internet Explorer, Edge */
  -ms-overflow-style: none;

  /* Hide scrollbar for Firefox */
  scrollbar-width: none;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
../types/interfaces.ts ../helpers/EventStorting ../helpers/EventSorting
