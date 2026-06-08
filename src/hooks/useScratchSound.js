import { useRef, useCallback } from "react";

export function useScratchSound() {
  const ctxRef      = useRef(null);
  const gainRef     = useRef(null);
  const filterRef   = useRef(null);
  const sourceRef   = useRef(null);
  const activeRef   = useRef(false);

  // lazy-init AudioContext (must be after a user gesture)
  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    // 0.5s loop of white noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // bandpass filter — vinyl scratch character (~1200 Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;

    // second filter for warmth
    const filter2 = ctx.createBiquadFilter();
    filter2.type = "highshelf";
    filter2.frequency.value = 4000;
    filter2.gain.value = -8;

    // gain starts at 0 — we'll modulate it during drag
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);

    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    sourceRef.current = source;
    gainRef.current   = gain;
    filterRef.current = filter;
  }, []);

  // call with normalized speed 0–1+ during drag
  const setSpeed = useCallback((speed) => {
    if (!gainRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const clampedGain = Math.min(speed * 0.35, 0.45);
    gainRef.current.gain.setTargetAtTime(clampedGain, ctx.currentTime, 0.02);

    // pitch-shift illusion: tweak filter freq with speed
    if (filterRef.current) {
      const freq = 800 + speed * 1400;
      filterRef.current.frequency.setTargetAtTime(
        Math.min(freq, 3500), ctx.currentTime, 0.03
      );
    }
  }, []);

  const stop = useCallback(() => {
    if (!activeRef.current || !gainRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;
    // quick fade out
    gainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    setTimeout(() => {
      try { sourceRef.current?.stop(); } catch (_) {}
      sourceRef.current = null;
      gainRef.current   = null;
      filterRef.current = null;
      activeRef.current = false;
    }, 200);
  }, []);

  return { start, setSpeed, stop };
}
