let point_id_counter = 0

class Point {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class ControlPoint extends Point {
  pid = point_id_counter++
  constructor(x: number, y: number) {
    super(x, y)
  }

  get config() {
    return {
      x: this.x,
      y: this.y,
      radius: 5,
      fill: 'red',
      draggable: true,
      extra: { pid: this.pid },
    }
  }
}

class Line {
  points: number[] = []
  constructor(points: Point[]) {
    for (let point of points) {
      this.points.push(point.x)
      this.points.push(point.y)
    }
  }
}

class SplinePiece extends Line {
  constructor(points: Point[]) {
    super(points)
  }
  get config() {
    return {
      points: this.points,
      stroke: 'black',
      strokeWidth: 1.5,
    }
  }
}

class ControlPointLine extends Line {
  constructor(points: Point[]) {
    super(points)
  }
  get config() {
    return {
      points: this.points,
      stroke: 'green',
      strokeWidth: 1,
      dash: [3, 5]
    }
  }
}

export { ControlPoint, SplinePiece, Point, ControlPointLine }
