import { SCRIPT_PREFIX } from "./constant/script-name.const";

const SYNC = `${SCRIPT_PREFIX}:${"SYNC"}`;
const TIME = `${SCRIPT_PREFIX}:${"TIME"}`;

export class TimeSync {
  private static timeSync: TimeSync;

  private readonly isServer: boolean;
  private intervalHandler: CitizenTimer;

  private lastServerTime: number;
  private lastClientTime: number;

  private constructor() {
    this.isServer = IsDuplicityVersion();
    if (this.isServer) {
      if (GlobalState[SYNC] && GlobalState[TIME]) {
        return;
      }
      GlobalState.set(SYNC, true, false);
    }
    this.updateTime();
    this.intervalHandler = setInterval(() => {
      this.updateTime();
    }, 5000);
  }

  public static get instance(): TimeSync {
    if (!TimeSync.timeSync) {
      TimeSync.timeSync = new TimeSync();
    }
    return TimeSync.timeSync;
  }

  public updateTime() {
    if (this.isServer) {
      GlobalState.set(TIME, GetGameTimer(), true);
    } else {
      this.lastClientTime = GetNetworkTime();
      this.lastServerTime = GlobalState[TIME] || this.lastClientTime;
    }
  }

  public get networkTime(): number {
    if (this.isServer) {
      return GetGameTimer();
    } else {
      return this.lastServerTime + (GetNetworkTime() - this.lastClientTime);
    }
  }
}
