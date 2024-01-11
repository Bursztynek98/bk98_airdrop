import EventEmitter2 from 'eventemitter2';
import { Model, Vector3 } from 'fivem-js';

import { DrawChecker } from 'utils/draw-checker';
import { FrameSkipper } from 'utils/frame-skipper';
import { LinearFunctionFromPoints } from 'utils/linear-function-from-points';

import { AIRCRAFT_EVENT_NAME } from 'constant/aircraft-event-name.const';
import { AIRCRAFT_FRAME_SKIPPER } from 'constant/aircraft-frame-skipper.const';
import { AIRCRAFT_PILOT_MODEL } from 'constant/aircraft-pilot-model.const';
import { AIRCRAFT_VISIBLE_RADIUS } from 'constant/aircraft-visible-radius.const';

export class AirDropAircraft {
  private isStarted = false;

  private readonly drawChecker: DrawChecker;

  private readonly eventEmitter: EventEmitter2;

  private readonly frameSkipper: FrameSkipper;

  private readonly linearFunction: LinearFunctionFromPoints;

  private readonly objectModel: Model;

  private readonly pilotModel: Model;

  private objectHandler: number;

  private pilotHandler: number;

  /**
   * Create AirDropAircraft
   * @param id Uniq ID of AirDropProp
   * @param objectModel Name of Aircraft to flay. Example: "cuban800",
   * @param startPoint Position of spawn Aircraft
   * @param endPoint Position of end fly (Position of spawn AirDrop)
   * @param startNetTime Network time when Aircraft is started (from server!)
   * @param endNetTime Network time when Aircraft is end (Network time when landing is started) (from server!)
   * @param visibleRadius Visible distance to draw Aircraft
   * @param pilotModel Name of pilot Model. Example: "s_m_m_pilot_02"
   */
  constructor(
    public readonly id: string,
    objectModel: string | number,
    startPoint: Vector3,
    private readonly endPoint: Vector3,
    startNetTime: number,
    endNetTime: number,
    private readonly visibleRadius?: number,
    pilotModel?: string | number,
  ) {
    if (!this.visibleRadius) this.visibleRadius = AIRCRAFT_VISIBLE_RADIUS;

    this.eventEmitter = new EventEmitter2();
    this.frameSkipper = new FrameSkipper(0);
    this.objectModel = new Model(objectModel);
    this.pilotModel = new Model(pilotModel || AIRCRAFT_PILOT_MODEL);
    this.drawChecker = new DrawChecker(
      startPoint,
      endPoint,
      startNetTime,
      endNetTime,
      this.visibleRadius,
    );
    this.linearFunction = new LinearFunctionFromPoints(
      [0.0, 0],
      [1.0, AIRCRAFT_FRAME_SKIPPER],
    );
  }

  private get objectHandlerExist() {
    return this.objectHandler && DoesEntityExist(this.objectHandler);
  }

  private setPosition(position: Vector3, rotation?: number) {
    SetEntityCoords(
      this.objectHandler,
      position.x,
      position.y,
      position.z,
      true,
      true,
      true,
      false,
    );
    rotation && SetEntityHeading(this.objectHandler, rotation);
  }

  private async spawn(
    position: Vector3,
    rotation?: number,
    realFinish?: boolean,
  ) {
    if (this.objectHandlerExist) {
      this.setPosition(position, rotation);
      return;
    }

    await this.objectModel.request(1000);
    await this.pilotModel.request(1000);

    this.objectHandler = CreateVehicle(
      this.objectModel.Hash,
      position.x,
      position.y,
      position.z,
      rotation || 90,
      false,
      false,
    );
    SetEntityInvincible(this.objectHandler, true);
    SetVehicleDoorsLocked(this.objectHandler, 2);
    ActivatePhysics(this.objectHandler);
    SetVehicleForwardSpeed(this.objectHandler, 200.0);
    SetHeliBladesFullSpeed(this.objectHandler);
    SetVehicleEngineOn(this.objectHandler, true, true, true);
    ControlLandingGear(this.objectHandler, 3);
    SetEntityLodDist(this.objectHandler, this.visibleRadius);

    this.pilotHandler = CreatePedInsideVehicle(
      this.objectHandler,
      1,
      this.pilotModel.Hash,
      -1,
      false,
      false,
    );
    SetEntityInvincible(this.pilotHandler, true);
    SetBlockingOfNonTemporaryEvents(this.pilotHandler, true);
    SetPedRandomComponentVariation(this.pilotHandler, 0);
    SetPedKeepTask(this.pilotHandler, true);
    TaskVehicleDriveToCoord(
      this.pilotHandler,
      this.objectHandler,
      this.endPoint.x,
      this.endPoint.y,
      this.endPoint.z,
      200.0,
      0,
      this.objectModel.Hash,
      262144,
      15.0,
      -1.0,
    );

    this.eventEmitter.emit(AIRCRAFT_EVENT_NAME.SPAWN, {
      id: this.id,
      vehicle: this.objectHandler,
      ped: this.pilotHandler,
      realFinish,
    });
  }

  public on(event: string, callback: (...args: any[]) => void) {
    return this.eventEmitter.on(event, callback);
  }

  public flyToSky() {
    if (this.objectHandlerExist) {
      const [x, y] = GetEntityCoords(this.objectHandler, true);
      TaskVehicleDriveToCoord(
        this.pilotHandler,
        this.objectHandler,
        x,
        y,
        10000.0,
        200.0,
        0,
        this.objectModel.Hash,
        262144,
        15.0,
        -1.0,
      );
      setTimeout(() => {
        this?.delete && this.delete();
      }, 1000 * 20);
    }
  }

  public delete() {
    this.objectHandler && DeleteEntity(this.objectHandler);
    this.pilotHandler && DeleteEntity(this.pilotHandler);
    this.objectHandler = null;
    this.pilotHandler = null;
    this.eventEmitter.emit(AIRCRAFT_EVENT_NAME.DELETE, { id: this.id });
  }

  // call every tick
  public draw(currentNetworkTime: number) {
    try {
      if (!this.objectHandlerExist) return;
      if (this.frameSkipper.shouldSkipFrame) return;
      this.setPosition(
        this.drawChecker.currentObjectCord(currentNetworkTime),
        this.drawChecker.heading,
      );
    } catch (e) {
      throw new Error(
        `Failed exec draw for AirDropAircraft (${this.id}) error: ${e.message}`,
      );
    }
  }

  // Call every second
  public async shouldDraw(playerCords: Vector3, currentNetworkTime: number) {
    try {
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
        1000 * 5,
      );

      if (!this.isStarted && started) {
        this.isStarted = true;
        this.eventEmitter.emit(AIRCRAFT_EVENT_NAME.START, { id: this.id });
      }

      this.eventEmitter.emit(AIRCRAFT_EVENT_NAME.UPDATE_POSITION, {
        id: this.id,
        cord: [currentObjectCord.x, currentObjectCord.y, currentObjectCord.z],
        realFinish,
      });
      this.frameSkipper.frameToSkip =
        this.linearFunction.gatRound(visibleFactor);
      if (shouldDraw && !this.objectHandlerExist) {
        await this.spawn(
          currentObjectCord,
          this.drawChecker.heading,
          realFinish,
        );
      } else if (!shouldDraw && this.objectHandlerExist) {
        this.delete();
      }

      return finish;
    } catch (e) {
      throw new Error(
        `Failed exec shouldDraw for AirDropAircraft (${this.id}) error: ${e.message}`,
      );
    }
  }
}
