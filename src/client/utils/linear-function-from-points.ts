export type Vec2 = [number, number];

export class LinearFunctionFromPoints {
  private m: number;

  private b: number;

  /**
   * Create Linear Function
   * Set point1 to [0, 0] and point2 to [100, 1]
   * Wheen you call gatRound(50) you will get 0.5
   * @param point1 [x: Number, y: Number]
   * @param point2 [x: Number, y: Number]
   */
  constructor(point1: Vec2, point2: Vec2) {
    this.m = (point2[1] - point1[1]) / (point2[0] - point1[0]);
    this.b = point1[1] - this.m * point1[0];
  }

  public gatValue(x: number) {
    return this.m * x + this.b;
  }

  public gatRound(x: number) {
    return Math.round(this.gatValue(x));
  }
}
