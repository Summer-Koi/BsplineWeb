import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ControlPoint, ControlPointLine, SplinePiece, Point } from '../components/ts/defines'
import {
  calculateBSplinePoint,
  insertKnot,
  generateUniformKnotVector,
} from '../components/ts/utils'
import { ElMessage } from 'element-plus'

export const useBsplineStore = defineStore('bspline', () => {
  // 基本 B 样条状态
  const degree = ref(0)
  const knots = ref<number[]>([])
  const controlPoints = ref<ControlPoint[]>([])

  // 绘图相关状态
  const splinePieces = ref<SplinePiece[]>([])
  const controlPointLine = ref<ControlPointLine>()
  const basisFunctionCache = new Map<string, number>()

  // 创建模式相关状态
  const createMode = ref(false)
  const newCurveDegree = ref(3)
  const tempControlPoints = ref<ControlPoint[]>([])
  const tempControlPointLine = ref<ControlPointLine>()

  // 手动节点向量相关状态
  const useManualKnots = ref(false)
  const manualKnots = ref<number[]>([])
  const manualKnotsInput = ref('')

  // 其他UI状态
  const knotInput = ref('')
  const importText = ref('')

  // 计算属性
  const isValidBspline = computed(() => {
    if (knots.value.length === 0 || controlPoints.value.length === 0 || degree.value === 0) {
      return false
    }
    return knots.value.length === controlPoints.value.length + degree.value + 1
  })

  // ----- 方法 -----

  // 清除基函数缓存
  const clearBasisCache = () => {
    basisFunctionCache.clear()
  }

  // 更新样条曲线片段
  const updateSplinePieces = () => {
    if (!isValidBspline.value) return

    splinePieces.value = []

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

  // 更新控制点连线
  const updateControlPointLine = () => {
    if (controlPoints.value.length === 0) return
    controlPointLine.value = new ControlPointLine(controlPoints.value)
  }

  // 创建均匀节点向量
  const createUniformKnotVector = (numPoints: number, degree: number) => {
    let knotCount = numPoints + degree + 1
    let result = []

    // 开始节点
    for (let i = 0; i <= degree; i++) {
      result.push(0)
    }

    // 内部节点
    let internalKnotCount = numPoints - degree - 1
    if (internalKnotCount > 0) {
      for (let i = 1; i <= internalKnotCount; i++) {
        result.push(i / (internalKnotCount + 1))
      }
    }

    // 结束节点
    for (let i = 0; i <= degree; i++) {
      result.push(1)
    }

    return result
  }

  // ----- 交互方法 -----

  // 开始创建B样条
  const startCreatingBSpline = () => {
    createMode.value = true
    tempControlPoints.value = []
    tempControlPointLine.value = undefined
    ElMessage.info('点击画布添加控制点，点击"完成"结束创建')
  }

  // 添加临时控制点
  const addTempControlPoint = (x: number, y: number) => {
    if (!createMode.value) return

    tempControlPoints.value.push(new ControlPoint(x, y))
    tempControlPointLine.value = new ControlPointLine(tempControlPoints.value)
  }

  // 解析手动输入的节点向量
  const parseManualKnots = () => {
    try {
      if (!manualKnotsInput.value.trim()) {
        return null
      }

      // 处理输入格式
      const knotValues = manualKnotsInput.value
        .replace(/[,;，；]/g, ' ')
        .split(/\s+/)
        .filter((k) => k.trim())
        .map((k) => parseFloat(k))

      // 验证输入有效性
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

  // 完成创建B样条
  const finishCreatingBSpline = () => {
    if (!createMode.value || tempControlPoints.value.length < 2) {
      ElMessage.warning('至少需要两个控制点')
      return
    }

    // 获取节点向量
    let knotValues: number[] | null = null
    if (useManualKnots.value) {
      knotValues = parseManualKnots()
    }

    // 确定最终阶数
    const finalDegree = Math.min(newCurveDegree.value, tempControlPoints.value.length - 1)

    // 决定使用哪种节点向量
    let newKnots: number[]
    if (knotValues && knotValues.length > 0) {
      // 验证手动节点向量
      const requiredLength = tempControlPoints.value.length + finalDegree + 1
      const firstKnot = knotValues[0]
      const lastKnot = knotValues[knotValues.length - 1]
      const firstKnotCount = knotValues.filter((knot) => knot === firstKnot).length
      const lastKnotCount = knotValues.filter((knot) => knot === lastKnot).length

      if (
        firstKnotCount !== finalDegree + 1 ||
        lastKnotCount !== finalDegree + 1 ||
        knotValues.length !== requiredLength
      ) {
        ElMessage.warning('节点向量格式不符合要求，使用默认节点向量')
        newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
      } else {
        newKnots = knotValues
      }
    } else {
      // 使用均匀节点向量
      newKnots = createUniformKnotVector(tempControlPoints.value.length, finalDegree)
    }

    // 更新模型
    degree.value = finalDegree
    knots.value = newKnots
    controlPoints.value = [...tempControlPoints.value]

    // 清除临时数据
    createMode.value = false
    tempControlPoints.value = []
    tempControlPointLine.value = undefined
    manualKnots.value = []
    useManualKnots.value = false
    manualKnotsInput.value = ''

    // 更新图形
    clearBasisCache()
    updateSplinePieces()
    updateControlPointLine()

    ElMessage.success('B样条创建完成')
  }

  // 取消创建B样条
  const cancelCreatingBSpline = () => {
    createMode.value = false
    tempControlPoints.value = []
    tempControlPointLine.value = undefined
    manualKnots.value = []
    useManualKnots.value = false
    manualKnotsInput.value = ''
    ElMessage.info('已取消创建')
  }

  // 更新控制点位置（拖动时）
  const updateControlPointPosition = (pointId: number, x: number, y: number) => {
    const point = controlPoints.value.find((p) => p.pid === pointId)
    if (point) {
      point.x = x
      point.y = y
      updateSplinePieces()
    }
  }

  // 插入节点
  const insertKnotToSpline = () => {
    if (!isValidBspline.value) {
      ElMessage.error('请先创建有效的B样条')
      return
    }

    if (knotInput.value === '') {
      ElMessage.error('请输入节点值')
      return
    }

    const newKnotValue = Number(knotInput.value)
    if (isNaN(newKnotValue)) {
      ElMessage.error('请输入有效数字')
      return
    }

    if (
      newKnotValue < knots.value[degree.value] ||
      newKnotValue > knots.value[knots.value.length - degree.value - 1]
    ) {
      ElMessage.error('节点值超出范围')
      return
    }

    const { newControlPoints, newKnots } = insertKnot(
      controlPoints.value,
      degree.value,
      knots.value,
      newKnotValue,
    )

    // 更新状态
    controlPoints.value = newControlPoints.map((p) => new ControlPoint(p.x, p.y))
    knots.value = newKnots

    // 更新图形
    clearBasisCache()
    updateSplinePieces()
    updateControlPointLine()

    ElMessage.success('节点插入成功')
    knotInput.value = ''
  }

  // 导入B样条数据
  const importBSpline = (jsonData: any) => {
    try {
      const newDegree = jsonData.degree
      const newKnots = jsonData.knots
      const newControlPoints = jsonData.controlPoints.map(
        (point: any) => new ControlPoint(point.x, point.y),
      )

      if (newDegree + newControlPoints.length + 1 !== newKnots.length) {
        throw new Error('节点数量不匹配')
      }

      degree.value = newDegree
      knots.value = newKnots
      controlPoints.value = newControlPoints

      clearBasisCache()
      updateSplinePieces()
      updateControlPointLine()

      ElMessage.success('导入成功')
    } catch (e) {
      ElMessage.error(`导入失败: ${e}`)
      degree.value = 0
      knots.value = []
      controlPoints.value = []
    }
  }

  // 导出B样条数据
  const exportBSpline = () => {
    if (!isValidBspline.value) {
      ElMessage.error('没有有效的B样条数据可导出')
      return
    }

    const data = {
      degree: degree.value,
      knots: knots.value,
      controlPoints: controlPoints.value.map((p) => ({ x: p.x, y: p.y })),
    }

    navigator.clipboard.writeText(JSON.stringify(data, null))
    ElMessage.success('已复制到剪贴板')
  }

  // 加载示例数据
  const loadExampleData = (exampleDegree: number, numPoints: number) => {
    try {
      import(`../components/data/d${exampleDegree}p${numPoints}.json`)
        .then((data) => {
          importBSpline(data.default)
        })
        .catch(() => {
          ElMessage.error('加载示例数据失败')
        })
    } catch (e) {
      ElMessage.error('加载示例数据失败')
    }
  }

  return {
    // 状态
    degree,
    knots,
    controlPoints,
    splinePieces,
    controlPointLine,
    createMode,
    newCurveDegree,
    tempControlPoints,
    tempControlPointLine,
    useManualKnots,
    manualKnots,
    manualKnotsInput,
    knotInput,
    importText,

    // 计算属性
    isValidBspline,

    // 方法
    clearBasisCache,
    updateSplinePieces,
    updateControlPointLine,
    createUniformKnotVector,
    startCreatingBSpline,
    addTempControlPoint,
    finishCreatingBSpline,
    cancelCreatingBSpline,
    updateControlPointPosition,
    insertKnotToSpline,
    importBSpline,
    exportBSpline,
    loadExampleData,
  }
})
