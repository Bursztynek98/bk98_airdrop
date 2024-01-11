import EventEmitter2 from 'eventemitter2';
import { Model, ParticleEffectAsset, Prop, Vector3 } from 'fivem-js';
import { DrawChecker } from 'utils/draw-checker';
import { FrameSkipper } from 'utils/frame-skipper';
import { LinearFunctionFromPoints } from 'utils/linear-function-from-points';

import { PROP_DISAPPEAR_TIME } from '@shared/constant/prop-disappear-time.const';
import { PROP_SPEED } from '@shared/constant/prop-speed.const';

import { PROP_EVENT_NAME } from 'constant/prop-event-name.const';
import { PROP_FRAME_SKIPPER } from 'constant/prop-frame-skipper.const';
import { PROP_PARACHUTE_MODEL } from 'constant/prop-parachute-model.const';
import { PROP_VISIBLE_RADIUS } from 'constant/prop-visible-radius.const';

export class AirDropProp {
  private isStarted = false;

  private drawBreak = false;

  private readonly drawChecker: DrawChecker;

  private readonly endPoint: Vector3;

  private readonly eventEmitter: EventEmitter2;

  private readonly frameSkipper: FrameSkipper;

  private readonly linearFunction: LinearFunctionFromPoints;

  private readonly objectModel: Model;

  private readonly parachuteModel: Model;

  private readonly particleEffectAsset: ParticleEffectAsset;

  private objectHandler: Prop;

  private parachuteHandler: Prop;

  /**
   * Create AirDropProp
   * @param id Uniq ID of AirDropProp
   * @param objectModel Name of prop to land. Example: "prop_drop_armscrate_01b",
   * @param startPoint Position of spawn AirDrop
   * @param startNetTime Network time when landing is started (from server!)
   * @param speed Speed in m/s 9.81 m/s Earth acceleration!
   * @param visibleRadius Visible distance to draw Prop
   * @param disappearTime How long object can be visible after landing
   */
  constructor(
    public readonly id: string,
    objectModel: string | number,
    startPoint: Vector3,
    z: number,
    startNetTime: number,
    speed?: number,
    private readonly visibleRadius?: number,
    private readonly disappearTime?: number,
  ) {
    if (!this.visibleRadius) this.visibleRadius = PROP_VISIBLE_RADIUS;
    if (!this.disappearTime) this.disappearTime = PROP_DISAPPEAR_TIME;

    this.endPoint = new Vector3(startPoint.x, startPoint.y, z);

    const distance = this.endPoint.distance(startPoint);
    const endNetTime = startNetTime + (distance / (speed || PROP_SPEED)) * 1000;
    this.drawChecker = new DrawChecker(
      startPoint,
      this.endPoint,
      startNetTime,
      endNetTime,
      this.visibleRadius,
      true,
    );
    this.linearFunction = new LinearFunctionFromPoints(
      [0.0, 0],
      [1.0, PROP_FRAME_SKIPPER],
    );

    this.eventEmitter = new EventEmitter2();
    this.frameSkipper = new FrameSkipper(0);
    this.objectModel = new Model(objectModel);
    this.parachuteModel = new Model(PROP_PARACHUTE_MODEL);
    this.particleEffectAsset = new ParticleEffectAsset('core');
  }

  private get objectHandlerExist() {
    return this.objectHandler && this.objectHandler?.exists();
  }

  private minZ(z: number) {
    if (z <= this.endPoint.z) {
      return z;
    }
    return this.endPoint.z;
  }

  private setPosition(position: Vector3) {
    if (position.z <= this.endPoint.z) {
      this.objectHandler.placeOnGround();
      this.parachuteHandler && this.parachuteHandler.delete();
      this.parachuteHandler = null;
      return true;
    }
    this.objectHandler.Position = position;
    return false;
  }

  private async spawn(position: Vector3, realFinish: boolean) {
    if (this.objectHandlerExist) {
      return this.setPosition(position);
    }

    if (!this.objectModel.IsProp || !(await this.objectModel.request(1000))) {
      return null;
    }

    if (
      !this.parachuteModel.IsProp ||
      !(await this.parachuteModel.request(1000))
    ) {
      return null;
    }

    this.objectHandler = new Prop(
      CreateObject(
        this.objectModel.Hash,
        position.x,
        position.y,
        this.minZ(position.z),
        false,
        false,
        false,
      ),
    );
    this.objectHandler.IsPositionFrozen = true;
    this.objectHandler.LodDistance = this.visibleRadius;
    this.objectHandler.IsInvincible = true;

    if (position.z > this.endPoint.z) {
      this.parachuteHandler = new Prop(
        CreateObject(
          this.parachuteModel.Hash,
          position.x,
          position.y,
          this.minZ(position.z),
          false,
          false,
          false,
        ),
      );

      this.parachuteHandler.attachTo(
        this.objectHandler,
        new Vector3(0.0, 0.0, 0.1),
        new Vector3(0.0, 0.0, 0.0),
      );
      this.parachuteHandler.Velocity = new Vector3(0.0, 0.0, -0.2);
      this.parachuteHandler.LodDistance = this.visibleRadius;
      this.parachuteHandler.IsInvincible = true;
    }
    this.setPosition(position);
    this.particleEffectAsset.startNonLoopedOnEntity(
      'weap_heist_flare_trail',
      this.objectHandler,
      undefined,
      undefined,
      1.0,
    );
    this.eventEmitter.emit(PROP_EVENT_NAME.SPAWN, {
      object: this.objectHandler?.Handle,
      parachute: this.parachuteHandler?.Handle,
      realFinish,
    });
    return null;
  }

  public on(event: string, callback: (...args: any[]) => void) {
    return this.eventEmitter.on(event, callback);
  }

  public delete() {
    this.objectHandler && this.objectHandler.delete();
    this.parachuteHandler && this.parachuteHandler.delete();
    this.eventEmitter.emit(PROP_EVENT_NAME.DELETE, {
      object: this.objectHandler?.Handle,
      parachute: this.parachuteHandler?.Handle,
    });
    this.objectHandler = null;
    this.parachuteHandler = null;
  }

  // call every tick
  public draw(currentNetworkTime: number) {
    if (this.drawBreak) return;
    try {
      if (!this.objectHandlerExist) return;
      if (this.frameSkipper.shouldSkipFrame) return;
      this.drawBreak = this.setPosition(
        this.drawChecker.currentObjectCord(currentNetworkTime),
      );
    } catch (e) {
      throw new Error(
        `Failed exec draw for AirDropProp (${this.id}) error: ${e.message}`,
      );
    }
  }

  // Call every second
  public async shouldDraw(playerCords: Vector3, currentNetworkTime: number) {
    try {
      if (this.drawChecker.netOffset(currentNetworkTime) < 0.0) return null;
      const [
        shouldDraw,
        visibleFactor,
        currentObjectCord,
        finish,
        realFinish,
        started,
      ] = this.drawChecker.shouldDraw(
        playerCords,
        currentNetworkTime,
        this.disappearTime,
      );

      if (!this.isStarted && started) {
        this.isStarted = true;
        this.eventEmitter.emit(PROP_EVENT_NAME.START);
      }

      if (
        !this.objectHandlerExist ||
        (this.objectHandlerExist &&
          this.objectHandler?.Position?.distance(currentObjectCord) > 0.005)
      ) {
        this.eventEmitter.emit(PROP_EVENT_NAME.UPDATE_POSITION, {
          object: this.objectHandler?.Handle,
          parachute: this.parachuteHandler?.Handle,
          cord: [currentObjectCord.x, currentObjectCord.y, currentObjectCord.z],
          realFinish,
        });
      }
      this.frameSkipper.frameToSkip =
        this.linearFunction.gatRound(visibleFactor);
      if (shouldDraw && !this.objectHandlerExist) {
        await this.spawn(currentObjectCord, realFinish);
      } else if (!shouldDraw && this.objectHandlerExist) {
        this.delete();
      }

      return finish;
    } catch (e) {
      throw new Error(
        `Failed exec shouldDraw for AirDropProp (${this.id}) error: ${e.message}`,
      );
    }
  }
}
