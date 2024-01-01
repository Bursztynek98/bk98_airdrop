export const PlayerActive = async () => {
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
