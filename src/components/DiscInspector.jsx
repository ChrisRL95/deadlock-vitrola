import { useState, useEffect, useRef } from "react";

export default function DiscInspector({ character, characters, onPlay, onClose }) {
  const [flipped, setFlipped]     = useState(false);
  const [vinylOut, setVinylOut]   = useState(false);
  const [idx, setIdx]             = useState(() => characters.findIndex(c => c.id === character.id));
  const [direction, setDirection] = useState("right");
  const [nameKey, setNameKey]     = useState(0);
  const [tilt, setTilt]           = useState({ x: 0, y: 0 });
  const [shine, setShine]         = useState({ x: 50, y: 50 });
  const [hovered, setHovered]     = useState(false);
  const stageRef                  = useRef(null);

  const current  = characters[idx];
  const frontImg = current.image;
  const backImg  = current.imageB || current.image;

  function goTo(newIdx) {
    setDirection(newIdx > idx ? "right" : "left");
    setFlipped(false);
    setVinylOut(false);
    setTilt({ x: 0, y: 0 });
    setIdx(newIdx);
    setNameKey(k => k + 1);
  }

  function prev() { goTo((idx - 1 + characters.length) % characters.length); }
  function next() { goTo((idx + 1) % characters.length); }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  function handleMouseMove(e) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    setTilt({ x: -dy * 10, y: dx * 10 });
    setShine({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  function handleMouseEnter() { setHovered(true); }
  function handleMouseLeave() { setHovered(false); setTilt({ x: 0, y: 0 }); setShine({ x: 50, y: 50 }); }

  function handleVinylAction() {
    if (!vinylOut) { setVinylOut(true); }
    else { onPlay(current); }
  }

  // B: shadow offset mirrors tilt — shadow moves opposite to card lean
  const shadowX = (-tilt.y * 2.5).toFixed(1);
  const shadowY = (tilt.x * 2.5 + 20).toFixed(1);
  const dynamicShadow = hovered
    ? `${shadowX}px ${shadowY}px 56px rgba(0,0,0,0.8), ${(shadowX / 2).toFixed(1)}px ${(shadowY / 2).toFixed(1)}px 24px rgba(0,0,0,0.5)`
    : "0 24px 64px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6)";

  const tiltTransform = hovered
    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : "perspective(900px) rotateX(0deg) rotateY(0deg)";
  const tiltTransition = hovered ? "transform 0.08s ease-out" : "transform 0.55s cubic-bezier(0.34,1.2,0.64,1)";

  const shineStyle = {
    opacity: hovered ? 1 : 0,
    background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`,
  };

  return (
    <div className="inspector-overlay" onClick={onClose}>
      <div className="inspector-modal" onClick={e => e.stopPropagation()}>

        <button className="inspector-nav inspector-nav--prev" onClick={prev}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="inspector-nav inspector-nav--next" onClick={next}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div
          ref={stageRef}
          className="inspector-stage"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Vinyl disc */}
          <div
            className={`inspector-vinyl${vinylOut ? " inspector-vinyl--out" : ""}`}
            style={vinylOut ? {
              transform: `translateX(-50%) translateY(-220px) ${tiltTransform.replace("perspective(900px) ", "")}`,
              transition: tiltTransition,
            } : undefined}
          >
            <div className="inspector-vinyl-disc">
              <div className="inspector-vinyl-ring" />
              <div className="inspector-vinyl-label">
                {current.image && <img src={current.image} alt={current.name} />}
                <div className="inspector-vinyl-hole" />
              </div>
              {vinylOut && <div className="inspector-cover-tilt-shine" style={shineStyle} />}
            </div>
          </div>

          {/* A: entry wrapper — owns the appear animation so it doesn't clash with tilt transform */}
          <div key={idx} className="inspector-cover-enter">
            <div
              className={`inspector-cover-flip${flipped ? " inspector-cover-flip--back" : ""}`}
              style={{
                transform: tiltTransform,
                transition: tiltTransition,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <div
                className="inspector-cover-inner"
                style={{
                  boxShadow: dynamicShadow,
                  transition: hovered ? "box-shadow 0.08s ease-out" : "box-shadow 0.55s ease",
                }}
              >
                <div className="inspector-cover-face inspector-cover-front">
                  {frontImg && <img src={frontImg} alt={current.name} />}
                  <div className="inspector-cover-tilt-shine" style={shineStyle} />
                </div>
                <div className="inspector-cover-face inspector-cover-back">
                  {backImg && <img src={backImg} alt={current.name + " — verso"} />}
                  <div className="inspector-cover-back-overlay">
                    <p className="inspector-back-description">{current.description}</p>
                  </div>
                  <div className="inspector-cover-tilt-shine" style={shineStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* E: name slides in from navigation direction */}
        <div
          key={nameKey}
          className={`inspector-name inspector-name--slide-${direction}`}
        >
          {current.name}
        </div>

        {/* F: position dots */}
        <div className="inspector-dots">
          {characters.map((_, i) => (
            <div
              key={i}
              className={`inspector-dot${i === idx ? " inspector-dot--active" : ""}`}
              style={i === idx ? { background: current.color } : undefined}
            />
          ))}
        </div>

        <div className="inspector-actions">
          <button
            className="inspector-btn"
            onClick={() => { setFlipped(f => !f); setVinylOut(false); setTilt({ x: 0, y: 0 }); setHovered(false); }}
          >
            {flipped ? "Ver frente" : "Ver verso"}
          </button>
          <button
            className={`inspector-btn inspector-btn--primary${vinylOut ? " inspector-btn--play" : ""}`}
            onClick={handleVinylAction}
            style={{ "--btn-color": current.color }}
          >
            {vinylOut ? "▶ Tocar" : "Tirar disco"}
          </button>
        </div>

        <button className="inspector-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L4 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>

      </div>
    </div>
  );
}
