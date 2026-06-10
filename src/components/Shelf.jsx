import { useState, useEffect, useRef } from "react";
import Disc from "./Disc";

const R2 = "https://pub-52e2be368e3442e2ac570de63276fa30.r2.dev";
const COLS = 4;

function PlaceholderDisc() {
  return (
    <div className="disc-wrapper disc-empty">
      <div className="album-cover album-cover-placeholder-slot">
        <div className="album-cover-placeholder">
          <span>coming soon</span>
        </div>
      </div>
    </div>
  );
}

function HoloLogo({ src, alt }) {
  const [hue, setHue] = useState(0);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);
  const targetRef = useRef({ hue: 0, x: 0.5, y: 0.5 });
  const currentRef = useRef({ hue: 0, x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      targetRef.current.x = e.clientX / window.innerWidth;
      targetRef.current.y = e.clientY / window.innerHeight;
      // map X across full hue wheel
      targetRef.current.hue = targetRef.current.x * 360;
    };
    window.addEventListener("mousemove", onMove);

    // smooth lerp loop
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      const t = 0.06;
      currentRef.current.hue = lerp(currentRef.current.hue, targetRef.current.hue, t);
      currentRef.current.x   = lerp(currentRef.current.x,   targetRef.current.x,   t);
      currentRef.current.y   = lerp(currentRef.current.y,   targetRef.current.y,   t);
      setHue(currentRef.current.hue);
      setPos({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // primary glow colour matches current hue; secondary is complementary
  const h1 = hue;
  const h2 = (hue + 120) % 360;
  const glowSize1 = 8 + pos.x * 14;
  const glowSize2 = 6 + pos.y * 10;
  const brightness = 0.9 + pos.x * 0.25;

  const filter = [
    `hue-rotate(${h1}deg)`,
    `saturate(1.6)`,
    `brightness(${brightness})`,
    `drop-shadow(0 0 ${glowSize1}px hsla(${h1},90%,65%,0.65))`,
    `drop-shadow(0 0 ${glowSize2}px hsla(${h2},80%,70%,0.35))`,
  ].join(" ");

  return (
    <img
      src={src}
      alt={alt}
      className="shelf-logo"
      style={{ filter, transition: "filter 0.05s linear" }}
    />
  );
}

export default function Shelf({ characters, onSelect }) {
  const total = Math.ceil(Math.max(characters.length, COLS) / COLS) * COLS;
  const items = [
    ...characters.map((char) => ({ type: "char", char })),
    ...Array.from({ length: total - characters.length }, (_, i) => ({ type: "empty", i })),
  ];

  const rows = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }

  return (
    <div className="shelf-page">
      <div className="shelf-bg">
        <img src={`${R2}/images/Archmother.png`} alt="" className="shelf-bg-left" />
        <img src={`${R2}/images/HiddenKing.png`} alt="" className="shelf-bg-right" />
      </div>
      <header className="shelf-header">
        <div className="shelf-header-left">
          <HoloLogo src={`${R2}/images/Logo.png`} alt="Deadlock" />
          <h1>Character Mixes</h1>
        </div>
        <div className="shelf-header-right">{characters.length} / 38 characters</div>
      </header>

      <div className="shelf">
        {rows.map((row, ri) => (
          <div key={ri} className="shelf-section">
            <div className="shelf-row">
              {row.map((item) =>
                item.type === "char" ? (
                  <Disc key={item.char.id} character={item.char} onClick={onSelect} />
                ) : (
                  <PlaceholderDisc key={`empty-${item.i}`} />
                )
              )}
            </div>
            <div className="shelf-plank" />
          </div>
        ))}
      </div>
    </div>
  );
}
