import { useState } from "react";
import Shelf from "./components/Shelf";
import Turntable from "./components/Turntable";
import { characters } from "./data/characters";
import "./App.css";

function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      {selected ? (
        <Turntable
          character={selected}
          characters={characters}
          onBack={() => setSelected(null)}
          onSelect={setSelected}
        />
      ) : (
        <Shelf characters={characters} onSelect={setSelected} />
      )}
    </div>
  );
}

export default App;
