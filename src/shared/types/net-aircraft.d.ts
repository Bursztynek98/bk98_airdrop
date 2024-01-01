export type TNetAircraft = {
  model: string;
  startPoint: [number, number, number];
  startNetTime: number;
  visibleRadius?: number;
  pilotModel?: string | number;
};
