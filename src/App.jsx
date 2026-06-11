import { useState } from "react";
import Shelf from "./components/Shelf";
import Turntable from "./components/Turntable";
import DesireIntro from "./components/DesireIntro";
import DiscInspector from "./components/DiscInspector";
import { characters } from "./data/characters";
import "./App.css";

function App() {
  const [selected, setSelected]     = useState(null);
  const [pending, setPending]       = useState(null);
  const [inspecting, setInspecting] = useState(null);

  function handleSelect(char) {
    setInspecting(null);
    if (char.desire) {
      setPending(char);
    } else {
      setSelected(char);
    }
  }

  function handleIntroDone() {
    setSelected(pending);
    setPending(null);
  }

  return (
    <div className="app">
      {pending && (
        <DesireIntro character={pending} onDone={handleIntroDone} />
      )}

      {selected ? (
        <Turntable
          character={selected}
          characters={characters}
          onBack={() => setSelected(null)}
          onSelect={handleSelect}
        />
      ) : (
        !pending && (
          <>
            <Shelf
              characters={characters}
              onPlay={handleSelect}
              onInspect={(char) => setInspecting(char)}
            />
            {inspecting && (
              <DiscInspector
                character={inspecting}
                characters={characters}
                onPlay={handleSelect}
                onClose={() => setInspecting(null)}
              />
            )}
          </>
        )
      )}
    </div>
  );
}

export default App;
