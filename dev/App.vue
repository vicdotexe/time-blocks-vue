<template>
  <div>
    <div :style="{ width: '100%', height: '90vh' }">
      <EventCalendar
        v-model:date="date"
        v-model:mode="mode"
        :events="events"
        :interval-height="intervalHeight"
        :interval-minutes="intervalMinutes"
        @onEventCreation="(e) => onEventCreation(e)"
        @event-clicked="(e) => console.log(e)"
        :hideWeekends="true"
      >
        <template #calendarEvent="{ event }">
          <div
            class="material-card"
            :style="{
              width: '100%',
              height: '100%',
              backgroundColor: (event as SpecialEvent)?.color
            }"
          >
            <button
              style="position: absolute; bottom: 0px"
              @click="onDelete(event)"
            >
              delete
            </button>
            {{ event.startDate.getHours() }}:{{
              event.startDate.getMinutes()
            }}
            - {{ event.endDate.getHours() }}:{{ event.endDate.getMinutes() }}
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
import { CalendarEvent } from "../src/interfaces/interfaces";
import { addMinutes } from "date-fns";
import { randomColor, guid } from "../src/helpers/Utility";

const intervalMinutes = ref(15);
const intervalHeight = ref(15);
const date = ref(new Date());
const mode = ref("week");

interface SpecialEvent extends CalendarEvent {
  color?: string;
}

const events = ref<SpecialEvent[]>(
  // an array of 6 events, each between 15 and 120 minutes long (in intervals of 15), and the days are random but fall on this week, the end times cannot fall on the day after their start date
  Array.from({ length: 24 }, () => {
    const startDate = addMinutes(
      new Date(),
      Math.floor(Math.random() * Math.floor((7 * 24 * 60) / 15)) * 15
    );
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

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
  console.log("created");
  let newEvent: SpecialEvent = {
    ...event,
    id: guid(),
    color: randomColor(),
  };

  events.value.push(newEvent);
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
