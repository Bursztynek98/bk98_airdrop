export function Delay(ms: number) {
  return new Promise((r) => {
    setTimeout(() => {
      r(true);
    }, ms);
  });
}
