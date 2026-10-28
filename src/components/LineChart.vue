<template>
  <Bar :data="chartData" :options="options"></Bar>
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip)

export default {
  name: 'LineChart',
  components: { Bar },
  props: {
    chartData: { type: Object, required: true },
    options: Object
  }
}
</script>
