import { visemeMap } from "./viseme-map";

export type TimedViseme = {
  offsetMs: number;
  visemeId: number;
};

export function createLipSyncTimeline(visemes: TimedViseme[]) {
  return visemes.map((item) => ({
    time: item.offsetMs,
    weights: visemeMap[item.visemeId] ?? { viseme_sil: 1 },
  }));
}