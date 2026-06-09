export default function Disc({ character, onClick }) {
  return (
    <div className="disc-wrapper" onClick={() => onClick(character)}>
      {/* Vinyl que sobe no hover */}
      <div className="vinyl-peek" style={{ "--disc-color": character.color }}>
        <div className="vinyl-peek-grooves" />
        <div className="vinyl-peek-label">
          {character.image && <img src={character.image} alt="" />}
        </div>
      </div>

      <div className="album-cover" style={{ "--disc-color": character.color }}>
        {character.image ? (
          <img src={character.image} alt={character.name} />
        ) : (
          <div className="album-cover-placeholder">
            <span>{character.name[0]}</span>
          </div>
        )}
        <div className="album-cover-overlay" />
        <div className="disc-label">
          <span>{character.name}</span>
        </div>
      </div>
    </div>
  );
}
