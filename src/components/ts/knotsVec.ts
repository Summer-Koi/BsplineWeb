class KnotsVector {
  knots: number[]
  constructor(knots: number[]) {
    this.knots = knots
    this.knots.sort((a, b) => a - b)
  }

  setKnots(knots: number[]) {
    this.knots = knots
    this.knots.sort((a, b) => a - b)
  }

  normalizeKnotsXPosition(
    knots: number[],
    min: number,
    max: number,
    left: number = 20,
    right: number = 580,
  ) {
    let knotsXPosition = knots.map((knot) => {
      return ((knot - min) / (max - min)) * (right - left) + left
    })
    return knotsXPosition
  }

  get uniqueKnots() {
    return [...new Set(this.knots)]
  }

  get duplicateKnots() {
    let duplicates = this.knots.filter((knot, index) => {
      return this.knots.indexOf(knot) !== index
    })
    return duplicates
  }

  get uniqueKnotsConfig() {
    let normUniqueKnots = this.normalizeKnotsXPosition(
      this.uniqueKnots,
      Math.min(...this.uniqueKnots),
      Math.max(...this.uniqueKnots),
    )
    return normUniqueKnots.map((knot) => {
      return {
        x: knot,
        y: 40,
        radius: 4,
        fill: 'black',
      }
    })
  }
}

export { KnotsVector }
