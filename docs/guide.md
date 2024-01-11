---
title: Guide
description: Guide & API reference for Time Blocks
layout: doc
---

## Installing

```
npm install time-blocks-vue
```

## Basic usage
``` vue
<template>
    <EventCalendar :events="events" />
</template>

<script setup lang='ts'>
import { EventCalendar } from 'time-blocks-vue'
import { ref } from 'vue';

let startDate = new Date();
let endDate = new Date();
endDate.setMinutes(startDate.getMinutes() + 15);

const events = ref([{
    id: "1234",
    description: "Event description",
    color: "blue",
    startDate: startDate,
    endDate: endDate,
}]);
</script>

<style>
@import "time-blocks-vue/style.css";
</style>
```
::: tip
The event calendar will try to fill it's parent's dimensions, so best practice is to put it in a wrapper element with a fixed height.
:::

## Props

| Name                     | Type                                                  | Required | Default | Purpose                                          |
| ------------------------ | ----------------------------------------------------- | -------- | ------- | ------------------------------------------------ |
| events                   | [CalendarEvent](#calendarevent-properties)[]          | Yes      |         | Array of events to be displayed.                 |
| date                     | Date                                                  | No       |         | The current date displayed by the calendar.      |
| mode                     | "week" \| "day"                                       | No       |         | Display mode of the calendar (week or day view). |
| interval-height          | number                                                | No       | 20      | Height of each time interval in pixels.          |
| interval-minutes         | number                                                | No       | 15      | Duration in minutes of each interval.            |
| hide-weekends            | boolean                                               | No       | false   | Whether to hide weekends on the calendar.        |
| no-header                | boolean                                               | No       | false   | If true, the calendar header will be hidden.     |
| dark-mode                | boolean                                               | No       | true    | Enables dark mode for the calendar.              |
| scroll-to-hour           | number                                                | No       | 5.5     | Default hour to scroll to on calendar load.      |
| concurrency-mode         | "stack" \| "split"                                    | No       | "stack" | How overlapping events are displayed.            |
| hours-past-midnight      | number                                                | No       | 4       | Number of hours past midnight shown.             |
| default-event-properties | Partial\<[CalendarEvent](#calendarevent-properties)\> | No       |         | Default properties for new events.               |

::: info Intervals
IntervalMinutes will define the granularity of where an event's date properties will snap to when interacting with the calendar.
:::

::: info Mode
In 'day' mode, only the current date prop will be shown. In 'week' mode, the start and end of the week will be determined from the current date prop, and a column for each day of the week will be shown.
:::

::: warning Concurrency Mode
Currently both 'stack' and 'split' modes are a WIP, but decent enough to work with for now.
:::

### CalendarEvent Properties

| Name        | Type             | Required | Purpose                                                                   |
| ----------- | ---------------- | -------- | ------------------------------------------------------------------------- |
| id          | string \| number | Yes      | Unique identifier for the event.                                          |
| description | string \| null   | No       | Descriptive text about the event.                                         |
| startDate   | Date             | Yes      | The starting date and time of the event.                                  |
| endDate     | Date             | Yes      | The ending date and time of the event.                                    |
| color       | string           | No       | Color used to represent the event visually. (CSS color name or hex value) |

::: tip
The color property will have no affect when implementing a custom [CalendarEvent Slot](#calendarevent-slot). In this case, the property can be used however you like: CSS color name, hex value, class name, etc.
:::

## Events
| Event Name    | Payload       | Purpose                                    |
| ------------- | ------------- | ------------------------------------------ |
| event-created | CalendarEvent | Emitted when a new event is created.       |
| event-clicked | CalendarEvent | Emitted when an event is clicked.          |
| event-updated | CalendarEvent | Emitted when an existing event is updated. |

::: info
Event calendar will allow the user to draw out a new event that is populated with a unique id, and the appropriate start and end dates. However it does nothing with this info other than emit the `event-created` event, this is where you would want to process what should actually happen.

Examples would be: validate or manipulate the incoming payload, and push directly to the events prop, or another array if the events prop is a computed buffer.
:::

## Slots
One of the main goals is to open up as much custom styling as possible, and for now where possible, exposing slots are leaned towards over providing custom classes.

### CalendarEvent Slot

| Props | Prop Type     |
| ----- | ------------- |
| event | CalendarEvent |

``` vue
<template #calendarEvent="{ event }">
    <div
    class="calendar-event-card"
    :style="{ 
        backgroundColor: event.color, 
        width: '100%', 
        height: '100%' }">
    <div>{{ event.startDate }} - {{ event.endDate }}</div>
    <div>{{ event.description }}</div>
    </div>
</template>
```

::: tip
When using this slot, it's better to avoid handling click events on the root element, in favor of the `event-clicked` event, as EventCalendar needs to consume click events and may end up in odd/unexpected behavior. As long as nested elements stop propagation, they should be safe to implement them.
:::

::: info SIZING
When using this slot, your root element will automatically receive the following:
```
box-sizing: border-box
overflow: hidden
width: 100% (of value determined by concurrencyMode)
height: 100% (of height calculated by difference in minutes)
```

You are free to override these, but take special care.
:::

### DayHeader Slot
This slot is the header above each day column.

| Props | Prop Type |
| ----- | --------- |
| date  | Date      |

``` vue
<template #dayHeader="{ date }">
    <div class="day-header">
    <!-- Format the date as needed -->
    <span>{{ date.toDateString() }}</span>
    </div>
</template>
```

### TimeInterval Slot
The time display for each horizontal hour line. These will be centered vertically with each hour line.

| Props | Prop Type |
| ----- | --------- |
| hour  | number    |

``` vue
<template #timeInterval="{ hour }">
    <div class="time-interval">
    <!-- Display the hour or format as needed -->
    <span>{{ hour }}:00</span>
    </div>
</template>
```
