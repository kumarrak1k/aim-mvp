import type { AudioMetrics } from "../types";
import { defaultAudioMetrics } from "../config";

export const calculateScaledVolumeSample = (dataArray: Uint8Array) => {
  let sumSquares = 0;

  for (let index = 0; index < dataArray.length; index += 1) {
    const centred = (dataArray[index] - 128) / 128;
    sumSquares += centred * centred;
  }

  const rms = Math.sqrt(sumSquares / dataArray.length);
  return rms * 100;
};

export const calculateAudioMetrics = (samples: number[]): AudioMetrics => {
  if (!samples.length) {
    return { ...defaultAudioMetrics };
  }

  const averageVolume =
    samples.reduce((sum, value) => sum + value, 0) / samples.length;

  const peakVolume = Math.max(...samples);

  const variance =
    samples.reduce(
      (sum, value) => sum + Math.pow(value - averageVolume, 2),
      0
    ) / samples.length;

  const volumeVariation = Math.sqrt(variance);

  // Samples arrive every 100 ms.
  // silence  < 8  RMS units  — below this is treated as silence/breath
  // low      < 15 RMS units  — audible but quiet
  // pause    >= 5  samples   = 500 ms  — short natural gap
  // long     >= 30 samples   = 3 000 ms — only flag genuinely long pauses
  //   (previous threshold was 800 ms which caught every breath and sentence break)
  const silenceThreshold = 8;
  const lowVolumeThreshold = 15;
  const pauseRunThreshold = 5;
  const longPauseRunThreshold = 30;

  let silenceFrames = 0;
  let lowVolumeFrames = 0;
  let voicedFrames = 0;
  let estimatedPauseCount = 0;
  let longPauseCount = 0;
  let currentSilentRun = 0;

  for (const sample of samples) {
    if (sample < silenceThreshold) {
      silenceFrames += 1;
      currentSilentRun += 1;
    } else {
      voicedFrames += 1;

      if (currentSilentRun >= pauseRunThreshold) {
        estimatedPauseCount += 1;
      }

      if (currentSilentRun >= longPauseRunThreshold) {
        longPauseCount += 1;
      }

      currentSilentRun = 0;
    }

    if (sample >= silenceThreshold && sample < lowVolumeThreshold) {
      lowVolumeFrames += 1;
    }
  }

  if (currentSilentRun >= pauseRunThreshold) estimatedPauseCount += 1;
  if (currentSilentRun >= longPauseRunThreshold) longPauseCount += 1;

  return {
    averageVolume: Number(averageVolume.toFixed(2)),
    peakVolume: Number(peakVolume.toFixed(2)),
    volumeVariation: Number(volumeVariation.toFixed(2)),
    silenceRatio: Number((silenceFrames / samples.length).toFixed(3)),
    lowVolumeRatio: Number((lowVolumeFrames / samples.length).toFixed(3)),
    estimatedPauseCount,
    longPauseCount,
    voicedFrameRatio: Number((voicedFrames / samples.length).toFixed(3)),
  };
};
