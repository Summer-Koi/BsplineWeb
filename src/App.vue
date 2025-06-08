<script setup lang="ts">
import Canvas from './components/Canvas.vue'
import Widgets from './components/Widgets.vue'
import { onMounted, ref } from 'vue'
import { ControlPoint } from './components/ts/defines'
import { ElMessage } from 'element-plus'

const degree = ref(0)
const knots = ref<number[]>([])
const controlPoints = ref<ControlPoint[]>([])
const importText = ref('')

// 添加手动节点向量相关属性
const createMode = ref(false)
const newCurveDegree = ref(3)
const useManualKnots = ref(false)
const manualKnots = ref<number[]>([])

// 引用组件以便进行通信
const canvasRef = ref()
const widgetsRef = ref()

// 在Widgets中输入节点向量并解析后传递给Canvas
const handleManualKnotsInput = (knotValues: number[] | null) => {
  if (knotValues) {
    manualKnots.value = knotValues
    useManualKnots.value = true
  } else {
    useManualKnots.value = false
  }
  console.log(manualKnots.value, useManualKnots.value)
  createMode.value = false
}
</script>

<template>
  <div>
    <Canvas
      ref="canvasRef"
      v-model:degree="degree"
      v-model:knots="knots"
      v-model:control-points="controlPoints"
      v-model:create-mode="createMode"
      v-model:new-curve-degree="newCurveDegree"
      v-model:use-manual-knots="useManualKnots"
      v-model:manual-knots="manualKnots"
      />
  </div>
  <Widgets
    ref="widgetsRef"
    v-model:import-text="importText"
    v-model:degree="degree"
    v-model:knots="knots"
    v-model:control-points="controlPoints"
    v-model:create-mode="createMode"
    v-model:new-curve-degree="newCurveDegree"
    @manual-knots-input="handleManualKnotsInput"
  />
</template>

<style>
body {
  display: flex;
  place-items: center;
}
#app {
  display: flex;
  padding: 0 2rem;
}
</style>
