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

export default function Shelf({ characters, onSelect }) {
  // fill to a multiple of COLS so rows are complete
  const total = Math.ceil(Math.max(characters.length, COLS) / COLS) * COLS;
  const items = [
    ...characters.map((char) => ({ type: "char", char })),
    ...Array.from({ length: total - characters.length }, (_, i) => ({ type: "empty", i })),
  ];

  // split into rows of COLS
  const rows = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }

  return (
    <div className="shelf-page">
      <div className="shelf-bg">
        <img src={`${R2}/images/HiddenKing.png`} alt="" className="shelf-bg-left" />
        <img src={`${R2}/images/Archmother.png`} alt="" className="shelf-bg-right" />
      </div>
      <header className="shelf-header">
        <div className="shelf-header-left">
          <span>Deadlock</span>
          <h1>Character Discography</h1>
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
