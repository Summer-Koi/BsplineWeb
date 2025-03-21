<script setup lang="ts">
import { ControlPoint, SplinePiece, Point } from './defines'
import { ElMessage } from 'element-plus'

const importText = defineModel<string>('importText')

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const importBSpline = () => {
  if (importText.value === undefined) return
  try {
    const data = JSON.parse(importText.value)
    degree.value = data.degree
    knots.value = data.knots
    controlPoints.value = data.controlPoints.map((point: any) => new ControlPoint(point.x, point.y))
  } catch (e) {
    console.error(e)
  }
}

const exportBSpline = () => {
  if (degree.value === undefined || knots.value === undefined || controlPoints.value === undefined)
    return
  const data = {
    degree: degree.value,
    knots: knots.value,
    controlPoints: controlPoints.value.map((point) => ({ x: point.x, y: point.y })),
  }
  importText.value = JSON.stringify(data, null)
  navigator.clipboard.writeText(importText.value)
  ElMessage.success('已复制到剪贴板')
}
</script>

<template>
  <div class="widget-container">
    <div>输入文本以导入B样条</div>
    <el-input
      v-model="importText"
      style="width: 240px"
      :autosize="{ minRows: 2, maxRows: 4 }"
      type="textarea"
      placeholder="Please input"
    />
    <div>
      <el-button @click="importBSpline">导入</el-button>
      <el-button @click="exportBSpline">导出</el-button>
    </div>
    <div>
      示例数据： { "degree": 3, "knots": [ 0, 0, 0, 0, 1, 2, 3, 3, 3, 3 ], "controlPoints": [ { "x":
      10, "y": 50 }, { "x": 100, "y": 100 }, { "x": 200, "y": 200 }, { "x": 300, "y": 100 }, { "x":
      400, "y": 200 }, { "x": 400, "y": 400 } ] }
    </div>
    <div>{{ controlPoints }}</div>
    <div>{{ degree }}</div>
    <div>{{ knots }}</div>
  </div>
</template>
