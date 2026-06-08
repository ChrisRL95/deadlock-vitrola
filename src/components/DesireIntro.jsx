import { useState, useEffect } from "react";

export default function DesireIntro({ character, onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "hold" | "out"

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`desire-overlay desire-overlay--${phase}`}>
      <div className="desire-inner">
        <div className="desire-sigil" style={{ "--char-color": character.color }}>
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 6" />
            <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            <polygon points="60,14 103,87 17,87" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
            <polygon points="60,106 17,33 103,33" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7" />
            <circle cx="60" cy="60" r="5" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
        <p className="desire-label">desejo</p>
        <p className="desire-text">"{character.desire}"</p>
        <p className="desire-name" style={{ color: character.color }}>{character.name}</p>
      </div>
    </div>
  );
}
