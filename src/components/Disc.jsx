export default function Disc({ character, onClick }) {
  return (
    <div className="disc-wrapper" onClick={() => onClick(character)}>
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
