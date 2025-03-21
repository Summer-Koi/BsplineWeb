// utils.ts

/**
 * Calculate the B-spline basis function with scoped memo
 * @param i - The index of the basis function
 * @param k - The degree of the basis function
 * @param t - The parameter
 * @param knots - The knot vector
 * @param memo - local cache for this computation
 * @returns The value of the basis function at t
 */
function basisFunction(
  i: number,
  k: number,
  t: number,
  knots: number[],
  memo: Map<string, number>,
): number {
  const key = `${i}-${k}-${t.toFixed(6)}`
  if (memo.has(key)) {
    return memo.get(key)!
  }

  let result: number
  if (k === 0) {
    result = knots[i] <= t && t < knots[i + 1] ? 1 : 0
  } else {
    const denom1 = knots[i + k] - knots[i]
    const denom2 = knots[i + k + 1] - knots[i + 1]
    const term1 =
      denom1 === 0 ? 0 : ((t - knots[i]) / denom1) * basisFunction(i, k - 1, t, knots, memo)
    const term2 =
      denom2 === 0
        ? 0
        : ((knots[i + k + 1] - t) / denom2) * basisFunction(i + 1, k - 1, t, knots, memo)
    result = term1 + term2
  }

  memo.set(key, result)
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
 * @param memo - local cache for this computation
 * @returns The point on the B-spline curve at parameter t
 */
function calculateBSplinePoint(
  controlPoints: { x: number; y: number }[],
  degree: number,
  knots: number[],
  t: number,
  memo: Map<string, number>,
): { x: number; y: number } {
  const n = controlPoints.length - 1
  let point = { x: 0, y: 0 }

  for (let i = 0; i <= n; i++) {
    const basis = basisFunction(i, degree, t, knots, memo)
    point.x += basis * controlPoints[i].x
    point.y += basis * controlPoints[i].y
  }

  return point
}

export { calculateBSplinePoint }
