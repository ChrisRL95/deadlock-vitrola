const R2 = "https://pub-52e2be368e3442e2ac570de63276fa30.r2.dev";

export const characters = [
  {
    id: "abrams",
    name: "Abrams",
    color: "#c0392b",
    textColor: "#fff",
    image: `${R2}/images/abrams.png`,
    render: `${R2}/images/Abrams_Render.png`,
    nameImage: `${R2}/images/abrams-name.png`,
    icon: `${R2}/images/abrams-icon.png`,
    desire: "Destruir o próprio Tomo Mágico que lhe concede poderes — libertando-se para sempre da possessão demoníaca que consome sua alma.",
    description: "Uma noite chuvosa em Nova York. Luzes de neon refletidas no asfalto molhado. Um detetive solitário caminhando por becos vazios enquanto investiga uma conspiração ocultista ligada a assassinatos ritualísticos e artefatos proibidos. O cheiro de fumaça, o som distante do jazz vindo de um bar quase vazio e a sensação constante de que algo observa das sombras. Uma jornada entre o crime organizado, sociedades secretas e horrores sobrenaturais que jamais deveriam existir.",
    tracks: [
      { label: "Abrams", start: 0, file: `${R2}/audio/Abrams.mp3` },
    ],
  },
  {
    id: "apollo",
    name: "Apollo",
    color: "#c0392b",
    textColor: "#fff",
    image: `${R2}/images/apollo.png`,
    render: `${R2}/images/Apollo_Render.png`,
    nameImage: `${R2}/images/apollo_name.png`,
    icon: `${R2}/images/apollo-icon.png`,
    desire: "O desejo de Apollo é desconhecido, mas ele parece lutar no ritual por Ixia — e para honrar o nome de sua família, testando seus limites em cada batalha.",
    description: "O som de um jovem príncipe treinando para seu destino. Salões de esgrima iluminados pelo amanhecer, bandeiras reais tremulando ao vento e o eco de lâminas se cruzando em duelos de precisão absoluta. Uma mistura de nobreza, juventude e ambição, onde cada batalha é uma oportunidade de provar seu valor. A atmosfera combina disciplina aristocrática, espírito competitivo e a energia de alguém que acredita ter nascido para a grandeza. Não é a música de um rei consolidado, mas de um herdeiro determinado a conquistar seu lugar no mundo. Rápida, elegante, heroica e carregada pela certeza de que a vitória pertence aos preparados.",
    tracks: [
      { label: "Apollo", start: 0, file: `${R2}/audio/Apollo.mp3` },
    ],
  },
  // Add more characters here
];
