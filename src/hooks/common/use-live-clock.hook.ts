import { useEffect, useState } from "react";

import { formatTime } from "@utils/format/format";

export const useLiveClock = (): string => {
  const [clock, setClock] = useState(() => formatTime(Date.now()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(formatTime(Date.now()));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return clock;
};
