export const Delay = (ms: number) =>
  new Promise((r) =>
    setTimeout(() => {
      r(true);
    }, ms),
  );
