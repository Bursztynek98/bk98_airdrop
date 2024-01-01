export class FrameSkipper {
  private frame: number;

  private currentSkipFrame: number = 0;

  constructor(frameToSkip: number) {
    this.frame = frameToSkip;
    this.currentSkipFrame = frameToSkip;
  }

  public get shouldSkipFrame(): boolean {
    if (this.frame === 0) return false;
    this.currentSkipFrame -= 1;
    if (this.currentSkipFrame <= 0) {
      this.currentSkipFrame = this.frame;
      return false;
    }
    return true;
  }

  public set frameToSkip(value: number) {
    this.frame = value;
    this.currentSkipFrame = 0;
  }

  public get isSkip() {
    return this.currentSkipFrame - 1 > 0;
  }
}
