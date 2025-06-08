<script setup lang="ts">
import { ControlPoint, SplinePiece, Point } from './ts/defines'
import { insertKnot } from './ts/utils'
import { ElMessage } from 'element-plus'
import { ref, nextTick } from 'vue'

const knots = defineModel<number[]>('knots')
const degree = defineModel<number>('degree')
const controlPoints = defineModel<ControlPoint[]>('controlPoints')

const knotInput = ref('')
const createMode = defineModel<boolean>('createMode')
const newCurveDegree = defineModel<number>('newCurveDegree')

// 添加节点向量手动输入
const manualKnotsInput = ref('')
const useManualKnots = ref(false)

// 添加导入文本输入
const importTextInput = ref('')

// 解析手动输入的节点向量
const parseManualKnots = () => {
  try {
    if (!manualKnotsInput.value.trim()) {
      return null
    }

    // 处理可能的不同输入格式（逗号、空格分隔等）
    const knotValues = manualKnotsInput.value
      .replace(/[,;，；]/g, ' ')
      .split(/\s+/)
      .filter((k) => k.trim())
      .map((k) => parseFloat(k))

    // 验证所有输入都是有效数字
    if (knotValues.some(isNaN)) {
      ElMessage.warning('节点向量包含无效数值')
      return null
    }

    // 验证节点向量是非递减的
    for (let i = 1; i < knotValues.length; i++) {
      if (knotValues[i] < knotValues[i - 1]) {
        ElMessage.warning('节点向量必须是非递减序列')
        return null
      }
    }

    return knotValues
  } catch (e) {
    ElMessage.error('节点向量解析失败')
    return null
  }
}

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

const startCreatingBSpline = () => {
  if (createMode.value) return
  createMode.value = true
  ElMessage.info('点击画布添加控制点，点击"完成"结束创建')
}

const emits = defineEmits(['manual-knots-input'])

const finishCreatingBSpline = () => {
  // 解析并检查手动节点向量
  const knotValues = useManualKnots.value ? parseManualKnots() : null

  // 发送节点向量到父组件
  emits('manual-knots-input', knotValues)

  // 退出创建模式

  ElMessage.success('B样条创建完成')
}

const cancelCreatingBSpline = () => {
  createMode.value = false
  ElMessage.info('已取消创建')
  useManualKnots.value = false
}

const importBSplineFromText = () => {
  if (!importTextInput.value.trim()) {
    ElMessage.warning('请输入有效的B样条数据')
    return
  }

  try {
    const jsonData = JSON.parse(importTextInput.value)
    importBSpline(jsonData)
    importTextInput.value = '' // 导入成功后清空输入框
  } catch (e) {
    ElMessage.error('解析导入数据失败，请确保格式正确')
  }
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

      <div class="mt-10">
        <el-input
          v-model="importTextInput"
          type="textarea"
          :rows="3"
          placeholder="粘贴B样条数据进行导入"
        />
      </div>

      <div class="mt-10">
        <el-button type="primary" @click="importBSplineFromText" style="margin-right: 10px"
          >导入</el-button
        >
        <el-button type="primary" @click="exportBSpline">导出</el-button>
      </div>
    </div>
    <div class="widget-box" style="border-color: coral">
      <h3 style="font-weight: bold">插节点</h3>
      <span>节点向量：{{ knots }}</span>
      <br />
      <span>手动插入：</span>
      <el-input
        v-model="knotInput"
        style="width: 150px; margin-right: 10px"
        placeholder="Please input"
      />
      <el-button @click="onInsertKnotClick">插入节点</el-button>
    </div>
    <div class="widget-box" style="border-color: mediumseagreen">
      <h3 style="font-weight: bold">创建新B样条</h3>
      <div>
        <span>设置阶数: </span>
        <el-input-number v-model="newCurveDegree" :min="2" :disabled="createMode" />
      </div>

      <!-- 添加节点向量输入区域 -->
      <div class="mt-10">
        <el-checkbox v-model="useManualKnots" :disabled="createMode">手动设置节点向量</el-checkbox>
        <div v-if="useManualKnots" class="mt-10">
          <el-input
            v-model="manualKnotsInput"
            :disabled="createMode"
            type="textarea"
            :rows="2"
            placeholder="输入节点向量（如: 0 0 0 0.3 0.7 1 1 1）"
          />
          <div class="mt-10" style="font-size: 12px; color: #666">
            提示：节点值需要从小到大排序，用空格或逗号分隔
          </div>
        </div>
      </div>

      <div class="mt-10">
        <el-button type="primary" @click="startCreatingBSpline" :disabled="createMode">
          开始创建
        </el-button>
        <el-button type="success" @click="finishCreatingBSpline" :disabled="!createMode">
          完成
        </el-button>
        <el-button @click="cancelCreatingBSpline" :disabled="!createMode"> 取消 </el-button>
      </div>
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
