import { Blip, Game, Vector3 } from "fivem-js";

import { AirDropProp } from "air-drop-prop";
import { AirDropAircraft } from "air-drop-aircraft";
import { TimeSync } from "../shared/time-sync";

import { AIRCRAFT_EVENT_NAME } from "constant/aircraft-event-name.const";
import { PROP_EVENT_NAME } from "constant/prop-event-name.const";
import { SCRIPT_NAME } from "../shared/constant/script-name.const";

import { TNetAircraft } from "../shared/types/net-aircraft";
import { TNetProp } from "../shared/types/net-prop";
import { TNetMetaData } from "../shared/types/net-meta-data";
import { TNetPayload } from "../shared/types/net-payload";

const delay = (ms: number) =>
  new Promise((r) =>
    setTimeout(() => {
      r(true);
    }, ms)
  );

async function getZ(point: Vector3, iteration = 1): Promise<[boolean, number]> {
  if (iteration > 25) {
    ClearFocus();
    return [false, 0.0];
  }
  const [isGround, z] = GetGroundZFor_3dCoord_2(
    point.x,
    point.y,
    point.z,
    false
  );
  if (!isGround) {
    SetFocusPosAndVel(point.x, point.y, 100.0, 0.0, 0.0, 0.0);
    await delay(100);
    return await getZ(point, iteration + 1);
  }
  ClearFocus();
  return [isGround, z];
}

class AirDrop {
  private static airDropInstance: AirDrop;

  private onTickHandler: number;
  private onIntervalHandler: CitizenTimer;

  private readonly timeSync: TimeSync;
  private readonly airDrop: Map<
    string,
    {
      aircraft?: AirDropAircraft;
      prop?: AirDropProp;
      metaData: TNetMetaData;
    }
  >;

  private constructor() {
    this.timeSync = TimeSync.instance;
    this.airDrop = new Map();
    onNet(
      `${SCRIPT_NAME}:CREATE`,
      ({ id, aircraft, prop, metaData }: TNetPayload) => {
        if (GetInvokingResource() !== null) {
          return;
        }
        this.timeSync.updateTime();
        this.addDrop(id, aircraft, prop, metaData);
      }
    );

    onNet(`${SCRIPT_NAME}:REMOVE`, (id: string) => {
      if (GetInvokingResource() !== null) {
        return;
      }
      this.removeDrop(id);
    });

    onNet(`${SCRIPT_NAME}:SYNC`, (data: Array<TNetPayload>) => {
      if (GetInvokingResource() !== null) {
        return;
      }
      this.timeSync.updateTime();
      data.forEach(({ id, aircraft, prop, metaData }) => {
        this.addDrop(id, aircraft, prop, metaData);
      });
    });
    emitNet(`${SCRIPT_NAME}:SYNC`);
  }

  public static get instance(): AirDrop {
    if (!AirDrop.airDropInstance) {
      AirDrop.airDropInstance = new AirDrop();
    }
    return AirDrop.airDropInstance;
  }

  private async emit(eventName: string, id: string, args: Record<string, any>) {
    const metaData = this.airDrop.get(id)?.metaData;
    TriggerEvent(`${SCRIPT_NAME}:${eventName}`, { ...args, id, metaData });
  }

  private run() {
    this.onTickHandler =
      this.onTickHandler ||
      setTick(() => {
        this.onTick();
      });
    this.onIntervalHandler =
      this.onIntervalHandler ||
      setInterval(() => {
        this.onInterval();
      }, 255);
  }

  private async addDrop(
    id: string,
    aircraft: TNetAircraft,
    prop: TNetProp,
    metaData?: TNetMetaData
  ) {
    if (this.airDrop.has(id)) return;

    const [isGround, z] = await getZ(new Vector3(...prop.startPoint));
    if (!isGround) {
      throw new Error("Failed to find ground for AirDropProp");
    }

    this.airDrop.set(id, {
      aircraft: new AirDropAircraft(
        id,
        aircraft.model,
        new Vector3(...aircraft.startPoint),
        new Vector3(...prop.startPoint),
        aircraft.startNetTime,
        prop.startNetTime,
        aircraft.visibleRadius,
        aircraft.pilotModel
      ),
      prop: new AirDropProp(
        id,
        prop.model,
        new Vector3(...prop.startPoint),
        z,
        prop.startNetTime,
        prop.speed,
        prop.visibleRadius,
        prop.disappearTime
      ),
      metaData,
    });

    const a = this.airDrop.get(id).aircraft;
    Object.keys(AIRCRAFT_EVENT_NAME).forEach((key) => {
      a.on(key, (args: { id: string } & Record<string, any>) => {
        this.emit(`AIRCRAFT_EVENT_NAME:${key}`, args.id, args);
      });
    });

    const p = this.airDrop.get(id).prop;
    Object.keys(PROP_EVENT_NAME).forEach((key) => {
      p.on(key, (args: { id: string } & Record<string, any>) => {
        this.emit(`PROP_EVENT_NAME:${key}`, args.id, args);
      });
    });

    this.run();
  }

  private removeDrop(id: string) {
    const airDrop = this.airDrop.get(id);
    if (!airDrop) return;
    airDrop.aircraft?.delete();
    airDrop.aircraft = null;
    airDrop.prop?.delete();
    airDrop.prop = null;
    this.airDrop.delete(id);
  }

  private onTick() {
    if (this.airDrop.size == 0) {
      clearTick(this.onTickHandler);
      this.onTickHandler = null;
      return;
    }
    try {
      const netTime = this.timeSync.networkTime;

      this.airDrop.forEach((value) => {
        value.aircraft?.draw(netTime);
        value.prop?.draw(netTime);
      });
    } catch (e) {
      console.log(`onTick error: ${e}`);
    }
  }

  private async onInterval() {
    if (this.airDrop.size == 0) {
      clearInterval(this.onIntervalHandler);
      this.onIntervalHandler = null;
      return;
    }
    try {
      const netTime = this.timeSync.networkTime;
      const position = Game.PlayerPed.Position;

      for (const [id, value] of this.airDrop) {
        if (await value.aircraft?.shouldDraw(position, netTime)) {
          value.aircraft?.flyToSky();
          value.aircraft = null;
        }

        if (await value.prop?.shouldDraw(position, netTime)) {
          value.prop?.delete();
          value.prop = null;
        }

        if (!value.aircraft && !value.prop) this.airDrop.delete(id);
      }
    } catch (e) {
      console.log(`setInterval error: ${e}`);
    }
  }
}

const playerActive = async () => {
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (NetworkIsSessionStarted() && NetworkIsPlayerActive(PlayerId())) {
        clearInterval(t);
        Wait(1000);
        resolve(true);
      }
      return;
    }, 150);
  });
};

async function boot() {
  await playerActive();
  AirDrop.instance;

  console.log(`[${SCRIPT_NAME}] Client Resource Started`);
}

boot();

// Object.keys(AIRCRAFT_EVENT_NAME).forEach((key) => {
//   on(`${SCRIPT_NAME}:AIRCRAFT_EVENT_NAME:${key}`, (...args: any[]) => {
//     console.log("AIRCRAFT_EVENT_NAME", key, args);
//   });
// });
// Object.keys(PROP_EVENT_NAME).forEach((key) => {
//   on(`${SCRIPT_NAME}:PROP_EVENT_NAME:${key}`, (...args: any[]) => {
//     console.log("PROP_EVENT_NAME", key, args);
//   });
// });

const bl = new Map<string, Blip>();

on(
  `${SCRIPT_NAME}:AIRCRAFT_EVENT_NAME:${AIRCRAFT_EVENT_NAME.UPDATE_POSITION}`,
  ({ id, cord }: { id: string; cord: [number, number, number] }) => {
    if (!bl.has(id)) {
      const _b = new Blip(AddBlipForCoord(cord[0], cord[1], cord[2]));
      bl.set(id, _b);
      _b.Name = id;
      return;
    }
    const b = bl.get(id);
    b.Position = new Vector3(cord[0], cord[1], cord[2]);
  }
);
