<template>
  <div>
    <div :style="{ width: '100%', height: '90vh' }">
      <EventCalendar
        :events="events"
        :interval-height="intervalHeight"
        :interval-minutes="intervalMinutes"
        @event-created="onEventCreation"
        @event-clicked="(e) => console.log(e)"
        :hideWeekends="true"
      >
        <template #calendarEvent="{ event }">
          <div
            class="material-card"
            :style="{
              width: '100%',
              height: '100%',
              backgroundColor: event?.color,
            }"
          >
            <button
              style="position: absolute; bottom: 0px"
              @click="onDelete(event)"
            >
              delete
            </button>
            {{  format(event.startDate, 'MM/dd HH:mm') }} <br/> {{ format(event.endDate, 'MM/dd HH:mm') }}
          </div>
        </template>

        <template #dayHeader="{ date }"> </template>
      </EventCalendar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import EventCalendar from "../src/components/EventCalendar.vue";
import { CalendarEvent } from "../src/types/interfaces";
import { addMinutes, startOfWeek, format } from "date-fns";
import { randomColor, guid } from "../src/helpers/Utility";

const intervalMinutes = ref(15);
const intervalHeight = ref(15);

const events = ref<CalendarEvent[]>(
  Array.from({ length: 24 }, () => {
    const startDate = addMinutes(
      startOfWeek(new Date()),
      Math.floor(Math.random() * Math.floor((7 * 24 * 60) / 15)) * 15
    );

    let endDate = addMinutes(
      startDate,
      Math.floor(Math.random() * Math.floor((8 * 60) / 15)) * 15 + 15
    );
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);

    while (endDate.getDay() != startDate.getDay()) {
      endDate = addMinutes(endDate, -15);
    }

    return {
      id: guid(),
      startDate,
      endDate,
      description: "test",
      color: randomColor(),
    };
  })
);

function onDelete(event: CalendarEvent) {
  events.value.splice(events.value.indexOf(event), 1);
}

function onEventCreation(event: CalendarEvent) {
  event.color = randomColor();
  events.value.push(event);
}
</script>

<style scoped lang="scss">
.material-card {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  transition: box-shadow 0.3s ease-in-out;
  overflow: hidden;
}

.material-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.15);
}
</style>
