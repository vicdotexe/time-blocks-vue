<template>
  <div
    class="scrollbar-and-hide"
    :style="{
      background: 'white',
      width: '100%',
      height: '100%',
      userSelect: 'none',
    }"
    @mouseup="
      () => {
        isDragging = false;

        if (creatingEvent && newEvent) {
          emits('onEventCreation', { ...newEvent });
        }

        if (activeEvent && !creatingEvent) {
          emits('event-updated', activeEvent);
        }
        creatingEvent = false;
        newEvent = null;
      }
    "
  >
    <div
      style="
        display: flex;
        width: 100%;
        border-bottom: 1px solid lightgray;
        border-top: 1px solid lightgray;
        position: sticky;
        top: 0;
        z-index: 1000;
        background: white;
        font-size: small;
      "
    >
      <div style="min-width: 60px; background: white"></div>
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
    <div
      :style="{
        position: 'relative',
        display: 'flex',
        height: `${24 * intervalHeight * (60 / intervalMinutes)}px`,
        width: '100%',
      }"
    >
      <div
        style="
          min-width: 60px;
          min-height: 100%;
          background: white;
          position: relative;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          color: gray;
          font-family: 'monospace';
        "
      >
        <div
          v-for="interval in 24"
          :style="{
            position: 'absolute',
            top: `${interval * intervalHeight * (60 / intervalMinutes)}px`,
            transform: 'translateY(-50%)',
            right: '0.25rem',
          }"
        >
          {{
            `${interval <= 12 ? interval : interval % 12}:00 ${
              interval <= 12 ? "AM" : "PM"
            }`
          }}
        </div>
      </div>
      <div
        style="width: 100%; height: 100%; position: relative; display: flex"
        ref="rootDiv"
        @mousemove="onMouseMove"
        @mousedown="createEvent"
      >
        <div
          v-for="interval in 24"
          :style="{
            borderTop: '1px solid lightgray',
            width: '100%',
            position: 'absolute',
            top: `${interval * intervalHeight * (60 / intervalMinutes)}px`,
          }"
        ></div>
        <div style="display: flex; flex-direction: column; width: 100%">
          <div
            style="display: flex; width: 100%; height: 100%; position: relative"
          >
            <Day
              v-for="date in range"
              :date="date"
              :key="date.toString()"
              :events="$events"
              :interval-height="intervalHeight"
              :interval-minutes="intervalMinutes"
              @mouse-down-event="onMouseDownEvent"
              @event-clicked="
                (e) => mousePosition.y == startY && emits('event-clicked', e)
              "
            >
              <template #default="{ event }">
                <slot :event="event"></slot>
              </template>
            </Day>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Day from "./Day.vue";
import { getWeekDays } from "../helpers/DateHelper";
import { Interval, $CalendarEvent, CalendarEvent } from "../types/interfaces";
import { computed, defineEmits, defineProps, ref, reactive } from "vue";
import { addMinutes, subMinutes } from "date-fns";
import ConcurrencyHelper from "../helpers/ConcurrencyHelper";

const emits = defineEmits<{
  (e: "onEventCreation", event: CalendarEvent): void;
  (e: "event-clicked", event: CalendarEvent): void;
  (e: "event-updated", event: CalendarEvent): void;
}>();

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

  // time string from ms in format 'h:mm'
  let time = new Date(ms).toISOString().substr(11, 5);
  return time;
}

const props = defineProps<{
  date: Date;
  mode: "week" | "day";
  intervalHeight: number;
  intervalMinutes: number;
  events: CalendarEvent[];
  hideWeekends: boolean;
}>();

const $events = computed(() => {
  return new ConcurrencyHelper().calculateConcurrencyForEvents([
    ...(props.events as $CalendarEvent[]),
    ...(newEvent.value ? [newEvent.value] : []),
  ]);
});

const range = computed(() => {
  if (props.mode == "day") {
    return [props.date];
  } else {
    let range = getWeekDays(props.date);
    if (props.hideWeekends) {
      range = range.filter((d) => d.getDay() != 0 && d.getDay() != 6);
    }
    return range;
  }
});

const newEvent = ref<$CalendarEvent | null>(null);

const mouseDay = computed(() => {
  const totalWidth = rootDiv.value?.clientWidth ?? 0;
  const columnWidth = totalWidth / range.value.length;
  const currentColumn = Math.floor(mousePosition.value.x / columnWidth);

  return range.value[currentColumn];
});

let startY = 0;
let startState: $CalendarEvent | null = null;
let isDragging = false;

function onMouseDownEvent(
  event: $CalendarEvent,
  handle: "top" | "bottom" | "body"
) {
  activeEvent = event;
  startY = mousePosition.value.y;
  startState = { ...event };
  isDragging = true;
  activeHandle = handle;
  emits("event-state", "startResize");
}

function onMouseMove(event: MouseEvent) {
  if (!rootDiv.value) {
    return;
  }

  const rect = rootDiv.value.getBoundingClientRect();

  const scrollLeft = rootDiv.value.scrollLeft ?? 0;
  const scrollTop = rootDiv.value.scrollTop ?? 0;

  mousePosition.value.x = event.clientX - rect.left + scrollLeft;
  mousePosition.value.y = event.clientY - rect.top + scrollTop;

  if (!isDragging) return;

  if (creatingEvent) {
    let mouseInterval = getInterval(mousePosition.value.y);
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
  } else {
    handleExistingEvent();
  }
}

function handleExistingEvent() {
  if (!startState || !activeEvent) return;

  let initialTop = yFromDate(startState.startDate);
  let initialBottom = yFromDate(startState.endDate);
  let initialHeight = initialBottom - initialTop;

  if (activeHandle == "body") {
    const dy = mousePosition.value.y - startY;

    let newTop = initialTop + dy;
    newTop = Math.max(getInterval(newTop).startPixel, 0);

    activeEvent.startDate = getDateFromY(newTop);
    activeEvent.endDate = getDateFromY(newTop + initialHeight);

    let day = mouseDay.value;
    activeEvent.startDate = mergeTime(day, activeEvent.startDate);
    activeEvent.endDate = mergeTime(day, activeEvent.endDate);
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
      newDate <= subMinutes(activeEvent.endDate, 15)
    ) {
      activeEvent.startDate = newDate;
    } else if (
      activeHandle == "bottom" &&
      newDate >= addMinutes(activeEvent.startDate, 15)
    ) {
      activeEvent.endDate = newDate;
    }
  }
}

function mergeTime(date: Date, time: Date) {
  const newDate = new Date(date);
  newDate.setHours(time.getHours());
  newDate.setMinutes(time.getMinutes());
  newDate.setSeconds(time.getSeconds());
  newDate.setMilliseconds(time.getMilliseconds());
  return newDate;
}

const rootDiv = ref();
const mousePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const mouseMinutesY = computed(() => {
  // Get the Y coordinate of the mouse position
  const mouseY = mousePosition.value.y;

  // Calculate the ratio of the mouse position over the interval height
  const intervalRatio = mouseY / props.intervalHeight;

  // Convert the ratio into minutes
  const minutes = intervalRatio * props.intervalMinutes;

  // You might want to round or floor this value
  return Math.floor(minutes);
});

function getInterval(y: number) {
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

const mouseInterval = computed<Interval>(() => {
  let index = Math.floor(mouseMinutesY.value / props.intervalMinutes);
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

let activeEvent: $CalendarEvent | null = null;
let activeHandle: "top" | "bottom" | "body" | null = null;
let creatingEvent = false;

function createEvent() {
  let event: $CalendarEvent = reactive({
    id: newGuid(),
    description: "boo",
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

function newGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
</script>

<style lang="scss" scoped>
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
../types/interfaces.ts
