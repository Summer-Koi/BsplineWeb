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
</script>

<template>
  <div class="left-container">
    <Canvas v-model:degree="degree" v-model:knots="knots" v-model:control-points="controlPoints" />
    <Knots v-model:degree="degree" v-model:knots="knots" v-model:control-points="controlPoints" />
  </div>
  <Widgets
    v-model:import-text="importText"
    v-model:degree="degree"
    v-model:knots="knots"
    v-model:control-points="controlPoints"
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

.widget-container {
  display: flex;
  width: 300px;
  flex-direction: column;
}
</style>
