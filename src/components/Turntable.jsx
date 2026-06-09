import { useState, useEffect, useRef, useCallback } from "react";
import { useDominantColor } from "../hooks/useDominantColor";

// 33 RPM → degrees per ms (normal playback speed reference)
const NORMAL_DEG_PER_MS = (33 * 360) / (60 * 1000); // ≈ 0.198 °/ms

// Static dust particle specs — positions/sizes/timings are intentionally varied
const DUST_SPECS = [
  { top: "27%", left: "21%", delay: "0s",    dur: "4.3s", size: 1.5 },
  { top: "44%", left: "70%", delay: "1.4s",  dur: "5.9s", size: 1   },
  { top: "71%", left: "37%", delay: "0.6s",  dur: "3.8s", size: 2   },
  { top: "19%", left: "56%", delay: "2.2s",  dur: "6.2s", size: 1   },
  { top: "61%", left: "79%", delay: "0.3s",  dur: "4.8s", size: 1.5 },
  { top: "34%", left: "14%", delay: "1.9s",  dur: "5.4s", size: 1   },
  { top: "81%", left: "58%", delay: "3.1s",  dur: "4.6s", size: 2   },
  { top: "14%", left: "42%", delay: "2.6s",  dur: "7.1s", size: 1   },
];

function rampRate(audioEl, fromRate, toRate, durationMs, onDone) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    // ease-out curve
    const eased = 1 - Math.pow(1 - t, 2);
    audioEl.playbackRate = fromRate + (toRate - fromRate) * eased;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      audioEl.playbackRate = toRate;
      if (onDone) onDone();
    }
  };
  requestAnimationFrame(step);
}

export default function Turntable({ character, characters = [], onBack, onSelect }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [discAngle, setDiscAngle] = useState(0);
  const [loop, setLoop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const accentColor = useDominantColor(character.render || character.image, character.color);

  // parallax on render
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const discRef = useRef(null);
  const lastAngleRef = useRef(null);
  const lastDragTimeRef = useRef(null);
  const rafRef = useRef(null);
  const discAngleRef = useRef(0);
  const lastSpinTimeRef = useRef(null);
  const spindownRafRef = useRef(null);
  const playingRef = useRef(false);   // shadow for rAF callbacks
  const wasPlayingRef = useRef(false); // was playing before drag started

  const tracks = character.tracks;

  // keep playingRef in sync
  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Track selection
  useEffect(() => {
    const elapsedMin = elapsed / 60;
    let idx = 0;
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (elapsedMin >= tracks[i].start) { idx = i; break; }
    }
    if (idx !== currentTrackIndex) setCurrentTrackIndex(idx);
  }, [elapsed, tracks]);

  // Load track
  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = playing;
    audioRef.current.src = tracks[currentTrackIndex].file;
    audioRef.current.preservesPitch = false; // pitch follows speed (vinyl feel)
    audioRef.current.load();
    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };
    if (wasPlaying) audioRef.current.play();
  }, [currentTrackIndex]);

  // Timer + disc rAF spin
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setElapsed(() => audioRef.current?.currentTime ?? 0);
      }, 250);

      lastSpinTimeRef.current = null;
      const spin = (timestamp) => {
        if (lastSpinTimeRef.current !== null) {
          const delta = timestamp - lastSpinTimeRef.current;
          const rate = audioRef.current?.playbackRate ?? 1;
          discAngleRef.current = (discAngleRef.current + delta * NORMAL_DEG_PER_MS * rate) % 360;
          setDiscAngle(discAngleRef.current);
        }
        lastSpinTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(spin);
      };
      rafRef.current = requestAnimationFrame(spin);
    } else {
      clearInterval(intervalRef.current);
      cancelAnimationFrame(rafRef.current);
      lastSpinTimeRef.current = null;
    }
    return () => {
      clearInterval(intervalRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  // ── Play / Pause with spin-up / spin-down ──
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      // pause audio immediately
      audioRef.current.pause();
      audioRef.current.playbackRate = 1.0;
      setPlaying(false);
      // cancel main spin loop NOW (don't wait for useEffect) to avoid double-advance
      cancelAnimationFrame(rafRef.current);
      // visual spin-down: disc decelerates over ~600ms using real delta time
      cancelAnimationFrame(spindownRafRef.current);
      let lastT = performance.now();
      const startTime = lastT;
      const spinDown = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / 600, 1);
        const rate = 1 - t; // linear deceleration
        const delta = now - lastT;
        lastT = now;
        discAngleRef.current = (discAngleRef.current + delta * NORMAL_DEG_PER_MS * rate) % 360;
        setDiscAngle(discAngleRef.current);
        if (t < 1) spindownRafRef.current = requestAnimationFrame(spinDown);
      };
      spindownRafRef.current = requestAnimationFrame(spinDown);
    } else {
      // spin-up: start quiet then ramp pitch to normal
      audioRef.current.playbackRate = 0.25;
      audioRef.current.play();
      setPlaying(true);
      rampRate(audioRef.current, 0.25, 1.0, 700);
    }
  }

  function handleVolume(e) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function handleSeek(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * (duration || 3600);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setElapsed(newTime);
  }

  function toggleLoop() {
    const next = !loop;
    setLoop(next);
    if (audioRef.current) audioRef.current.loop = next;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleSelectCharacter(char) {
    setPickerOpen(false);
    if (onSelect) onSelect(char);
  }

  // ── Disc drag / scratch ──
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
    lastDragTimeRef.current = performance.now();
    wasPlayingRef.current = playingRef.current;
    // pause audio while holding — resume on release
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.playbackRate = 1.0;
    }
  }

  const onMouseMove = useCallback((e) => {
    if (!isDragging || lastAngleRef.current === null) return;
    const now = performance.now();
    const newAngle = getAngle(e, discRef.current);
    const delta = normalizeDelta(newAngle - lastAngleRef.current);
    const dt = now - (lastDragTimeRef.current ?? now);
    lastAngleRef.current = newAngle;
    lastDragTimeRef.current = now;

    // visual rotation
    discAngleRef.current = (discAngleRef.current + delta) % 360;
    setDiscAngle(discAngleRef.current);

    // scrub audio position: 360° = 30s
    const deltaSeconds = (delta / 360) * 30;
    setElapsed((prev) => {
      const total = duration || 3600;
      const next = Math.max(0, Math.min(total, prev + deltaSeconds));
      if (audioRef.current) audioRef.current.currentTime = next;
      return next;
    });

    // scratch sound + audio scrub
    if (audioRef.current && dt > 0) {
      const degPerMs = delta / dt;
      const absDegPerMs = Math.abs(degPerMs);
      const normalizedSpeed = absDegPerMs / NORMAL_DEG_PER_MS; // 1.0 = normal speed

      if (degPerMs > 0.02) {
        // dragging forward — play audio at proportional rate
        const rate = Math.min(normalizedSpeed, 3.0);
        audioRef.current.playbackRate = rate;
        if (audioRef.current.paused) audioRef.current.play().catch(() => {});
      } else {
        // dragging backward or stopped — mute audio
        if (!audioRef.current.paused) audioRef.current.pause();
        audioRef.current.playbackRate = 1.0;
      }
    }
  }, [isDragging, duration]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    lastAngleRef.current = null;
    lastDragTimeRef.current = null;
    if (audioRef.current) {
      if (wasPlayingRef.current) {
        // resume and ramp back to normal speed
        audioRef.current.playbackRate = 0.3;
        audioRef.current.play().catch(() => {});
        rampRate(audioRef.current, 0.3, 1.0, 400);
      } else {
        audioRef.current.pause();
        audioRef.current.playbackRate = 1.0;
      }
    }
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

  return (
    <div className="turntable-page">
      {character.render && (
        <img
          src={character.render}
          alt=""
          className="turntable-render"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            transition: "transform 0.15s ease-out",
          }}
        />
      )}

      <button className="back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Discography</span>
      </button>

      <div className="turntable-layout">

        {/* Character picker sidebar */}
        <div className="char-picker-sidebar">
          <button
            className="char-picker-toggle"
            style={{ "--btn-color": accentColor }}
            onClick={() => setPickerOpen((o) => !o)}
            title="Trocar personagem"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="9" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 15c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span>Trocar disco</span>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ transform: pickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>

          {pickerOpen && (
            <div className="char-picker-dropdown">
              {characters.filter((c) => c.id !== character.id).length === 0 ? (
                <div className="char-picker-empty">mais personagens em breve</div>
              ) : (
                characters.filter((c) => c.id !== character.id).map((c) => (
                  <button
                    key={c.id}
                    className="char-picker-item"
                    onClick={() => handleSelectCharacter(c)}
                    style={{ "--item-color": c.color }}
                  >
                    <div className="char-picker-thumb" style={{ background: c.color }}>
                      {c.image && <img src={c.image} alt={c.name} />}
                    </div>
                    <span>{c.name}</span>
                    <div className="char-picker-dot" style={{ background: c.color }} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Disc */}
        <div className="turntable-disc-area">
          <div
            ref={discRef}
            className="turntable-disc"
            style={{
              "--disc-color": accentColor,
              transform: `rotate(${discAngle}deg)`,
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

          {/* Fixed light reflection — stays in place while disc rotates beneath */}
          <div className="vinyl-shine" />

          {/* Dust particles — appear while playing */}
          <div className={`dust-particles${playing ? " dust-active" : ""}`}>
            {DUST_SPECS.map((d, i) => (
              <span key={i} className="dust-particle" style={{
                top: d.top, left: d.left,
                width: d.size + "px", height: d.size + "px",
                animationDelay: d.delay,
                animationDuration: d.dur,
              }} />
            ))}
          </div>

          {/* Tonearm */}
          <div
            className="tonearm-wrapper"
            style={{ transform: `rotate(${tonearmAngle}deg)` }}
          >
            <div className="tonearm-arm" />
            <div className="tonearm-headshell" />
            <div className={`tonearm-needle${playing ? " tonearm-needle--playing" : ""}`} />
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

          <div className="progress-bar-wrapper">
            <div
              className="progress-bar"
              onClick={handleSeek}
              title="Clique para navegar"
            >
              <div className="progress-fill" style={{ width: `${progress * 100}%`, background: accentColor }} />
              {character.icon ? (
                <img src={character.icon} className="progress-thumb progress-thumb--icon" alt="" style={{ left: `${progress * 100}%`, borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}88` }} />
              ) : (
                <div className="progress-thumb" style={{ left: `${progress * 100}%`, background: accentColor }} />
              )}
            </div>
            <div className="progress-times">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(Math.floor(totalSeconds))}</span>
            </div>
          </div>

          <div className="controls-row">
            <button className="play-btn" onClick={togglePlay}
                    style={{ "--btn-color": accentColor }}>
              <span>{playing ? "⏸" : "▶"}</span>
            </button>
            <button
              className={`loop-btn ${loop ? "loop-btn--active" : ""}`}
              onClick={toggleLoop}
              style={{ "--btn-color": accentColor }}
              title={loop ? "Loop ativado" : "Loop desativado"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h10a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M14 12H4a2 2 0 0 1-2-2V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M11 2l3 2-3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 14l-3-2 3-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="volume-control">
              <span className="volume-icon">{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={volume} onChange={handleVolume}
                className="volume-slider"
                style={{ "--vol-color": accentColor }}
              />
            </div>
          </div>

          <audio ref={audioRef} />
        </div>
      </div>
    </div>
  );
}
