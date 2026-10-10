// Catalogo de ataques del laboratorio. Hoy solo lista y exporta:
//   node run-attacks.js --list [--category <c>]
//   node run-attacks.js --export salida.jsonl [--category <c>]
// El envio al backend queda pendiente de la decision de Mario sobre la cuenta de prueba y la CLI
// (docs/laboratorio-ataques-contenedores.md, "Decisiones pendientes").
const fs = require('fs');
const path = require('path');

const { ataques } = JSON.parse(fs.readFileSync(path.join(__dirname, 'attacks.json'), 'utf8'));
const args = process.argv.slice(2);
const catIdx = args.indexOf('--category');
const cat = catIdx !== -1 ? args[catIdx + 1] : null;
const selected = ataques
  .filter(a => !cat || a.categoria === cat)
  .sort((a, b) => a.prioridad - b.prioridad);

const exportIdx = args.indexOf('--export');
if (exportIdx !== -1) {
  const lines = selected.map(a => JSON.stringify({ ...a, runId: process.env.LAB_RUN_ID || 'sin-id' }));
  fs.writeFileSync(args[exportIdx + 1], lines.join('\n') + '\n');
  console.log(`exportados ${selected.length} ataques a ${args[exportIdx + 1]}`);
} else {
  for (const a of selected) {
    console.log(`P${a.prioridad} ${a.id} [${a.categoria}/${a.canal}] ${a.turnos.length} turno(s) -> ${a.espera}`);
  }
  console.log(`\nTotal: ${selected.length}`);
}
