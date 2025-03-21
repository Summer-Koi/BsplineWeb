<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ControlPoint, SplinePiece, Point } from './defines'
import { calculateBSplinePoint } from './utils'
import type { Circle } from 'konva/lib/shapes/Circle'

const stageConfig = {
  width: 600,
  height: 600,
}

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const splinePieces = ref<SplinePiece[]>([])

const updateSplinePieces = () => {
  if (!knots.value) return
  if (degree.value === undefined) return
  if (!controlPoints.value) return
  splinePieces.value = []

  //TODO: 自适应 mini piece size

  for (let i = degree.value; i < controlPoints.value.length; i++) {
    let t_start = knots.value[i]
    let t_end = knots.value[i + 1]
    let t_step = (t_end - t_start) / 20
    let points: Point[] = []
    for (let t = t_start; t < t_end + t_step / 2; t += t_step) {
      const point = calculateBSplinePoint(controlPoints.value, degree.value, knots.value, t)
      points.push(point)
    }
    splinePieces.value.push(new SplinePiece(points))
  }
}

onMounted(() => {
  updateSplinePieces()
})
watch([degree, knots, controlPoints], () => {
  updateSplinePieces()
})

const onCPointDragStart = () => {}
const onCPointDragMove = (e: any) => {
  if (!controlPoints.value) return
  let target = e.target as Circle

  for (let i = 0; i < controlPoints.value.length; i++) {
    if (controlPoints.value[i].pid === target.attrs.extra.pid) {
      controlPoints.value[i].x = target.x()
      controlPoints.value[i].y = target.y()
      break
    }
  }

  updateSplinePieces()
}
const onCPointDragEnd = () => {}
</script>

<template>
  <div class="main-canvas">
    <v-stage :config="stageConfig">
      <v-layer>
        <v-line v-for="splinePiece in splinePieces" :config="splinePiece.config" />
        <v-circle
          v-for="controlPoint in controlPoints"
          :config="controlPoint.config"
          @dragstart="onCPointDragStart"
          @dragmove="onCPointDragMove"
          @dragend="onCPointDragEnd"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.main-canvas {
  border: 1px solid #000;
  width: 600px;
  height: 600px;
}
</style>
