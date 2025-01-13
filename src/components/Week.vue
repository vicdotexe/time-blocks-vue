<template>
  <div
    class="scrollbar-and-hide"
    :style="{
      width: '100%',
      height: '100%',
      userSelect: 'none',
    }"
    @mouseup.left="onMouseUp"
    ref="scrollDiv"
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
        z-index: 100;
        font-size: small;
      "
      :style="{
        backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      }"
    >
      <!-- Fill space above time column
       todo: remove hard coded width -->
      <div style="min-width: 60px; max-width: 60px" />

      <!-- Header for each day -->
      <div
        v-for="date in range"
        :key="date.toString()"
        style="width: 100%; position: relative; color: dimgray"
        :style="{
          color: darkMode ? '#eee' : 'dimgray',
          zIndex: 501,
        }"
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
        height: `${
          (25 + hoursPastMidnight) * intervalHeight * (60 / intervalMinutes)
        }px`,
        width: '100%',
      }"
    >
      <!-- Time interval column
       todo: remove hard coded width -->
      <div style="min-width: 60px; min-height: 100%; position: relative">
        <div
          v-for="hour in 24 + hoursPastMidnight"
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
                font-family: 'Roboto', sans-serif;
                text-align: end;
                margin-right: 0.25rem;
              "
              :style="{
                color: darkMode ? '#ccc' : 'gray',
              }"
            >
              {{
                `${hour <= 12 ? hour : ((hour - 1) % 12) + 1}:00 ${
                  hour < 12 || hour >= 24 ? "AM" : "PM"
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
          v-for="hour in 24 + hoursPastMidnight"
          :style="{
            borderTop: `1px solid ${darkMode ? '#333' : 'lightgray'}`,
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
          :dark-mode="darkMode"
          :concurrency-mode="concurrencyMode"
          @event-mousedown="onMouseDown"
          @event-clicked="onEventClicked"
        >
          <template #default="{ event }">
            <slot name="calendarEvent" :event="event" />
          </template>

          <template #nowIndicator>
            <slot name="nowIndicator" />
          </template>

          <template #eventTooltip="{ event }">
            <slot name="eventTooltip" :event="event" />
          </template>

          <template #eventTooltipContent="{ event }">
            <slot name="eventTooltipContent" :event="event" />
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
import { computed, ref, reactive, onMounted, nextTick } from "vue";
import {
  addMinutes,
  endOfDay,
  isAfter,
  isBefore,
  startOfDay,
  differenceInCalendarDays,
  addDays,
  addHours,
  differenceInDays,
  isSameDay,
} from "date-fns";
import { guid } from "../helpers/Utility";

type MouseDownState = {
  event: $CalendarEvent;
  initialEventState: $CalendarEvent;
  handle: "top" | "bottom" | "body";
  x: number;
  y: number;
};

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
  darkMode: boolean;
  scrollToHour: number;
  concurrencyMode: "stack" | "split";
  hoursPastMidnight: number;
  defaultEventProperties?: Partial<$CalendarEvent>;
}>();

let initialState: $CalendarEvent | null = null;
let isDragging = false;
let creatingEvent = false;
let mouseDown: MouseDownState;

const rootDiv = ref<HTMLElement | null>(null);
const scrollDiv = ref();
const newEvent = ref<$CalendarEvent | null>(null);
const mousePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

onMounted(() => {
  nextTick(() => {
    if (props.scrollToHour) {
      const minutes = props.scrollToHour * 60;
      const y = (minutes / props.intervalMinutes) * props.intervalHeight;
      scrollDiv.value?.scrollTo(0, y);
    }
  });
});

const $events = computed(() => {
  return [
    ...(props.events as $CalendarEvent[]),
    ...(newEvent.value ? [newEvent.value] : []),
  ];
});

const range = computed(() =>
  props.mode == "day"
    ? [props.date]
    : getWeekDays(props.date, !props.hideWeekends)
);

function onMouseDown(event: $CalendarEvent, handle: "top" | "bottom" | "body") {
  if (event.readonly === true) return;
  initialState = { ...event };
  isDragging = true;
  mouseDown = {
    event,
    initialEventState: { ...event },
    handle,
    y: mousePosition.value.y,
    x: mousePosition.value.x,
  };
}

function onMouseUp() {
  if (creatingEvent && newEvent.value) {
    emits("event-created", { ...newEvent.value });
    creatingEvent = false;
    newEvent.value = null;
  }

  const { event, initialEventState: initialState } = mouseDown;

  if (
    event.startDate.getTime() != initialState?.startDate.getTime() ||
    event.endDate.getTime() != initialState?.endDate.getTime()
  ) {
    emits("event-updated", mouseDown.event);
  }
  isDragging = false;
}

function onMouseMove(mouseEvent: MouseEvent) {
  if (!updateMousePosition(mouseEvent) || !isDragging) {
    return;
  }

  const {
    event,
    initialEventState: initialState,
    handle,
    y: startY,
    x: startX,
  } = mouseDown;

  const initialInterval = roundToNearestInterval(startY);
  const currentInterval = roundToNearestInterval(mousePosition.value.y);
  const pixelsToTime = props.intervalMinutes / props.intervalHeight;
  const minuteDelta = (currentInterval - initialInterval) * pixelsToTime;

  const newStartTime = addMinutes(initialState.startDate, minuteDelta);
  const newEndTime = addMinutes(initialState.endDate, minuteDelta);

  if (handle == "body") {
    if (
      differenceInCalendarDays(newStartTime, initialState.startDate) > 0 &&
      !isSameDay(newStartTime, getDateFromX(startX))
    ) {
      return;
    }

    const downDate = getDateFromX(startX);
    const hoveredDate = getDateFromX(mousePosition.value.x);
    const dayDelta = differenceInDays(hoveredDate, downDate);

    event.startDate = addDays(newStartTime, dayDelta);
    event.endDate = addDays(newEndTime, dayDelta);
  } else {
    const anchor =
      handle === "top" ? initialState.endDate : initialState.startDate;
    const newTime = handle === "top" ? newStartTime : newEndTime;

    const [startDate, endDate] = isAfter(newTime, anchor)
      ? [anchor, newTime]
      : [newTime, anchor];

    const mouseDownColumnDate = getDateFromX(startX);

    let max: Date;
    if (isSameDay(mouseDownColumnDate, initialState.endDate)) {
      max = endOfDay(mouseDownColumnDate);
    } else {
      max = startOfDay(addDays(initialState.startDate, 1));
      max = addHours(max, props.hoursPastMidnight);
    }

    if (
      !isSameDay(startDate, initialState.startDate) ||
      (mouseDown.handle === "bottom" &&
        (isAfter(endDate, max) ||
          isBefore(
            endDate,
            addMinutes(mouseDownColumnDate, props.intervalMinutes)
          )))
    ) {
      return;
    }

    event.startDate = startDate;
    event.endDate = endDate;
  }
}

function onEventClicked(event: $CalendarEvent) {
  // Prevents drag interaction from firing a click
  if (mousePosition.value.y != mouseDown.y) return;
  emits("event-clicked", event);
}

function updateMousePosition(event: MouseEvent): boolean {
  if (!rootDiv.value) {
    return false;
  }

  const scrollLeft = rootDiv.value?.scrollLeft;
  const scrollTop = rootDiv.value?.scrollTop;

  const { left, top } = rootDiv.value.getBoundingClientRect();
  mousePosition.value.x = event.clientX - left + scrollLeft;
  mousePosition.value.y = event.clientY - top + scrollTop;

  return true;
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

function getDateFromX(x: number): Date {
  let totalWidth = rootDiv.value?.clientWidth ?? 0;
  let columnWidth = totalWidth / range.value.length;
  let currentColumn = Math.floor(x / columnWidth);
  return range.value[currentColumn];
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
  const hoveredDay = getDateFromX(mousePosition.value.x);

  let start = getDateFromY(
    hoveredDay,
    floorToNearestInterval(mousePosition.value.y)
  );
  if (isAfter(start, endOfDay(hoveredDay))) {
    return;
  }

  let event: $CalendarEvent = reactive({
    id: props.defaultEventProperties?.id ?? guid(),
    description: props.defaultEventProperties?.description,
    color: props.defaultEventProperties?.color ?? "#2196f3",
    startDate: start,
    endDate: addMinutes(start, props.intervalMinutes),
    nOfPreviousConcurrentEvents: 0,
    totalConcurrentEvents: 0,
    left: 0,
    width: 100,
  });

  newEvent.value = event;
  mouseDown = {
    event,
    initialEventState: { ...event },
    handle: "bottom",
    x: mousePosition.value.x,
    y: mousePosition.value.y + props.intervalHeight,
  };
  creatingEvent = true;
  isDragging = true;
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
