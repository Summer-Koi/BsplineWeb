<script setup lang="ts">
import { ControlPoint, SplinePiece, Point } from './ts/defines'
import { insertKnot } from './ts/utils'
import { ElMessage } from 'element-plus'
import { ref, nextTick } from 'vue'

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const knotInput = ref('')

const importBSpline = (jsondata: any) => {
  try {
    degree.value = jsondata.degree
    knots.value = jsondata.knots
    controlPoints.value = jsondata.controlPoints.map(
      (point: any) => new ControlPoint(point.x, point.y),
    )
    nextTick(() => {
      try {
        if (
          degree.value === undefined ||
          knots.value === undefined ||
          controlPoints.value === undefined
        )
          throw new Error('数据格式错误')
        if (degree.value + 1 + controlPoints.value.length !== knots.value.length)
          throw new Error('节点数不匹配')
        ElMessage.success('导入成功')
      } catch (e) {
        ElMessage.error('导入失败，错误原因：' + e)
        degree.value = 0
        knots.value = []
        controlPoints.value = []
      }
    })
  } catch (e) {
    ElMessage.error('导入失败，错误原因：' + e)
    degree.value = 0
    knots.value = []
    controlPoints.value = []
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
  navigator.clipboard.writeText(JSON.stringify(data, null))
  ElMessage.success('已复制到剪贴板')
}

const onImportExampleClick = (degree: number, num_points: number) => {
  try {
    const importPromise = import(`./data/d${degree}p${num_points}.json`)
    importPromise
      .then((data) => {
        importBSpline(data.default)
      })
      .catch((error) => {
        ElMessage.error('导入示例数据失败')
      })
  } catch (e) {
    ElMessage.error('导入示例数据失败')
  }
}

const onInsertKnotClick = () => {
  if (degree.value === undefined || knots.value === undefined || controlPoints.value === undefined)
    return
  if (knotInput.value === '') {
    ElMessage.error('请输入节点值')
    return
  }
  if (knots.value.length === 0) {
    ElMessage.error('请先导入数据')
    return
  }
  const newKnot = Number(knotInput.value)
  if (newKnot === undefined) return
  if (isNaN(newKnot)) {
    ElMessage.error('请输入数字')
    return
  }
  if (
    newKnot < knots.value[degree.value] ||
    newKnot > knots.value[knots.value.length - degree.value - 1]
  ) {
    ElMessage.error('节点值超出范围')
    return
  }
  const { newControlPoints, newKnots } = insertKnot(
    controlPoints.value,
    degree.value,
    knots.value,
    newKnot,
  )
  let controlPointsValue = []
  for (const point of newControlPoints) {
    controlPointsValue.push(new ControlPoint(point.x, point.y))
  }
  controlPoints.value = []
  controlPoints.value = controlPointsValue
  knots.value = []
  knots.value = newKnots
}
</script>

<template>
  <div class="widget-container">
    <div class="widget-box" style="border-color: dodgerblue">
      <h3 style="font-weight: bold">导入/导出</h3>
      <span>示例数据：</span>
      <br />
      <el-button @click="onImportExampleClick(2, 3)">2阶-3点</el-button>
      <el-button @click="onImportExampleClick(2, 6)">2阶-6点</el-button>
      <el-button @click="onImportExampleClick(3, 5)">3阶-5点</el-button>
      <el-button @click="onImportExampleClick(3, 7)">3阶-7点</el-button>
      <div class="mt-10"/>
      <el-button type="primary" @click="exportBSpline">导出</el-button>
    </div>
    <div class="widget-box" style="border-color:coral">
      <h3 style="font-weight: bold">插节点</h3>
      <span>节点向量：{{ knots }}</span>
      <br />
      <span>手动插入：</span>
      <el-input v-model="knotInput" style="width: 150px; margin-right: 10px;" placeholder="Please input" />
      <el-button @click="onInsertKnotClick">插入节点</el-button>
    </div>  
    <div>
    </div>
  </div>
</template>

<style scoped>
.widget-container {
  width: 500px;
}
.widget-box {
  border: 1px solid;
  border-radius: 10px;
  margin-left: 10px;
  padding: 20px;
  margin-bottom: 10px;
}
.mt-10 {
  margin-top: 10px;
}
</style>
