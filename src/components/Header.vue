<template>
  <div class="header">
    <div>
      <input type="date" v-model="selected" />
      <select v-model="selectedMode">
        <option value="week">Week</option>
        <option value="day">Day</option>
      </select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

const props = defineProps<{
  date: Date;
  mode: "week" | "day";
}>();

const tempDate = ref(props.date);
const tempMode = ref(props.mode);

const selected = computed({
  get: () => tempDate.value.toISOString().split("T")[0],
  set: (v) => {
    const [year, month, day] = v.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    tempDate.value = date;

    emit("dateChanged", tempDate.value);
  },
});

const selectedMode = computed({
  get: () => tempMode.value,
  set: (v) => {
    tempMode.value = v;
    emit("modeChanged", tempMode.value);
  },
});

const emit = defineEmits<{
  (e: "dateChanged", date: Date): void;
  (e: "modeChanged", mode: "week" | "day"): void;
}>();
</script>
