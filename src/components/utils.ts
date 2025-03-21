// utils.ts

const memo: { [key: string]: number } = {}

/**
 * Calculate the B-spline basis function
 * @param i - The index of the basis function
 * @param k - The degree of the basis function
 * @param t - The parameter
 * @param knots - The knot vector
 * @returns The value of the basis function at t
 */
function basisFunction(i: number, k: number, t: number, knots: number[]): number {
  const key = `${i}-${k}-${t}`
  if (memo[key] !== undefined) {
    return memo[key]
  }

  let result: number
  if (k === 0) {
    result = knots[i] <= t && t < knots[i + 1] ? 1 : 0
  } else {
    const denom1 = knots[i + k] - knots[i]
    const denom2 = knots[i + k + 1] - knots[i + 1]
    const term1 = denom1 === 0 ? 0 : ((t - knots[i]) / denom1) * basisFunction(i, k - 1, t, knots)
    const term2 =
      denom2 === 0 ? 0 : ((knots[i + k + 1] - t) / denom2) * basisFunction(i + 1, k - 1, t, knots)
    result = term1 + term2
  }

  memo[key] = result
  return result
}

/* function basisFunction(i: number, k: number, t: number, knots: number[]): number {
  if (k === 0) {
    return knots[i] <= t && t < knots[i + 1] ? 1 : 0
  } else {
    const denom1 = knots[i + k] - knots[i]
    const denom2 = knots[i + k + 1] - knots[i + 1]
    const term1 = denom1 === 0 ? 0 : ((t - knots[i]) / denom1) * basisFunction(i, k - 1, t, knots)
    const term2 =
      denom2 === 0 ? 0 : ((knots[i + k + 1] - t) / denom2) * basisFunction(i + 1, k - 1, t, knots)
    return term1 + term2
  }
} */

/**
 * Calculate the B-spline curve point at parameter t
 * @param controlPoints - The control points of the B-spline
 * @param degree - The degree of the B-spline
 * @param knots - The knot vector
 * @param t - The parameter
 * @returns The point on the B-spline curve at parameter t
 */
function calculateBSplinePoint(
  controlPoints: { x: number; y: number }[],
  degree: number,
  knots: number[],
  t: number,
): { x: number; y: number } {
  const n = controlPoints.length - 1
  let point = { x: 0, y: 0 }

  for (let i = 0; i <= n; i++) {
    const basis = basisFunction(i, degree, t, knots)
    point.x += basis * controlPoints[i].x
    point.y += basis * controlPoints[i].y
  }

  return point
}

export { calculateBSplinePoint }
