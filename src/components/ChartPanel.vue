<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
]);

const props = defineProps<{
  option: EChartsCoreOption;
  label: string;
}>();
const root = ref<HTMLDivElement>();
let chart: echarts.ECharts | undefined;
let observer: ResizeObserver | undefined;

const render = () => {
  if (!root.value) return;
  if (!chart) chart = echarts.init(root.value, undefined, { renderer: "canvas" });
  chart.setOption(props.option, true);
};

onMounted(() => {
  render();
  if (root.value) {
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(root.value);
  }
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  observer?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div ref="root" class="chart-canvas" role="img" :aria-label="label" />
</template>
