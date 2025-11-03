<template>
  <Bar
    :data="chartData"
    :options="chartOptions"
  />
</template>

<script>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'LineChart',
  components: {
    Bar
  },
  props: {
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    chartOptions () {
      return {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options
      }
    }
  }
}
</script>
