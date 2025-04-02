<script setup lang="ts">
import Canvas from './components/Canvas.vue'
import Knots from './components/Knots.vue'
import Widgets from './components/Widgets.vue'
import { onMounted, ref } from 'vue'
import { ControlPoint } from './components/ts/defines'
import { ElMessage } from 'element-plus'

const degree = ref(0)
const knots = ref<number[]>([])
const controlPoints = ref<ControlPoint[]>([])
const importText = ref('')

const createMode = ref(false)
const newCurveDegree = ref(3)
</script>

<template>
  <div>
    <Canvas
      v-model:degree="degree"
      v-model:knots="knots"
      v-model:control-points="controlPoints"
      v-model:create-mode="createMode"
      v-model:new-curve-degree="newCurveDegree"
    />
  </div>
  <Widgets
    v-model:import-text="importText"
    v-model:degree="degree"
    v-model:knots="knots"
    v-model:control-points="controlPoints"
    v-model:create-mode="createMode"
    v-model:new-curve-degree="newCurveDegree"
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
