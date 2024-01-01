const currentResourceName = String(GetCurrentResourceName()).toUpperCase();
export const SCRIPT_PREFIX = 'BK98';

export const SCRIPT_NAME = `${SCRIPT_PREFIX}_AIRDROP`;

if (currentResourceName !== SCRIPT_NAME) {
  throw new Error(
    'This script can only be ran from ' + SCRIPT_NAME + ' resource',
  );
}
