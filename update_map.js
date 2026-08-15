const fs = require('fs');

let content = fs.readFileSync('src/components/AdvisorPanel.tsx', 'utf-8');

const replacements = {
  'angel_pestana.png': 'Angel_Pestana.png',
  'diego_abad_de_santillan.png': 'Diego_Abad_de_Santillan.png',
  'federica_montseny.png': 'Federica_Montseny.png',
  'horacio_martinez_prieto.png': 'Horacio_Martinez_Prieto.png',
  'jaime_balius.png': 'Jaime_Balius.png',
  'joan_peiro.png': 'Joan_Peiro.png',
  'jose_buenaventura_durruti_dumange.png': 'Jose_Buenaventura_Durruti_Dumange.png',
  'jose_peirats.png': 'Jose_Peirats.png',
  'juan_garcia_oliver.png': 'Juan_Garcia_Oliver.png',
  'juan_lopez_sanchez.png': 'Juan_Lopez_Sanchez.png',
  'mariano_rodriguez_vazquez.png': 'Mariano_Rodriguez_Vazquez.png',
  'orobon_fernandez.png': 'Orobon_Fernandez.png',
  'pedro_vallina.png': 'Pedro_Vallina.png',
  'ramon_franco.png': 'Ramon_Franco.png'
};

for (const [oldName, newName] of Object.entries(replacements)) {
  content = content.replace(oldName, newName);
}

fs.writeFileSync('src/components/AdvisorPanel.tsx', content);
