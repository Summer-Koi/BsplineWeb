<script setup lang="ts">
import Canvas from './components/Canvas.vue'
import Widgets from './components/Widgets.vue'
import { ref } from 'vue'
import { ControlPoint } from './components/defines'
import { ElMessage } from 'element-plus'

const degree = ref(0)
const knots = ref([])
const controlPoints = ref<ControlPoint[]>([])
const importText = ref('')


</script>

<template>
  <Canvas v-model:degree="degree" v-model:knots="knots" v-model:control-points="controlPoints" />
  <Widgets v-model:import-text="importText" v-model:degree="degree" v-model:knots="knots" v-model:control-points="controlPoints" />
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
