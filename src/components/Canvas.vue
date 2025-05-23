<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ControlPoint, SplinePiece, Point, ControlPointLine } from './ts/defines'
import { calculateBSplinePoint, generateUniformKnotVector } from './ts/utils'
import type { Circle } from 'konva/lib/shapes/Circle'
import { ElMessage } from 'element-plus'

const stageConfig = {
  width: 600,
  height: 600,
}

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const splinePieces = ref<SplinePiece[]>([])
const controlPointLine = ref<ControlPointLine>()

const basisFunctionCache = new Map<string, number>()
const clearBasisCache = () => {
  basisFunctionCache.clear()
}

const updateSplinePieces = () => {
  if (knots.value === undefined) return
  if (degree.value === undefined) return
  if (controlPoints.value === undefined) return
  if (knots.value.length !== degree.value + 1 + controlPoints.value.length) return
  splinePieces.value = []

  //TODO: 自适应 mini piece size

  for (let i = degree.value; i < controlPoints.value.length; i++) {
    let t_start = knots.value[i]
    let t_end = knots.value[i + 1]
    let num_pieces = 20
    let t_step = (t_end - t_start) / 20
    let points: Point[] = []
    for (let j = 0; j <= num_pieces; j++) {
      let t = t_start + j * t_step
      let point = calculateBSplinePoint(
        controlPoints.value,
        degree.value,
        knots.value,
        t,
        basisFunctionCache,
      )
      points.push(point)
    }
    splinePieces.value.push(new SplinePiece(points))
  }
}

const updateControlPointLine = () => {
  if (controlPoints.value === undefined) return
  controlPointLine.value = new ControlPointLine(controlPoints.value)
}

onMounted(() => {
  clearBasisCache()
  updateSplinePieces()
  updateControlPointLine()
})
watch(
  [degree, knots, controlPoints],
  () => {
    clearBasisCache()
    updateSplinePieces()
    updateControlPointLine()
  },
  { deep: true },
)

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

// For create mode
const createMode = defineModel<boolean>('createMode')
const newCurveDegree = defineModel<number>('newCurveDegree')
const tempControlPoints = ref<ControlPoint[]>([])
const tempControlPointLine = ref<ControlPointLine>()

// Add this function to generate a uniform knot vector
const createUniformKnotVector = (numPoints: number, degree: number) => {
  let knotCount = numPoints + degree + 1
  let knots = []

  // Add degree+1 knots at the start with value 0
  for (let i = 0; i <= degree; i++) {
    knots.push(0)
  }

  // Add internal knots with uniform spacing
  let internalKnotCount = numPoints - degree - 1
  if (internalKnotCount > 0) {
    for (let i = 1; i <= internalKnotCount; i++) {
      knots.push(i / (internalKnotCount + 1))
    }
  }

  // Add degree+1 knots at the end with value 1
  for (let i = 0; i <= degree; i++) {
    knots.push(1)
  }

  return knots
}

// 添加接收手动节点向量的属性
const useManualKnots = defineModel<boolean>('useManualKnots')
const manualKnots = defineModel<number[]>('manualKnots')

// Handle stage click for adding control points in create mode
const onStageClick = (e: any) => {
  if (!createMode.value) return

  // Get click position
  const stage = e.target.getStage()
  const pos = stage.getPointerPosition()

  // Add new control point
  tempControlPoints.value.push(new ControlPoint(pos.x, pos.y))

  // Update the temp line that connects control points
  tempControlPointLine.value = new ControlPointLine(tempControlPoints.value)
}

// Update create mode based on widgets component
watch(
  () => createMode.value,
  (newMode) => {
    if (newMode) {
      // Start creating a new curve
      tempControlPoints.value = []
      tempControlPointLine.value = undefined
    } else if (tempControlPoints.value.length >= 2) {
      // User finished creating the curve - apply it to the main display

      // Get the chosen degree from widgets
      const newDegree = newCurveDegree.value!

      // Make sure degree is valid based on number of points
      const finalDegree = Math.min(newDegree, tempControlPoints.value.length - 1)
      // const finalDegree = newDegree

      // 决定是否使用手动节点向量
      let newKnots: number[]

      if (useManualKnots.value && manualKnots.value && manualKnots.value.length > 0) {
        // 检查手动节点向量是否符合要求
        const requiredLength = tempControlPoints.value.length + finalDegree + 1

        // 检查节点向量前后是否有 degree + 1 个相同的值
        const firstKnot = manualKnots.value[0]
        const lastKnot = manualKnots.value[manualKnots.value.length - 1]
        const firstKnotCount = manualKnots.value.filter((knot) => knot === firstKnot).length
        const lastKnotCount = manualKnots.value.filter((knot) => knot === lastKnot).length

        // 中间的重节点最多不能重复 degree 次
        const middleKnots = manualKnots.value.slice(
          firstKnotCount,
          manualKnots.value.length - lastKnotCount,
        )
        const middleKnotCounts = middleKnots.reduce((acc: Record<number, number>, knot) => {
          acc[knot] = (acc[knot] || 0) + 1
          return acc
        }, {})
        const maxMiddleKnotCount = Math.max(...Object.values(middleKnotCounts))

        if (maxMiddleKnotCount > finalDegree) {
          ElMessage.warning(
            `节点向量中间的重节点最多不能重复 ${finalDegree} 次，但实际为 ${maxMiddleKnotCount}。使用默认节点向量。`,
          )
          newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
        } else if (firstKnotCount !== newDegree + 1) {
          ElMessage.warning(
            `节点向量前端应有 ${newDegree + 1} 个相同的值，但实际为 ${firstKnotCount}。使用默认节点向量。`,
          )
          newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
        } else if (lastKnotCount !== newDegree + 1) {
          ElMessage.warning(
            `节点向量后端应有 ${newDegree + 1} 个相同的值，但实际为 ${lastKnotCount}。使用默认节点向量。`,
          )
          newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
        } else if (manualKnots.value.length !== requiredLength) {
          ElMessage.warning(
            `节点向量长度应为 ${requiredLength}（控制点数 ${tempControlPoints.value.length} + 阶数 ${finalDegree} + 1），` +
              `但实际为 ${manualKnots.value.length}。使用默认节点向量。`,
          )
          newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
        } else {
          newKnots = manualKnots.value
        }
      } else {
        // Generate a uniform knot vector based on the number of control points and degree
        newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
      }

      // Update the data models
      degree.value = finalDegree
      knots.value = newKnots
      controlPoints.value = [...tempControlPoints.value]

      // Clear temp data
      tempControlPoints.value = []
      tempControlPointLine.value = undefined
      manualKnots.value = []
      useManualKnots.value = false
    }
  },
)
</script>

<template>
  <div class="main-canvas">
    <v-stage :config="stageConfig" @click="onStageClick">
      <v-layer>
        <!-- Regular B-spline display -->
        <v-line v-if="controlPointLine && !createMode" :config="controlPointLine.config" />
        <v-line
          v-if="!createMode"
          v-for="splinePiece in splinePieces"
          :config="splinePiece.config"
        />
        <v-circle
          v-if="!createMode"
          v-for="controlPoint in controlPoints"
          :config="controlPoint.config"
          @dragstart="onCPointDragStart"
          @dragmove="onCPointDragMove"
          @dragend="onCPointDragEnd"
        />

        <!-- Temporary control points and line during creation -->
        <v-line v-if="tempControlPointLine" :config="tempControlPointLine.config" />
        <v-circle
          v-for="point in tempControlPoints"
          :config="{
            x: point.x,
            y: point.y,
            radius: 5,
            fill: 'blue',
            draggable: false,
          }"
        />

        <!-- Create mode indicator -->
        <v-text
          v-if="createMode"
          :config="{
            x: 10,
            y: 10,
            text: '创建模式：点击添加控制点',
            fontSize: 16,
            fill: 'green',
          }"
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
