<script setup lang="ts">
import { watch, ref } from 'vue'
import { ControlPoint, SplinePiece, Point } from './ts/defines'
import { KnotsVector } from './ts/knotsVec'
import { ElMessage } from 'element-plus'

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const knotsStageConfig = {
  width: 600,
  height: 100,
}
const knotsVector = ref<KnotsVector>(new KnotsVector([]))

watch(
  knots,
  (newKnots) => {
    if (newKnots !== undefined) {
      knotsVector.value.setKnots(newKnots)
      console.log('update')
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="knots-container">
    <v-stage :config="knotsStageConfig">
      <v-layer>
        <v-circle
          v-for="(knots, index) in knotsVector.uniqueKnotsConfig"
          :config="knots"
          :key="index"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.knots-container {
  width: 600px;
  height: 100px;
  position: relative;
  border: 1px solid #3498db;
  border-top: none;
}
.node {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3498db;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
</style>
