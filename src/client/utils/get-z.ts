import { Vector3 } from 'fivem-js';
import { Delay } from './delay';

export const GetZ = async (
  point: Vector3,
  iteration = 1,
): Promise<[boolean, number]> => {
  if (iteration > 25) {
    ClearFocus();
    return [false, 0.0];
  }
  const [isGround, z] = GetGroundZFor_3dCoord_2(
    point.x,
    point.y,
    point.z,
    false,
  );
  if (!isGround) {
    SetFocusPosAndVel(point.x, point.y, 100.0, 0.0, 0.0, 0.0);
    await Delay(100);
    return await GetZ(point, iteration + 1);
  }
  ClearFocus();
  return [isGround, z];
};
