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
  const [sheenX, setSheenX] = useState(-30);
  const rafRef = useRef(null);
  const targetX = useRef(-30);
  const currentX = useRef(-30);

  useEffect(() => {
    const onMove = (e) => {
      // map cursor 0→window to sheen position -30 → 130 (% across logo)
      targetX.current = (e.clientX / window.innerWidth) * 160 - 30;
    };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      currentX.current += (targetX.current - currentX.current) * 0.07;
      setSheenX(currentX.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const x = sheenX;
  const sheenGradient = `linear-gradient(
    108deg,
    transparent          ${x - 14}%,
    rgba(255,245,200,0.0) ${x - 10}%,
    rgba(255,245,200,0.4) ${x - 4}%,
    rgba(255,255,235,0.85) ${x}%,
    rgba(255,245,200,0.4) ${x + 4}%,
    rgba(255,245,200,0.0) ${x + 10}%,
    transparent          ${x + 14}%
  )`;

  return (
    <div className="shelf-logo-wrap">
      <img src={src} alt={alt} className="shelf-logo" />
      <div className="shelf-logo-sheen" style={{ background: sheenGradient }} />
    </div>
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
