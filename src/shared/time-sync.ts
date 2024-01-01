import { uuidv4 } from 'fivem-js/lib/utils/UUIDV4';
import { SCRIPT_NAME, SCRIPT_PREFIX } from './constant/script-name.const';

const SYNC = `${SCRIPT_PREFIX}:${'SYNC'}`;
const TIME = `${SCRIPT_PREFIX}:${'TIME'}`;

export class TimeSync {
  private static timeSync: TimeSync;
  public readonly id: string;

  private readonly isServer: boolean;
  private intervalHandler: CitizenTimer;

  private lastServerTime: number;
  private lastClientTime: number;

  private constructor() {
    this.updateTime = this.updateTime.bind(this);
    this.isServer = IsDuplicityVersion();
    if (this.isServer) {
      this.id = uuidv4();
      if (GlobalState[SYNC] && GlobalState[TIME]) {
        return;
      }
      GlobalState.set(SYNC, this.id, false);
    }
    this.startSync();

    if (this.isServer) {
      on('onResourceStop', (resourceName: string) => {
        if (GetCurrentResourceName() != resourceName) {
          return;
        }
        if (GlobalState[SYNC] == this.id) {
          GlobalState.set(SYNC, null, false);
          console.log(
            `[${SCRIPT_NAME}] [${SYNC}] Time Sync Stop instance (${this.id})`,
          );
        }
      });
      AddStateBagChangeHandler(SYNC, null, () => {
        const prevValue = GlobalState[SYNC];
        if (prevValue == this.id) {
          return;
        }
        GlobalState.set(SYNC, this.id, false);
        this.startSync();
      });
    }
  }

  private startSync() {
    this.updateTime();
    this.intervalHandler = setInterval(this.updateTime, 5000);
    console.log(
      `[${SCRIPT_NAME}] [${SYNC}] Time Sync Started${
        this.isServer ? ` instance (${GlobalState[SYNC]})` : ''
      }`,
    );
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
      if (GlobalState[SYNC] != this.id) {
        clearInterval(this.intervalHandler);
        console.log(
          `[${SCRIPT_NAME}] [${SYNC}] Time Sync Stop, Detected master instance (${GlobalState[SYNC]})`,
        );
      }
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
