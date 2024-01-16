import { Vector3 } from 'fivem-js/lib/utils/Vector3';
import { SCRIPT_NAME } from '@shared/constant/script-name.const';
import { TimeSync } from '@shared/time-sync';
import { TNetPayload } from '@shared/types/net-payload';
import { uuidv4 } from 'fivem-js/lib/utils/UUIDV4';
import { PROP_SPEED } from '@shared/constant/prop-speed.const';
import { PROP_DISAPPEAR_TIME } from '@shared/constant/prop-disappear-time.const';
import { Logger } from '@shared/logger';

const exp = global.exports;
const netTimeInstance = TimeSync.instance;
const airDrop = new Map<string, Omit<TNetPayload, 'id'>>();

onNet(`${SCRIPT_NAME}:SYNC`, () => {
  const { source } = global;
  emitNet(
    `${SCRIPT_NAME}:SYNC`,
    source,
    Array.from(airDrop, ([id, data]) => ({ id, ...data })),
  );
});

function addDrop(
  [x, y]: [number, number],
  aircraft: {
    model: string;
    visibleRadius?: number;
    pilotModel?: string | number;
  },
  prop: {
    model: string;
    visibleRadius?: number;
    speed?: number;
    disappearTime?: number;
    z?: number;
  },
  metaData?: Record<string, any>,
  distance = 6000,
  height = 300.0,
  heading?: number,
) {
  const currentNetTime = netTimeInstance.networkTime;
  const flyTime = 1000 * (distance / (350 / 3.6));
  const netTime = currentNetTime + flyTime;
  const finnishTimeout = Math.floor(
    flyTime +
      1000 * ((height * 1) / (prop.speed || PROP_SPEED)) +
      (prop.disappearTime || PROP_DISAPPEAR_TIME),
  );
  // Random number 60-240
  const dHeading = heading || Math.floor(Math.random() * 180) + 60;
  const theta = (dHeading / 180.0) * 3.14;
  const dPlaneSpawn = new Vector3(0, 0, height).subtract(
    new Vector3(Math.cos(theta) * distance, Math.sin(theta) * distance, 0.0),
  );

  const id = uuidv4();

  airDrop.set(id, {
    aircraft: {
      model: aircraft.model,
      startPoint: [dPlaneSpawn.x, dPlaneSpawn.y, dPlaneSpawn.z],
      startNetTime: currentNetTime,
      visibleRadius: aircraft.visibleRadius,
      pilotModel: aircraft.pilotModel,
    },
    prop: {
      model: prop.model,
      startPoint: [x, y, height],
      startNetTime: netTime,
      speed: prop.speed,
      visibleRadius: prop.visibleRadius,
      disappearTime: prop.disappearTime,
      z: prop.z,
    },
    metaData,
  });

  setTimeout(() => {
    const drop = airDrop.get(id);
    if (!drop) return;
    TriggerEvent(`${SCRIPT_NAME}:END`, { ...drop, id });
    airDrop.delete(id);
  }, finnishTimeout);

  const drop = airDrop.get(id);
  emitNet(`${SCRIPT_NAME}:CREATE`, -1, { ...drop, id });
  TriggerEvent(`${SCRIPT_NAME}:CREATE`, { ...drop, id });
  return id;
}
exp(`ADD_DROP`, addDrop);

function removeDrop(id: string) {
  const drop = airDrop.get(id);
  if (drop) {
    emitNet(`${SCRIPT_NAME}:REMOVE`, -1, id);
    TriggerEvent(`${SCRIPT_NAME}:REMOVE`, { ...drop, id });
    airDrop.delete(id);
  }
}
exp(`REMOVE_DROP`, removeDrop);

Logger.log(`[${SCRIPT_NAME}] Server Resource Started`);
