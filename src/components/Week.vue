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
        height: `${36 * intervalHeight * (60 / intervalMinutes)}px`,
        width: '100%',
      }"
    >
      <!-- Time interval column
       todo: remove hard coded width -->
      <div style="min-width: 60px; min-height: 100%; position: relative">
        <div
          v-for="hour in 36"
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
                  hour <= 12 || hour >= 24 ? "AM" : "PM"
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
          v-for="hour in 36"
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
import { $CalendarEvent, CalendarEvent } from "../types";
import { computed, ref, reactive } from "vue";
import {
  addMinutes,
  endOfDay,
  isAfter,
  isBefore,
  startOfDay,
  differenceInMinutes,
} from "date-fns";
import { processConcurrency } from "../helpers/EventSorting";
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
let initialState: $CalendarEvent | null = null;
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

function onMouseDown(event: $CalendarEvent, handle: "top" | "bottom" | "body") {
  activeEvent = event;
  startY = mousePosition.value.y;
  initialState = { ...event };
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
  if (
    !updateMousePosition(event) ||
    !isDragging ||
    !initialState ||
    !activeEvent
  ) {
    return;
  }
  manipulateEvent(initialState, activeEvent);
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

  const scrollLeft = rootDiv.value.scrollLeft;
  const scrollTop = rootDiv.value.scrollTop;

  const { left, top } = rootDiv.value.getBoundingClientRect();
  mousePosition.value.x = event.clientX - left + scrollLeft;
  mousePosition.value.y = event.clientY - top + scrollTop;
  return true;
}

function manipulateEvent(initialState: CalendarEvent, target: CalendarEvent) {
  let initialTop = yFromDate(initialState.startDate);
  let initialHeight =
    differenceInMinutes(initialState.endDate, initialState.startDate) *
    (props.intervalHeight / props.intervalMinutes);

  if (activeHandle == "body") {
    const day = mouseDay.value;
    const dy = mousePosition.value.y - startY;

    let newTop = Math.max(roundToNearestInterval(initialTop + dy), 0);
    let newStart = getDateFromY(day, newTop);
    let newEnd = getDateFromY(day, newTop + initialHeight);

    if (isAfter(newStart, endOfDay(day))) {
      return;
    }
    target.startDate = newStart;
    target.endDate = newEnd;
  } else {
    const day = initialState.startDate;
    const newDate = getDateFromY(
      day,
      roundToNearestInterval(mousePosition.value.y)
    );

    let start;
    let end;
    let anchor =
      activeHandle == "top" ? initialState.endDate : initialState.startDate;

    if (activeHandle == "top") {
      if (isAfter(newDate, anchor)) {
        console.log("after");
        start = anchor;
        end = newDate;
      } else {
        console.log("before");
        start = newDate;
        end = anchor;
      }
    } else {
      if (isBefore(newDate, anchor)) {
        start = newDate;
        end = anchor;
      } else {
        end = newDate;
        start = anchor;
      }
    }

    target.startDate = start;
    target.endDate = end;
  }
}

function roundToNearestInterval(y: number): number {
  return Math.round(y / props.intervalHeight) * props.intervalHeight;
}

function floorToNearestInterval(y: number): number {
  return Math.floor(y / props.intervalHeight) * props.intervalHeight;
}

function getDateFromY(startingDate: Date, y: number): Date {
  let minutes = (y / props.intervalHeight) * props.intervalMinutes;
  let date = addMinutes(startOfDay(startingDate), minutes);
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
  startY = mousePosition.value.y;
  let start = getDateFromY(mouseDay.value, floorToNearestInterval(startY));
  if (isAfter(start, endOfDay(mouseDay.value))) {
    return;
  }

  let event: $CalendarEvent = reactive({
    id: guid(),
    startDate: start,
    endDate: addMinutes(start, props.intervalMinutes),
    zIndex: 5000,
    nOfPreviousConcurrentEvents: 0,
    totalConcurrentEvents: 0,
  });

  newEvent.value = event;
  activeEvent = event;
  initialState = { ...event };
  creatingEvent = true;
  isDragging = true;
  activeHandle = "bottom";
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
