import { useRef, useState } from "react";

export default function Disc({ character, onPlay, onInspect }) {
  const cardRef = useRef(null);
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 12, y: dx * 12 });
    setShine({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  function handleMouseEnter() { setHovered(true); }
  function handleMouseLeave() { setHovered(false); setTilt({ x: 0, y: 0 }); setShine({ x: 50, y: 50 }); }

  return (
    <div
      className="disc-wrapper"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovered
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.05) translateY(-36px)`
          : "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)",
        transition: hovered ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.34,1.2,0.64,1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div className="album-cover" style={{ "--disc-color": character.color }}>
        {character.image ? (
          <img src={character.image} alt={character.name} />
        ) : (
          <div className="album-cover-placeholder">
            <span>{character.name[0]}</span>
          </div>
        )}
        <div className="album-cover-overlay" />
        <div
          className="album-cover-shine"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`,
          }}
        />

        {/* Hover action buttons */}
        <div className={`disc-hover-actions${hovered ? " disc-hover-actions--visible" : ""}`}>
          {/* Center play button */}
          <button
            className="disc-play-btn"
            onClick={e => { e.stopPropagation(); onPlay(character); }}
            aria-label={`Tocar ${character.name}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4.5L15.5 10L7 15.5V4.5Z" fill="currentColor"/>
            </svg>
          </button>

          {/* Inspect button — bottom-left */}
          <button
            className="disc-inspect-btn"
            onClick={e => { e.stopPropagation(); onInspect(character); }}
            aria-label={`Inspecionar ${character.name}`}
          >
            i
          </button>
        </div>
      </div>
    </div>
  );
}
