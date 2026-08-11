"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStoredAudioInput,
  getStoredAudioOutput,
  outputSelectionSupported,
  setStoredAudioInput,
  setStoredAudioOutput,
} from "../lib/audioDevices";

type DeviceOption = { deviceId: string; label: string };

/**
 * Microphone and speaker pickers for voice interviews. "System default"
 * (empty value) is always first and is the automatic choice; a concrete
 * device is only used once the candidate picks one. Selections persist in
 * localStorage and are read by useAudioMonitoring (input) and
 * useQuestionAudio (output).
 */
export function AudioDeviceSelectors() {
  const [inputs, setInputs] = useState<DeviceOption[]>([]);
  const [outputs, setOutputs] = useState<DeviceOption[]>([]);
  const [inputId, setInputId] = useState("");
  const [outputId, setOutputId] = useState("");
  const [needsPermission, setNeedsPermission] = useState(false);
  const [outputSupported, setOutputSupported] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Chrome exposes "default"/"communications" pseudo-devices; our
      // explicit "System default" option covers those, so skip them.
      const real = devices.filter(
        (d) => d.deviceId && d.deviceId !== "default" && d.deviceId !== "communications"
      );
      const mics = real.filter((d) => d.kind === "audioinput");
      const speakers = real.filter((d) => d.kind === "audiooutput");

      // Until microphone permission has been granted once, labels are blank.
      setNeedsPermission(mics.length > 0 && mics.every((d) => !d.label));
      setInputs(
        mics.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }))
      );
      setOutputs(
        speakers.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${i + 1}`,
        }))
      );
    } catch {
      // Enumeration failed — the selects just show "System default".
    }
  }, []);

  useEffect(() => {
    setInputId(getStoredAudioInput());
    setOutputId(getStoredAudioOutput());
    setOutputSupported(outputSelectionSupported());
    void refresh();

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) return;
    const onChange = () => void refresh();
    mediaDevices.addEventListener("devicechange", onChange);
    return () => mediaDevices.removeEventListener("devicechange", onChange);
  }, [refresh]);

  async function enableDeviceNames() {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await refresh();
    } catch {
      // Permission denied — selectors keep working with generic names hidden.
    } finally {
      setRequesting(false);
    }
  }

  const selectClass =
    "w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10";

  return (
    <div>
      <p className="mb-3 text-sm font-bold text-white">Audio devices</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">
            Microphone
          </span>
          <select
            value={inputId}
            onChange={(e) => {
              setInputId(e.target.value);
              setStoredAudioInput(e.target.value);
            }}
            className={selectClass}
          >
            <option value="">System default</option>
            {inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">
            Speaker
          </span>
          <select
            value={outputId}
            onChange={(e) => {
              setOutputId(e.target.value);
              setStoredAudioOutput(e.target.value);
            }}
            className={selectClass}
            disabled={!outputSupported}
          >
            <option value="">System default</option>
            {outputSupported &&
              outputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
          </select>
        </label>
      </div>

      {needsPermission && (
        <button
          type="button"
          onClick={() => void enableDeviceNames()}
          disabled={requesting}
          className="mt-3 rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-bold text-purple-100 transition hover:bg-purple-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {requesting ? "Requesting…" : "Allow microphone to show device names"}
        </button>
      )}

      <p className="mt-3 text-xs leading-5 text-gray-400">
        {outputSupported
          ? "Applies to question playback and voice analysis. Live dictation always uses your system default microphone."
          : "Speaker selection isn't supported in this browser; audio plays through your system default. Live dictation always uses your system default microphone."}
      </p>
    </div>
  );
}
