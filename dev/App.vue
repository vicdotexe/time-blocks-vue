<template>
  <div>
    <button @click="showWeekends = !showWeekends">asdf</button>
    <div :style="{ width: '100%', height: '80vh' }">
      <EventCalendar
        :events="events"
        :hide-weekends="showWeekends"
        :interval-height="intervalHeight"
        :interval-minutes="intervalMinutes"
        @event-created="onEventCreation"
        @event-clicked="(e) => console.log(e)"
        :concurrency-mode="'stack'"
        :default-event-properties="{ color: 'grey' }"
      >
        <template #calendarEvent="{ event }">
          <div
            class="material-card"
            :style="{
              backgroundColor: event.color,
              overflow: 'hidden',
              border: '1px solid darkgrey',
            }"
          >
            <div>
              {{ event.color }}
              {{ format(event.startDate, "HH:mm") }} -
              {{ format(event.endDate, "HH:mm") }}
            </div>
            <div>
              {{ event.description }}
            </div>
          </div>
        </template>

        <!-- <template #dayHeader="{ date, totalTime }">
          <div
            style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              width: 100%;
            "
          >
            <div>{{ format(date, "EEEE") }}</div>
            <div>{{ format(date, "dd.MM.yyyy") }}</div>
            <div>{{ totalTime }} minutes</div>
          </div>
        </template> -->

        <!-- <template #timeInterval="{ hour }">
          <div style="color: white; text-align: end; margin-right: 0.5rem">
            {{ hour }}
          </div>
        </template> -->
      </EventCalendar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import EventCalendar from "../src/components/EventCalendar.vue";
import { CalendarEvent } from "../src/types/interfaces";
import { addMinutes, startOfWeek } from "date-fns";
import { randomColor, guid } from "../src/helpers/Utility";
import { format } from "date-fns";

const intervalMinutes = ref(15);
const intervalHeight = ref(20);
const showWeekends = ref(false);
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
      description: randomText(),
      color: randomColor(),
    };
  })
);

// random lorem ipsum text function
function randomText() {
  const lorem = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed non risus.",
    "Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
    "Cras elementum ultrices diam.",
    "Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
    "Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.",
    "Duis semper.",
    "Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim.",
    "Pellentesque congue.",
    "Ut in risus volutpat libero pharetra tempor.",
    "Cras vestibulum bibendum augue.",
    "Praesent egestas leo in pede.",
    "Praesent blandit odio eu enim.",
    "Pellentesque sed dui ut augue blandit sodales.",
    "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh.",
    "Mauris ac mauris sed pede pellentesque fermentum.",
    "Maecenas adipiscing ante non diam sodales hendrerit.",
    "Ut velit mauris, egestas sed, gravida nec, ornare ut, mi.",
    "Aenean ut orci vel massa suscipit pulvinar.",
    "Nulla sollicitudin.",
    "Fusce varius, ligula non tempus aliquam, nunc turpis ullamcorper nibh, in tempus sapien eros vitae ligula.",
    "Pellentesque rhoncus nunc et augue.",
    "Integer id felis.",
    "Curabitur aliquet pellentesque diam.",
    "Integer quis metus vitae elit lobortis egestas.",
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    "Morbi vel erat non mauris convallis vehicula.",
    "Nulla et sapien.",
    "Integer tortor tellus, aliquam faucibus, convallis id, congue eu, quam.",
  ];

  return lorem[Math.floor(Math.random() * lorem.length)];
}

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
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 0rem;
  transition: box-shadow 0.3s ease-in-out;
  overflow: hidden;
}

.material-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.15);
}
</style>
