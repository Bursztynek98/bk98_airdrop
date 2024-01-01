/* eslint-disable no-console */
import { SCRIPT_NAME } from './constant/script-name.const';

export class Logger {
  public static log(...args: any[]) {
    console.log(`[${SCRIPT_NAME}]`, ...args);
  }

  public static warn(...args: any[]) {
    console.warn(`[${SCRIPT_NAME}]`, ...args);
  }
}
