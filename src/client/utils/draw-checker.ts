import { Vector3 } from "fivem-js";
import { LinearFunctionFromPoints } from "utils/linear-function-from-points";

export class DrawChecker {
  private readonly linearFunction: LinearFunctionFromPoints;
  private readonly offset: Vector3;
  public readonly heading: number;

  constructor(
    private readonly startPoint: Vector3,
    endPoint: Vector3,
    startNetTime: number,
    private readonly endNetTime: number,
    public readonly visibleRadius: number,
    private readonly stopOnFinish = false
  ) {
    this.offset = endPoint.subtract(startPoint);
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    this.heading = GetHeadingFromVector_2d(dx, dy);

    this.linearFunction = new LinearFunctionFromPoints(
      [startNetTime, 0.0],
      [endNetTime, 1.0]
    );
  }

  public netOffset(currentNetworkTime: number) {
    const offset = this.linearFunction.gatValue(currentNetworkTime);
    return this.stopOnFinish ? Math.min(offset, 1.0) : offset;
  }

  public currentObjectCord(currentNetworkTime: number) {
    return Vector3.add(
      this.startPoint,
      Vector3.multiply(this.offset, this.netOffset(currentNetworkTime))
    );
  }

  public finish(currentNetworkTime: number, extraEndNetTime?: number) {
    return currentNetworkTime >= this.endNetTime + (extraEndNetTime || 0);
  }

  public shouldDraw(
    playerCords: Vector3,
    currentNetworkTime: number,
    extraEndNetTime?: number
  ): [
    shouldDraw: boolean,
    visibleFactor: number,
    currentObjectCord: Vector3,
    finish: boolean
  ] {
    const currentObjectCord = this.currentObjectCord(currentNetworkTime);
    const distance = playerCords.distance(currentObjectCord);
    const finish = this.finish(currentNetworkTime, extraEndNetTime);

    return [
      distance < this.visibleRadius,
      distance / this.visibleRadius,
      currentObjectCord,
      finish,
    ];
  }
}
