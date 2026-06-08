import { useState, useEffect, useRef, useCallback } from "react";

export default function Turntable({ character, onBack }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [scrubAngle, setScrubAngle] = useState(0); // visual rotation from scrubbing
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const discRef = useRef(null);
  const lastAngleRef = useRef(null);

  const tracks = character.tracks;

  // Determine current track based on elapsed time (in minutes)
  useEffect(() => {
    const elapsedMin = elapsed / 60;
    let idx = 0;
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (elapsedMin >= tracks[i].start) { idx = i; break; }
    }
    if (idx !== currentTrackIndex) setCurrentTrackIndex(idx);
  }, [elapsed, tracks]);

  // Load and play new track when index changes
  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = playing;
    audioRef.current.src = tracks[currentTrackIndex].file;
    audioRef.current.load();
    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };
    if (wasPlaying) audioRef.current.play();
  }, [currentTrackIndex]);

  // Timer
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (audioRef.current) return audioRef.current.currentTime;
          return e + 1;
        });
      }, 250);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setPlaying((p) => !p);
  }

  function handleVolume(e) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // ── Disc scrub ──
  function getAngle(e, el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }

  function normalizeDelta(d) {
    if (d > 180) return d - 360;
    if (d < -180) return d + 360;
    return d;
  }

  function onDiscMouseDown(e) {
    e.preventDefault();
    setIsDragging(true);
    lastAngleRef.current = getAngle(e, discRef.current);
  }

  const onMouseMove = useCallback((e) => {
    if (!isDragging || lastAngleRef.current === null) return;
    const newAngle = getAngle(e, discRef.current);
    const delta = normalizeDelta(newAngle - lastAngleRef.current);
    lastAngleRef.current = newAngle;

    // 360° = 30 seconds of audio
    const deltaSeconds = (delta / 360) * 30;
    setScrubAngle((a) => a + delta);

    setElapsed((prev) => {
      const total = duration || 3600;
      const next = Math.max(0, Math.min(total, prev + deltaSeconds));
      if (audioRef.current) audioRef.current.currentTime = next;
      return next;
    });
  }, [isDragging, duration]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    lastAngleRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onMouseMove);
      window.addEventListener("touchend", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  const totalSeconds = duration || 3600;
  const progress = Math.min(elapsed / totalSeconds, 1);

  const ANGLE_REST  = 0;
  const ANGLE_START = 25;
  const ANGLE_END   = 40;
  const tonearmAngle = playing
    ? ANGLE_START + (ANGLE_END - ANGLE_START) * progress
    : ANGLE_REST;

  // spin animation degrees from playing + scrub
  const spinDeg = scrubAngle;

  return (
    <div className="turntable-page">
      {character.render && (
        <img src={character.render} alt="" className="turntable-render" />
      )}
      <button className="back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Discography</span>
      </button>

      <div className="turntable-layout">
        {/* Disc */}
        <div className="turntable-disc-area">
          <div
            ref={discRef}
            className={`turntable-disc ${playing && !isDragging ? "spinning" : ""}`}
            style={{
              "--disc-color": character.color,
              transform: isDragging ? `rotate(${spinDeg}deg)` : undefined,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={onDiscMouseDown}
            onTouchStart={onDiscMouseDown}
          >
            <div className="disc-ring" />
            <div className="disc-center">
              {character.image ? (
                <img src={character.image} alt={character.name} />
              ) : (
                <span>{character.name[0]}</span>
              )}
            </div>
          </div>
          {/* Tonearm */}
          <div
            className="tonearm-wrapper"
            style={{ transform: `rotate(${tonearmAngle}deg)` }}
          >
            <div className="tonearm-arm" />
            <div className="tonearm-headshell" />
            <div className="tonearm-needle" />
            <div className="tonearm-pivot-ball" />
          </div>
        </div>

        {/* Info & Controls */}
        <div className="turntable-info">
          {character.nameImage ? (
            <img src={character.nameImage} alt={character.name} className="character-name-img" />
          ) : (
            <h2>{character.name}</h2>
          )}

          {character.description && (
            <p className="character-description">{character.description}</p>
          )}

          {/* Progress bar */}
          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress * 100}%`, background: character.color }} />
            </div>
            <div className="progress-times">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(Math.floor(totalSeconds))}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-row">
            <button className="play-btn" onClick={togglePlay}
                    style={{ "--btn-color": character.color }}>
              {playing ? "⏸" : "▶"}
            </button>
            <div className="volume-control">
              <span className="volume-icon">{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={volume} onChange={handleVolume}
                className="volume-slider"
                style={{ "--vol-color": character.color }}
              />
            </div>
          </div>

          <audio ref={audioRef} />
        </div>
      </div>
    </div>
  );
}
