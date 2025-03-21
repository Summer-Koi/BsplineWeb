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

class SplinePiece {
  points: number[] = []
  constructor(points: Point[]) {
    for (let point of points) {
      this.points.push(point.x)
      this.points.push(point.y)
    }
  }

  get config() {
    return {
      points: this.points,
      stroke: 'black',
      strokeWidth: 1,
    }
  }
}

export { ControlPoint, SplinePiece, Point }
