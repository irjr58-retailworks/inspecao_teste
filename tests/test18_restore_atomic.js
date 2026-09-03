const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return { name, type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
}

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Estado local ANTES da tentativa de restaurar.
  const local = { id: "vLocalExistente", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", lojaCd: "Loja Local" };
  await App.idbSet("vistorias", undefined, local);
  await App.idbSet("config", "main", { ...App.DEFAULT_CONFIG, empresa: "Empresa Original" });

  const incomingPackage = {
    schemaVersion: App.MERGE_SCHEMA_VERSION,
    vistorias: [
      { id: "vNova1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", lojaCd: "Loja Nova 1" },
      { id: "vNova2", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", lojaCd: "Loja Nova 2" },
    ],
    photos: [],
    config: { empresa: "Empresa do Backup" },
    deletedVistorias: {},
  };

  const wrap = App.ConfigScreen();
  const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const restoreInput = inputs[0];

  // Arma o caos: deixa 1 put() da transação final passar, falha no 2º -- confirma que o 1º "sucesso"
  // NÃO fica persistido (rollback de verdade), não só que o resto falhou.
  disk.__chaos.failAfterPuts = 1;

  const file = fakeFile("backup.json", incomingPackage);
  let threw = null;
  try {
    for (const fn of restoreInput._listeners.change || []) await fn({ target: { files: [file], value: "" } });
  } catch (err) { threw = err; }
  disk.__chaos.failAfterPuts = null;

  console.log("alert()s emitidos:", App.__ui.alerts);
  console.log("Exceção não tratada escapou do handler?", threw ? threw.message : "não");

  const vistoriasFinal = await App.idbGetAll("vistorias");
  const configFinal = await App.idbGet("config", "main");
  console.log("\nVistorias no banco APÓS a tentativa (falha no meio):", vistoriasFinal.map(v => v.id));
  console.log("Esperado: SOMENTE ['vLocalExistente'] -- nada do pacote incoming, nem o que 'passou' antes da falha");
  console.log("PASS (nada do incoming persistiu, local intacto)?", vistoriasFinal.length === 1 && vistoriasFinal[0].id === "vLocalExistente");
  console.log("\nConfig 'empresa' após a tentativa:", configFinal.empresa, "(esperado: 'Empresa Original', não deve ter mudado)");
  console.log("PASS (config não vazou)?", configFinal.empresa === "Empresa Original");
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
